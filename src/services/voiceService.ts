import type {
  Language,
  SpeechEngine,
  VoiceError,
  VoiceErrorCode,
  VoiceSessionOptions,
} from "@/types"

/**
 * Speech-to-text abstraction.
 *
 * The browser's Web Speech API backs this today. It is a convenience for the
 * prototype, not the clinical voice pipeline: accuracy on Indian-language
 * medical speech is not adequate, and it sends audio to the browser vendor.
 *
 * The real engine will be a FastAPI endpoint fronting Bhashini / AI4Bharat /
 * Whisper. It implements the same `SpeechEngine` interface, so swapping it in
 * means adding an engine below and changing `resolveEngine` — no component,
 * hook or screen changes.
 */

const BCP47_BY_LANGUAGE: Record<Language, string> = {
  en: "en-IN",
  hi: "hi-IN",
}

function mapErrorCode(code: SpeechRecognitionErrorCode): VoiceErrorCode {
  switch (code) {
    case "not-allowed":
    case "service-not-allowed":
      return "permission-denied"
    case "no-speech":
      return "no-speech"
    case "audio-capture":
      return "audio-capture"
    case "network":
      return "network"
    case "aborted":
      return "aborted"
    default:
      return "unknown"
  }
}

function getRecognitionConstructor(): SpeechRecognitionConstructor | undefined {
  if (typeof window === "undefined") return undefined
  return window.SpeechRecognition ?? window.webkitSpeechRecognition
}

class BrowserSpeechEngine implements SpeechEngine {
  readonly id = "browser-web-speech"

  private recognition: SpeechRecognition | null = null

  isSupported(): boolean {
    return getRecognitionConstructor() !== undefined
  }

  start(options: VoiceSessionOptions): void {
    const Recognition = getRecognitionConstructor()

    if (!Recognition) {
      options.onError({ code: "unsupported" })
      options.onEnd()
      return
    }

    // Starting twice throws in Chrome; drop the previous session first.
    this.abort()

    const recognition = new Recognition()
    recognition.lang = BCP47_BY_LANGUAGE[options.language]
    recognition.continuous = options.continuous ?? false
    recognition.interimResults = true
    recognition.maxAlternatives = 1

    recognition.onresult = (event) => {
      let settled = ""
      let interim = ""

      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i]
        const text = result[0]?.transcript ?? ""
        if (result.isFinal) settled += text
        else interim += text
      }

      options.onResult({
        transcript: settled.trim(),
        interim: interim.trim(),
        isFinal: settled.length > 0,
      })
    }

    recognition.onerror = (event) => {
      options.onError({
        code: mapErrorCode(event.error),
        detail: event.message || event.error,
      })
    }

    recognition.onend = () => {
      this.recognition = null
      options.onEnd()
    }

    this.recognition = recognition

    try {
      recognition.start()
    } catch (error) {
      // Thrown when the browser blocks the mic outright, or on a double start.
      this.recognition = null
      options.onError({
        code: "unknown",
        detail: error instanceof Error ? error.message : undefined,
      })
      options.onEnd()
    }
  }

  stop(): void {
    this.recognition?.stop()
  }

  abort(): void {
    if (!this.recognition) return
    // Detach handlers so the discarded session cannot fire `onEnd` on the new one.
    this.recognition.onresult = null
    this.recognition.onerror = null
    this.recognition.onend = null
    this.recognition.abort()
    this.recognition = null
  }
}

/**
 * Placeholder for the FastAPI-hosted engine.
 *
 * Implementing it means recording audio (MediaRecorder), POSTing chunks to
 * `/voice/transcribe`, and emitting the results through `onResult`. Reporting
 * `isSupported: false` keeps it out of the way until then.
 */
class RemoteSpeechEngine implements SpeechEngine {
  readonly id = "clinsutra-backend"

  isSupported(): boolean {
    return false
  }

  start(options: VoiceSessionOptions): void {
    options.onError({
      code: "unsupported",
      detail: "Backend speech engine is not implemented yet.",
    })
    options.onEnd()
  }

  stop(): void {}
  abort(): void {}
}

const engines: SpeechEngine[] = [new RemoteSpeechEngine(), new BrowserSpeechEngine()]

/** Picks the first engine that reports support, preferring the backend. */
export function resolveEngine(): SpeechEngine | null {
  return engines.find((engine) => engine.isSupported()) ?? null
}

export const voiceService = {
  resolveEngine,

  isSupported(): boolean {
    return resolveEngine() !== null
  },

  /** Maps an engine error onto the translation key the UI should render. */
  messageKeyFor(error: VoiceError) {
    switch (error.code) {
      case "unsupported":
        return "mic.unsupported" as const
      case "permission-denied":
        return "mic.permissionDenied" as const
      case "no-speech":
        return "mic.noSpeech" as const
      case "audio-capture":
        return "mic.audioCapture" as const
      case "network":
        return "mic.network" as const
      default:
        return "mic.error" as const
    }
  },
}
