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
  // Set when the active engine failed in a way that warrants trying the next
  // engine in the list. Read in `onEnd` (which every engine fires after
  // `onError`) so the hand-off happens with only one engine ever active.
  const fallbackToRef = useRef<number | null>(null)
  // Whether the active engine has produced any transcript yet. Once it has, a
  // later error is surfaced rather than triggering a silent engine switch.
  const producedResultRef = useRef(false)
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

    const engineList = voiceService.resolveEngines()
    if (engineList.length === 0) {
      setError({ code: "unsupported" })
      return
    }

    setError(null)
    setInterim("")
    setListening(true)
    fallbackToRef.current = null
    producedResultRef.current = false

    // Codes worth retrying on the next engine: the primary engine could not run
    // here (unconfigured/SDK missing) or could not reach the relay (network /
    // timeout). Permission / hardware / no-speech errors are surfaced as-is —
    // the fallback engine would hit the same wall.
    const isHandoffCode = (code: string) => code === "unsupported" || code === "network"

    const runEngine = (index: number) => {
      const engine = engineList[index]
      if (!engine) {
        setListening(false)
        return
      }
      engineRef.current = engine

      engine.start({
        language,
        continuous,
        onResult: ({ transcript: settled, interim: live, isFinal }) => {
          producedResultRef.current = true
          setInterim(live)
          if (!isFinal || !settled) return
          setTranscript((current) => (current ? `${current} ${settled}` : settled))
          onFinalResultRef.current?.(settled)
        },
        onError: (voiceError) => {
          const canFallback =
            isHandoffCode(voiceError.code) &&
            !producedResultRef.current &&
            index + 1 < engineList.length
          if (canFallback) {
            // Defer the switch to onEnd so the failed engine is fully torn down.
            fallbackToRef.current = index + 1
            return
          }
          // "aborted" is what a deliberate stop looks like — not worth surfacing.
          if (voiceError.code !== "aborted") setError(voiceError)
          setListening(false)
        },
        onEnd: () => {
          if (fallbackToRef.current !== null) {
            const next = fallbackToRef.current
            fallbackToRef.current = null
            runEngine(next)
            return
          }
          setListening(false)
          setInterim("")
        },
      })
    }

    runEngine(0)
  }, [continuous, language, listening])

  const stop = useCallback(() => {
    fallbackToRef.current = null
    engineRef.current?.stop()
    setListening(false)
  }, [])

  const toggle = useCallback(() => {
    if (listening) stop()
    else start()
  }, [listening, start, stop])

  const reset = useCallback(() => {
    fallbackToRef.current = null
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
