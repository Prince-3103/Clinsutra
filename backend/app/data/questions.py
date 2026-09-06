"""
Server-side mirror of the frontend's demo adaptive question bank
(`src/data/questions.ts`). This is the exact same non-diagnostic demo content
the frontend already ships in mock mode — porting it here just lets
`GET /interview/opening` / `POST /interview/follow-ups` return identical data
once `VITE_USE_MOCK_API=false`. No new clinical logic is introduced.
"""

from __future__ import annotations

CHIEF_COMPLAINT_QUESTION: dict = {
    "id": "q-chief-complaint",
    "kind": "single",
    "prompt": {
        "en": "What problem are you experiencing today?",
        "hi": "आज आप किस समस्या का अनुभव कर रहे हैं?",
    },
    "options": [
        {"id": "chest-pain", "label": {"en": "Chest pain or tightness", "hi": "छाती में दर्द या जकड़न"}},
        {"id": "breathlessness", "label": {"en": "Difficulty breathing", "hi": "सांस लेने में कठिनाई"}},
        {"id": "fever", "label": {"en": "Fever or body ache", "hi": "बुखार या शरीर में दर्द"}},
        {"id": "headache", "label": {"en": "Headache or dizziness", "hi": "सिरदर्द या चक्कर"}},
        {"id": "abdominal", "label": {"en": "Stomach pain or nausea", "hi": "पेट दर्द या मतली"}},
        {"id": "other", "label": {"en": "Something else", "hi": "कुछ और"}},
    ],
}

COMPLAINTS: dict = {
    "chest-pain": {
        "id": "chest-pain",
        "label": {"en": "Chest pain or tightness", "hi": "छाती में दर्द या जकड़न"},
        "echo": {"en": "I have chest pain", "hi": "छाती में दर्द है"},
        "followUps": [
            {
                "id": "cp-onset",
                "kind": "single",
                "prompt": {"en": "When did the chest pain start?", "hi": "छाती का दर्द कब शुरू हुआ?"},
                "options": [
                    {"id": "cp-onset-now", "label": {"en": "Just now", "hi": "अभी-अभी"}, "signals": ["onset-sudden"]},
                    {"id": "cp-onset-hours", "label": {"en": "A few hours ago", "hi": "कुछ घंटे पहले"}, "signals": ["onset-recent"]},
                    {"id": "cp-onset-yesterday", "label": {"en": "Yesterday", "hi": "कल"}},
                    {"id": "cp-onset-days", "label": {"en": "Several days ago", "hi": "कई दिन पहले"}},
                ],
            },
            {
                "id": "cp-location",
                "kind": "single",
                "prompt": {"en": "Where exactly is the pain located?", "hi": "दर्द ठीक कहाँ है?"},
                "options": [
                    {"id": "cp-loc-centre", "label": {"en": "Centre of chest", "hi": "छाती के बीच में"}, "signals": ["pain-central"]},
                    {"id": "cp-loc-left", "label": {"en": "Left side", "hi": "बाईं तरफ"}},
                    {"id": "cp-loc-right", "label": {"en": "Right side", "hi": "दाईं तरफ"}},
                    {"id": "cp-loc-behind", "label": {"en": "Behind the chest", "hi": "छाती के पीछे"}, "signals": ["pain-central"]},
                ],
            },
            {
                "id": "cp-radiation",
                "kind": "single",
                "prompt": {"en": "Does the pain spread to your arm, jaw or back?", "hi": "क्या दर्द हाथ, जबड़े या पीठ तक फैलता है?"},
                "options": [
                    {"id": "cp-rad-arm", "label": {"en": "Yes, to arm", "hi": "हाँ, हाथ तक"}, "signals": ["radiation-arm"]},
                    {"id": "cp-rad-jaw", "label": {"en": "Yes, to jaw", "hi": "हाँ, जबड़े तक"}, "signals": ["radiation-jaw"]},
                    {"id": "cp-rad-back", "label": {"en": "Yes, to back", "hi": "हाँ, पीठ तक"}, "signals": ["radiation-back"]},
                    {"id": "cp-rad-none", "label": {"en": "No, stays in chest", "hi": "नहीं, केवल छाती में"}, "signals": ["no-radiation"]},
                ],
            },
            {
                "id": "cp-associated",
                "kind": "single",
                "prompt": {"en": "Is there sweating or breathlessness with the pain?", "hi": "क्या दर्द के साथ पसीना या सांस फूलना है?"},
                "options": [
                    {"id": "cp-assoc-sweating", "label": {"en": "Yes, heavy sweating", "hi": "हाँ, बहुत पसीना"}, "signals": ["diaphoresis"]},
                    {"id": "cp-assoc-breathless", "label": {"en": "Yes, breathlessness", "hi": "हाँ, सांस फूलना"}, "signals": ["breathless-at-rest"]},
                    {"id": "cp-assoc-both", "label": {"en": "Both", "hi": "दोनों"}, "signals": ["diaphoresis", "breathless-at-rest"]},
                    {"id": "cp-assoc-none", "label": {"en": "Neither", "hi": "इनमें से कोई नहीं"}},
                ],
            },
        ],
    },
    "breathlessness": {
        "id": "breathlessness",
        "label": {"en": "Difficulty breathing", "hi": "सांस लेने में कठिनाई"},
        "echo": {"en": "I have difficulty breathing", "hi": "सांस लेने में कठिनाई है"},
        "followUps": [
            {
                "id": "br-onset",
                "kind": "single",
                "prompt": {"en": "When did the breathing difficulty start?", "hi": "सांस की तकलीफ कब शुरू हुई?"},
                "options": [
                    {"id": "br-onset-sudden", "label": {"en": "Suddenly, within the hour", "hi": "अचानक, एक घंटे के अंदर"}, "signals": ["onset-sudden"]},
                    {"id": "br-onset-today", "label": {"en": "Earlier today", "hi": "आज पहले"}, "signals": ["onset-recent"]},
                    {"id": "br-onset-days", "label": {"en": "Over a few days", "hi": "कुछ दिनों से"}},
                    {"id": "br-onset-weeks", "label": {"en": "For weeks or longer", "hi": "हफ्तों से"}},
                ],
            },
            {
                "id": "br-trigger",
                "kind": "single",
                "prompt": {"en": "When are you short of breath?", "hi": "आपको कब सांस फूलती है?"},
                "options": [
                    {"id": "br-trig-rest", "label": {"en": "Even while resting", "hi": "आराम करते समय भी"}, "signals": ["breathless-at-rest"]},
                    {"id": "br-trig-exertion", "label": {"en": "Only on walking or effort", "hi": "चलने या मेहनत पर"}, "signals": ["breathless-on-exertion"]},
                    {"id": "br-trig-lying", "label": {"en": "Only when lying down", "hi": "केवल लेटने पर"}},
                    {"id": "br-trig-night", "label": {"en": "Mostly at night", "hi": "अधिकतर रात में"}},
                ],
            },
            {
                "id": "br-associated",
                "kind": "single",
                "prompt": {"en": "Is there chest pain, sweating or blue lips?", "hi": "क्या छाती में दर्द, पसीना या होंठ नीले हैं?"},
                "options": [
                    {"id": "br-assoc-chest", "label": {"en": "Yes, chest pain", "hi": "हाँ, छाती में दर्द"}, "signals": ["pain-central"]},
                    {"id": "br-assoc-sweat", "label": {"en": "Yes, sweating", "hi": "हाँ, पसीना"}, "signals": ["diaphoresis"]},
                    {"id": "br-assoc-cough", "label": {"en": "Cough and wheeze", "hi": "खांसी और घरघराहट"}},
                    {"id": "br-assoc-none", "label": {"en": "None of these", "hi": "इनमें से कोई नहीं"}},
                ],
            },
        ],
    },
    "fever": {
        "id": "fever",
        "label": {"en": "Fever or body ache", "hi": "बुखार या शरीर में दर्द"},
        "echo": {"en": "I have fever and body ache", "hi": "मुझे बुखार और शरीर में दर्द है"},
        "followUps": [
            {
                "id": "fv-duration",
                "kind": "single",
                "prompt": {"en": "How many days have you had fever?", "hi": "कितने दिनों से बुखार है?"},
                "options": [
                    {"id": "fv-dur-1", "label": {"en": "Since today", "hi": "आज से"}},
                    {"id": "fv-dur-3", "label": {"en": "2–3 days", "hi": "2–3 दिन"}},
                    {"id": "fv-dur-7", "label": {"en": "About a week", "hi": "लगभग एक सप्ताह"}},
                    {"id": "fv-dur-long", "label": {"en": "More than a week", "hi": "एक सप्ताह से अधिक"}},
                ],
            },
            {
                "id": "fv-grade",
                "kind": "single",
                "prompt": {"en": "How high is the fever?", "hi": "बुखार कितना तेज़ है?"},
                "options": [
                    {"id": "fv-grade-mild", "label": {"en": "Mild warmth", "hi": "हल्की गर्मी"}},
                    {"id": "fv-grade-moderate", "label": {"en": "Moderate", "hi": "मध्यम"}},
                    {"id": "fv-grade-high", "label": {"en": "Very high with chills", "hi": "बहुत तेज़, ठंड लगकर"}, "signals": ["high-fever"]},
                    {"id": "fv-grade-unknown", "label": {"en": "Not measured", "hi": "मापा नहीं"}},
                ],
            },
            {
                "id": "fv-associated",
                "kind": "single",
                "prompt": {"en": "Any neck stiffness, rash or confusion?", "hi": "क्या गर्दन में अकड़न, दाने या भ्रम है?"},
                "options": [
                    {"id": "fv-assoc-neck", "label": {"en": "Yes, neck stiffness", "hi": "हाँ, गर्दन में अकड़न"}, "signals": ["neck-stiffness"]},
                    {"id": "fv-assoc-rash", "label": {"en": "Yes, rash", "hi": "हाँ, दाने"}},
                    {"id": "fv-assoc-confusion", "label": {"en": "Yes, confusion or drowsiness", "hi": "हाँ, भ्रम या सुस्ती"}, "signals": ["speech-difficulty"]},
                    {"id": "fv-assoc-none", "label": {"en": "None of these", "hi": "इनमें से कोई नहीं"}},
                ],
            },
        ],
    },
    "headache": {
        "id": "headache",
        "label": {"en": "Headache or dizziness", "hi": "सिरदर्द या चक्कर"},
        "echo": {"en": "I have a headache and dizziness", "hi": "मुझे सिरदर्द और चक्कर हैं"},
        "followUps": [
            {
                "id": "hd-onset",
                "kind": "single",
                "prompt": {"en": "How did the headache begin?", "hi": "सिरदर्द कैसे शुरू हुआ?"},
                "options": [
                    {"id": "hd-onset-thunderclap", "label": {"en": "Suddenly — worst headache of my life", "hi": "अचानक — अब तक का सबसे तेज़ दर्द"}, "signals": ["onset-sudden", "worst-ever-headache"]},
                    {"id": "hd-onset-hours", "label": {"en": "Built up over hours", "hi": "कुछ घंटों में बढ़ा"}, "signals": ["onset-recent"]},
                    {"id": "hd-onset-days", "label": {"en": "Over several days", "hi": "कई दिनों में"}},
                    {"id": "hd-onset-recurrent", "label": {"en": "Comes and goes often", "hi": "बार-बार आता है"}},
                ],
            },
            {
                "id": "hd-neuro",
                "kind": "single",
                "prompt": {"en": "Any weakness, slurred speech or loss of vision?", "hi": "क्या कमजोरी, बोलने में कठिनाई या दृष्टि हानि है?"},
                "options": [
                    {"id": "hd-neuro-weakness", "label": {"en": "Weakness on one side", "hi": "एक तरफ कमजोरी"}, "signals": ["focal-weakness"]},
                    {"id": "hd-neuro-speech", "label": {"en": "Slurred or difficult speech", "hi": "बोलने में कठिनाई"}, "signals": ["speech-difficulty"]},
                    {"id": "hd-neuro-vision", "label": {"en": "Sudden vision loss", "hi": "अचानक दृष्टि हानि"}, "signals": ["vision-loss"]},
                    {"id": "hd-neuro-none", "label": {"en": "None of these", "hi": "इनमें से कोई नहीं"}},
                ],
            },
            {
                "id": "hd-severity",
                "kind": "single",
                "prompt": {"en": "How severe is it right now?", "hi": "अभी दर्द कितना तेज़ है?"},
                "options": [
                    {"id": "hd-sev-mild", "label": {"en": "Mild", "hi": "हल्का"}},
                    {"id": "hd-sev-moderate", "label": {"en": "Moderate", "hi": "मध्यम"}},
                    {"id": "hd-sev-severe", "label": {"en": "Severe — hard to bear", "hi": "बहुत तेज़ — सहन नहीं होता"}, "signals": ["severe-pain"]},
                ],
            },
        ],
    },
    "abdominal": {
        "id": "abdominal",
        "label": {"en": "Stomach pain or nausea", "hi": "पेट दर्द या मतली"},
        "echo": {"en": "I have stomach pain", "hi": "मुझे पेट में दर्द है"},
        "followUps": [
            {
                "id": "ab-onset",
                "kind": "single",
                "prompt": {"en": "When did the pain start?", "hi": "दर्द कब शुरू हुआ?"},
                "options": [
                    {"id": "ab-onset-sudden", "label": {"en": "Suddenly, very severe", "hi": "अचानक, बहुत तेज़"}, "signals": ["onset-sudden", "severe-pain"]},
                    {"id": "ab-onset-hours", "label": {"en": "A few hours ago", "hi": "कुछ घंटे पहले"}, "signals": ["onset-recent"]},
                    {"id": "ab-onset-days", "label": {"en": "A few days ago", "hi": "कुछ दिन पहले"}},
                    {"id": "ab-onset-weeks", "label": {"en": "Weeks or longer", "hi": "हफ्तों से"}},
                ],
            },
            {
                "id": "ab-site",
                "kind": "single",
                "prompt": {"en": "Where is the pain worst?", "hi": "दर्द सबसे अधिक कहाँ है?"},
                "options": [
                    {"id": "ab-site-upper", "label": {"en": "Upper abdomen", "hi": "ऊपरी पेट"}},
                    {"id": "ab-site-lower-right", "label": {"en": "Lower right", "hi": "नीचे दाईं ओर"}},
                    {"id": "ab-site-lower-left", "label": {"en": "Lower left", "hi": "नीचे बाईं ओर"}},
                    {"id": "ab-site-all-over", "label": {"en": "All over", "hi": "पूरे पेट में"}},
                ],
            },
            {
                "id": "ab-bleeding",
                "kind": "single",
                "prompt": {"en": "Any vomiting of blood or black stools?", "hi": "क्या खून की उल्टी या काला मल है?"},
                "options": [
                    {"id": "ab-bleed-vomit", "label": {"en": "Yes, blood in vomit", "hi": "हाँ, उल्टी में खून"}, "signals": ["vomiting-blood"]},
                    {"id": "ab-bleed-stool", "label": {"en": "Yes, black stools", "hi": "हाँ, काला मल"}, "signals": ["black-stools"]},
                    {"id": "ab-bleed-none", "label": {"en": "No", "hi": "नहीं"}},
                ],
            },
        ],
    },
    "other": {
        "id": "other",
        "label": {"en": "Something else", "hi": "कुछ और"},
        "echo": {"en": "I have another problem", "hi": "मुझे कोई और समस्या है"},
        "followUps": [
            {
                "id": "ot-describe",
                "kind": "single",
                "prompt": {"en": "Which of these is closest to your problem?", "hi": "इनमें से कौन आपकी समस्या के सबसे करीब है?"},
                "options": [
                    {"id": "ot-injury", "label": {"en": "Injury or wound", "hi": "चोट या घाव"}},
                    {"id": "ot-skin", "label": {"en": "Skin problem", "hi": "त्वचा की समस्या"}},
                    {"id": "ot-followup", "label": {"en": "Routine follow-up", "hi": "नियमित फॉलो-अप"}},
                    {"id": "ot-other", "label": {"en": "Something not listed", "hi": "सूची में नहीं"}},
                ],
            },
            {
                "id": "ot-duration",
                "kind": "single",
                "prompt": {"en": "How long has this been going on?", "hi": "यह कब से चल रहा है?"},
                "options": [
                    {"id": "ot-dur-today", "label": {"en": "Started today", "hi": "आज शुरू हुआ"}},
                    {"id": "ot-dur-week", "label": {"en": "About a week", "hi": "लगभग एक सप्ताह"}},
                    {"id": "ot-dur-month", "label": {"en": "About a month", "hi": "लगभग एक महीना"}},
                    {"id": "ot-dur-longer", "label": {"en": "Longer than a month", "hi": "एक महीने से अधिक"}},
                ],
            },
            {
                "id": "ot-severity",
                "kind": "single",
                "prompt": {"en": "How much does it affect you?", "hi": "यह आपको कितना प्रभावित करता है?"},
                "options": [
                    {"id": "ot-sev-mild", "label": {"en": "A little", "hi": "थोड़ा"}},
                    {"id": "ot-sev-moderate", "label": {"en": "Noticeably", "hi": "काफी"}},
                    {"id": "ot-sev-severe", "label": {"en": "Severely", "hi": "बहुत अधिक"}, "signals": ["severe-pain"]},
                ],
            },
        ],
    },
}

COMPLAINT_IDS = list(COMPLAINTS.keys())


def is_complaint_id(value: str) -> bool:
    return value in COMPLAINTS
