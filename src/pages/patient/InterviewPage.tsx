import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { AudioButton, Button, Card } from "@/components/common"
import { OptionButton, VoiceInput } from "@/components/patient"
import { CHIEF_COMPLAINT_QUESTION, COMPLAINTS, isComplaintId } from "@/data"
import { useKioskSession, useTranslation } from "@/hooks"
import { clinicalService } from "@/services"
import type { Question } from "@/types"
import { cn } from "@/utils"

export function InterviewPage() {
  const navigate = useNavigate()
  const { t, tx, scriptClass } = useTranslation()
  const { complaintId, setComplaint, getAnswer, answerQuestion } = useKioskSession()

  const [question, setQuestion] = useState<Question>(CHIEF_COMPLAINT_QUESTION)

  useEffect(() => {
    let cancelled = false
    clinicalService
      .getOpeningQuestion()
      .then((opening) => {
        if (!cancelled) setQuestion(opening)
      })
      .catch(() => {
        // Falls back to the bundled question, so the kiosk still works offline.
      })
    return () => {
      cancelled = true
    }
  }, [])

  const answer = getAnswer(question.id)
  const selectedId = answer?.optionIds[0] ?? null
  const prompt = tx(question.prompt)

  const handleSelect = (optionId: string) => {
    if (isComplaintId(optionId)) setComplaint(optionId, optionId)
    else answerQuestion(question.id, [optionId])
  }

  // Once a complaint is picked the follow-up count is known, so the badge can
  // show a real total instead of a placeholder.
  const totalQuestions = complaintId
    ? 1 + COMPLAINTS[complaintId].followUps.length
    : question.options.length

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-6 sm:px-6 sm:py-8">
      <div className="flex items-center gap-3">
        <span className={cn("bg-[#0A6E8A] text-white text-sm font-bold px-3 py-1 rounded-full", scriptClass)}>
          {t("interview.badge", { current: 1, total: totalQuestions })}
        </span>
        <AudioButton size="sm" text={prompt} />
      </div>

      <Card className="p-6 border-l-4 border-l-[#0A6E8A]">
        <div
          className={cn(
            "text-xl font-bold text-[#0D1B2A] leading-snug sm:text-2xl",
            scriptClass,
          )}
        >
          {prompt}
        </div>
      </Card>

      <div
        className="grid grid-cols-1 gap-3 sm:grid-cols-2"
        role="radiogroup"
        aria-label={prompt}
      >
        {question.options.map((option) => (
          <OptionButton
            key={option.id}
            label={tx(option.label)}
            selected={selectedId === option.id}
            onSelect={() => handleSelect(option.id)}
            className={scriptClass}
          />
        ))}
      </div>

      <VoiceInput
        label={t("interview.speakPrompt")}
        className="py-4"
        onTranscript={(transcript) => {
          if (!selectedId) return
          answerQuestion(question.id, [selectedId], transcript)
        }}
      />

      <div className="flex gap-4">
        <Button
          variant="outline"
          size="lg"
          className={cn("flex-1", scriptClass)}
          onClick={() => navigate("/kiosk/identify")}
        >
          {t("common.back")}
        </Button>
        <Button
          size="lg"
          className={cn("flex-1", scriptClass)}
          onClick={() => navigate("/kiosk/follow-up")}
          disabled={!selectedId}
        >
          {t("common.next")}
        </Button>
      </div>

      {!selectedId && (
        <p className={cn("text-center text-sm text-[#5A7184]", scriptClass)}>
          {t("interview.selectToContinue")}
        </p>
      )}
    </div>
  )
}
