import type {
  Language,
  SpeechEngine,
  VoiceError,
  VoiceErrorCode,
  VoiceSessionOptions,
} from "@/types"
import { API_CONFIG } from "./apiClient"

/**
 * Speech-to-text abstraction.
 *
 * Two engines implement the same `SpeechEngine` interface:
 *
 *  - `GeminiLiveEngine` (PRIMARY): streams microphone audio over a WebSocket to
 *    the FastAPI relay (`/voice/live`), which holds the Gemini Live session with
 *    the server-side key and returns transcriptions. The Gemini API key never
 *    reaches the browser. Speech-to-text only — Gemini never diagnoses or
 *    triages here; deterministic triage stays authoritative.
 *  - `BrowserSpeechEngine` (FALLBACK): the browser's built-in Web Speech API.
 *    Used automatically whenever Gemini Live is unconfigured, unavailable,
 *    errors, or times out, so voice — and the kiosk flow — never breaks.
 *
 * Swapping or reordering engines is confined to this file; no component, hook,
 * or screen changes.
 */

const BCP47_BY_LANGUAGE: Record<Language, string> = {
  en: "en-IN",
  hi: "hi-IN",
}

/** Target sample rate for Gemini Live realtime audio input (PCM16 mono). */
const LIVE_SAMPLE_RATE = 16000
/** How long to wait for the relay's "ready" before falling back. */
const LIVE_READY_TIMEOUT_MS = 4000

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

type AudioContextConstructor = typeof AudioContext

function getAudioContextConstructor(): AudioContextConstructor | undefined {
  if (typeof window === "undefined") return undefined
  return (
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: AudioContextConstructor })
      .webkitAudioContext
  )
}

/**
 * Builds the voice WebSocket URL from the configured API base.
 *
 * Handles both an absolute base (`http(s)://host/api` -> `ws(s)://host/api`)
 * and a relative base (`/api` -> `ws(s)://<page host>/api`). The scheme follows
 * the page: on an https tunnel it becomes `wss` so it is not blocked as mixed
 * content. A relative base is the default, so the socket rides the same
 * forwarded origin as the page (proxied to the backend by the dev server).
 */
function liveSocketUrl(language: Language): string {
  const base = API_CONFIG.baseUrl
  const query = `?language=${encodeURIComponent(language)}`

  if (/^https?:\/\//i.test(base)) {
    const url = new URL(base)
    url.protocol = url.protocol === "https:" ? "wss:" : "ws:"
    return `${url.toString().replace(/\/$/, "")}/voice/live${query}`
  }

  const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:"
  const path = base.startsWith("/") ? base : `/${base}`
  return `${wsProtocol}//${window.location.host}${path}/voice/live${query}`
}

/** Float32 [-1,1] samples -> little-endian PCM16, downsampled to 16 kHz. */
function encodePcm16(input: Float32Array, inputRate: number): ArrayBuffer {
  const ratio = inputRate / LIVE_SAMPLE_RATE
  const outLength = ratio > 1 ? Math.floor(input.length / ratio) : input.length
  const output = new Int16Array(outLength)
  for (let i = 0; i < outLength; i += 1) {
    const sample = input[Math.floor(i * ratio)] ?? 0
    const clamped = Math.max(-1, Math.min(1, sample))
    output[i] = clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff
  }
  return output.buffer
}

/**
 * PRIMARY engine: microphone -> FastAPI `/voice/live` -> Gemini Live.
 *
 * The Gemini key stays on the backend; the browser only opens a WebSocket and
 * streams PCM audio. Any connection/permission/timeout failure resolves through
 * `onError` + `onEnd`, which lets the hook fall back to the browser engine.
 */
class GeminiLiveEngine implements SpeechEngine {
  readonly id = "gemini-live"

  private ws: WebSocket | null = null
  private ctx: AudioContext | null = null
  private stream: MediaStream | null = null
  private source: MediaStreamAudioSourceNode | null = null
  private processor: ScriptProcessorNode | null = null
  private readyTimer: ReturnType<typeof setTimeout> | null = null
  private ended = false
  private ready = false

  isSupported(): boolean {
    if (typeof window === "undefined") return false
    return (
      typeof WebSocket !== "undefined" &&
      typeof navigator !== "undefined" &&
      !!navigator.mediaDevices?.getUserMedia &&
      getAudioContextConstructor() !== undefined
    )
  }

  start(options: VoiceSessionOptions): void {
    this.abort()
    this.ended = false
    this.ready = false

    let ws: WebSocket
    try {
      ws = new WebSocket(liveSocketUrl(options.language))
    } catch {
      this.fail(options, { code: "network", detail: "Could not open voice socket." })
      return
    }
    ws.binaryType = "arraybuffer"
    this.ws = ws

    // If the relay never says "ready", treat Gemini Live as unavailable so the
    // caller falls back to the browser engine instead of hanging.
    this.readyTimer = setTimeout(() => {
      if (!this.ready) {
        this.fail(options, { code: "network", detail: "Gemini Live timed out." })
      }
    }, LIVE_READY_TIMEOUT_MS)

    ws.onmessage = (event) => {
      let message: { type?: string; text?: string; final?: boolean; detail?: string }
      try {
        message = JSON.parse(event.data as string)
      } catch {
        return
      }

      switch (message.type) {
        case "ready":
          this.ready = true
          this.clearReadyTimer()
          void this.beginCapture(options)
          break
        case "transcript":
          if (message.final) {
            options.onResult({ transcript: message.text ?? "", interim: "", isFinal: true })
          } else {
            options.onResult({ transcript: "", interim: message.text ?? "", isFinal: false })
          }
          break
        case "unsupported":
        case "error":
          // Relay asked us to fall back (no key, SDK missing, session failed).
          this.fail(options, { code: "unsupported", detail: message.detail })
          break
      }
    }

    ws.onerror = () => {
      // Only meaningful before we're streaming; after that, onclose handles it.
      if (!this.ready) this.fail(options, { code: "network", detail: "Voice socket error." })
    }

    ws.onclose = () => {
      this.clearReadyTimer()
      this.cleanupAudio()
      this.finish(options)
    }
  }

  private async beginCapture(options: VoiceSessionOptions): Promise<void> {
    const AudioCtor = getAudioContextConstructor()
    if (!AudioCtor) {
      this.fail(options, { code: "unsupported" })
      return
    }

    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch (error) {
      const name = error instanceof DOMException ? error.name : ""
      // Permission / hardware failures are surfaced, not silently retried on the
      // browser engine — it would hit the same wall and re-prompt.
      const code: VoiceErrorCode =
        name === "NotAllowedError" || name === "SecurityError"
          ? "permission-denied"
          : name === "NotFoundError"
            ? "audio-capture"
            : "network"
      this.fail(options, { code, detail: name })
      return
    }

    // The socket may have closed while we awaited permission.
    if (this.ended || !this.ws || this.ws.readyState !== WebSocket.OPEN) {
      stream.getTracks().forEach((track) => track.stop())
      return
    }

    this.stream = stream
    const ctx = new AudioCtor()
    this.ctx = ctx
    const source = ctx.createMediaStreamSource(stream)
    this.source = source
    // ScriptProcessorNode is deprecated but dependency-free and reliable across
    // kiosk browsers — adequate for this MVP (no separate worklet module to
    // bundle). It emits raw PCM we downsample to 16 kHz and forward.
    const processor = ctx.createScriptProcessor(4096, 1, 1)
    this.processor = processor

    processor.onaudioprocess = (event) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return
      const channel = event.inputBuffer.getChannelData(0)
      this.ws.send(encodePcm16(channel, ctx.sampleRate))
    }

    source.connect(processor)
    // Required for onaudioprocess to fire in some browsers. The processor writes
    // no output, so this feeds silence to the speakers (no echo).
    processor.connect(ctx.destination)
  }

  stop(): void {
    // Tell the relay to flush the current utterance, then close.
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send("end")
      } catch {
        // ignore — closing anyway
      }
    }
    this.abort()
  }

  abort(): void {
    this.clearReadyTimer()
    this.cleanupAudio()
    if (this.ws) {
      this.ws.onmessage = null
      this.ws.onerror = null
      this.ws.onclose = null
      try {
        this.ws.close()
      } catch {
        // already closing
      }
      this.ws = null
    }
  }

  private cleanupAudio(): void {
    if (this.processor) {
      this.processor.onaudioprocess = null
      this.processor.disconnect()
      this.processor = null
    }
    this.source?.disconnect()
    this.source = null
    if (this.ctx) {
      void this.ctx.close().catch(() => undefined)
      this.ctx = null
    }
    this.stream?.getTracks().forEach((track) => track.stop())
    this.stream = null
  }

  private clearReadyTimer(): void {
    if (this.readyTimer !== null) {
      clearTimeout(this.readyTimer)
      this.readyTimer = null
    }
  }

  /** Report an error and end the session exactly once. */
  private fail(options: VoiceSessionOptions, error: VoiceError): void {
    if (this.ended) return
    options.onError(error)
    this.abort()
    this.finish(options)
  }

  /** Fire `onEnd` exactly once for this session. */
  private finish(options: VoiceSessionOptions): void {
    if (this.ended) return
    this.ended = true
    options.onEnd()
  }
}

const engines: SpeechEngine[] = [new GeminiLiveEngine(), new BrowserSpeechEngine()]

/**
 * Supported engines in priority order (Gemini Live first, browser fallback).
 * The hook walks this list, so a runtime failure of the primary engine hands
 * off to the next one automatically.
 */
export function resolveEngines(): SpeechEngine[] {
  return engines.filter((engine) => engine.isSupported())
}

/** The highest-priority supported engine, or null if none can run here. */
export function resolveEngine(): SpeechEngine | null {
  return resolveEngines()[0] ?? null
}

export const voiceService = {
  resolveEngine,
  resolveEngines,

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
