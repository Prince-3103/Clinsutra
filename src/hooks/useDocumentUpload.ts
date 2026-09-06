import { useCallback, useRef, useState } from "react"
import { documentService } from "@/services"
import type { DocumentTypeId, LocalizedText } from "@/types"
import { useKioskSession } from "./useKioskSession"

export interface UseDocumentUploadResult {
  /** Validation failures from the last selection, newest first. */
  errors: LocalizedText[]
  clearErrors: () => void
  /** Validates and registers files chosen from the picker. */
  addFiles: (files: FileList | File[], docType: DocumentTypeId) => void
  removeDocument: (documentId: string) => void
  /** Walks every queued document through the mocked OCR pipeline. */
  processAll: () => Promise<void>
  processing: boolean
}

/**
 * File selection, validation and the mocked processing pipeline.
 *
 * Files never leave the browser here — `documentService` only simulates the
 * stages. When the backend lands, the same call becomes a multipart upload and
 * this hook is unchanged.
 */
export function useDocumentUpload(): UseDocumentUploadResult {
  const { documents, addDocument, updateDocument, removeDocument, getFile } =
    useKioskSession()
  const [errors, setErrors] = useState<LocalizedText[]>([])
  const [processing, setProcessing] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  const addFiles = useCallback(
    (files: FileList | File[], docType: DocumentTypeId) => {
      const rejected: LocalizedText[] = []

      for (const file of Array.from(files)) {
        const result = documentService.validateFile(file)
        if (!result.valid) {
          if (result.reason) rejected.push(result.reason)
          continue
        }
        addDocument(documentService.createDocumentRecord(file, docType), file)
      }

      if (rejected.length > 0) setErrors((current) => [...rejected, ...current])
    },
    [addDocument],
  )

  const clearErrors = useCallback(() => setErrors([]), [])

  const processAll = useCallback(async () => {
    const pending = documents.filter((doc) => doc.stage === "queued")
    if (pending.length === 0) return

    const controller = new AbortController()
    abortRef.current = controller
    setProcessing(true)

    try {
      for (const document of pending) {
        try {
          const extraction = await documentService.process(
            document,
            getFile(document.id),
            {
              signal: controller.signal,
              onStage: (stage, progress) =>
                updateDocument(document.id, { stage, progress }),
            },
          )
          updateDocument(document.id, {
            stage: "complete",
            progress: 100,
            extraction,
          })
        } catch {
          // One bad document must not stall the rest of the queue.
          updateDocument(document.id, {
            stage: "failed",
            progress: 100,
            error: "processing-failed",
          })
        }
      }
    } finally {
      setProcessing(false)
      abortRef.current = null
    }
  }, [documents, getFile, updateDocument])

  return {
    errors,
    clearErrors,
    addFiles,
    removeDocument,
    processAll,
    processing,
  }
}
