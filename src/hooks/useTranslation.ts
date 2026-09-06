import { useCallback, useMemo } from "react"
import { interpolate, translations, type TranslationKey } from "@/data"
import type { Language, LocalizedText } from "@/types"
import { useKioskSession } from "./useKioskSession"

export type TranslateFn = (
  key: TranslationKey,
  vars?: Record<string, string | number>,
) => string

export interface Translation {
  language: Language
  setLanguage: (language: Language) => void
  t: TranslateFn
  /** Resolves a `LocalizedText` (question prompts, red-flag reasons). */
  tx: (text: LocalizedText) => string
  /** Applies the Devanagari webfont only when the active script needs it. */
  scriptClass: string
}

/** Patient-facing translation. The doctor dashboard stays in English. */
export function useTranslation(): Translation {
  const { language, setLanguage } = useKioskSession()

  const t = useCallback<TranslateFn>(
    (key, vars) => interpolate(translations[language][key], vars),
    [language],
  )

  const tx = useCallback((text: LocalizedText) => text[language], [language])

  return useMemo(
    () => ({
      language,
      setLanguage,
      t,
      tx,
      scriptClass: language === "hi" ? "devanagari" : "",
    }),
    [language, setLanguage, t, tx],
  )
}
