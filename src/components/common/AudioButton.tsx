import { useCallback, useEffect, useRef, useState } from "react"
import { useTranslation } from "@/hooks"
import { cn } from "@/utils"

export type AudioButtonSize = "sm" | "md" | "lg"

const SIZES: Record<AudioButtonSize, string> = {
  sm: "w-10 h-10 text-lg",
  md: "w-14 h-14 text-2xl",
  lg: "w-20 h-20 text-4xl",
}

export interface AudioButtonProps {
  size?: AudioButtonSize
  /** Text read aloud. Omit to render the control without speech output. */
  text?: string
  className?: string
}

/**
 * Reads a screen's instruction aloud for low-literacy patients.
 *
 * Uses the browser's speech synthesis where available and degrades to a
 * decorative toggle where it is not, so the button never throws.
 */
export function AudioButton({ size = "md", text, className }: AudioButtonProps) {
  const { t, language } = useTranslation()
  const [playing, setPlaying] = useState(false)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

  const supported =
    typeof window !== "undefined" && "speechSynthesis" in window && Boolean(text)

  const stop = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel()
    }
    setPlaying(false)
  }, [])

  useEffect(() => stop, [stop])

  const handleClick = () => {
    if (playing) {
      stop()
      return
    }
    if (!supported || !text) {
      // No speech engine here — flash the pressed state and move on.
      setPlaying(true)
      window.setTimeout(() => setPlaying(false), 600)
      return
    }

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = language === "hi" ? "hi-IN" : "en-IN"
    utterance.onend = () => setPlaying(false)
    utterance.onerror = () => setPlaying(false)
    utteranceRef.current = utterance
    setPlaying(true)
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(utterance)
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      title={t("audio.listen")}
      aria-label={t("audio.listen")}
      aria-pressed={playing}
      className={cn(
        "relative rounded-full flex items-center justify-center font-bold border-2 transition-all",
        SIZES[size],
        playing
          ? "bg-[#0A6E8A] text-white border-[#0A6E8A]"
          : "bg-[#E8F4F8] text-[#0A6E8A] border-[#0A6E8A]",
        className,
      )}
    >
      {playing ? "⏸" : "🔊"}
      {playing && (
        <span className="absolute inset-0 rounded-full border-2 border-[#0A6E8A] animate-ping opacity-50" />
      )}
    </button>
  )
}
