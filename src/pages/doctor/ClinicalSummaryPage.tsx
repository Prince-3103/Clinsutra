import { useCallback, useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Badge, Modal, PriorityDot, SectionCard, StatusBadge } from "@/components/common"
import { EditableSection } from "@/components/doctor"
import { useDoctorLayout } from "@/layouts"
import { ApiError, clinicalService, patientService } from "@/services"
import type { ClinicalAlert, ClinicalHistory } from "@/types"
import { cn, formatTime, initialOf } from "@/utils"

type TextField =
  | "chiefComplaint"
  | "historyOfPresentIllness"
  | "pastMedicalHistory"
  | "pastSurgicalHistory"
  | "familyHistory"
  | "personalHistory"
  | "reviewOfSystems"
  | "investigationsSummary"
  | "clinicalSummary"

type ListField = "keySymptoms" | "riskIndicators" | "suggestedQuestions"

/** EditableSection edits one string at a time — list fields render as one item per line and split back into an array on change. */
function joinLines(items: string[]): string {
  return items.join("\n")
}
function splitLines(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
}

/** A human-readable message for a failed AI generation call — same "never fake success" principle as saving. */
function generateFailureMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.code === "timeout") return "The AI summary took too long to generate. You can try again, or fill in the sections manually."
    if (error.code === "network") return "Couldn't reach the server to generate a summary. You can fill in the sections manually."
  }
  return "Couldn't generate an AI summary right now. You can fill in the sections manually."
}

/** A human-readable message for a failed save — never echoes raw server/network detail that could carry patient data. */
function saveFailureMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.code === "timeout") return "The save timed out. Check your connection and try again."
    if (error.code === "network") return "Couldn't reach the server. Check your connection and try again."
    return "The server rejected the save. Your edits are kept below — try again."
  }
  return "Something went wrong saving. Your edits are kept below — try again."
}

export function ClinicalSummaryPage() {
  const navigate = useNavigate()
  const { patients, selectedPatientId, refresh } = useDoctorLayout()

  const [history, setHistory] = useState<ClinicalHistory | null>(null)
  const [alerts, setAlerts] = useState<ClinicalAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<Date | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  const [reviewOpen, setReviewOpen] = useState(false)
  const [reviewing, setReviewing] = useState(false)
  const [reviewError, setReviewError] = useState<string | null>(null)
  const [reviewedJustNow, setReviewedJustNow] = useState(false)

  const [aiSource, setAiSource] = useState<"ai" | "fallback" | null>(null)
  const [generating, setGenerating] = useState(false)
  const [generateError, setGenerateError] = useState<string | null>(null)

  const patient = patients.find((entry) => entry.id === selectedPatientId)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setEditing(false)
    setSaveError(null)
    setReviewError(null)
    setReviewedJustNow(false)
    setAiSource(null)
    setGenerateError(null)

    Promise.all([
      clinicalService.getHistory(selectedPatientId),
      clinicalService.getAlerts(selectedPatientId),
    ])
      .then(([record, patientAlerts]) => {
        if (cancelled) return
        setHistory(record ?? null)
        setAlerts(patientAlerts)
      })
      .catch(() => {
        if (!cancelled) setHistory(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [selectedPatientId])

  const updateField = useCallback((field: TextField, value: string) => {
    setHistory((current) => (current ? { ...current, [field]: value } : current))
  }, [])

  const updateListField = useCallback((field: ListField, text: string) => {
    setHistory((current) => (current ? { ...current, [field]: splitLines(text) } : current))
  }, [])

  /**
   * Persists a patch through the one existing PATCH endpoint. On failure it
   * never fakes success: it surfaces `saveError`, leaves the in-progress
   * edits exactly as the doctor typed them, and lets the caller decide
   * whether to stay in edit mode so they can retry.
   */
  const persist = useCallback(
    async (patch: Partial<ClinicalHistory>) => {
      if (!history) return false
      setSaving(true)
      setSaveError(null)
      try {
        const saved = await clinicalService.saveHistory(history.patientId, patch)
        setHistory(saved)
        setSavedAt(new Date())
        return true
      } catch (error) {
        setSaveError(saveFailureMessage(error))
        return false
      } finally {
        setSaving(false)
      }
    },
    [history],
  )

  const handleToggleEdit = async () => {
    if (editing && history) {
      const ok = await persist({
        chiefComplaint: history.chiefComplaint,
        historyOfPresentIllness: history.historyOfPresentIllness,
        pastMedicalHistory: history.pastMedicalHistory,
        pastSurgicalHistory: history.pastSurgicalHistory,
        familyHistory: history.familyHistory,
        personalHistory: history.personalHistory,
        reviewOfSystems: history.reviewOfSystems,
        investigationsSummary: history.investigationsSummary,
        keySymptoms: history.keySymptoms,
        riskIndicators: history.riskIndicators,
        suggestedQuestions: history.suggestedQuestions,
        clinicalSummary: history.clinicalSummary,
      })
      // Save failed: stay in edit mode with the doctor's text intact instead
      // of silently exiting as if it had saved.
      if (!ok) return
    }
    setEditing((current) => !current)
  }

  const handleConfirmAndSave = () => {
    void persist({ confirmedByClinician: true })
  }

  /**
   * Generates a fresh AI-assisted summary draft and loads it into the form
   * for review — it does NOT save anything by itself. The doctor still has
   * to edit-as-needed and click Save or Confirm & Save, which go through
   * the same PATCH endpoint as every other field on this page.
   */
  const handleRegenerate = async () => {
    if (!patient) return
    setGenerating(true)
    setGenerateError(null)
    try {
      const draft = await clinicalService.generateAiSummary(patient.id)
      setHistory((current) =>
        current
          ? {
              ...current,
              chiefComplaint: draft.chiefComplaint || current.chiefComplaint,
              historyOfPresentIllness: draft.historyPresentIllness || current.historyOfPresentIllness,
              keySymptoms: draft.keySymptoms,
              riskIndicators: draft.riskIndicators,
              suggestedQuestions: draft.suggestedQuestions,
              clinicalSummary: draft.clinicalSummary,
            }
          : current,
      )
      setAiSource(draft.source)
      // The draft isn't saved yet — put the page into edit mode so the
      // doctor reviews/edits it before Save persists anything.
      setEditing(true)
    } catch (error) {
      setGenerateError(generateFailureMessage(error))
    } finally {
      setGenerating(false)
    }
  }

  const handleMarkReviewed = async () => {
    if (!patient) return
    setReviewing(true)
    setReviewError(null)
    try {
      await patientService.updateStatus(patient.id, "Completed", { resolveRedFlag: true })
      setReviewOpen(false)
      setReviewedJustNow(true)
      refresh()
    } catch {
      setReviewError(
        "Couldn't mark this patient as reviewed — the server didn't confirm the change. Nothing was changed; try again.",
      )
    } finally {
      setReviewing(false)
    }
  }

  if (loading) {
    return (
      <div className="p-4 flex flex-col gap-4 h-full overflow-y-auto sm:p-6" aria-busy="true">
        <div className="h-28 rounded-2xl shimmer" />
        <div className="h-40 rounded-2xl shimmer" />
        <div className="h-40 rounded-2xl shimmer" />
      </div>
    )
  }

  if (!patient || !history) {
    return (
      <div className="p-6 h-full overflow-y-auto">
        <div className="bg-white border border-[#D1E4ED] rounded-2xl px-5 py-10 text-center text-sm text-[#5A7184]">
          No clinical record is available for this patient.
          <button
            type="button"
            onClick={() => navigate("/doctor/queue")}
            className="ml-1 font-semibold text-[#0A6E8A] underline"
          >
            Back to queue
          </button>
        </div>
      </div>
    )
  }

  const abnormalCount = alerts.filter((alert) => alert.category === "lab").length
  const alreadyReviewed = patient.status === "Completed"

  return (
    <div className="p-4 flex flex-col gap-5 h-full overflow-y-auto sm:p-6">
      <div className="bg-white border border-[#D1E4ED] rounded-2xl p-4 flex flex-col items-start justify-between gap-4 lg:flex-row sm:p-5">
        <div className="flex flex-col items-start gap-4 sm:flex-row">
          <div className="w-14 h-14 bg-[#0A6E8A] rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow">
            {initialOf(patient.name)}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold text-[#0D1B2A] sm:text-xl">
                {patient.name}
              </h2>
              <PriorityDot level={patient.priority} />
              {patient.redFlag && (
                <Badge color="red">
                  🚩 Red Flag{patient.redFlagResolved ? " (Reviewed)" : ""}
                </Badge>
              )}
              <StatusBadge status={patient.status} />
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-sm text-[#5A7184]">
              <span>Age: {patient.age} yrs</span>
              <span>•</span>
              <span>{patient.gender}</span>
              <span>•</span>
              <span className="mono">ABHA: {patient.abha}</span>
              <span>•</span>
              <span>Token: {patient.token}</span>
            </div>
            {patient.flags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {patient.flags.map((flag) => (
                  <Badge key={flag} color="red">
                    ⚑ {flag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex w-full flex-wrap gap-2 lg:w-auto lg:justify-end">
          <button
            type="button"
            onClick={() => navigate("/doctor/timeline")}
            className="px-3 py-2 text-xs font-semibold border border-[#D1E4ED] rounded-xl text-[#5A7184] hover:bg-[#F0F7FA]"
          >
            📅 Timeline
          </button>
          <button
            type="button"
            onClick={() => navigate("/doctor/alerts")}
            className="px-3 py-2 text-xs font-semibold border border-[#FCA5A5] rounded-xl text-[#DC2626] hover:bg-[#FEF2F2]"
          >
            ⚠️ Alerts
          </button>
          <button
            type="button"
            onClick={handleToggleEdit}
            disabled={saving}
            className={cn(
              "px-3 py-2 text-xs font-semibold rounded-xl transition-colors",
              editing
                ? "bg-[#0A6E8A] text-white"
                : "border border-[#D1E4ED] text-[#5A7184] hover:bg-[#F0F7FA]",
            )}
          >
            {editing ? (saving ? "Saving…" : "✓ Save") : "✏ Edit"}
          </button>
          <button
            type="button"
            onClick={handleConfirmAndSave}
            disabled={saving || history.confirmedByClinician}
            className={cn(
              "px-4 py-2 text-xs font-bold rounded-xl transition-colors",
              history.confirmedByClinician
                ? "bg-[#059669] text-white"
                : "bg-[#0A6E8A] text-white hover:bg-[#085F78]",
            )}
          >
            {history.confirmedByClinician ? "✓ Confirmed" : "Confirm & Save"}
          </button>
          <button
            type="button"
            onClick={() => setReviewOpen(true)}
            disabled={alreadyReviewed}
            className={cn(
              "px-4 py-2 text-xs font-bold rounded-xl transition-colors",
              alreadyReviewed
                ? "bg-[#059669] text-white"
                : "bg-[#DC2626] text-white hover:bg-[#B91C1C]",
            )}
          >
            {alreadyReviewed ? "✓ Reviewed" : "✓ Mark as Reviewed"}
          </button>
        </div>
      </div>

      {saveError && (
        <div className="bg-[#FEF2F2] border border-[#FCA5A5] rounded-2xl px-4 py-3 flex flex-col items-start gap-2 text-sm text-[#991B1B] sm:flex-row sm:items-center sm:justify-between">
          <span>⚠ {saveError}</span>
          <button
            type="button"
            onClick={handleToggleEdit}
            disabled={saving}
            className="text-xs font-bold underline shrink-0"
          >
            {saving ? "Retrying…" : "Retry save"}
          </button>
        </div>
      )}

      {reviewedJustNow && (
        <div className="bg-[#ECFDF5] border border-[#6EE7B7] rounded-2xl px-4 py-3 text-sm text-[#065F46]">
          ✓ Patient marked as reviewed. Status updated to Completed and the active
          triage alert is resolved — the original P1/P2/P3 result and red-flag
          history remain on record.
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 text-xs text-[#5A7184]">
        <span className="w-2 h-2 bg-[#0A6E8A] rounded-full" />
        {history.confirmedByClinician
          ? "Reviewed and confirmed by a clinician."
          : "AI-generated clinical summary — physician verification required before use. Editable."}
        <span className="text-[#10B981] font-semibold sm:ml-auto">
          Last updated: {formatTime(savedAt ?? new Date(history.updatedAt))}
        </span>
      </div>

      <div className="bg-white border border-[#D1E4ED] rounded-2xl p-4 flex flex-col gap-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-[#0D1B2A]">🤖 AI-Assisted Clinical Summary</h3>
            {aiSource === "ai" && <Badge color="blue">🤖 AI-generated</Badge>}
            {aiSource === "fallback" && (
              <Badge color="gray">⚠ Fallback (deterministic, not AI-generated)</Badge>
            )}
          </div>
          <button
            type="button"
            onClick={() => void handleRegenerate()}
            disabled={generating || saving}
            className="px-3 py-2 text-xs font-semibold rounded-xl border border-[#D1E4ED] text-[#0A6E8A] hover:bg-[#F0F7FA] disabled:opacity-60"
          >
            {generating ? "Generating…" : "🔄 Regenerate"}
          </button>
        </div>

        <p className="text-xs text-[#5A7184] -mt-2">
          Describes what the patient reported — never a diagnosis, prescription, or
          triage decision. Review and edit before saving; Gemini never sets the
          P1/P2/P3 priority, which is decided only by the deterministic triage rules.
        </p>

        {generateError && (
          <p className="text-xs text-[#991B1B] font-semibold">⚠ {generateError}</p>
        )}

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <EditableSection
            title="Key Symptoms"
            icon="🩹"
            editing={editing}
            value={joinLines(history.keySymptoms)}
            onChange={(value) => updateListField("keySymptoms", value)}
          />
          <EditableSection
            title="Risk Indicators"
            icon="⚠️"
            editing={editing}
            value={joinLines(history.riskIndicators)}
            onChange={(value) => updateListField("riskIndicators", value)}
          />
          <div className="lg:col-span-2">
            <EditableSection
              title="Suggested Questions"
              icon="❓"
              editing={editing}
              value={joinLines(history.suggestedQuestions)}
              onChange={(value) => updateListField("suggestedQuestions", value)}
            />
          </div>
          <div className="lg:col-span-2">
            <EditableSection
              title="Clinical Summary"
              icon="📋"
              rows={4}
              editing={editing}
              value={history.clinicalSummary}
              onChange={(value) => updateField("clinicalSummary", value)}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="lg:col-span-2">
          <EditableSection
            title="Chief Complaint"
            icon="🩺"
            rows={2}
            editing={editing}
            value={history.chiefComplaint}
            onChange={(value) => updateField("chiefComplaint", value)}
          />
        </div>

        <div className="lg:col-span-2">
          <EditableSection
            title="History of Present Illness"
            icon="📝"
            rows={4}
            editing={editing}
            value={history.historyOfPresentIllness}
            onChange={(value) => updateField("historyOfPresentIllness", value)}
          />
        </div>

        <EditableSection
          title="Past Medical History"
          icon="🏥"
          editing={editing}
          value={history.pastMedicalHistory}
          onChange={(value) => updateField("pastMedicalHistory", value)}
        />

        <EditableSection
          title="Past Surgical History"
          icon="🔪"
          editing={editing}
          value={history.pastSurgicalHistory}
          onChange={(value) => updateField("pastSurgicalHistory", value)}
        />

        <SectionCard title="Current Medications" icon="💊">
          {history.medications.length === 0 ? (
            <p className="text-sm text-[#5A7184]">None on record.</p>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {history.medications.map((medication) => (
                <li
                  key={medication.id}
                  className="flex items-center gap-2 text-sm text-[#0D1B2A]"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0A6E8A] shrink-0" />
                  {medication.name} {medication.dose} — {medication.frequency}
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard title="Allergies" icon="⚠️">
          {history.allergies.length === 0 ? (
            <p className="text-sm text-[#5A7184]">No known allergies on record.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {history.allergies.map((allergy) => (
                <div
                  key={allergy.id}
                  className="bg-[#FEF2F2] border border-[#FCA5A5] rounded-xl px-3 py-2 text-sm text-[#991B1B] font-medium"
                >
                  ⚑ {allergy.substance} — {allergy.reaction}
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <EditableSection
          title="Family History"
          icon="👨‍👩‍👧"
          editing={editing}
          value={history.familyHistory}
          onChange={(value) => updateField("familyHistory", value)}
        />

        <EditableSection
          title="Personal History"
          icon="🧍"
          editing={editing}
          value={history.personalHistory}
          onChange={(value) => updateField("personalHistory", value)}
        />

        <EditableSection
          title="Review of Systems"
          icon="🔬"
          editing={editing}
          value={history.reviewOfSystems}
          onChange={(value) => updateField("reviewOfSystems", value)}
        />

        <EditableSection
          title="Previous Investigations"
          icon="🧾"
          editing={editing}
          value={history.investigationsSummary}
          onChange={(value) => updateField("investigationsSummary", value)}
          actions={
            <button
              type="button"
              onClick={() => navigate("/doctor/timeline")}
              className="text-xs text-[#0A6E8A] font-semibold hover:underline"
            >
              View Timeline →
            </button>
          }
          footer={
            abnormalCount > 0 ? (
              <button
                type="button"
                onClick={() => navigate("/doctor/alerts")}
                className="mt-2 text-xs text-[#DC2626] font-semibold flex items-center gap-1 hover:underline"
              >
                ⚠ {abnormalCount} abnormal value{abnormalCount === 1 ? "" : "s"} flagged
              </button>
            ) : null
          }
        />
      </div>

      <Modal
        open={reviewOpen}
        title="Mark as Reviewed"
        onClose={() => (reviewing ? null : setReviewOpen(false))}
        footer={
          <>
            <button
              type="button"
              onClick={() => setReviewOpen(false)}
              disabled={reviewing}
              className="px-4 py-2 text-sm font-semibold rounded-xl border border-[#D1E4ED] text-[#5A7184] hover:bg-[#F0F7FA]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void handleMarkReviewed()}
              disabled={reviewing}
              className="px-4 py-2 text-sm font-bold rounded-xl bg-[#DC2626] text-white hover:bg-[#B91C1C]"
            >
              {reviewing ? "Marking…" : "Mark as Reviewed"}
            </button>
          </>
        }
      >
        <p className="text-sm text-[#0D1B2A] leading-relaxed">
          Mark this patient as reviewed and resolve the active triage alert?
        </p>
        <p className="text-xs text-[#5A7184] mt-2 leading-relaxed">
          This confirms you have examined the patient — it does not clear them
          medically or change the diagnosis. The original {patient.priority} triage
          result and the red-flag event stay on the record.
        </p>
        {reviewError && (
          <p className="text-xs text-[#991B1B] mt-3 font-semibold">⚠ {reviewError}</p>
        )}
      </Modal>
    </div>
  )
}
