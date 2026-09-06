import type { CSSProperties, ReactNode } from "react"
import { cn } from "@/utils"

export interface CardProps {
  children: ReactNode
  className?: string
  style?: CSSProperties
}

export function Card({ children, className, style }: CardProps) {
  return (
    <div
      className={cn(
        "bg-white rounded-3xl shadow-sm border border-[#D1E4ED]",
        className,
      )}
      style={style}
    >
      {children}
    </div>
  )
}
