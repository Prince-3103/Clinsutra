import type { ClinicalHistory, VitalObservation } from "@/types"

/** AI-drafted histories, keyed by patient id. Demo content only. */
export const MOCK_HISTORIES: Record<string, ClinicalHistory> = {
  "OPD-0847": {
    patientId: "OPD-0847",
    chiefComplaint:
      "Chest pain for 3 hours, radiating to left arm, associated with diaphoresis",
    historyOfPresentIllness:
      "52-year-old male presents with sudden onset of retrosternal chest pain at rest for approximately 3 hours. Pain is described as squeezing in nature, 7/10 severity. Radiates to left arm and jaw. Associated with diaphoresis and mild breathlessness. No relief with rest. No previous similar episodes.",
    pastMedicalHistory:
      "Hypertension (diagnosed 2014, on medication). Type 2 Diabetes Mellitus (diagnosed 2019, on oral hypoglycaemics). No prior cardiac history documented.",
    pastSurgicalHistory: "Appendectomy (2001). No other surgical history.",
    medications: [
      { id: "m1", name: "Amlodipine", dose: "5mg", frequency: "once daily" },
      { id: "m2", name: "Metformin", dose: "500mg", frequency: "twice daily" },
      { id: "m3", name: "Aspirin", dose: "75mg", frequency: "once daily" },
    ],
    allergies: [
      {
        id: "a1",
        substance: "Penicillin",
        reaction: "Urticarial rash",
        severity: "high",
      },
    ],
    familyHistory:
      "Father: Coronary artery disease, died aged 62. Mother: Hypertension, alive age 78. One sibling with diabetes.",
    personalHistory:
      "Non-smoker. Occasional alcohol consumption (social). Retired school teacher. Sedentary lifestyle. Diet: mixed.",
    reviewOfSystems:
      "Positive: chest pain, diaphoresis, mild dyspnoea. Negative: palpitations, syncope, orthopnoea, PND, leg swelling.",
    investigationsSummary:
      "Previous CBC (Jan 2025): Hb 11.2 g/dL (low), WBC 8,900, Plt 215K. ECG: Not available. Echo: Not available. HbA1c (Dec 2024): 8.1% (elevated).",
    aiGenerated: true,
    confirmedByClinician: false,
    updatedAt: "2026-09-06T09:14:00+05:30",
  },

  "OPD-0848": {
    patientId: "OPD-0848",
    chiefComplaint: "Fever with body ache for 3 days",
    historyOfPresentIllness:
      "38-year-old female with intermittent fever for 3 days, peaking in the evenings, associated with generalised body ache and headache. No rash, no neck stiffness, no urinary symptoms. Taking paracetamol with partial relief.",
    pastMedicalHistory: "No chronic illness documented. Two uncomplicated pregnancies.",
    pastSurgicalHistory: "Lower segment caesarean section (2016).",
    medications: [
      { id: "m1", name: "Paracetamol", dose: "500mg", frequency: "as needed" },
    ],
    allergies: [],
    familyHistory: "No significant family history reported.",
    personalHistory: "Non-smoker, no alcohol. Homemaker. Mixed diet.",
    reviewOfSystems:
      "Positive: fever, myalgia, headache. Negative: cough, dysuria, rash, neck stiffness.",
    investigationsSummary: "No recent investigations on record.",
    aiGenerated: true,
    confirmedByClinician: false,
    updatedAt: "2026-09-06T09:08:00+05:30",
  },

  "OPD-0849": {
    patientId: "OPD-0849",
    chiefComplaint: "Breathlessness on exertion, worsening over 2 weeks",
    historyOfPresentIllness:
      "67-year-old male, known COPD, reports increasing breathlessness on walking short distances over the past 2 weeks. Associated productive cough with whitish sputum. No chest pain, no fever, no ankle swelling. Uses inhaler irregularly.",
    pastMedicalHistory:
      "COPD (diagnosed 2016). Ex-smoker, 30 pack-years, quit 2018. Hypertension.",
    pastSurgicalHistory: "Nil.",
    medications: [
      { id: "m1", name: "Salbutamol inhaler", dose: "100mcg", frequency: "as needed" },
      { id: "m2", name: "Tiotropium", dose: "18mcg", frequency: "once daily" },
      { id: "m3", name: "Telmisartan", dose: "40mg", frequency: "once daily" },
    ],
    allergies: [],
    familyHistory: "Father: chronic bronchitis.",
    personalHistory: "Ex-smoker. Retired mill worker. Lives with family.",
    reviewOfSystems:
      "Positive: exertional dyspnoea, productive cough. Negative: haemoptysis, chest pain, orthopnoea, fever.",
    investigationsSummary:
      "Spirometry (Mar 2025): FEV1 52% predicted. Chest X-ray (Mar 2025): hyperinflated lung fields.",
    aiGenerated: true,
    confirmedByClinician: false,
    updatedAt: "2026-09-06T09:01:00+05:30",
  },

  "OPD-0845": {
    patientId: "OPD-0845",
    chiefComplaint: "Headache with dizziness for 5 days",
    historyOfPresentIllness:
      "29-year-old female with bilateral, band-like headache for 5 days, worse towards the evening, associated with light-headedness on standing. No visual disturbance, no vomiting, no focal weakness. Long screen hours and poor sleep reported.",
    pastMedicalHistory: "Iron deficiency anaemia (2023, treated).",
    pastSurgicalHistory: "Nil.",
    medications: [],
    allergies: [
      {
        id: "a1",
        substance: "Sulfa drugs",
        reaction: "Skin rash",
        severity: "moderate",
      },
    ],
    familyHistory: "Mother: migraine.",
    personalHistory: "Non-smoker, no alcohol. Software engineer. Vegetarian diet.",
    reviewOfSystems:
      "Positive: headache, postural dizziness. Negative: focal weakness, speech difficulty, visual loss, fever.",
    investigationsSummary: "CBC (Aug 2026): Hb 11.8 g/dL (borderline low).",
    aiGenerated: true,
    confirmedByClinician: true,
    updatedAt: "2026-09-06T08:40:00+05:30",
  },

  "OPD-0846": {
    patientId: "OPD-0846",
    chiefComplaint: "Routine follow-up for type 2 diabetes",
    historyOfPresentIllness:
      "44-year-old male attending scheduled follow-up. Reports good adherence to medication, occasional postprandial fatigue. No polyuria, no visual blurring, no foot ulcers. Home glucose readings 130–160 mg/dL fasting.",
    pastMedicalHistory: "Type 2 Diabetes Mellitus (diagnosed 2021). Dyslipidaemia.",
    pastSurgicalHistory: "Nil.",
    medications: [
      { id: "m1", name: "Metformin", dose: "1000mg", frequency: "twice daily" },
      { id: "m2", name: "Atorvastatin", dose: "10mg", frequency: "once daily at night" },
    ],
    allergies: [],
    familyHistory: "Both parents with type 2 diabetes.",
    personalHistory: "Non-smoker. Walks 30 minutes daily. Shopkeeper.",
    reviewOfSystems:
      "Positive: mild postprandial fatigue. Negative: polyuria, paraesthesiae, visual blurring.",
    investigationsSummary: "HbA1c (Jul 2026): 7.2%. Lipid profile (Jul 2026): LDL 96 mg/dL.",
    aiGenerated: true,
    confirmedByClinician: true,
    updatedAt: "2026-09-06T08:50:00+05:30",
  },
}

/** Self-reported observations captured at the kiosk, keyed by patient id. */
export const MOCK_VITALS: Record<string, VitalObservation[]> = {
  "OPD-0847": [
    { id: "v1", label: "Symptoms Onset", value: "3 hrs ago", unit: "", normal: true },
    { id: "v2", label: "Pain Score", value: "7", unit: "/ 10", normal: false },
    { id: "v3", label: "Diaphoresis", value: "Yes", unit: "", normal: false },
    { id: "v4", label: "Dyspnoea", value: "Mild", unit: "", normal: false },
  ],
  "OPD-0848": [
    { id: "v1", label: "Symptoms Onset", value: "3 days ago", unit: "", normal: true },
    { id: "v2", label: "Highest Temp", value: "38.9", unit: "°C", normal: false },
    { id: "v3", label: "Neck Stiffness", value: "No", unit: "", normal: true },
    { id: "v4", label: "Rash", value: "No", unit: "", normal: true },
  ],
  "OPD-0849": [
    { id: "v1", label: "Symptoms Onset", value: "2 weeks", unit: "", normal: true },
    { id: "v2", label: "Breathless At", value: "Exertion", unit: "", normal: false },
    { id: "v3", label: "Cough", value: "Yes", unit: "", normal: false },
    { id: "v4", label: "Ankle Swelling", value: "No", unit: "", normal: true },
  ],
  "OPD-0845": [
    { id: "v1", label: "Symptoms Onset", value: "5 days ago", unit: "", normal: true },
    { id: "v2", label: "Pain Score", value: "4", unit: "/ 10", normal: true },
    { id: "v3", label: "Focal Weakness", value: "No", unit: "", normal: true },
    { id: "v4", label: "Vision Change", value: "No", unit: "", normal: true },
  ],
  "OPD-0846": [
    { id: "v1", label: "Visit Type", value: "Follow-up", unit: "", normal: true },
    { id: "v2", label: "Fasting Sugar", value: "142", unit: "mg/dL", normal: false },
    { id: "v3", label: "Foot Ulcer", value: "No", unit: "", normal: true },
    { id: "v4", label: "Adherence", value: "Good", unit: "", normal: true },
  ],
}
