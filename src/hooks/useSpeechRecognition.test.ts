import { afterEach, describe, expect, it, vi } from "vitest"
import { act, renderHook } from "@testing-library/react"
import { useSpeechRecognition } from "./useSpeechRecognition"
import { voiceService } from "@/services"
import type { SpeechEngine, VoiceSessionOptions } from "@/types"

/** A stand-in for Gemini Live that fails to connect (relay unreachable). */
function makeFailingEngine(): SpeechEngine {
  return {
    id: "gemini-live",
    isSupported: () => true,
    start(options: VoiceSessionOptions) {
      // Mirrors the real engine: a handoff-worthy error, then onEnd.
      options.onError({ code: "network", detail: "relay unreachable" })
      options.onEnd()
    },
    stop() {},
    abort() {},
  }
}

/** A stand-in for the browser Web Speech engine that transcribes successfully. */
function makeBrowserEngine(): SpeechEngine {
  return {
    id: "browser-web-speech",
    isSupported: () => true,
    start(options: VoiceSessionOptions) {
      options.onResult({ transcript: "fever", interim: "", isFinal: true })
      options.onEnd()
    },
    stop() {},
    abort() {},
  }
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe("useSpeechRecognition — automatic fallback", () => {
  it("falls back to the browser engine when Gemini Live fails, with the same transcript path", () => {
    const failing = makeFailingEngine()
    const browser = makeBrowserEngine()
    vi.spyOn(voiceService, "isSupported").mockReturnValue(true)
    vi.spyOn(voiceService, "resolveEngines").mockReturnValue([failing, browser])

    const onFinalResult = vi.fn()
    const { result } = renderHook(() =>
      useSpeechRecognition({ language: "en", onFinalResult }),
    )

    act(() => result.current.start())

    // The primary engine's network failure handed off to the browser engine,
    // which produced the transcript — the caller sees it identically.
    expect(onFinalResult).toHaveBeenCalledExactlyOnceWith("fever")
    expect(result.current.transcript).toBe("fever")
    expect(result.current.error).toBeNull()
    expect(result.current.listening).toBe(false)
  })

  it("surfaces the error when no fallback engine is available", () => {
    const failing = makeFailingEngine()
    vi.spyOn(voiceService, "isSupported").mockReturnValue(true)
    vi.spyOn(voiceService, "resolveEngines").mockReturnValue([failing])

    const { result } = renderHook(() => useSpeechRecognition({ language: "en" }))

    act(() => result.current.start())

    expect(result.current.error).toEqual({
      code: "network",
      detail: "relay unreachable",
    })
    expect(result.current.listening).toBe(false)
  })
})
