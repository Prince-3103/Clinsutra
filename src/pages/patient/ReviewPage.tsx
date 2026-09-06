import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button, Card, Disclaimer } from "@/components/common"
import { ReviewSection } from "@/components/patient"
import { useKioskSession, useTranslation } from "@/hooks"
import { patientService } from "@/services"
import {
  buildDraftSections,
  cn,
  complaintSummary,
  initialOf,
  toClinicalHistoryPatch,
} from "@/utils"

export function ReviewPage() {
  const navigate = useNavigate()
  const { t, tx, language, scriptClass } = useTranslation()
  const {
    identification,
    complaintId,
    answers,
    documents,
    assessment,
    setToken,
    documentSessionId,
  } = useKioskSession()

  const drafted = useMemo(
    () => buildDraftSections(complaintId, answers, documents, language),
    [complaintId, answers, documents, language],
  )

  const [values, setValues] = useState<Record<string, string>>({})
  const [editing, setEditing] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const displayName = identification.fullName.trim() || "Patient"
  const displayAge = identification.age.trim() || "—"
  const displayGender = identification.gender.trim() || "—"

  const handleConfirm = async () => {
    setSubmitting(true)
    setError(null)
    try {
      const receipt = await patientService.submitKioskSession({
        identification,
        complaint: complaintSummary(complaintId, answers),
        priority: assessment?.priority ?? "P3",
        redFlag: assessment?.triggered ?? false,
        flags: (assessment?.reasons ?? []).map((reason) => tx(reason)),
        complaintId,
        clinicalHistory: toClinicalHistoryPatch(drafted, values),
        answers,
        documentSessionId,
      })
      setToken(receipt.token)
      navigate("/kiosk/complete")
    } catch {
      setError(t("mic.error"))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-5 sm:px-6 sm:py-8">
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <div
            className={cn("text-2xl font-bold text-[#0D1B2A] sm:text-3xl", scriptClass)}
          >
            {t("review.title")}
          </div>
          <div className={cn("text-[#5A7184] text-sm mt-1 sm:text-base", scriptClass)}>
            {t("review.subtitle")}
          </div>
        </div>
        <div
          className={cn(
            "bg-[#E8F4F8] text-[#0A6E8A] text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1",
            scriptClass,
          )}
        >
          {t("review.aiGenerated")}
        </div>
      </div>

      <Card className="px-5 py-4 flex flex-col items-start gap-4 bg-[#E8F4F8] sm:flex-row sm:items-center">
        <div className="w-12 h-12 bg-[#0A6E8A] rounded-full flex items-center justify-center text-white font-bold text-xl">
          {initialOf(displayName)}
        </div>
        <div>
          <div className="font-bold text-[#0D1B2A] text-base sm:text-lg">
            {displayName}
          </div>
          <div className={cn("text-sm text-[#5A7184]", scriptClass)}>
            {t("review.identity", {
              age: displayAge,
              gender: displayGender,
              token: identification.abhaId || identification.hospitalRegNumber || "—",
            })}
          </div>
        </div>
      </Card>

      <div className="flex flex-col gap-3">
        {drafted.map((section) => (
          <ReviewSection
            key={section.id}
            label={t(section.labelKey)}
            value={values[section.id] ?? section.value}
            editing={editing}
            scriptClass={scriptClass}
            onChange={(value) =>
              setValues((current) => ({ ...current, [section.id]: value }))
            }
          />
        ))}
      </div>

      <Disclaimer className={scriptClass}>{t("review.disclaimer")}</Disclaimer>

      {error && (
        <p
          role="alert"
          className="text-sm text-[#991B1B] bg-[#FEF2F2] border border-[#FCA5A5] rounded-xl px-4 py-3"
        >
          {error}
        </p>
      )}

      <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:gap-4">
        <Button
          variant="outline"
          size="lg"
          className={cn("flex-1", scriptClass)}
          onClick={() => setEditing((current) => !current)}
        >
          {editing ? t("review.save") : t("review.edit")}
        </Button>
        <Button
          size="xl"
          className={cn("flex-1", scriptClass)}
          onClick={handleConfirm}
          disabled={submitting}
        >
          {t("review.confirm")}
        </Button>
      </div>
    </div>
  )
}
