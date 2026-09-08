import type { IsoDate } from "./common"

export type Gender = "Male" | "Female" | "Other"

/** Triage priority. P1 is most urgent. Assigned by demo rules, never by diagnosis. */
export type Priority = "P1" | "P2" | "P3"

export type PatientStatus = "Waiting" | "In Consultation" | "Completed"

/** How the patient identified themselves at the kiosk. */
export type IdentificationMode = "abha" | "scan" | "new"

export interface PatientIdentification {
  mode: IdentificationMode
  abhaId: string
  hospitalRegNumber: string
  fullName: string
  age: string
  gender: string
  phone: string
}

export interface Patient {
  id: string
  name: string
  age: number
  gender: Gender
  /** OPD token issued at the kiosk. */
  token: string
  /** Ayushman Bharat Health Account ID. Demo values only. */
  abha: string
  priority: Priority
  status: PatientStatus
  /** Chief complaint in the patient's own words, as captured at the kiosk. */
  complaint: string
  /** Human-readable wait time, e.g. "8 min", or "—" when not waiting. */
  waitTime: string
  redFlag: boolean
  /** Short triage flag labels shown as badges in the queue. */
  flags: string[]
  /**
   * True once a doctor has explicitly clicked "Mark as Reviewed". Never set
   * by AI. The original `priority`/`redFlag`/`flags` triage result is never
   * changed by this — it only stops the queue from still treating the
   * patient as an active, unreviewed red-flag case.
   */
  redFlagResolved: boolean
  /** When the kiosk submission was received. */
  submittedAt: IsoDate
}

export interface Doctor {
  id: string
  name: string
  specialty: string
  /** Consultation room, e.g. "OPD 3". */
  room: string
  /** Two-letter avatar fallback. */
  initials: string
}

export type QueueFilter = "all" | "waiting" | "completed"
