import { CURRENT_DOCTOR, MOCK_PATIENTS } from "@/data"
import type {
  Answer,
  ClinicalHistory,
  ComplaintId,
  Doctor,
  Patient,
  PatientIdentification,
  Priority,
  QueueFilter,
} from "@/types"
import { API_CONFIG, delay, request } from "./apiClient"

export interface QueueQuery {
  filter?: QueueFilter
  /** Matched against name, token and complaint, case-insensitively. */
  search?: string
}

export interface KioskSubmission {
  identification: PatientIdentification
  complaint: string
  priority: Priority
  redFlag: boolean
  flags: string[]

  /**
   * The chief-complaint branch the follow-up questions were drawn from.
   * Optional so a submission built before this field existed still works.
   */
  complaintId?: ComplaintId | null
  /**
   * The clinician-reviewable draft the patient confirmed on the review
   * screen (see `buildDraftSections` / `ReviewPage`). Partial because the
   * kiosk only ever fills in what the interview actually covered — the
   * backend stores it as-is, per Phase 7 (no AI generation here).
   */
  clinicalHistory?: Partial<
    Omit<ClinicalHistory, "patientId" | "updatedAt">
  >
  /** Raw interview trail, kept alongside the drafted narrative. */
  answers?: Answer[]
  /**
   * Ties documents uploaded earlier in this kiosk visit (before a patient
   * record existed) to the patient created by this submission — see
   * `documentService.process` and `KioskSessionProvider`.
   */
  documentSessionId?: string
}

export interface SubmissionReceipt {
  token: string
  patientId: string
  submittedAt: string
}

/** In-memory copy so kiosk submissions show up in the queue during a demo. */
let queue: Patient[] = [...MOCK_PATIENTS]
let tokenCounter = 850

function matches(patient: Patient, query: QueueQuery): boolean {
  const { filter = "all", search = "" } = query

  if (filter === "waiting" && patient.status !== "Waiting") return false
  if (filter === "completed" && patient.status !== "Completed") return false

  const term = search.trim().toLowerCase()
  if (!term) return true

  return (
    patient.name.toLowerCase().includes(term) ||
    patient.token.toLowerCase().includes(term) ||
    patient.complaint.toLowerCase().includes(term) ||
    patient.abha.toLowerCase().includes(term)
  )
}

export const patientService = {
  async getQueue(query: QueueQuery = {}): Promise<Patient[]> {
    if (!API_CONFIG.useMock) {
      return request<Patient[]>(
        `/patients?filter=${query.filter ?? "all"}&search=${encodeURIComponent(
          query.search ?? "",
        )}`,
      )
    }
    await delay(120)
    return queue.filter((patient) => matches(patient, query))
  },

  async getPatient(id: string): Promise<Patient | undefined> {
    if (!API_CONFIG.useMock) return request<Patient>(`/patients/${id}`)
    await delay(80)
    return queue.find((patient) => patient.id === id)
  },

  async getCurrentDoctor(): Promise<Doctor> {
    if (!API_CONFIG.useMock) return request<Doctor>("/doctors/me")
    await delay(40)
    return CURRENT_DOCTOR
  },

  /**
   * Registers a completed kiosk session and issues an OPD token.
   * Locally this appends to the in-memory queue so the doctor dashboard can
   * show the handoff immediately.
   */
  async submitKioskSession(
    submission: KioskSubmission,
  ): Promise<SubmissionReceipt> {
    if (!API_CONFIG.useMock) {
      return request<SubmissionReceipt>("/kiosk/submissions", {
        method: "POST",
        body: submission,
      })
    }

    await delay(400)
    tokenCounter += 1
    const token = `OPD-${String(tokenCounter).padStart(4, "0")}`
    const submittedAt = new Date().toISOString()
    const name = submission.identification.fullName.trim() || "Kiosk Patient"
    const parsedAge = Number.parseInt(submission.identification.age, 10)

    const patient: Patient = {
      id: token,
      name,
      age: Number.isFinite(parsedAge) ? parsedAge : 0,
      gender:
        submission.identification.gender === "Female"
          ? "Female"
          : submission.identification.gender === "Other"
            ? "Other"
            : "Male",
      token,
      abha: submission.identification.abhaId || "—",
      priority: submission.priority,
      status: "Waiting",
      complaint: submission.complaint,
      waitTime: "just now",
      redFlag: submission.redFlag,
      flags: submission.flags,
      redFlagResolved: false,
      submittedAt,
    }

    queue = [patient, ...queue]
    return { token, patientId: patient.id, submittedAt }
  },

  /**
   * Updates a patient's status via the one existing status endpoint.
   *
   * `resolveRedFlag: true` is how the doctor's "Mark as Reviewed" action
   * (see ClinicalSummaryPage) resolves the active triage alert — it never
   * touches `priority`/`redFlag`/`flags`, so the original P1/P2/P3 result
   * and the red-flag reason stay in the record for the audit trail. AI code
   * must never call this with `resolveRedFlag: true` — only a doctor's
   * explicit click does.
   */
  async updateStatus(
    id: string,
    status: Patient["status"],
    options: { resolveRedFlag?: boolean } = {},
  ): Promise<Patient> {
    if (!API_CONFIG.useMock) {
      return request<Patient>(`/patients/${id}/status`, {
        method: "PATCH",
        body: { status, resolveRedFlag: options.resolveRedFlag ?? false },
      })
    }
    await delay(80)
    queue = queue.map((patient) =>
      patient.id === id
        ? {
            ...patient,
            status,
            waitTime: status === "Completed" ? "—" : patient.waitTime,
            redFlagResolved: options.resolveRedFlag ? true : patient.redFlagResolved,
          }
        : patient,
    )
    const updated = queue.find((patient) => patient.id === id)
    if (!updated) throw new Error(`Unknown patient ${id}`)
    return updated
  },

  /**
   * Permanently deletes a patient and all dependent records via the backend
   * DELETE endpoint. The backend enforces that only a completed/reviewed
   * patient can be deleted and that the caller has the doctor role — this is
   * never a frontend-only removal. Rejects (throws) on any failure so the
   * caller can keep the patient visible and show an error.
   */
  async deletePatient(id: string): Promise<void> {
    if (!API_CONFIG.useMock) {
      // The doctor JWT is attached automatically by apiClient (buildHeaders).
      await request<void>(`/patients/${id}`, { method: "DELETE" })
      return
    }
    await delay(120)
    queue = queue.filter((patient) => patient.id !== id)
  },

  /** Test/demo helper — resets the in-memory queue to the seeded data. */
  resetQueue(): void {
    queue = [...MOCK_PATIENTS]
    tokenCounter = 850
  },
}
