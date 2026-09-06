import type { ReactNode } from "react"
import { cn } from "@/utils"

export type DisclaimerTone = "neutral" | "info"

/**
 * The medical-safety notice.
 *
 * Every screen that shows an AI-derived result renders one of these. The
 * wording must keep saying that the output is not a diagnosis and that a
 * clinician decides — do not soften it.
 */
export function Disclaimer({
  children,
  tone = "neutral",
  icon,
  className,
}: {
  children: ReactNode
  tone?: DisclaimerTone
  icon?: string
  className?: string
}) {
  if (tone === "info") {
    return (
      <div
        role="note"
        className={cn(
          "bg-[#F0F7FA] border border-[#D1E4ED] rounded-2xl p-4 text-sm text-[#5A7184] flex gap-3",
          className,
        )}
      >
        <span className="text-lg shrink-0 sm:text-xl" aria-hidden>
          {icon ?? "ℹ️"}
        </span>
        <span>{children}</span>
      </div>
    )
  }

  return (
    <div
      role="note"
      className={cn(
        "bg-[#F0F7FA] border border-[#D1E4ED] rounded-2xl p-4 text-sm text-[#5A7184] text-center",
        className,
      )}
    >
      {children}
    </div>
  )
}
