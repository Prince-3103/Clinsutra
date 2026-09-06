import { useCallback, useEffect, useRef, useState } from "react"
import { voiceService } from "@/services"
import type { Language, SpeechEngine, VoiceError } from "@/types"
import type { TranslationKey } from "@/data"

export interface UseSpeechRecognitionOptions {
  language: Language
  /** Keep listening through pauses. Off by default for short kiosk answers. */
  continuous?: boolean
  /** Called once with the settled transcript when a phrase completes. */
  onFinalResult?: (transcript: string) => void
}

export interface UseSpeechRecognitionResult {
  /** False when no engine can run here — render the tap-only path. */
  supported: boolean
  listening: boolean
  /** Settled text. Accumulates across phrases within one listening session. */
  transcript: string
  /** Live, still-changing text. Shown greyed while the patient speaks. */
  interim: string
  error: VoiceError | null
  /** Translation key for the message to show the patient, or null. */
  errorMessageKey: TranslationKey | null
  start: () => void
  stop: () => void
  toggle: () => void
  reset: () => void
}

/**
 * Microphone capture for the kiosk.
 *
 * Talks only to `voiceService`, so replacing the browser engine with the
 * FastAPI/Bhashini/Whisper backend does not touch this hook or any component
 * that uses it. Every failure path — unsupported browser, denied permission, no
 * microphone, network loss — resolves to `error` plus `listening: false`, so a
 * refusal never leaves the UI stuck or crashes the screen.
 */
export function useSpeechRecognition(
  options: UseSpeechRecognitionOptions,
): UseSpeechRecognitionResult {
  const { language, continuous = false, onFinalResult } = options

  const [supported] = useState(() => voiceService.isSupported())
  const [listening, setListening] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [interim, setInterim] = useState("")
  const [error, setError] = useState<VoiceError | null>(null)

  const engineRef = useRef<SpeechEngine | null>(null)
  // Kept in a ref so `start` does not need to change identity when the caller
  // passes a new inline callback on every render.
  const onFinalResultRef = useRef(onFinalResult)
  onFinalResultRef.current = onFinalResult

  useEffect(() => {
    return () => {
      engineRef.current?.abort()
      engineRef.current = null
    }
  }, [])

  const start = useCallback(() => {
    if (listening) return

    const engine = voiceService.resolveEngine()
    if (!engine) {
      setError({ code: "unsupported" })
      return
    }

    engineRef.current = engine
    setError(null)
    setInterim("")
    setListening(true)

    engine.start({
      language,
      continuous,
      onResult: ({ transcript: settled, interim: live, isFinal }) => {
        setInterim(live)
        if (!isFinal || !settled) return
        setTranscript((current) => (current ? `${current} ${settled}` : settled))
        onFinalResultRef.current?.(settled)
      },
      onError: (voiceError) => {
        // "aborted" is what a deliberate stop looks like — not worth surfacing.
        if (voiceError.code !== "aborted") setError(voiceError)
        setListening(false)
      },
      onEnd: () => {
        setListening(false)
        setInterim("")
      },
    })
  }, [continuous, language, listening])

  const stop = useCallback(() => {
    engineRef.current?.stop()
    setListening(false)
  }, [])

  const toggle = useCallback(() => {
    if (listening) stop()
    else start()
  }, [listening, start, stop])

  const reset = useCallback(() => {
    engineRef.current?.abort()
    setListening(false)
    setTranscript("")
    setInterim("")
    setError(null)
  }, [])

  return {
    supported,
    listening,
    transcript,
    interim,
    error,
    errorMessageKey: error ? voiceService.messageKeyFor(error) : null,
    start,
    stop,
    toggle,
    reset,
  }
}
