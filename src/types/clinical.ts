import type { IsoDate, LocalizedText } from "./common"
import type { Priority } from "./patient"

/** Identifies a chief complaint branch in the adaptive question bank. */
export type ComplaintId =
  | "chest-pain"
  | "breathlessness"
  | "fever"
  | "headache"
  | "abdominal"
  | "other"

/**
 * A machine-readable signal an answer contributes. Red-flag rules are written
 * against these rather than against free text, so the rule table stays readable
 * and the backend can emit the same vocabulary later.
 */
export type ClinicalSignal =
  | "onset-sudden"
  | "onset-recent"
  | "pain-central"
  | "radiation-arm"
  | "radiation-jaw"
  | "radiation-back"
  | "no-radiation"
  | "diaphoresis"
  | "breathless-at-rest"
  | "breathless-on-exertion"
  | "severe-pain"
  | "high-fever"
  | "neck-stiffness"
  | "focal-weakness"
  | "speech-difficulty"
  | "vision-loss"
  | "worst-ever-headache"
  | "vomiting-blood"
  | "black-stools"
  | "none"

export type QuestionKind = "single" | "multi"

export interface QuestionOption {
  id: string
  label: LocalizedText
  /** Signals this option contributes to the red-flag evaluation. */
  signals?: ClinicalSignal[]
}

export interface Question {
  id: string
  prompt: LocalizedText
  kind: QuestionKind
  options: QuestionOption[]
  /** Shown above the option grid, e.g. to explain why the question is asked. */
  hint?: LocalizedText
}

/** One chief-complaint branch: the entry option plus its adaptive follow-ups. */
export interface ComplaintDefinition {
  id: ComplaintId
  label: LocalizedText
  /** Echoed back to the patient on the follow-up screen. */
  echo: LocalizedText
  followUps: Question[]
}

export interface Answer {
  questionId: string
  /** Option ids. Single-choice questions hold exactly one. */
  optionIds: string[]
  /** Free-text or dictated answer, when the patient spoke instead of tapping. */
  transcript?: string
  answeredAt: IsoDate
}

export interface Medication {
  id: string
  name: string
  dose: string
  frequency: string
}

export interface Allergy {
  id: string
  substance: string
  reaction: string
  severity: "high" | "moderate" | "low"
}

export interface Investigation {
  id: string
  name: string
  value: string
  unit?: string
  referenceRange: string
  abnormal: boolean
  direction?: "high" | "low"
  date: IsoDate
  source: string
}

/** One editable block of the AI-drafted history. */
export interface ClinicalSection {
  id: string
  label: string
  icon: string
  value: string
  /** Rows to render for lists (medications, allergies) instead of a paragraph. */
  items?: string[]
  /** Wide sections span both columns of the doctor's summary grid. */
  fullWidth?: boolean
  editable: boolean
}

export interface ClinicalHistory {
  patientId: string
  chiefComplaint: string
  historyOfPresentIllness: string
  pastMedicalHistory: string
  pastSurgicalHistory: string
  medications: Medication[]
  allergies: Allergy[]
  familyHistory: string
  personalHistory: string
  reviewOfSystems: string
  investigationsSummary: string
  /** True until a clinician has reviewed and confirmed the draft. */
  aiGenerated: boolean
  confirmedByClinician: boolean
  updatedAt: IsoDate
}

export type TimelineEventType =
  | "Lab Report"
  | "Prescription"
  | "Hospital Visit"
  | "Diagnosis"
  | "Surgery"

export type TimelineFilter = "All" | "Lab" | "Prescription" | "Hospital" | "Surgery"

export interface TimelineEvent {
  id: string
  patientId: string
  date: string
  /** Sortable form of `date`; kept separate so the display format stays stable. */
  sortKey: IsoDate
  type: TimelineEventType
  icon: string
  color: "blue" | "green" | "orange" | "gray" | "red"
  title: string
  summary: string
  detail: string
  abnormal: boolean
  source: string
}

export type AlertSeverity = "high" | "moderate" | "low"
export type AlertCategory = "lab" | "interaction" | "caution" | "allergy"

export interface ClinicalAlert {
  id: string
  patientId: string
  category: AlertCategory
  severity: AlertSeverity
  /** Short label, e.g. the test name or the flag title. */
  title: string
  /** Present for lab alerts. */
  value?: string
  referenceRange?: string
  status?: "HIGH" | "LOW"
  date?: string
  /** Physician-facing note. Never a diagnosis or a dosing instruction. */
  note: string
}

export interface VitalObservation {
  id: string
  label: string
  value: string
  unit: string
  /** False renders the tile in the alert colour. */
  normal: boolean
}

/** Result of the demo triage rules. Explicitly not a diagnosis. */
export interface RedFlagAssessment {
  triggered: boolean
  priority: Priority
  /** Rule ids that fired, for traceability. */
  ruleIds: string[]
  reasons: LocalizedText[]
}

export interface RedFlagRule {
  id: string
  /** Restricts the rule to one complaint branch; omit to apply to all. */
  complaint?: ComplaintId
  /** Every signal must be present for the rule to fire. */
  requires: ClinicalSignal[]
  priority: Priority
  reason: LocalizedText
}
