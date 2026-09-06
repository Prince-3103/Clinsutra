import { useTranslation } from "@/hooks"
import { cn } from "@/utils"

export interface MicButtonProps {
  listening: boolean
  disabled?: boolean
  onToggle: () => void
}

/** The round microphone control. Tap to start, tap again to stop. */
export function MicButton({ listening, disabled, onToggle }: MicButtonProps) {
  const { t } = useTranslation()

  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      aria-pressed={listening}
      aria-label={listening ? t("mic.stop") : t("mic.speak")}
      className={cn(
        "relative w-24 h-24 rounded-full flex flex-col items-center justify-center gap-1 border-4 font-bold text-xs transition-all select-none",
        listening
          ? "bg-[#DC2626] text-white border-[#DC2626] scale-110 shadow-xl shadow-red-300"
          : "bg-white text-[#0A6E8A] border-[#0A6E8A] hover:bg-[#E8F4F8] shadow-lg",
        disabled && "opacity-50 cursor-not-allowed hover:bg-white",
      )}
    >
      <span className="text-3xl" aria-hidden>
        {listening ? "⏹" : "🎤"}
      </span>
      <span>{listening ? t("mic.stop") : t("mic.speak")}</span>
      {listening && (
        <span className="absolute inset-0 rounded-full border-4 border-red-400 animate-ping opacity-60" />
      )}
    </button>
  )
}
