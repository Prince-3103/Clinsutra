import { cn } from "@/utils"

export interface OptionButtonProps {
  label: string
  selected: boolean
  onSelect: () => void
  /** "lg" is the chief-complaint grid; "md" is the follow-up cards. */
  size?: "md" | "lg"
  className?: string
}

/** A selectable answer in the clinical interview. */
export function OptionButton({
  label,
  selected,
  onSelect,
  size = "lg",
  className,
}: OptionButtonProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      role="radio"
      aria-checked={selected}
      className={cn(
        "rounded-2xl border-2 text-left transition-all",
        size === "lg"
          ? "p-4 font-semibold text-sm sm:p-5 sm:text-lg"
          : "p-3 rounded-xl font-medium text-sm sm:p-4 sm:text-base",
        selected
          ? size === "lg"
            ? "bg-[#0A6E8A] text-white border-[#0A6E8A] shadow-lg"
            : "bg-[#0A6E8A] text-white border-[#0A6E8A]"
          : "bg-white text-[#0D1B2A] border-[#D1E4ED] hover:border-[#0A6E8A] hover:bg-[#E8F4F8]",
        className,
      )}
    >
      {size === "lg" ? (selected ? "✓ " : "○ ") : selected ? "✓ " : ""}
      {label}
    </button>
  )
}
