import type { ClinicalAlert } from "@/types"

/**
 * Decision-support flags for the clinician, keyed by patient id.
 *
 * These are prompts for physician review. None of them is a diagnosis, and none
 * carries a dosing instruction — the wording deliberately points back to the
 * treating clinician.
 */
export const MOCK_ALERTS: Record<string, ClinicalAlert[]> = {
  "OPD-0847": [
    {
      id: "al1",
      patientId: "OPD-0847",
      category: "lab",
      severity: "moderate",
      title: "Haemoglobin",
      value: "11.2 g/dL",
      referenceRange: "13.5–17.5 g/dL",
      status: "LOW",
      date: "15 Jan 2025",
      note: "Below the reference range. Iron studies and a peripheral smear may be worth considering — for physician review.",
    },
    {
      id: "al2",
      patientId: "OPD-0847",
      category: "lab",
      severity: "moderate",
      title: "HbA1c",
      value: "8.1%",
      referenceRange: "< 7.0% (target)",
      status: "HIGH",
      date: "12 Dec 2024",
      note: "Above the usual target range. Glycaemic control to be reviewed by the treating clinician.",
    },
    {
      id: "al3",
      patientId: "OPD-0847",
      category: "interaction",
      severity: "high",
      title: "Aspirin already on record",
      note: "Patient's medication list includes Aspirin 75mg once daily. Confirm the current dose and timing with the patient before any further antiplatelet decision is made.",
    },
    {
      id: "al4",
      patientId: "OPD-0847",
      category: "caution",
      severity: "moderate",
      title: "Metformin and contrast imaging",
      note: "Metformin is on the active medication list. If contrast imaging is being considered, review with the treating clinician per local protocol.",
    },
    {
      id: "al5",
      patientId: "OPD-0847",
      category: "allergy",
      severity: "high",
      title: "Penicillin allergy on record",
      note: "Documented urticarial reaction to penicillin. Relevant if antibiotic therapy is being considered. Allergy status to be re-confirmed with the patient.",
    },
  ],

  "OPD-0848": [
    {
      id: "al1",
      patientId: "OPD-0848",
      category: "caution",
      severity: "low",
      title: "Fever duration",
      note: "Fever documented for 3 days without a recorded source. No neck stiffness or rash reported at the kiosk. For physician assessment.",
    },
  ],

  "OPD-0849": [
    {
      id: "al1",
      patientId: "OPD-0849",
      category: "lab",
      severity: "moderate",
      title: "FEV1 (% predicted)",
      value: "52%",
      referenceRange: "> 80% predicted",
      status: "LOW",
      date: "18 Mar 2025",
      note: "Below the reference range on the most recent spirometry. For physician interpretation in clinical context.",
    },
    {
      id: "al2",
      patientId: "OPD-0849",
      category: "caution",
      severity: "moderate",
      title: "Inhaler adherence reported as irregular",
      note: "Patient reported irregular inhaler use at the kiosk. Worth confirming technique and adherence during the consultation.",
    },
  ],

  "OPD-0845": [
    {
      id: "al1",
      patientId: "OPD-0845",
      category: "lab",
      severity: "low",
      title: "Haemoglobin",
      value: "11.8 g/dL",
      referenceRange: "12.0–15.5 g/dL",
      status: "LOW",
      date: "20 Aug 2026",
      note: "Marginally below the reference range. For physician review alongside symptoms.",
    },
    {
      id: "al2",
      patientId: "OPD-0845",
      category: "allergy",
      severity: "moderate",
      title: "Sulfa drug allergy on record",
      note: "Documented skin rash with sulfa drugs. Relevant if antibiotic therapy is being considered.",
    },
  ],

  "OPD-0846": [
    {
      id: "al1",
      patientId: "OPD-0846",
      category: "lab",
      severity: "low",
      title: "HbA1c",
      value: "7.2%",
      referenceRange: "< 7.0% (target)",
      status: "HIGH",
      date: "14 Jul 2026",
      note: "Slightly above the usual target, improved from the previous reading. For physician review.",
    },
  ],
}
