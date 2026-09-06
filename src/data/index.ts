export { MOCK_PATIENTS, CURRENT_DOCTOR, DEFAULT_PATIENT_ID } from "./patients"
export { MOCK_HISTORIES, MOCK_VITALS } from "./clinicalHistories"
export { MOCK_TIMELINE } from "./timeline"
export { MOCK_ALERTS } from "./alerts"
export {
  DOCUMENT_TYPES,
  DOCUMENT_TYPE_BY_ID,
  MAX_FILE_SIZE_BYTES,
  ACCEPTED_MIME_TYPES,
  FILE_INPUT_ACCEPT,
} from "./documentTypes"
export {
  CHIEF_COMPLAINT_QUESTION,
  COMPLAINTS,
  COMPLAINT_IDS,
  getComplaint,
  isComplaintId,
} from "./questions"
export { RED_FLAG_RULES, NOT_A_DIAGNOSIS_NOTICE } from "./redFlagRules"
export {
  translations,
  LANGUAGE_OPTIONS,
  WELCOME_DEVANAGARI,
  interpolate,
} from "./translations"
export type { TranslationKey } from "./translations"
