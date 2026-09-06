import { Card } from "@/components/common"
import { cn } from "@/utils"

export interface ReviewSectionProps {
  label: string
  value: string
  editing: boolean
  onChange: (value: string) => void
  scriptClass?: string
}

/** One block of the AI-drafted history, editable in place by the patient. */
export function ReviewSection({
  label,
  value,
  editing,
  onChange,
  scriptClass,
}: ReviewSectionProps) {
  return (
    <Card className="px-5 py-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div
            className={cn(
              "text-xs font-bold text-[#0A6E8A] uppercase tracking-wider mb-1",
              scriptClass,
            )}
          >
            {label}
          </div>
          {editing ? (
            <textarea
              value={value}
              aria-label={label}
              onChange={(event) => onChange(event.target.value)}
              className="w-full text-[#0D1B2A] text-sm border border-[#D1E4ED] rounded-xl px-3 py-2 focus:outline-none focus:border-[#0A6E8A] resize-none sm:text-base"
              rows={2}
            />
          ) : (
            <div className="text-[#0D1B2A] text-sm sm:text-base">{value}</div>
          )}
        </div>
      </div>
    </Card>
  )
}
