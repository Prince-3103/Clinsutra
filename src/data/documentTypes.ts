import type { DocumentTypeDefinition, DocumentTypeId } from "@/types"

/** Document categories the kiosk accepts, in the order shown on the screen. */
export const DOCUMENT_TYPES: DocumentTypeDefinition[] = [
  {
    id: "prescription",
    icon: "💊",
    label: { en: "Prescription", hi: "पर्ची" },
  },
  {
    id: "lab",
    icon: "🧪",
    label: { en: "Lab Report", hi: "लैब रिपोर्ट" },
  },
  {
    id: "discharge",
    icon: "🏥",
    label: { en: "Discharge Summary", hi: "छुट्टी सारांश" },
  },
  {
    id: "imaging",
    icon: "🩻",
    label: { en: "X-Ray / Scan", hi: "एक्स-रे / स्कैन" },
  },
  {
    id: "other",
    icon: "📄",
    label: { en: "Other Document", hi: "अन्य दस्तावेज़" },
  },
]

export const DOCUMENT_TYPE_BY_ID: Record<DocumentTypeId, DocumentTypeDefinition> =
  DOCUMENT_TYPES.reduce(
    (acc, type) => {
      acc[type.id] = type
      return acc
    },
    {} as Record<DocumentTypeId, DocumentTypeDefinition>,
  )

/** 10 MB — comfortably fits a phone photo of a prescription or a scanned PDF. */
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024

export const ACCEPTED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/heic",
  "image/heif",
  "image/webp",
] as const

/** `accept` attribute for the file input. */
export const FILE_INPUT_ACCEPT = ".pdf,.jpg,.jpeg,.png,.heic,.heif,.webp"
