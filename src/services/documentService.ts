import {
  ACCEPTED_MIME_TYPES,
  DOCUMENT_TYPE_BY_ID,
  MAX_FILE_SIZE_BYTES,
} from "@/data"
import type {
  DocumentExtraction,
  DocumentTypeId,
  FileValidationResult,
  ProcessingStage,
  UploadedDocument,
} from "@/types"
import { formatFileSize } from "@/utils"
import { API_CONFIG, delay, request } from "./apiClient"

/**
 * The pipeline stages, in order. The mock walks through these on a timer; the
 * backend will report the same sequence over
 * FastAPI → PaddleOCR → vision/LLM extraction → PostgreSQL.
 */
export const PIPELINE_STAGES: ProcessingStage[] = [
  "uploading",
  "ocr",
  "extracting",
  "structuring",
  "complete",
]

const EXTENSION_FALLBACK: Record<string, string> = {
  pdf: "application/pdf",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  heic: "image/heic",
  heif: "image/heif",
  webp: "image/webp",
}

function resolveMimeType(file: File): string {
  if (file.type) return file.type
  const extension = file.name.split(".").pop()?.toLowerCase() ?? ""
  return EXTENSION_FALLBACK[extension] ?? ""
}

export function validateFile(file: File): FileValidationResult {
  const mimeType = resolveMimeType(file)

  if (!ACCEPTED_MIME_TYPES.includes(mimeType as (typeof ACCEPTED_MIME_TYPES)[number])) {
    return {
      valid: false,
      reason: {
        en: `${file.name} is not a supported file type. Use PDF, JPG, PNG or HEIC.`,
        hi: `${file.name} समर्थित फ़ाइल प्रकार नहीं है। PDF, JPG, PNG या HEIC उपयोग करें।`,
      },
    }
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    const limit = formatFileSize(MAX_FILE_SIZE_BYTES)
    return {
      valid: false,
      reason: {
        en: `${file.name} is larger than ${limit}. Please upload a smaller file.`,
        hi: `${file.name} ${limit} से बड़ी है। कृपया छोटी फ़ाइल अपलोड करें।`,
      },
    }
  }

  return { valid: true }
}

export function createDocumentRecord(
  file: File,
  docType: DocumentTypeId,
): UploadedDocument {
  return {
    id: `doc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: file.name,
    size: file.size,
    mimeType: resolveMimeType(file),
    docType,
    stage: "queued",
    progress: 0,
    addedAt: new Date().toISOString(),
  }
}

/** Plausible extraction output so the review screen has something to show. */
function mockExtraction(document: UploadedDocument): DocumentExtraction {
  const label = DOCUMENT_TYPE_BY_ID[document.docType].label.en
  const fieldsByType: Record<DocumentTypeId, Array<{ label: string; value: string }>> = {
    prescription: [
      { label: "Prescriber", value: "Dr. R. Sharma" },
      { label: "Date", value: "05 Nov 2024" },
      { label: "Medications", value: "Amlodipine 5mg OD, Metformin 500mg BD" },
    ],
    lab: [
      { label: "Panel", value: "Complete Blood Count" },
      { label: "Haemoglobin", value: "11.2 g/dL (low)" },
      { label: "Collected", value: "15 Jan 2025" },
    ],
    discharge: [
      { label: "Facility", value: "Civil Hospital" },
      { label: "Admitted", value: "12 Feb 2024" },
      { label: "Discharged", value: "16 Feb 2024" },
    ],
    imaging: [
      { label: "Study", value: "Chest X-ray PA view" },
      { label: "Reported", value: "18 Mar 2025" },
    ],
    other: [{ label: "Document type", value: label }],
  }

  return {
    documentId: document.id,
    detectedType: document.docType,
    confidence: 0.92,
    fields: fieldsByType[document.docType],
  }
}

export interface ProcessOptions {
  /** Fired on every stage change so the UI can animate the pipeline. */
  onStage: (stage: ProcessingStage, progress: number) => void
  /** Milliseconds per stage. Kept short enough for a live demo. */
  stageDurationMs?: number
  signal?: AbortSignal
}

export const documentService = {
  validateFile,
  createDocumentRecord,

  /**
   * Runs one document through the pipeline.
   *
   * Today this is a timed simulation and the file never leaves the browser.
   * Against the backend it becomes a multipart POST plus a status poll (or an
   * SSE stream), reporting the same stages through `onStage`.
   */
  async process(
    document: UploadedDocument,
    file: File | undefined,
    options: ProcessOptions,
  ): Promise<DocumentExtraction> {
    const { onStage, stageDurationMs = 900, signal } = options

    if (!API_CONFIG.useMock && file) {
      const form = new FormData()
      form.append("file", file)
      form.append("docType", document.docType)
      onStage("uploading", 10)
      const extraction = await request<DocumentExtraction>("/documents", {
        method: "POST",
        body: form,
        signal,
      })
      onStage("complete", 100)
      return extraction
    }

    for (const [index, stage] of PIPELINE_STAGES.entries()) {
      if (signal?.aborted) throw new Error("aborted")
      const progress = Math.round(((index + 1) / PIPELINE_STAGES.length) * 100)
      onStage(stage, progress)
      if (stage !== "complete") await delay(stageDurationMs)
    }

    return mockExtraction(document)
  },

  /** Deletes a document. The mock has nothing server-side to clean up. */
  async remove(documentId: string): Promise<void> {
    if (!API_CONFIG.useMock) {
      await request<void>(`/documents/${documentId}`, { method: "DELETE" })
      return
    }
    await delay(60)
  },
}
