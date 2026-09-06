import { createContext } from "react"
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

export interface KioskSessionState {
  language: Language
  identification: PatientIdentification
  complaintId: ComplaintId | null
  /** Answers to the opening question and every follow-up, keyed by question id. */
  answers: Answer[]
  documents: UploadedDocument[]
  assessment: RedFlagAssessment | null
  /** Issued by `patientService.submitKioskSession` on the review screen. */
  token: string | null
}

export interface KioskSessionValue extends KioskSessionState {
  setLanguage: (language: Language) => void
  updateIdentification: (patch: Partial<PatientIdentification>) => void
  setComplaint: (complaintId: ComplaintId, optionId: string) => void
  answerQuestion: (
    questionId: string,
    optionIds: string[],
    transcript?: string,
  ) => void
  getAnswer: (questionId: string) => Answer | undefined
  setAssessment: (assessment: RedFlagAssessment) => void
  addDocument: (document: UploadedDocument, file: File) => void
  updateDocument: (
    documentId: string,
    patch: Partial<Omit<UploadedDocument, "id">>,
  ) => void
  removeDocument: (documentId: string) => void
  getFile: (documentId: string) => File | undefined
  documentsByType: (docType: DocumentTypeId) => UploadedDocument[]
  /** True once every document has left the pipeline. */
  allDocumentsProcessed: boolean
  currentStage: ProcessingStage | null
  setToken: (token: string) => void
  reset: () => void
}

export const EMPTY_IDENTIFICATION: PatientIdentification = {
  mode: "abha",
  abhaId: "",
  hospitalRegNumber: "",
  fullName: "",
  age: "",
  gender: "",
  phone: "",
}

export const KioskSessionContext = createContext<KioskSessionValue | null>(null)
