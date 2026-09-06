import { CURRENT_DOCTOR, MOCK_PATIENTS } from "@/data"
import type {
  Answer,
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
   * Interview + document context for the handoff, so the backend can build
   * the Interview/InterviewAnswer records and link already-uploaded
   * documents to the new patient in the same call. Optional so the mock
   * path (which only builds a `Patient` row) is unaffected.
   */
  complaintId?: ComplaintId | null
  answers?: Answer[]
  /** `UploadedDocument.remoteId` for every document from this kiosk visit. */
  documentIds?: string[]
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
      submittedAt,
    }

    queue = [patient, ...queue]
    return { token, patientId: patient.id, submittedAt }
  },

  async updateStatus(id: string, status: Patient["status"]): Promise<Patient> {
    if (!API_CONFIG.useMock) {
      return request<Patient>(`/patients/${id}/status`, {
        method: "PATCH",
        body: { status },
      })
    }
    await delay(80)
    queue = queue.map((patient) =>
      patient.id === id
        ? { ...patient, status, waitTime: status === "Completed" ? "—" : patient.waitTime }
        : patient,
    )
    const updated = queue.find((patient) => patient.id === id)
    if (!updated) throw new Error(`Unknown patient ${id}`)
    return updated
  },

  /** Test/demo helper — resets the in-memory queue to the seeded data. */
  resetQueue(): void {
    queue = [...MOCK_PATIENTS]
    tokenCounter = 850
  },
}
