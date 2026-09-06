import { AudioButton, Card } from "@/components/common"
import { useTranslation } from "@/hooks"
import type { Question } from "@/types"
import { cn } from "@/utils"
import { OptionButton } from "./OptionButton"

export interface QuestionCardProps {
  question: Question
  /** Short label above the prompt, e.g. "Q2". */
  index: string
  selectedOptionIds: string[]
  onSelect: (optionId: string) => void
}

/** One adaptive follow-up question with its option grid. */
export function QuestionCard({
  question,
  index,
  selectedOptionIds,
  onSelect,
}: QuestionCardProps) {
  const { tx, scriptClass } = useTranslation()
  const prompt = tx(question.prompt)

  return (
    <Card className="p-5 flex flex-col gap-3">
      <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center">
        <span className="text-xs bg-[#E8F4F8] text-[#0A6E8A] font-bold px-2 py-1 rounded-lg">
          {index}
        </span>
        <div className={cn("text-base font-bold text-[#0D1B2A] sm:text-xl", scriptClass)}>
          {prompt}
        </div>
        <AudioButton size="sm" text={prompt} />
      </div>
      <div
        className="grid grid-cols-1 gap-2 sm:grid-cols-2"
        role="radiogroup"
        aria-label={prompt}
      >
        {question.options.map((option) => (
          <OptionButton
            key={option.id}
            size="md"
            label={tx(option.label)}
            selected={selectedOptionIds.includes(option.id)}
            onSelect={() => onSelect(option.id)}
            className={scriptClass}
          />
        ))}
      </div>
    </Card>
  )
}
