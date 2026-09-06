import {
  CHIEF_COMPLAINT_QUESTION,
  COMPLAINTS,
  MOCK_ALERTS,
  MOCK_HISTORIES,
  MOCK_TIMELINE,
  MOCK_VITALS,
} from "@/data"
import type {
  Answer,
  ClinicalAlert,
  ClinicalHistory,
  ComplaintId,
  Question,
  RedFlagAssessment,
  TimelineEvent,
  VitalObservation,
} from "@/types"
import { evaluateRedFlags } from "@/utils"
import { API_CONFIG, delay, request } from "./apiClient"

/** Local overrides so clinician edits survive navigation during a session. */
const historyEdits = new Map<string, ClinicalHistory>()

export const clinicalService = {
  /** The opening question. Constant today; backend-driven later. */
  async getOpeningQuestion(): Promise<Question> {
    if (!API_CONFIG.useMock) return request<Question>("/interview/opening")
    await delay(60)
    return CHIEF_COMPLAINT_QUESTION
  },

  /**
   * Adaptive follow-ups for a chief complaint.
   *
   * The demo reads a static bank. The FastAPI/LLM endpoint will return the same
   * `Question[]` shape, conditioned on the answers given so far — which is why
   * `previousAnswers` is already part of the signature.
   */
  async getFollowUpQuestions(
    complaintId: ComplaintId,
    previousAnswers: Answer[] = [],
  ): Promise<Question[]> {
    if (!API_CONFIG.useMock) {
      return request<Question[]>("/interview/follow-ups", {
        method: "POST",
        body: { complaintId, previousAnswers },
      })
    }
    await delay(220)
    return COMPLAINTS[complaintId].followUps
  },

  /**
   * Demo triage evaluation. Runs locally so the kiosk keeps working offline;
   * the backend will own this once clinical governance is in place.
   */
  async assessRedFlags(
    complaintId: ComplaintId | null,
    answers: Answer[],
  ): Promise<RedFlagAssessment> {
    if (!API_CONFIG.useMock) {
      return request<RedFlagAssessment>("/triage/assess", {
        method: "POST",
        body: { complaintId, answers },
      })
    }
    await delay(150)
    return evaluateRedFlags(complaintId, answers)
  },

  async getHistory(patientId: string): Promise<ClinicalHistory | undefined> {
    if (!API_CONFIG.useMock) {
      return request<ClinicalHistory>(`/patients/${patientId}/history`)
    }
    await delay(120)
    return historyEdits.get(patientId) ?? MOCK_HISTORIES[patientId]
  },

  async saveHistory(
    patientId: string,
    patch: Partial<ClinicalHistory>,
  ): Promise<ClinicalHistory> {
    const base =
      historyEdits.get(patientId) ??
      MOCK_HISTORIES[patientId] ??
      (() => {
        throw new Error(`No history for ${patientId}`)
      })()

    const updated: ClinicalHistory = {
      ...base,
      ...patch,
      patientId,
      updatedAt: new Date().toISOString(),
    }

    if (!API_CONFIG.useMock) {
      return request<ClinicalHistory>(`/patients/${patientId}/history`, {
        method: "PATCH",
        body: patch,
      })
    }

    await delay(220)
    historyEdits.set(patientId, updated)
    return updated
  },

  /** Marks the AI draft as reviewed by a clinician. */
  async confirmHistory(patientId: string): Promise<ClinicalHistory> {
    return clinicalService.saveHistory(patientId, { confirmedByClinician: true })
  },

  async getTimeline(patientId: string): Promise<TimelineEvent[]> {
    if (!API_CONFIG.useMock) {
      return request<TimelineEvent[]>(`/patients/${patientId}/timeline`)
    }
    await delay(140)
    return [...(MOCK_TIMELINE[patientId] ?? [])].sort((a, b) =>
      b.sortKey.localeCompare(a.sortKey),
    )
  },

  async getAlerts(patientId: string): Promise<ClinicalAlert[]> {
    if (!API_CONFIG.useMock) {
      return request<ClinicalAlert[]>(`/patients/${patientId}/alerts`)
    }
    await delay(120)
    return MOCK_ALERTS[patientId] ?? []
  },

  async getVitals(patientId: string): Promise<VitalObservation[]> {
    if (!API_CONFIG.useMock) {
      return request<VitalObservation[]>(`/patients/${patientId}/vitals`)
    }
    await delay(90)
    return MOCK_VITALS[patientId] ?? []
  },

  /** Test/demo helper — drops in-session clinician edits. */
  resetEdits(): void {
    historyEdits.clear()
  },
}
