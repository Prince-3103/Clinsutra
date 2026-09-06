import type { PatientStatus, Priority } from "@/types"
import { cn } from "@/utils"
import { Badge } from "./Badge"

const STATUS_ICON: Record<PatientStatus, string> = {
  Waiting: "⏳",
  "In Consultation": "🩺",
  Completed: "✓",
}

const STATUS_COLOR = {
  Waiting: "yellow",
  "In Consultation": "blue",
  Completed: "green",
} as const

export function StatusBadge({ status }: { status: PatientStatus }) {
  return (
    <Badge color={STATUS_COLOR[status]}>
      {STATUS_ICON[status]} {status}
    </Badge>
  )
}

const PRIORITY_STYLES: Record<Priority, string> = {
  P1: "bg-[#DC2626] text-white",
  P2: "bg-[#D97706] text-white",
  P3: "bg-[#059669] text-white",
}

const PRIORITY_LABEL: Record<Priority, string> = {
  P1: "Priority 1 — most urgent",
  P2: "Priority 2",
  P3: "Priority 3 — routine",
}

export function PriorityDot({ level }: { level: Priority }) {
  return (
    <span
      title={PRIORITY_LABEL[level]}
      className={cn(
        "w-7 h-7 rounded-full flex items-center justify-center text-xs font-black",
        PRIORITY_STYLES[level],
      )}
    >
      {level}
    </span>
  )
}
