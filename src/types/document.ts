import type { IsoDate, LocalizedText } from "./common"

export type DocumentTypeId = "prescription" | "lab" | "discharge" | "imaging" | "other"

export interface DocumentTypeDefinition {
  id: DocumentTypeId
  icon: string
  label: LocalizedText
}

/**
 * Stages of the document pipeline. The frontend simulates these today; the
 * FastAPI backend will report the same stages over the real pipeline
 * (upload → PaddleOCR → vision/LLM extraction → structured record).
 */
export type ProcessingStage =
  | "queued"
  | "uploading"
  | "ocr"
  | "extracting"
  | "structuring"
  | "complete"
  | "failed"

export interface UploadedDocument {
  id: string
  /** Original filename as chosen by the patient. */
  name: string
  /** Size in bytes. Formatted for display by `utils/format`. */
  size: number
  mimeType: string
  docType: DocumentTypeId
  stage: ProcessingStage
  /** 0–100, drives the progress indicator. */
  progress: number
  addedAt: IsoDate
  /** Set when `stage` is "failed". */
  error?: string
  /** Populated once the mock pipeline finishes. */
  extraction?: DocumentExtraction
}

/** What the OCR + extraction step returns. Mocked today, backend-supplied later. */
export interface DocumentExtraction {
  documentId: string
  detectedType: DocumentTypeId
  /** Confidence 0–1 as reported by the extraction model. */
  confidence: number
  /** Key/value pairs pulled off the document, e.g. "Hb" → "11.2 g/dL". */
  fields: Array<{ label: string; value: string }>
}

export interface FileValidationResult {
  valid: boolean
  /** Localized reason when `valid` is false. */
  reason?: LocalizedText
}
