import type { Language, LanguageOption } from "@/types"

/**
 * Every patient-facing string, in one place.
 *
 * The kiosk is bilingual; the doctor dashboard is clinician-facing and stays in
 * English, so it does not draw from this table. `en` is the source of truth for
 * the key set — TypeScript requires `hi` to define exactly the same keys.
 *
 * Placeholders use `{name}` and are filled by `t(key, vars)`.
 */
const en = {
  "brand.name": "Clinsutra",
  "brand.tagline.short": "AI-Powered Case Taking",
  "brand.tagline.full": "AI-Powered Patient Case Taking",

  "common.continue": "Continue →",
  "common.next": "Next →",
  "common.back": "← Back",
  "common.skip": "Skip for Now",

  "shell.systemOnline": "System Online",
  "shell.assistance": "Call staff for assistance",
  "shell.extension": "Ext. 100",

  "progress.step": "Step {current} of {total}",
  "progress.complete": "{percent}% complete",

  "audio.listen": "Listen to audio",

  "welcome.heading": "Welcome",
  "welcome.subtitle": "Please select your preferred language to begin",
  "welcome.audioHint": "Tap to hear instructions",
  "welcome.cta": "Get Started →",
  "welcome.hospital": "AIIMS-Model Hospital • Outpatient Services",
  "welcome.poweredBy": "Powered by Clinsutra AI — Smart India Hackathon 2026",

  "patientId.title": "Patient Identification",
  "patientId.subtitle": "Please identify yourself to continue",
  "patientId.mode.abha": "ABHA ID",
  "patientId.mode.scan": "Scan Card",
  "patientId.mode.new": "New Patient",
  "patientId.abhaLabel": "ABHA ID / Patient ID",
  "patientId.abhaPlaceholder": "Enter 14-digit ABHA ID",
  "patientId.or": "OR",
  "patientId.regLabel": "Hospital Registration Number",
  "patientId.regPlaceholder": "e.g. AIIMS-2024-00123",
  "patientId.scanPrompt": "Position your card here",
  "patientId.activateCamera": "Activate Camera",
  "patientId.cameraUnavailable":
    "Camera scanning is not wired up in this demo. Use ABHA ID or New Patient.",
  "patientId.scanHelp": "Scan your Aadhaar, ABHA card, or Hospital ID",
  "patientId.field.name": "Full Name",
  "patientId.field.age": "Age",
  "patientId.field.gender": "Gender",
  "patientId.field.select": "Select",
  "patientId.field.phone": "Phone Number",
  "patientId.gender.male": "Male",
  "patientId.gender.female": "Female",
  "patientId.gender.other": "Other",
  "patientId.helpAudio": "Need help? Tap for audio guidance",
  "patientId.validation": "Enter an ABHA ID, a registration number, or your name to continue.",
  "patientId.validationDemographic": "Please also enter age, gender, or a phone number so we can identify the patient.",

  "interview.badge": "Question {current} of {total}",
  "interview.prompt": "What problem are you experiencing today?",
  "interview.speakPrompt": "— or speak your answer —",
  "interview.selectToContinue": "Select an option to continue",

  "followup.context": 'You said: "{complaint}" — follow-up questions',
  "followup.aiAdapting": "AI is adapting questions based on your answer",
  "followup.speakAnswers": "Or speak your answers",
  "followup.answered": "{answered} of {total} answered",

  "redflag.title": "Urgent Attention May Be Needed",
  "redflag.body":
    "Your symptoms may require urgent medical attention. Please do not leave the hospital. A staff member will assist you shortly.",
  "redflag.staffNotified": "Hospital Staff Notified",
  "redflag.staffDetail": "Duty nurse and triage team alerted",
  "redflag.priorityTitle": "Priority {priority} — Triage Flag Active",
  "redflag.forReview": "for physician review",
  "redflag.disclaimer":
    "⚕ This is NOT a diagnosis. A qualified clinician must evaluate the patient. Our AI has identified symptoms that need prompt attention.",
  "redflag.continue": "Continue Registration →",

  "documents.title": "Upload Medical Documents",
  "documents.subtitle": "Upload any previous prescriptions, reports or summaries",
  "documents.type.prescription": "Prescription",
  "documents.type.lab": "Lab Report",
  "documents.type.discharge": "Discharge Summary",
  "documents.type.imaging": "X-Ray / Scan",
  "documents.type.other": "Other Document",
  "documents.scanUpload": "Scan / Upload",
  "documents.added": "Added",
  "documents.listTitle": "Uploaded Documents",
  "documents.remove": "Remove document",
  "documents.error.type": "{name} is not a supported file type. Use PDF, JPG, PNG or HEIC.",
  "documents.error.size": "{name} is larger than {limit}. Please upload a smaller file.",
  "documents.privacy": "Documents stay on this device until you submit. Nothing is sent to third parties.",

  "processing.stage.uploading": "Scanning document…",
  "processing.stage.ocr": "Extracting text with OCR…",
  "processing.stage.extracting": "Identifying medical data…",
  "processing.stage.structuring": "Structuring clinical history…",
  "processing.stage.complete": "Complete!",
  "processing.wait": "Please wait — AI is processing your documents",
  "processing.node.document": "Document",
  "processing.node.ocr": "OCR",
  "processing.node.ai": "AI",
  "processing.node.done": "Done",

  "review.title": "Review Your Information",
  "review.subtitle": "AI has structured your medical history. Please confirm.",
  "review.aiGenerated": "🤖 AI Generated",
  "review.edit": "✏ Edit Information",
  "review.save": "✓ Save Edits",
  "review.confirm": "✓ Everything is Correct",
  "review.identity": "Age: {age} • {gender} • Token: {token}",
  "review.disclaimer":
    "⚕ This summary is AI-drafted from your answers. It is not a diagnosis — your doctor will review and confirm it.",
  "review.section.chiefComplaint": "Chief Complaint",
  "review.section.hpi": "History of Present Illness",
  "review.section.pmh": "Past Medical History",
  "review.section.medications": "Current Medications",
  "review.section.allergies": "Allergies",
  "review.section.familyHistory": "Family History",
  "review.section.personalHistory": "Personal History",

  "complete.title": "Submission Complete!",
  "complete.body":
    "Your medical history has been successfully submitted and is ready for the doctor.",
  "complete.tokenLabel": "Your Token Number",
  "complete.date": "Date:",
  "complete.doctorWillReview": "Doctor will review your history",
  "complete.listenToken": "Listen for your token number",
  "complete.printToken": "Print Token",
  "complete.startOver": "Start a New Patient Session",

  "mic.speak": "Speak",
  "mic.listening": "Listening…",
  "mic.stop": "Stop",
  "mic.transcript": "You said",
  "mic.clear": "Clear",
  "mic.unsupported": "Voice input is not available in this browser. Please tap an answer instead.",
  "mic.permissionDenied":
    "Microphone access was blocked. You can still answer by tapping an option.",
  "mic.noSpeech": "That was not picked up. Please try speaking again.",
  "mic.audioCapture": "No microphone was found. Please tap an answer instead.",
  "mic.network": "Voice input needs a network connection right now.",
  "mic.error": "Voice input is unavailable at the moment. Please tap an answer.",
} as const

export type TranslationKey = keyof typeof en

const hi: Record<TranslationKey, string> = {
  // Brand and hospital lines stayed in Latin script in the approved design.
  "brand.name": "Clinsutra",
  "brand.tagline.short": "AI-Powered Case Taking",
  "brand.tagline.full": "AI-Powered Patient Case Taking",

  "common.continue": "जारी रखें →",
  "common.next": "अगला →",
  "common.back": "← वापस",
  "common.skip": "अभी छोड़ें",

  "shell.systemOnline": "सिस्टम ऑनलाइन",
  "shell.assistance": "सहायता के लिए कर्मचारी को बुलाएं",
  "shell.extension": "एक्स. 100",

  "progress.step": "चरण {current} / {total}",
  "progress.complete": "{percent}% पूर्ण",

  "audio.listen": "ऑडियो सुनें",

  "welcome.heading": "स्वागत है",
  "welcome.subtitle": "आरंभ करने के लिए अपनी भाषा चुनें",
  "welcome.audioHint": "निर्देश सुनने के लिए टैप करें",
  "welcome.cta": "शुरू करें →",
  "welcome.hospital": "AIIMS-Model Hospital • Outpatient Services",
  "welcome.poweredBy": "Powered by Clinsutra AI — Smart India Hackathon 2026",

  "patientId.title": "रोगी पहचान",
  "patientId.subtitle": "जारी रखने के लिए अपनी पहचान करें",
  "patientId.mode.abha": "ABHA ID",
  "patientId.mode.scan": "कार्ड स्कैन करें",
  "patientId.mode.new": "नया रोगी",
  "patientId.abhaLabel": "ABHA ID / रोगी ID",
  "patientId.abhaPlaceholder": "14 अंकों की ABHA ID दर्ज करें",
  "patientId.or": "या",
  "patientId.regLabel": "अस्पताल पंजीकरण संख्या",
  "patientId.regPlaceholder": "उदा. AIIMS-2024-00123",
  "patientId.scanPrompt": "अपना कार्ड यहाँ रखें",
  "patientId.activateCamera": "कैमरा चालू करें",
  "patientId.cameraUnavailable":
    "इस डेमो में कैमरा स्कैनिंग उपलब्ध नहीं है। ABHA ID या नया रोगी विकल्प चुनें।",
  "patientId.scanHelp": "आधार, ABHA कार्ड या अस्पताल ID स्कैन करें",
  "patientId.field.name": "पूरा नाम",
  "patientId.field.age": "आयु",
  "patientId.field.gender": "लिंग",
  "patientId.field.select": "चुनें",
  "patientId.field.phone": "फोन नंबर",
  "patientId.gender.male": "पुरुष",
  "patientId.gender.female": "महिला",
  "patientId.gender.other": "अन्य",
  "patientId.helpAudio": "सहायता? ऑडियो निर्देश के लिए टैप करें",
  "patientId.validation": "जारी रखने के लिए ABHA ID, पंजीकरण संख्या या अपना नाम दर्ज करें।",
  "patientId.validationDemographic": "कृपया आयु, लिंग या फोन नंबर भी दर्ज करें ताकि रोगी की पहचान की जा सके।",

  "interview.badge": "प्रश्न {current} / {total}",
  "interview.prompt": "आज आप किस समस्या का अनुभव कर रहे हैं?",
  "interview.speakPrompt": "— या अपना उत्तर बोलें —",
  "interview.selectToContinue": "जारी रखने के लिए एक विकल्प चुनें",

  "followup.context": 'आपने कहा: "{complaint}" — अनुवर्ती प्रश्न',
  "followup.aiAdapting": "AI आपके उत्तर के आधार पर प्रश्न बदल रहा है",
  "followup.speakAnswers": "या बोलकर उत्तर दें",
  "followup.answered": "{total} में से {answered} उत्तर दिए गए",

  "redflag.title": "तत्काल ध्यान आवश्यक हो सकता है",
  "redflag.body":
    "आपके लक्षणों को तत्काल चिकित्सा ध्यान की आवश्यकता हो सकती है। कृपया अस्पताल न छोड़ें। एक कर्मचारी शीघ्र आपकी सहायता करेगा।",
  "redflag.staffNotified": "अस्पताल कर्मचारियों को सूचित किया गया",
  "redflag.staffDetail": "ड्यूटी नर्स और ट्राइएज टीम को सतर्क किया गया",
  "redflag.priorityTitle": "प्राथमिकता {priority} — ट्राइएज फ्लैग सक्रिय",
  "redflag.forReview": "चिकित्सक समीक्षा के लिए",
  "redflag.disclaimer":
    "⚕ यह कोई निदान नहीं है। एक योग्य चिकित्सक को रोगी की जांच करनी आवश्यक है। हमारे AI ने ऐसे लक्षणों की पहचान की है जिन पर ध्यान देने की आवश्यकता है।",
  "redflag.continue": "पंजीकरण जारी रखें →",

  "documents.title": "चिकित्सा दस्तावेज़ अपलोड करें",
  "documents.subtitle": "कोई भी पुरानी पर्ची, रिपोर्ट या सारांश अपलोड करें",
  "documents.type.prescription": "पर्ची",
  "documents.type.lab": "लैब रिपोर्ट",
  "documents.type.discharge": "छुट्टी सारांश",
  "documents.type.imaging": "एक्स-रे / स्कैन",
  "documents.type.other": "अन्य दस्तावेज़",
  "documents.scanUpload": "स्कैन / अपलोड",
  "documents.added": "जोड़ा गया",
  "documents.listTitle": "अपलोड किए गए दस्तावेज़",
  "documents.remove": "दस्तावेज़ हटाएं",
  "documents.error.type": "{name} समर्थित फ़ाइल प्रकार नहीं है। PDF, JPG, PNG या HEIC उपयोग करें।",
  "documents.error.size": "{name} {limit} से बड़ी है। कृपया छोटी फ़ाइल अपलोड करें।",
  "documents.privacy": "दस्तावेज़ जमा करने तक इसी डिवाइस पर रहते हैं। कुछ भी बाहर नहीं भेजा जाता।",

  "processing.stage.uploading": "दस्तावेज़ स्कैन हो रहा है…",
  "processing.stage.ocr": "OCR से टेक्स्ट निकाला जा रहा है…",
  "processing.stage.extracting": "चिकित्सा डेटा पहचाना जा रहा है…",
  "processing.stage.structuring": "नैदानिक इतिहास संरचित हो रहा है…",
  "processing.stage.complete": "पूर्ण!",
  "processing.wait": "कृपया प्रतीक्षा करें — AI आपके दस्तावेज़ संसाधित कर रहा है",
  "processing.node.document": "दस्तावेज़",
  "processing.node.ocr": "OCR",
  "processing.node.ai": "AI",
  "processing.node.done": "पूर्ण",

  "review.title": "अपनी जानकारी की समीक्षा करें",
  "review.subtitle": "AI ने आपका चिकित्सा इतिहास तैयार किया है। कृपया पुष्टि करें।",
  "review.aiGenerated": "🤖 AI द्वारा तैयार",
  "review.edit": "✏ जानकारी संपादित करें",
  "review.save": "✓ सहेजें",
  "review.confirm": "✓ सब कुछ सही है",
  "review.identity": "आयु: {age} • {gender} • टोकन: {token}",
  "review.disclaimer":
    "⚕ यह सारांश आपके उत्तरों से AI द्वारा तैयार किया गया है। यह निदान नहीं है — आपके डॉक्टर इसकी समीक्षा और पुष्टि करेंगे।",
  "review.section.chiefComplaint": "मुख्य शिकायत",
  "review.section.hpi": "वर्तमान बीमारी का इतिहास",
  "review.section.pmh": "पिछला चिकित्सा इतिहास",
  "review.section.medications": "वर्तमान दवाइयाँ",
  "review.section.allergies": "एलर्जी",
  "review.section.familyHistory": "पारिवारिक इतिहास",
  "review.section.personalHistory": "व्यक्तिगत इतिहास",

  "complete.title": "सबमिशन पूर्ण!",
  "complete.body": "आपका चिकित्सा इतिहास सफलतापूर्वक जमा हो गया है और डॉक्टर के लिए तैयार है।",
  "complete.tokenLabel": "आपका टोकन नंबर",
  "complete.date": "दिनांक:",
  "complete.doctorWillReview": "डॉक्टर आपका इतिहास देखेंगे",
  "complete.listenToken": "अपना टोकन नंबर सुनें",
  "complete.printToken": "टोकन प्रिंट करें",
  "complete.startOver": "नया रोगी सत्र शुरू करें",

  "mic.speak": "बोलें",
  "mic.listening": "सुन रहा है…",
  "mic.stop": "रोकें",
  "mic.transcript": "आपने कहा",
  "mic.clear": "मिटाएं",
  "mic.unsupported": "इस ब्राउज़र में वॉइस इनपुट उपलब्ध नहीं है। कृपया उत्तर पर टैप करें।",
  "mic.permissionDenied": "माइक्रोफ़ोन की अनुमति नहीं मिली। आप विकल्प पर टैप करके उत्तर दे सकते हैं।",
  "mic.noSpeech": "आवाज़ सुनाई नहीं दी। कृपया दोबारा बोलें।",
  "mic.audioCapture": "कोई माइक्रोफ़ोन नहीं मिला। कृपया उत्तर पर टैप करें।",
  "mic.network": "वॉइस इनपुट के लिए इस समय नेटवर्क कनेक्शन आवश्यक है।",
  "mic.error": "इस समय वॉइस इनपुट उपलब्ध नहीं है। कृपया उत्तर पर टैप करें।",
}

export const translations: Record<Language, Record<TranslationKey, string>> = {
  en,
  hi,
}

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: "en", nativeLabel: "English", englishLabel: "English", flag: "🇮🇳" },
  {
    code: "hi",
    nativeLabel: "हिंदी",
    englishLabel: "Hindi",
    flag: "🇮🇳",
    fontClass: "devanagari",
  },
]

/** Always rendered in Devanagari, in both languages, as in the original design. */
export const WELCOME_DEVANAGARI = "स्वागत है"

/** Replaces `{placeholder}` tokens. Missing vars are left untouched. */
export function interpolate(
  template: string,
  vars?: Record<string, string | number>,
): string {
  if (!vars) return template
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in vars ? String(vars[key]) : match,
  )
}
