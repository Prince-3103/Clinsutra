import { useEffect, useState } from "react"
import { Navigate, useNavigate } from "react-router-dom"
import { Button } from "@/components/common"
import { QuestionCard, VoiceInput } from "@/components/patient"
import { COMPLAINTS } from "@/data"
import { useKioskSession, useTranslation } from "@/hooks"
import { clinicalService } from "@/services"
import type { Question } from "@/types"
import { cn } from "@/utils"

export function FollowUpPage() {
  const navigate = useNavigate()
  const { t, tx, scriptClass } = useTranslation()
  const { complaintId, answers, getAnswer, answerQuestion, setAssessment } =
    useKioskSession()

  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [assessing, setAssessing] = useState(false)

  useEffect(() => {
    if (!complaintId) return
    let cancelled = false
    setLoading(true)

    clinicalService
      .getFollowUpQuestions(complaintId, answers)
      .then((result) => {
        if (!cancelled) setQuestions(result)
      })
      .catch(() => {
        if (!cancelled) setQuestions(COMPLAINTS[complaintId].followUps)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
    // `answers` is intentionally excluded: refetching on every tap would reset
    // the question list mid-interview. The backend call is seeded once per
    // complaint, which is what the adaptive step needs today.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [complaintId])

  // Reached directly without picking a complaint — send them back.
  if (!complaintId) return <Navigate to="/kiosk/interview" replace />

  const answeredCount = questions.filter(
    (question) => (getAnswer(question.id)?.optionIds.length ?? 0) > 0,
  ).length

  const handleContinue = async () => {
    setAssessing(true)
    try {
      const assessment = await clinicalService.assessRedFlags(complaintId, answers)
      setAssessment(assessment)
      navigate(assessment.triggered ? "/kiosk/red-flag" : "/kiosk/documents")
    } finally {
      setAssessing(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-6 sm:px-6 sm:py-8">
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "bg-[#FEF3C7] text-[#92400E] text-sm font-semibold px-3 py-2 rounded-xl border border-[#FDE68A] flex items-center gap-2",
            scriptClass,
          )}
        >
          <span aria-hidden>💬</span>
          <span>
            {t("followup.context", { complaint: tx(COMPLAINTS[complaintId].echo) })}
          </span>
        </div>
      </div>

      <div className={cn("flex items-center gap-2 text-xs text-[#5A7184]", scriptClass)}>
        <span className="w-2 h-2 bg-[#0A6E8A] rounded-full animate-pulse" />
        {t("followup.aiAdapting")}
      </div>

      {loading ? (
        <div className="flex flex-col gap-3" aria-busy="true">
          {[0, 1, 2].map((index) => (
            <div key={index} className="h-32 rounded-3xl shimmer" />
          ))}
        </div>
      ) : (
        questions.map((question, index) => (
          <QuestionCard
            key={question.id}
            question={question}
            index={`Q${index + 2}`}
            selectedOptionIds={getAnswer(question.id)?.optionIds ?? []}
            onSelect={(optionId) => answerQuestion(question.id, [optionId])}
          />
        ))
      )}

      <VoiceInput
        label={t("followup.speakAnswers")}
        layout="row"
        className="py-2"
      />

      <p className={cn("text-center text-sm text-[#5A7184]", scriptClass)}>
        {t("followup.answered", {
          answered: answeredCount,
          total: questions.length,
        })}
      </p>

      <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
        <Button
          variant="outline"
          size="lg"
          className={cn("flex-1", scriptClass)}
          onClick={() => navigate("/kiosk/interview")}
        >
          {t("common.back")}
        </Button>
        <Button
          size="lg"
          className={cn("flex-1", scriptClass)}
          onClick={handleContinue}
          disabled={assessing || loading}
        >
          {t("common.continue")}
        </Button>
      </div>
    </div>
  )
}
