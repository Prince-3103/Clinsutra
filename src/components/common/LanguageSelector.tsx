import { LANGUAGE_OPTIONS } from "@/data"
import { useTranslation } from "@/hooks"
import { cn } from "@/utils"

/** Compact EN / हि toggle used in the kiosk header. */
export function LanguageToggle() {
  const { language, setLanguage } = useTranslation()

  return (
    <div
      className="flex rounded-xl overflow-hidden border border-[#D1E4ED]"
      role="group"
      aria-label="Language"
    >
      {LANGUAGE_OPTIONS.map((option) => (
        <button
          key={option.code}
          type="button"
          onClick={() => setLanguage(option.code)}
          aria-pressed={language === option.code}
          className={cn(
            "px-4 py-2 text-sm font-semibold transition-colors",
            language === option.code
              ? "bg-[#0A6E8A] text-white"
              : "bg-white text-[#5A7184] hover:bg-[#F0F7FA]",
          )}
        >
          {option.code === "en" ? "EN" : "हि"}
        </button>
      ))}
    </div>
  )
}

/** Full-size language cards on the welcome screen. */
export function LanguageSelector({ className }: { className?: string }) {
  const { language, setLanguage } = useTranslation()

  return (
    <div className={className}>
      {LANGUAGE_OPTIONS.map((option) => (
        <button
          key={option.code}
          type="button"
          onClick={() => setLanguage(option.code)}
          aria-pressed={language === option.code}
          className={cn(
            "h-24 w-full rounded-3xl flex flex-col items-center justify-center gap-2 border-4 font-bold text-base transition-all shadow-lg sm:h-36 sm:text-2xl sm:gap-3",
            language === option.code
              ? "bg-[#0A6E8A] text-white border-[#0A6E8A] shadow-[#0A6E8A]/30"
              : "bg-white text-[#0D1B2A] border-[#D1E4ED] hover:border-[#0A6E8A] hover:bg-[#E8F4F8]",
          )}
        >
          <span className="text-3xl sm:text-4xl">{option.flag}</span>
          <span className={option.fontClass}>{option.nativeLabel}</span>
        </button>
      ))}
    </div>
  )
}
