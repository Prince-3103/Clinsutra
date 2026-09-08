import {
  CHIEF_COMPLAINT_QUESTION,
  COMPLAINTS,
  MOCK_ALERTS,
  MOCK_HISTORIES,
  MOCK_TIMELINE,
  MOCK_VITALS,
} from "@/data"
import type {
  AdaptiveQuestion,
  AdaptiveQuestionTurn,
  AiClinicalSummary,
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
    // THE SAVE BUG: this used to build `base`/`updated` — which only exist to
    // support the mock branch below — before checking `useMock` at all. Since
    // `historyEdits` starts empty and a real patient id is never a key in
    // `MOCK_HISTORIES`, that lookup's fallback threw on every single real-mode
    // save, regardless of whether the PATCH request that follows would have
    // succeeded. The FastAPI endpoint and MySQL side were always correct —
    // this function just never reached the `request()` call. Checking the
    // mode first, and only doing the mock-local computation inside the mock
    // branch, is the fix.
    if (!API_CONFIG.useMock) {
      return request<ClinicalHistory>(`/patients/${patientId}/history`, {
        method: "PATCH",
        body: patch,
      })
    }

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

  /**
   * Generates an AI-assisted clinical summary draft (Gemini on the backend;
   * see backend/app/services/ai_service.py). Read-only — this never saves
   * anything by itself. The doctor reviews the returned draft on
   * `/doctor/summary`, edits it, and only Save/Confirm & Save (`saveHistory`
   * above) persists it, through the one existing PATCH endpoint.
   *
   * `source` is always "ai" or "fallback" — never fake "AI-generated" status
   * when Gemini didn't actually run.
   */
  async generateAiSummary(patientId: string): Promise<AiClinicalSummary> {
    if (!API_CONFIG.useMock) {
      return request<AiClinicalSummary>(`/patients/${patientId}/ai-summary`, {
        method: "POST",
      })
    }
    await delay(300)
    const history = historyEdits.get(patientId) ?? MOCK_HISTORIES[patientId]
    if (!history) {
      return {
        chiefComplaint: "",
        historyPresentIllness: "",
        keySymptoms: [],
        riskIndicators: [],
        suggestedQuestions: [],
        clinicalSummary: "",
        source: "fallback",
      }
    }
    return {
      chiefComplaint: history.chiefComplaint,
      historyPresentIllness: history.historyOfPresentIllness,
      keySymptoms: [],
      riskIndicators: [],
      suggestedQuestions: [],
      clinicalSummary: `Patient reports: ${history.chiefComplaint}. ${history.historyOfPresentIllness}`,
      source: "fallback",
    }
  },

  /**
   * Next adaptive follow-up question for the kiosk interview (Gemini). Never
   * used to diagnose or determine triage — the deterministic red-flag rules
   * in `assessRedFlags` above are unaffected by this and remain the sole
   * source of P1/P2/P3. On any failure (including mock mode, which has no
   * LLM to call), `source` is "fallback" and `question` is null — callers
   * fall back to `getFollowUpQuestions`'s predefined bank in that case.
   */
  async getAdaptiveQuestion(
    complaint: string,
    language: string,
    history: AdaptiveQuestionTurn[],
  ): Promise<AdaptiveQuestion> {
    if (!API_CONFIG.useMock) {
      return request<AdaptiveQuestion>("/ai/adaptive-question", {
        method: "POST",
        body: { complaint, language, history },
      })
    }
    await delay(200)
    return { question: null, questionNumber: history.length + 1, isFinal: true, source: "fallback" }
  },

  /** Test/demo helper — drops in-session clinician edits. */
  resetEdits(): void {
    historyEdits.clear()
  },
}
