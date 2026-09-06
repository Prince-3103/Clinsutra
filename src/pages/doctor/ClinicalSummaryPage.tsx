import { useCallback, useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Badge, PriorityDot, SectionCard, StatusBadge } from "@/components/common"
import { EditableSection } from "@/components/doctor"
import { useDoctorLayout } from "@/layouts"
import { clinicalService } from "@/services"
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

export function ClinicalSummaryPage() {
  const navigate = useNavigate()
  const { patients, selectedPatientId } = useDoctorLayout()

  const [history, setHistory] = useState<ClinicalHistory | null>(null)
  const [alerts, setAlerts] = useState<ClinicalAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<Date | null>(null)

  const patient = patients.find((entry) => entry.id === selectedPatientId)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setEditing(false)

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

  const persist = useCallback(
    async (patch: Partial<ClinicalHistory>) => {
      if (!history) return
      setSaving(true)
      try {
        const saved = await clinicalService.saveHistory(history.patientId, patch)
        setHistory(saved)
        setSavedAt(new Date())
      } finally {
        setSaving(false)
      }
    },
    [history],
  )

  const handleToggleEdit = async () => {
    if (editing && history) {
      await persist({
        chiefComplaint: history.chiefComplaint,
        historyOfPresentIllness: history.historyOfPresentIllness,
        pastMedicalHistory: history.pastMedicalHistory,
        pastSurgicalHistory: history.pastSurgicalHistory,
        familyHistory: history.familyHistory,
        personalHistory: history.personalHistory,
        reviewOfSystems: history.reviewOfSystems,
        investigationsSummary: history.investigationsSummary,
      })
    }
    setEditing((current) => !current)
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
              {patient.redFlag && <Badge color="red">🚩 Red Flag</Badge>}
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
            onClick={() => void persist({ confirmedByClinician: true })}
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
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs text-[#5A7184]">
        <span className="w-2 h-2 bg-[#0A6E8A] rounded-full" />
        {history.confirmedByClinician
          ? "Reviewed and confirmed by a clinician."
          : "AI-generated clinical summary — physician verification required before use. Editable."}
        <span className="text-[#10B981] font-semibold sm:ml-auto">
          Last updated: {formatTime(savedAt ?? new Date(history.updatedAt))}
        </span>
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
    </div>
  )
}
