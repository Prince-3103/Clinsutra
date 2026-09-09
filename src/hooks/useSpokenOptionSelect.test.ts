import { describe, expect, it, vi } from "vitest"
import { act, renderHook } from "@testing-library/react"
import { useSpokenOptionSelect } from "./useSpokenOptionSelect"
import { CHIEF_COMPLAINT_QUESTION } from "@/data"

const candidates = CHIEF_COMPLAINT_QUESTION.options

describe("useSpokenOptionSelect", () => {
  it("selects the option on a clear spoken match and shows no prompt", () => {
    const onMatch = vi.fn()
    const { result } = renderHook(() =>
      useSpokenOptionSelect(candidates, "en", onMatch),
    )

    act(() => result.current.handleTranscript("I have fever"))

    expect(onMatch).toHaveBeenCalledExactlyOnceWith("fever")
    expect(result.current.heardTranscript).toBeNull()
  })

  it("does not select on an ambiguous answer; echoes the transcript instead", () => {
    const onMatch = vi.fn()
    const { result } = renderHook(() =>
      useSpokenOptionSelect(candidates, "en", onMatch),
    )

    act(() => result.current.handleTranscript("pain"))

    expect(onMatch).not.toHaveBeenCalled()
    expect(result.current.heardTranscript).toBe("pain")
  })

  it("does not select when nothing matches; echoes the transcript", () => {
    const onMatch = vi.fn()
    const { result } = renderHook(() =>
      useSpokenOptionSelect(candidates, "en", onMatch),
    )

    act(() => result.current.handleTranscript("hello there"))

    expect(onMatch).not.toHaveBeenCalled()
    expect(result.current.heardTranscript).toBe("hello there")
  })

  it("lets a manual tap clear the echoed prompt", () => {
    const onMatch = vi.fn()
    const { result } = renderHook(() =>
      useSpokenOptionSelect(candidates, "en", onMatch),
    )

    act(() => result.current.handleTranscript("pain"))
    expect(result.current.heardTranscript).toBe("pain")

    // A tap in the UI calls clearHeard() alongside its own selection.
    act(() => result.current.clearHeard())
    expect(result.current.heardTranscript).toBeNull()
  })

  describe('"Something else" catch-all fallback', () => {
    it("routes an unknown symptom to the fallback option, preserving the transcript", () => {
      const onMatch = vi.fn()
      const { result } = renderHook(() =>
        useSpokenOptionSelect(candidates, "en", onMatch, { fallbackOptionId: "other" }),
      )

      act(() => result.current.handleTranscript("I have skin problem"))

      expect(onMatch).toHaveBeenCalledExactlyOnceWith("other", "I have skin problem")
      expect(result.current.heardTranscript).toBeNull()
    })

    it("routes an unknown disease to the fallback option", () => {
      const onMatch = vi.fn()
      const { result } = renderHook(() =>
        useSpokenOptionSelect(candidates, "en", onMatch, { fallbackOptionId: "other" }),
      )

      act(() => result.current.handleTranscript("I think I have diabetes"))

      expect(onMatch).toHaveBeenCalledExactlyOnceWith("other", "I think I have diabetes")
    })

    it("still prefers a confident specific match over the fallback", () => {
      const onMatch = vi.fn()
      const { result } = renderHook(() =>
        useSpokenOptionSelect(candidates, "en", onMatch, { fallbackOptionId: "other" }),
      )

      act(() => result.current.handleTranscript("I have fever"))

      expect(onMatch).toHaveBeenCalledExactlyOnceWith("fever")
    })

    it("does NOT route an ambiguous answer to the fallback", () => {
      const onMatch = vi.fn()
      const { result } = renderHook(() =>
        useSpokenOptionSelect(candidates, "en", onMatch, { fallbackOptionId: "other" }),
      )

      act(() => result.current.handleTranscript("pain"))

      expect(onMatch).not.toHaveBeenCalled()
      expect(result.current.heardTranscript).toBe("pain")
    })

    it("keeps no-match behavior when there is no fallback option", () => {
      const onMatch = vi.fn()
      const { result } = renderHook(() =>
        useSpokenOptionSelect(candidates, "en", onMatch),
      )

      act(() => result.current.handleTranscript("I have skin problem"))

      expect(onMatch).not.toHaveBeenCalled()
      expect(result.current.heardTranscript).toBe("I have skin problem")
    })
  })
})
