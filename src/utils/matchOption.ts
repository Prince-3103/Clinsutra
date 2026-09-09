import type { Language, LocalizedText } from "@/types"

/**
 * Deterministic, local matching of a spoken transcript onto one of a
 * question's predefined options.
 *
 * This is intentionally NOT an AI/clinical decision: it is a keyword overlap
 * between what the patient said and the option labels the clinic authored. It
 * never invents an option, never triages, and never resolves an ambiguous
 * utterance — an ambiguous or empty match returns a non-committal status so the
 * UI asks the patient to tap instead (see `useSpokenOptionSelect`). The same
 * result drives both voice engines (Gemini Live and the browser fallback),
 * since both deliver a plain transcript string.
 */

export type SpokenMatchStatus = "match" | "ambiguous" | "none"

export interface SpokenMatchCandidate {
  /** The value returned on a confident match (an option id, or a composite). */
  id: string
  label: LocalizedText
}

export interface SpokenMatchResult {
  status: SpokenMatchStatus
  /** Set only when `status === "match"`. */
  optionId: string | null
}

// Connective / filler words that carry no option meaning, so they must not
// count as keywords (otherwise "or" would match almost anything).
const EN_STOPWORDS = new Set([
  "or", "and", "the", "a", "an", "to", "of", "in", "on", "at", "my", "i",
  "have", "has", "had", "is", "it", "its", "am", "are", "was", "feel",
  "feeling", "feels", "with", "please", "just", "really", "very", "been",
  "having", "get", "got", "me", "mine", "this", "that", "some", "there",
])
const HI_STOPWORDS = new Set([
  "या", "में", "और", "का", "की", "के", "है", "को", "से", "पर", "मुझे",
  "मेरा", "मेरी", "हो", "रहा", "रही", "गया", "गई", "एक",
])

/**
 * Lowercase and strip punctuation, keeping letters, digits and combining marks
 * of any script. `\p{M}` is essential: Devanagari vowel signs (matras) are
 * combining marks, and dropping them would shred Hindi words into fragments.
 */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\p{M}]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ")
}

function isAscii(token: string): boolean {
  for (let i = 0; i < token.length; i += 1) {
    if (token.charCodeAt(i) > 127) return false
  }
  return true
}

/** Content keywords from an option label in the active language. */
function keywordsFor(label: LocalizedText, language: Language): string[] {
  const stopwords = language === "hi" ? HI_STOPWORDS : EN_STOPWORDS
  const seen = new Set<string>()
  for (const token of normalize(label[language]).split(" ")) {
    if (token.length >= 2 && !stopwords.has(token)) seen.add(token)
  }
  return [...seen]
}

/** How many distinct option keywords appear in the (normalized) transcript. */
function countHits(transcript: string, keywords: string[]): number {
  let hits = 0
  for (const keyword of keywords) {
    if (isAscii(keyword)) {
      // Whole-word match so "arm" does not match "harm", etc.
      const pattern = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`)
      if (pattern.test(transcript)) hits += 1
    } else if (transcript.includes(keyword)) {
      // Devanagari word boundaries are unreliable; substring is adequate here.
      hits += 1
    }
  }
  return hits
}

/**
 * Match a transcript to exactly one option, or report ambiguity / no match.
 *
 * - `match`      exactly one option is the clear best (a full-label match, or a
 *                strictly-higher keyword-hit count than every other option).
 * - `ambiguous`  two or more options tie for the most keyword hits.
 * - `none`       no option shares any keyword with the transcript.
 */
export function matchSpokenOption(
  transcript: string,
  candidates: SpokenMatchCandidate[],
  language: Language,
): SpokenMatchResult {
  const normalized = normalize(transcript)
  if (!normalized || candidates.length === 0) {
    return { status: "none", optionId: null }
  }

  // A verbatim full-label utterance is an unambiguous match even if the label's
  // words also appear (partially) in other options.
  for (const candidate of candidates) {
    if (normalize(candidate.label[language]) === normalized) {
      return { status: "match", optionId: candidate.id }
    }
  }

  const scored = candidates
    .map((candidate) => ({
      id: candidate.id,
      hits: countHits(normalized, keywordsFor(candidate.label, language)),
    }))
    .filter((entry) => entry.hits > 0)

  if (scored.length === 0) return { status: "none", optionId: null }

  const topHits = Math.max(...scored.map((entry) => entry.hits))
  const leaders = scored.filter((entry) => entry.hits === topHits)
  if (leaders.length === 1) {
    return { status: "match", optionId: leaders[0].id }
  }
  return { status: "ambiguous", optionId: null }
}
