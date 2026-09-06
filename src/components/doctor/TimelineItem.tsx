import { Badge } from "@/components/common"
import type { TimelineEvent } from "@/types"
import { cn } from "@/utils"

const COLOR_MAP: Record<TimelineEvent["color"], string> = {
  blue: "border-l-[#2563EB] bg-[#EFF6FF]",
  green: "border-l-[#059669] bg-[#ECFDF5]",
  orange: "border-l-[#D97706] bg-[#FFFBEB]",
  gray: "border-l-[#6B7280] bg-white",
  red: "border-l-[#DC2626] bg-[#FEF2F2]",
}

export interface TimelineItemProps {
  event: TimelineEvent
  expanded: boolean
  onToggle: (eventId: string) => void
}

export function TimelineItem({ event, expanded, onToggle }: TimelineItemProps) {
  return (
    <div className="relative flex gap-3 pl-2 pb-4 sm:gap-4">
      <div
        className={cn(
          "relative z-10 w-10 h-10 rounded-full flex items-center justify-center text-base shrink-0 border-2 sm:text-lg",
          event.abnormal
            ? "bg-[#FEF2F2] border-[#FCA5A5]"
            : "bg-white border-[#D1E4ED]",
        )}
        aria-hidden
      >
        {event.icon}
      </div>

      <div
        className={cn(
          "flex-1 border-l-4 rounded-r-2xl border border-[#D1E4ED] overflow-hidden transition-all",
          COLOR_MAP[event.color],
        )}
      >
        <button
          type="button"
          onClick={() => onToggle(event.id)}
          aria-expanded={expanded}
          className="w-full text-left px-4 py-3 flex flex-col items-start justify-between gap-3 cursor-pointer hover:shadow-md sm:flex-row"
        >
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-0.5">
              <span className="text-xs font-bold text-[#5A7184] uppercase tracking-wider">
                {event.type}
              </span>
              <span className="text-xs text-[#5A7184]">•</span>
              <span className="text-xs text-[#5A7184]">{event.source}</span>
              {event.abnormal && <Badge color="red">↑↓ Abnormal</Badge>}
            </div>
            <div className="font-semibold text-[#0D1B2A] text-sm">{event.title}</div>
            <div className="text-xs text-[#5A7184] mt-0.5">{event.summary}</div>
          </div>
          <div className="shrink-0 text-left sm:text-right">
            <div className="text-xs font-semibold text-[#0D1B2A]">{event.date}</div>
            <div className="text-xs text-[#5A7184] mt-1">
              {expanded ? "▲ Collapse" : "▼ Expand"}
            </div>
          </div>
        </button>

        {expanded && (
          <div className="px-4 pb-4 pt-0 border-t border-white/50">
            <p className="text-sm text-[#0D1B2A] leading-relaxed">{event.detail}</p>
            <p className="mt-2 text-xs text-[#5A7184]">
              📄 Source document not attached in this demo.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
