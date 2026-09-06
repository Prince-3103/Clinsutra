import type { ButtonHTMLAttributes, ReactNode } from "react"
import { cn } from "@/utils"

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "danger"
  | "success"

export type ButtonSize = "sm" | "md" | "lg" | "xl"

const BASE =
  "inline-flex items-center justify-center gap-3 font-semibold rounded-2xl cursor-pointer select-none border-2 transition-all text-center"

const SIZES: Record<ButtonSize, string> = {
  sm: "px-4 py-2 text-sm sm:text-base",
  md: "px-5 py-3 text-sm sm:text-lg",
  lg: "px-5 py-3 text-base min-h-[52px] sm:px-8 sm:py-4 sm:text-xl sm:min-h-[64px]",
  xl: "px-6 py-4 text-lg min-h-[60px] sm:px-10 sm:py-5 sm:text-2xl sm:min-h-[80px]",
}

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "bg-[#0A6E8A] text-white border-[#0A6E8A] hover:bg-[#085F78] active:bg-[#074F65] shadow-lg shadow-[#0A6E8A]/20",
  secondary: "bg-[#E8F4F8] text-[#0A6E8A] border-[#0A6E8A] hover:bg-[#D1E9F2]",
  outline: "bg-white text-[#0D1B2A] border-[#D1E4ED] hover:bg-[#F0F7FA]",
  ghost: "bg-transparent text-[#5A7184] border-transparent hover:bg-[#EEF3F6]",
  danger:
    "bg-[#DC2626] text-white border-[#DC2626] hover:bg-[#B91C1C] shadow-lg shadow-red-200",
  success:
    "bg-[#059669] text-white border-[#059669] hover:bg-[#047857] shadow-lg shadow-green-200",
}

export interface ButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className"> {
  children: ReactNode
  variant?: ButtonVariant
  size?: ButtonSize
  icon?: ReactNode
  className?: string
}

/** The large touch target used across the kiosk. */
export function Button({
  children,
  variant = "primary",
  size = "lg",
  icon,
  disabled,
  className,
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled}
      className={cn(
        BASE,
        SIZES[size],
        VARIANTS[variant],
        disabled && "opacity-50 cursor-not-allowed",
        className,
      )}
      {...rest}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </button>
  )
}
