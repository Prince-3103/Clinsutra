import { useEffect, useMemo, useState } from "react"
import { Navigate, useNavigate } from "react-router-dom"
import { Button } from "@/components/common"
import { QuestionCard, VoiceInput } from "@/components/patient"
import { COMPLAINTS } from "@/data"
import { useKioskSession, useSpokenOptionSelect, useTranslation } from "@/hooks"
import { clinicalService } from "@/services"
import type { Question } from "@/types"
import { cn } from "@/utils"

/** Separates a follow-up question id from an option id in a spoken candidate. */
const CANDIDATE_SEPARATOR = "::"

export function FollowUpPage() {
  const navigate = useNavigate()
  const { t, tx, scriptClass, language } = useTranslation()
  const { complaintId, answers, getAnswer, answerQuestion, setAssessment } =
    useKioskSession()

  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [assessing, setAssessing] = useState(false)
  const [continueFailed, setContinueFailed] = useState(false)

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

  // Spoken answers can match any option across the shown follow-ups. Candidates
  // carry a "<questionId>::<optionId>" id so a match maps back to its question.
  const spokenCandidates = useMemo(
    () =>
      questions.flatMap((question) =>
        question.options.map((option) => ({
          id: `${question.id}${CANDIDATE_SEPARATOR}${option.id}`,
          label: option.label,
        })),
      ),
    [questions],
  )

  // No catch-all option on follow-ups, so an unmatched answer prompts a tap
  // (no `fallbackOptionId`).
  const spoken = useSpokenOptionSelect(
    spokenCandidates,
    language,
    (candidateId, transcript) => {
      const [questionId, optionId] = candidateId.split(CANDIDATE_SEPARATOR)
      if (questionId && optionId) answerQuestion(questionId, [optionId], transcript)
    },
  )

  // Reached directly without picking a complaint — send them back.
  if (!complaintId) return <Navigate to="/kiosk/interview" replace />

  const answeredCount = questions.filter(
    (question) => (getAnswer(question.id)?.optionIds.length ?? 0) > 0,
  ).length

  const handleContinue = async () => {
    setAssessing(true)
    setContinueFailed(false)
    try {
      const assessment = await clinicalService.assessRedFlags(complaintId, answers)
      setAssessment(assessment)
      navigate(assessment.triggered ? "/kiosk/red-flag" : "/kiosk/documents")
    } catch {
      // Never fail silently. The patient's answers stay in session state, so
      // they can simply tap Continue again once the connection is back.
      setContinueFailed(true)
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
            onSelect={(optionId) => {
              spoken.clearHeard()
              answerQuestion(question.id, [optionId])
            }}
          />
        ))
      )}

      <VoiceInput
        label={t("followup.speakAnswers")}
        layout="row"
        className="py-2"
        onTranscript={spoken.handleTranscript}
      />

      {spoken.heardTranscript && (
        <p
          role="status"
          className={cn(
            "text-center text-sm text-[#92400E] bg-[#FEF9C3] border border-[#FDE047] rounded-xl px-3 py-2",
            scriptClass,
          )}
        >
          {t("voice.heard", { text: spoken.heardTranscript })}
        </p>
      )}

      <p className={cn("text-center text-sm text-[#5A7184]", scriptClass)}>
        {t("followup.answered", {
          answered: answeredCount,
          total: questions.length,
        })}
      </p>

      {continueFailed && (
        <p
          role="alert"
          className={cn(
            "text-center text-sm text-[#B91C1C] bg-[#FEE2E2] border border-[#FCA5A5] rounded-xl px-3 py-2",
            scriptClass,
          )}
        >
          {t("followup.continueError")}
        </p>
      )}

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
          {assessing ? t("followup.checking") : t("common.continue")}
        </Button>
      </div>
    </div>
  )
}
