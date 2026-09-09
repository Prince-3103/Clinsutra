import type { Language } from "./common"

export type VoiceErrorCode =
  | "unsupported"
  | "permission-denied"
  | "no-speech"
  | "audio-capture"
  | "network"
  | "aborted"
  | "unknown"

export interface VoiceError {
  code: VoiceErrorCode
  /** Raw message from the underlying engine, for debugging. Never shown raw. */
  detail?: string
}

export interface TranscriptResult {
  /** Text settled by the engine and no longer subject to change. */
  transcript: string
  /** Best-guess text still being revised as the patient speaks. */
  interim: string
  isFinal: boolean
}

export interface VoiceSessionOptions {
  language: Language
  /** Keep listening after a pause instead of stopping at the first result. */
  continuous?: boolean
  onResult: (result: TranscriptResult) => void
  onError: (error: VoiceError) => void
  onEnd: () => void
}

/**
 * The contract every speech engine implements.
 *
 * Two engines back this: `GeminiLiveEngine` (primary — streams audio to the
 * FastAPI `/voice/live` relay fronting Gemini Live) and `BrowserSpeechEngine`
 * (automatic fallback — the browser Web Speech API). Both live in
 * `services/voiceService.ts`, so swapping or reordering engines touches that
 * file only — no UI changes.
 */
export interface SpeechEngine {
  readonly id: string
  isSupported(): boolean
  start(options: VoiceSessionOptions): void
  stop(): void
  abort(): void
}
