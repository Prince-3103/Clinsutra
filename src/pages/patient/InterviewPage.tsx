import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { AudioButton, Button, Card } from "@/components/common"
import { OptionButton, VoiceInput } from "@/components/patient"
import { CHIEF_COMPLAINT_QUESTION, COMPLAINTS, isComplaintId } from "@/data"
import { useKioskSession, useSpokenOptionSelect, useTranslation } from "@/hooks"
import { clinicalService } from "@/services"
import type { Question } from "@/types"
import { cn } from "@/utils"

export function InterviewPage() {
  const navigate = useNavigate()
  const { t, tx, scriptClass, language } = useTranslation()
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

  const handleSelect = (optionId: string, transcript?: string) => {
    if (isComplaintId(optionId)) {
      setComplaint(optionId, optionId)
      // Preserve the spoken text as free text (e.g. an unknown symptom routed
      // to "Something else"). setComplaint already recorded the option id.
      if (transcript) answerQuestion(CHIEF_COMPLAINT_QUESTION.id, [optionId], transcript)
    } else {
      answerQuestion(question.id, [optionId], transcript)
    }
  }

  // "Something else" (the catch-all) is where an unmatched spoken answer lands,
  // deterministically — never an unrelated specific option. Undefined if this
  // question has no such option (then unmatched speech just prompts a tap).
  const fallbackOptionId = question.options.find((o) => o.id === "other")?.id

  // Spoken answers drive the same selection path as a tap. A confident, single
  // match selects the specific option; an unknown answer selects "Something
  // else" and keeps the transcript; ambiguous answers echo back for a tap.
  // Works identically for Gemini Live and the browser fallback.
  const spoken = useSpokenOptionSelect(question.options, language, handleSelect, {
    fallbackOptionId,
  })

  const selectByTap = (optionId: string) => {
    spoken.clearHeard()
    handleSelect(optionId)
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
            onSelect={() => selectByTap(option.id)}
            className={scriptClass}
          />
        ))}
      </div>

      <VoiceInput
        label={t("interview.speakPrompt")}
        className="py-4"
        onTranscript={spoken.handleTranscript}
      />

      {spoken.heardTranscript && !selectedId && (
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
