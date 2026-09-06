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
 * The browser Web Speech API backs this today. A FastAPI-hosted engine
 * (Bhashini / AI4Bharat / Whisper) will implement the same interface, so
 * swapping engines touches `services/voiceService.ts` only — no UI changes.
 */
export interface SpeechEngine {
  readonly id: string
  isSupported(): boolean
  start(options: VoiceSessionOptions): void
  stop(): void
  abort(): void
}
