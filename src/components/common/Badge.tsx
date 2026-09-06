import type { ReactNode } from "react"
import { cn } from "@/utils"

export type BadgeColor = "blue" | "red" | "green" | "yellow" | "gray" | "orange"

const COLORS: Record<BadgeColor, string> = {
  blue: "bg-[#DBEAFE] text-[#1E40AF]",
  red: "bg-[#FEE2E2] text-[#991B1B]",
  green: "bg-[#D1FAE5] text-[#065F46]",
  yellow: "bg-[#FEF9C3] text-[#92400E]",
  gray: "bg-[#F1F5F9] text-[#475569]",
  orange: "bg-[#FEF3C7] text-[#92400E]",
}

export function Badge({
  children,
  color = "blue",
  className,
}: {
  children: ReactNode
  color?: BadgeColor
  className?: string
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold",
        COLORS[color],
        className,
      )}
    >
      {children}
    </span>
  )
}
