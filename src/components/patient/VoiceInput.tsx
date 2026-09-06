import { useSpeechRecognition, useTranslation } from "@/hooks"
import { cn } from "@/utils"
import { MicButton } from "./MicButton"

export interface VoiceInputProps {
  /** Caption shown beside the microphone. */
  label: string
  /** Receives the settled transcript each time a phrase completes. */
  onTranscript?: (transcript: string) => void
  /** Stack the caption above the button instead of beside it. */
  layout?: "column" | "row"
  className?: string
}

/**
 * Microphone plus its transcript and error surface.
 *
 * Every failure — no engine, blocked permission, no microphone, network loss —
 * renders as a calm message next to a still-usable screen. The patient can
 * always answer by tapping instead, so voice is never load-bearing.
 */
export function VoiceInput({
  label,
  onTranscript,
  layout = "column",
  className,
}: VoiceInputProps) {
  const { t, language, scriptClass } = useTranslation()
  const speech = useSpeechRecognition({ language, onFinalResult: onTranscript })

  const displayedTranscript = [speech.transcript, speech.interim]
    .filter(Boolean)
    .join(" ")

  return (
    <div className={cn("flex flex-col items-center gap-3", className)}>
      <div
        className={cn(
          "flex items-center gap-3",
          layout === "column" ? "flex-col" : "flex-col sm:flex-row sm:gap-4",
        )}
      >
        {layout === "column" && (
          <div className="text-[#5A7184] text-sm sm:text-base">{label}</div>
        )}
        <MicButton
          listening={speech.listening}
          disabled={!speech.supported}
          onToggle={speech.toggle}
        />
        {layout === "row" && <div className="text-[#5A7184]">{label}</div>}
      </div>

      {speech.listening && (
        <div
          className="flex items-center gap-2 text-sm font-semibold text-[#DC2626]"
          aria-live="polite"
        >
          <span className="w-2 h-2 bg-[#DC2626] rounded-full animate-pulse" />
          {t("mic.listening")}
        </div>
      )}

      {displayedTranscript && (
        <div className="w-full max-w-lg bg-white border border-[#D1E4ED] rounded-2xl px-4 py-3">
          <div className="text-xs font-bold text-[#0A6E8A] uppercase tracking-wider mb-1">
            {t("mic.transcript")}
          </div>
          <p className={cn("text-[#0D1B2A] text-sm sm:text-base", scriptClass)}>
            {speech.transcript}
            {speech.interim && (
              <span className="text-[#5A7184]"> {speech.interim}</span>
            )}
          </p>
          <button
            type="button"
            onClick={speech.reset}
            className="mt-2 text-xs font-semibold text-[#5A7184] hover:text-[#0A6E8A]"
          >
            {t("mic.clear")}
          </button>
        </div>
      )}

      {!speech.supported && (
        <p className="max-w-md text-center text-xs text-[#5A7184]">
          {t("mic.unsupported")}
        </p>
      )}

      {speech.errorMessageKey && (
        <p
          role="status"
          className="max-w-md text-center text-sm text-[#92400E] bg-[#FEF9C3] border border-[#FDE047] rounded-xl px-3 py-2"
        >
          {t(speech.errorMessageKey)}
        </p>
      )}
    </div>
  )
}
