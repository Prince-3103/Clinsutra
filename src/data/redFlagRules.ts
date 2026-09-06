import type { RedFlagRule } from "@/types"

/**
 * DEMO triage rules only.
 *
 * These decide whether a case is surfaced to a clinician sooner. They do not
 * diagnose, and they never map to a treatment or a drug. Every screen that
 * shows a result of these rules must also show the non-diagnosis disclaimer.
 *
 * A rule fires when the answered signals include *all* of `requires` and, if
 * `complaint` is set, the patient picked that chief complaint. The highest
 * priority among the rules that fire wins.
 */
export const RED_FLAG_RULES: RedFlagRule[] = [
  {
    id: "cp-radiation-arm",
    complaint: "chest-pain",
    requires: ["radiation-arm"],
    priority: "P1",
    reason: {
      en: "Chest pain with radiation to the arm",
      hi: "छाती में दर्द जो हाथ तक फैल रहा है",
    },
  },
  {
    id: "cp-radiation-jaw",
    complaint: "chest-pain",
    requires: ["radiation-jaw"],
    priority: "P1",
    reason: {
      en: "Chest pain with radiation to the jaw",
      hi: "छाती में दर्द जो जबड़े तक फैल रहा है",
    },
  },
  {
    id: "cp-breathlessness",
    complaint: "chest-pain",
    requires: ["breathless-at-rest"],
    priority: "P1",
    reason: {
      en: "Chest pain with breathlessness at rest",
      hi: "छाती में दर्द के साथ आराम में सांस फूलना",
    },
  },
  {
    id: "cp-diaphoresis",
    complaint: "chest-pain",
    requires: ["diaphoresis"],
    priority: "P1",
    reason: {
      en: "Chest pain with sweating reported",
      hi: "छाती में दर्द के साथ पसीना",
    },
  },
  {
    id: "cp-sudden-central",
    complaint: "chest-pain",
    requires: ["onset-sudden", "pain-central"],
    priority: "P2",
    reason: {
      en: "Sudden-onset central chest pain",
      hi: "अचानक शुरू हुआ छाती के बीच का दर्द",
    },
  },
  {
    id: "stroke-weakness",
    requires: ["focal-weakness"],
    priority: "P1",
    reason: {
      en: "One-sided weakness reported — stroke-like symptom",
      hi: "एक तरफ कमजोरी — स्ट्रोक जैसे लक्षण",
    },
  },
  {
    id: "stroke-speech",
    requires: ["speech-difficulty"],
    priority: "P1",
    reason: {
      en: "Speech difficulty reported — stroke-like symptom",
      hi: "बोलने में कठिनाई — स्ट्रोक जैसे लक्षण",
    },
  },
  {
    id: "stroke-vision",
    requires: ["vision-loss"],
    priority: "P1",
    reason: {
      en: "Sudden vision loss reported",
      hi: "अचानक दृष्टि हानि",
    },
  },
  {
    id: "thunderclap-headache",
    complaint: "headache",
    requires: ["worst-ever-headache"],
    priority: "P1",
    reason: {
      en: "Sudden severe headache described as worst ever",
      hi: "अचानक बहुत तेज़ सिरदर्द — अब तक का सबसे तेज़",
    },
  },
  {
    id: "breathless-at-rest",
    complaint: "breathlessness",
    requires: ["breathless-at-rest"],
    priority: "P1",
    reason: {
      en: "Breathlessness present at rest",
      hi: "आराम की स्थिति में सांस फूलना",
    },
  },
  {
    id: "breathless-sudden",
    complaint: "breathlessness",
    requires: ["onset-sudden"],
    priority: "P2",
    reason: {
      en: "Sudden-onset breathlessness",
      hi: "अचानक शुरू हुई सांस की तकलीफ",
    },
  },
  {
    id: "gi-bleed-haematemesis",
    requires: ["vomiting-blood"],
    priority: "P1",
    reason: {
      en: "Blood in vomit reported",
      hi: "उल्टी में खून",
    },
  },
  {
    id: "gi-bleed-melaena",
    requires: ["black-stools"],
    priority: "P2",
    reason: {
      en: "Black stools reported",
      hi: "काला मल",
    },
  },
  {
    id: "meningism",
    complaint: "fever",
    requires: ["high-fever", "neck-stiffness"],
    priority: "P1",
    reason: {
      en: "High fever with neck stiffness",
      hi: "तेज़ बुखार के साथ गर्दन में अकड़न",
    },
  },
  {
    id: "fever-neck-stiffness",
    complaint: "fever",
    requires: ["neck-stiffness"],
    priority: "P2",
    reason: {
      en: "Fever with neck stiffness",
      hi: "बुखार के साथ गर्दन में अकड़न",
    },
  },
  {
    id: "severe-abdominal-sudden",
    complaint: "abdominal",
    requires: ["onset-sudden", "severe-pain"],
    priority: "P2",
    reason: {
      en: "Sudden severe abdominal pain",
      hi: "अचानक तेज़ पेट दर्द",
    },
  },
]

/**
 * Shown wherever a red-flag result appears. Kept as data so the wording stays
 * identical on the kiosk, the queue and the alerts panel.
 */
export const NOT_A_DIAGNOSIS_NOTICE = {
  en: "This is not a diagnosis. A qualified clinician must evaluate the patient.",
  hi: "यह निदान नहीं है। एक योग्य चिकित्सक को रोगी की जांच करनी आवश्यक है।",
} as const
