import type { Language } from "@/types"

const LOCALE_BY_LANGUAGE: Record<Language, string> = {
  en: "en-IN",
  hi: "hi-IN",
}

export function formatDate(date: Date, language: Language = "en"): string {
  return date.toLocaleDateString(LOCALE_BY_LANGUAGE[language], {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

export function formatTime(date: Date, language: Language = "en"): string {
  return date.toLocaleTimeString(LOCALE_BY_LANGUAGE[language], {
    hour: "2-digit",
    minute: "2-digit",
  })
}

/** "245 KB", "1.4 MB". Uses binary units, matching what file pickers report. */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  const kb = bytes / 1024
  if (kb < 1024) return `${Math.round(kb)} KB`
  return `${(kb / 1024).toFixed(1)} MB`
}

/** Masks all but the leading block of an ABHA ID for at-a-glance display. */
export function maskAbhaId(abha: string): string {
  if (abha.length <= 10) return abha
  return `${abha.slice(0, 10)}...`
}

/** Uppercase initial used for avatar circles. */
export function initialOf(name: string): string {
  return name.trim().charAt(0).toUpperCase() || "?"
}
