import { useCallback, useMemo, useRef, useState, type ReactNode } from "react"
import type {
  Answer,
  ComplaintId,
  DocumentTypeId,
  Language,
  PatientIdentification,
  ProcessingStage,
  RedFlagAssessment,
  UploadedDocument,
} from "@/types"
import { CHIEF_COMPLAINT_QUESTION } from "@/data"
import {
  EMPTY_IDENTIFICATION,
  KioskSessionContext,
  type KioskSessionValue,
} from "./kioskSessionContext"

/**
 * Holds everything one kiosk visit collects.
 *
 * Deliberately in memory only: no medical answer is written to localStorage or
 * to any other persistent browser store. Closing the tab ends the session, and
 * `reset()` clears it for the next patient.
 */
export function KioskSessionProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>("en")
  const [identification, setIdentification] =
    useState<PatientIdentification>(EMPTY_IDENTIFICATION)
  const [complaintId, setComplaintId] = useState<ComplaintId | null>(null)
  const [answers, setAnswers] = useState<Answer[]>([])
  const [documents, setDocuments] = useState<UploadedDocument[]>([])
  const [assessment, setAssessment] = useState<RedFlagAssessment | null>(null)
  const [token, setToken] = useState<string | null>(null)

  // File handles live outside React state — they are not serializable and must
  // not end up in a store that could be persisted.
  const filesRef = useRef(new Map<string, File>())

  const updateIdentification = useCallback(
    (patch: Partial<PatientIdentification>) =>
      setIdentification((current) => ({ ...current, ...patch })),
    [],
  )

  const answerQuestion = useCallback(
    (questionId: string, optionIds: string[], transcript?: string) => {
      setAnswers((current) => {
        const next: Answer = {
          questionId,
          optionIds,
          transcript,
          answeredAt: new Date().toISOString(),
        }
        const index = current.findIndex((a) => a.questionId === questionId)
        if (index === -1) return [...current, next]
        const copy = [...current]
        copy[index] = next
        return copy
      })
    },
    [],
  )

  const setComplaint = useCallback(
    (nextComplaintId: ComplaintId, optionId: string) => {
      setComplaintId((previous) => {
        // Switching complaint invalidates the previous branch's follow-ups.
        if (previous && previous !== nextComplaintId) {
          setAnswers((current) =>
            current.filter((a) => a.questionId === CHIEF_COMPLAINT_QUESTION.id),
          )
          setAssessment(null)
        }
        return nextComplaintId
      })
      answerQuestion(CHIEF_COMPLAINT_QUESTION.id, [optionId])
    },
    [answerQuestion],
  )

  const getAnswer = useCallback(
    (questionId: string) => answers.find((a) => a.questionId === questionId),
    [answers],
  )

  const addDocument = useCallback((document: UploadedDocument, file: File) => {
    filesRef.current.set(document.id, file)
    setDocuments((current) => [...current, document])
  }, [])

  const updateDocument = useCallback(
    (documentId: string, patch: Partial<Omit<UploadedDocument, "id">>) => {
      setDocuments((current) =>
        current.map((doc) => (doc.id === documentId ? { ...doc, ...patch } : doc)),
      )
    },
    [],
  )

  const removeDocument = useCallback((documentId: string) => {
    filesRef.current.delete(documentId)
    setDocuments((current) => current.filter((doc) => doc.id !== documentId))
  }, [])

  const getFile = useCallback(
    (documentId: string) => filesRef.current.get(documentId),
    [],
  )

  const documentsByType = useCallback(
    (docType: DocumentTypeId) => documents.filter((doc) => doc.docType === docType),
    [documents],
  )

  const reset = useCallback(() => {
    filesRef.current.clear()
    setIdentification(EMPTY_IDENTIFICATION)
    setComplaintId(null)
    setAnswers([])
    setDocuments([])
    setAssessment(null)
    setToken(null)
  }, [])

  const allDocumentsProcessed = documents.every(
    (doc) => doc.stage === "complete" || doc.stage === "failed",
  )

  const currentStage: ProcessingStage | null =
    documents.find((doc) => doc.stage !== "complete" && doc.stage !== "failed")
      ?.stage ?? (documents.length > 0 ? "complete" : null)

  const value = useMemo<KioskSessionValue>(
    () => ({
      language,
      identification,
      complaintId,
      answers,
      documents,
      assessment,
      token,
      setLanguage,
      updateIdentification,
      setComplaint,
      answerQuestion,
      getAnswer,
      setAssessment,
      addDocument,
      updateDocument,
      removeDocument,
      getFile,
      documentsByType,
      allDocumentsProcessed,
      currentStage,
      setToken,
      reset,
    }),
    [
      language,
      identification,
      complaintId,
      answers,
      documents,
      assessment,
      token,
      updateIdentification,
      setComplaint,
      answerQuestion,
      getAnswer,
      addDocument,
      updateDocument,
      removeDocument,
      getFile,
      documentsByType,
      allDocumentsProcessed,
      currentStage,
      reset,
    ],
  )

  return (
    <KioskSessionContext.Provider value={value}>
      {children}
    </KioskSessionContext.Provider>
  )
}
