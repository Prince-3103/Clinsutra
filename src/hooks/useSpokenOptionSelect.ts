import { useCallback, useState } from "react"
import { matchSpokenOption, type SpokenMatchCandidate } from "@/utils"
import type { Language } from "@/types"

export interface UseSpokenOptionSelectOptions {
  /**
   * Option id to fall back to when the transcript matches no specific option
   * (a "Something else" / catch-all). When provided, an unmatched utterance
   * deterministically selects this option and the spoken text is passed to
   * `onMatch` as free text. Omit for questions that have no catch-all — those
   * keep the "please choose an option" prompt instead.
   */
  fallbackOptionId?: string
}

export interface UseSpokenOptionSelectResult {
  /**
   * The transcript to echo back ("I heard: …") when it could not be resolved
   * to a single option (and no catch-all fallback applied), or null.
   */
  heardTranscript: string | null
  /** Feed a final transcript from either voice engine. */
  handleTranscript: (transcript: string) => void
  /** Clear the echoed prompt — call this when the patient taps an option. */
  clearHeard: () => void
}

/**
 * Bridges a spoken transcript to the existing option-selection logic.
 *
 * Resolution is deterministic and local (see `matchSpokenOption`) — nothing
 * here makes a clinical/medical decision:
 *
 *  - Confident single match  -> select that option (no free text).
 *  - No specific match at all -> if a catch-all (`fallbackOptionId`) exists,
 *    select it and keep the spoken text as free text; otherwise echo the
 *    transcript so the patient can tap.
 *  - Ambiguous (a known term matching several options) -> never auto-routed to
 *    the catch-all; echo the transcript so the patient disambiguates.
 *
 * A tap can override any of this at any time (the page calls `onMatch`/its own
 * handler directly and `clearHeard`).
 */
export function useSpokenOptionSelect(
  candidates: SpokenMatchCandidate[],
  language: Language,
  onMatch: (optionId: string, transcript?: string) => void,
  { fallbackOptionId }: UseSpokenOptionSelectOptions = {},
): UseSpokenOptionSelectResult {
  const [heardTranscript, setHeardTranscript] = useState<string | null>(null)

  const handleTranscript = useCallback(
    (transcript: string) => {
      const trimmed = transcript.trim()
      if (!trimmed) return

      const result = matchSpokenOption(trimmed, candidates, language)

      if (result.status === "match" && result.optionId) {
        setHeardTranscript(null)
        onMatch(result.optionId)
        return
      }

      if (result.status === "none" && fallbackOptionId) {
        // Unknown symptom/disease: deterministically route to the catch-all and
        // preserve the spoken text as free text. This never maps to a specific
        // (unrelated) option — only to the explicit "Something else" choice.
        setHeardTranscript(null)
        onMatch(fallbackOptionId, trimmed)
        return
      }

      // Ambiguous, or no match with no catch-all: prompt the patient to tap.
      setHeardTranscript(trimmed)
    },
    [candidates, language, onMatch, fallbackOptionId],
  )

  const clearHeard = useCallback(() => setHeardTranscript(null), [])

  return { heardTranscript, handleTranscript, clearHeard }
}
