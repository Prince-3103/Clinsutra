import { COMPLAINTS } from "@/data"
import type {
  Answer,
  ClinicalHistory,
  ComplaintId,
  Language,
  LocalizedText,
  UploadedDocument,
} from "@/types"

export interface DraftSection {
  id: string
  /** Translation key for the heading. */
  labelKey:
    | "review.section.chiefComplaint"
    | "review.section.hpi"
    | "review.section.pmh"
    | "review.section.medications"
    | "review.section.allergies"
    | "review.section.familyHistory"
    | "review.section.personalHistory"
  value: string
}

const NOT_REPORTED: LocalizedText = {
  en: "Not reported at the kiosk.",
  hi: "कियोस्क पर दर्ज नहीं किया गया।",
}

const FROM_DOCUMENTS: LocalizedText = {
  en: "Awaiting extraction from uploaded documents.",
  hi: "अपलोड किए गए दस्तावेज़ों से निकाला जा रहा है।",
}

/**
 * Assembles the draft the patient reviews, from what this session actually
 * collected. Sections with no source say so rather than inventing content —
 * a summary that reads as complete when it is not would mislead the clinician.
 *
 * The FastAPI/LLM backend will replace this with a generated narrative; the
 * `DraftSection[]` shape stays the same.
 */
export function buildDraftSections(
  complaintId: ComplaintId | null,
  answers: Answer[],
  documents: UploadedDocument[],
  language: Language,
): DraftSection[] {
  const complaint = complaintId ? COMPLAINTS[complaintId] : null
  const byQuestionId = new Map(answers.map((answer) => [answer.questionId, answer]))

  const chiefComplaint = complaint
    ? complaint.label[language]
    : NOT_REPORTED[language]

  const narrative =
    complaint?.followUps
      .map((question) => {
        const answer = byQuestionId.get(question.id)
        if (!answer) return null
        const labels = question.options
          .filter((option) => answer.optionIds.includes(option.id))
          .map((option) => option.label[language])
        if (labels.length === 0) return null
        return `${question.prompt[language]} — ${labels.join(", ")}`
      })
      .filter((line): line is string => line !== null) ?? []

  const spoken = answers
    .filter((answer) => answer.transcript)
    .map((answer) => answer.transcript as string)

  const hpiParts = [...narrative, ...spoken]

  const prescriptionFields = documents
    .filter((document) => document.docType === "prescription" && document.extraction)
    .flatMap((document) => document.extraction?.fields ?? [])
    .filter((field) => field.label.toLowerCase().includes("medication"))
    .map((field) => field.value)

  const hasDocuments = documents.length > 0

  return [
    {
      id: "chief-complaint",
      labelKey: "review.section.chiefComplaint",
      value: chiefComplaint,
    },
    {
      id: "hpi",
      labelKey: "review.section.hpi",
      value: hpiParts.length > 0 ? hpiParts.join(". ") : NOT_REPORTED[language],
    },
    {
      id: "pmh",
      labelKey: "review.section.pmh",
      value: hasDocuments ? FROM_DOCUMENTS[language] : NOT_REPORTED[language],
    },
    {
      id: "medications",
      labelKey: "review.section.medications",
      value:
        prescriptionFields.length > 0
          ? prescriptionFields.join("; ")
          : hasDocuments
            ? FROM_DOCUMENTS[language]
            : NOT_REPORTED[language],
    },
    {
      id: "allergies",
      labelKey: "review.section.allergies",
      value: NOT_REPORTED[language],
    },
    {
      id: "family-history",
      labelKey: "review.section.familyHistory",
      value: NOT_REPORTED[language],
    },
    {
      id: "personal-history",
      labelKey: "review.section.personalHistory",
      value: NOT_REPORTED[language],
    },
  ]
}

type ClinicalHistoryPatch = Partial<Omit<ClinicalHistory, "patientId" | "updatedAt">>

const HISTORY_FIELD_BY_SECTION_ID: Partial<
  Record<DraftSection["id"], keyof ClinicalHistoryPatch>
> = {
  "chief-complaint": "chiefComplaint",
  hpi: "historyOfPresentIllness",
  pmh: "pastMedicalHistory",
  "family-history": "familyHistory",
  "personal-history": "personalHistory",
}

/**
 * Turns the reviewed draft sections into the `ClinicalHistory` patch sent
 * with `POST /kiosk/submissions`. `edits` holds whatever the patient/clinician
 * changed on the review screen, keyed by section id — falls back to the
 * drafted value when a section was never touched.
 *
 * `medications` and `allergies` sections are free-text narrative today (the
 * kiosk has no structured entry for either), while `ClinicalHistory` expects
 * typed arrays for both — they are intentionally left out here rather than
 * force-fit, exactly as before this change; a clinician adds them later via
 * `clinicalService.saveHistory`.
 */
export function toClinicalHistoryPatch(
  drafted: DraftSection[],
  edits: Record<string, string>,
): ClinicalHistoryPatch {
  const patch: Record<string, string> = {}

  for (const section of drafted) {
    const field = HISTORY_FIELD_BY_SECTION_ID[section.id]
    if (!field) continue
    patch[field] = edits[section.id] ?? section.value
  }

  return patch as ClinicalHistoryPatch
}

/** One-line complaint summary for the doctor's queue row. */
export function complaintSummary(
  complaintId: ComplaintId | null,
  answers: Answer[],
  language: Language = "en",
): string {
  if (!complaintId) return "Not reported"
  const complaint = COMPLAINTS[complaintId]
  const chief = complaint.label[language]

  const detail = complaint.followUps
    .flatMap((question) => {
      const answer = answers.find((entry) => entry.questionId === question.id)
      if (!answer) return []
      return question.options
        .filter((option) => answer.optionIds.includes(option.id))
        .map((option) => option.label[language])
    })
    .slice(0, 2)

  return detail.length > 0 ? `${chief} — ${detail.join(", ")}` : chief
}
