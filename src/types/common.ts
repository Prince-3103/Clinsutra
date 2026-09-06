/** Languages the kiosk currently supports. Extend here first, then in `data/translations.ts`. */
export type Language = "en" | "hi"

export const SUPPORTED_LANGUAGES: readonly Language[] = ["en", "hi"] as const

/** A string that exists in every supported language. */
export type LocalizedText = Record<Language, string>

/** ISO-8601 date string (`YYYY-MM-DD`) or full timestamp, as returned by the API. */
export type IsoDate = string

export interface LanguageOption {
  code: Language
  /** Rendered in the language's own script. */
  nativeLabel: string
  englishLabel: string
  flag: string
  /** Applies the Devanagari webfont where the script needs it. */
  fontClass?: string
}
