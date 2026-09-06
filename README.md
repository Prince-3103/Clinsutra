# Clinsutra — AI-Powered Patient Case Taking

React + TypeScript + Vite frontend for the Smart India Hackathon problem
statement: a bilingual patient kiosk that takes a clinical history, and a
clinician dashboard that reviews it.

The UI is the approved Clinsutra design, refactored out of the Figma Make
export into a maintainable component tree. No screen was redesigned.

## Running it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # typecheck + production build into dist/
npm run preview    # serve the production build
npm run typecheck  # tsc --noEmit
npm run lint       # eslint
```

## Routes

| Route | Screen |
| --- | --- |
| `/kiosk` | Welcome + language selection |
| `/kiosk/identify` | Patient identification (ABHA / scan / new) |
| `/kiosk/interview` | Chief complaint |
| `/kiosk/follow-up` | Adaptive follow-up questions |
| `/kiosk/red-flag` | Triage flag (only when the demo rules fire) |
| `/kiosk/documents` | Medical document upload |
| `/kiosk/processing` | OCR / extraction pipeline |
| `/kiosk/review` | Patient confirms the drafted history |
| `/kiosk/complete` | Token screen |
| `/doctor/queue` | Patient queue |
| `/doctor/summary` | Clinical summary (editable) |
| `/doctor/timeline` | Medical timeline |
| `/doctor/alerts` | Alerts and abnormal values |

The floating demo switcher between the two apps renders only in `npm run dev`.

## Structure

```
src/
├── components/
│   ├── common/    Button, Card, Badge, ProgressBar, AudioButton,
│   │              LanguageSelector, Modal, Disclaimer, ErrorBoundary…
│   ├── patient/   MicButton, VoiceInput, QuestionCard, DocumentCard,
│   │              DocumentTypeCard, PipelineIndicator, ReviewSection
│   └── doctor/    DoctorSidebar, PatientRow, EditableSection,
│                  TimelineItem, AlertCard, VitalsGrid
├── pages/
│   ├── patient/   one file per kiosk screen
│   └── doctor/    one file per dashboard screen
├── layouts/       KioskLayout, DoctorLayout
├── hooks/         KioskSessionProvider, useKioskSession, useKioskFlow,
│                  useTranslation, useSpeechRecognition, useDocumentUpload
├── services/      apiClient, patientService, clinicalService,
│                  documentService, voiceService
├── types/         Patient, ClinicalHistory, Question, Answer, Document,
│                  TimelineEvent, ClinicalAlert, …
├── data/          mock patients, histories, timeline, alerts,
│                  adaptive question bank, red-flag rules, translations
└── utils/         redFlags, summary, format, cn

backend/           FastAPI + SQLAlchemy 2.x + MySQL — see backend/README.md
```

## Connecting the FastAPI backend

Every screen already talks to `src/services/*`, never to the mock data
directly. A backend implementing this exact contract lives in `backend/`
(FastAPI + SQLAlchemy 2.x + MySQL — see `backend/README.md` for setup). To
switch over:

1. Set up and run the backend: `cd backend && pip install -r requirements.txt`,
   point `DATABASE_URL` in `.env` at your MySQL instance, `alembic upgrade head`,
   then `uvicorn app.main:app --reload`.
2. Copy `.env.example` to `.env.local`, set `VITE_API_BASE_URL` to the FastAPI
   host (`http://localhost:8000/api` by default) and `VITE_USE_MOCK_API=false`.
3. For voice, add a `SpeechEngine` implementation in `voiceService.ts` that
   posts audio to the backend. Nothing in the UI changes.

No API keys belong in this repository. Only `VITE_`-prefixed variables reach
the browser bundle, and none of them may carry a credential.

## Medical safety

- The red-flag rules in `src/data/redFlagRules.ts` are **demo triage rules**.
  They order the queue; they do not diagnose.
- No screen suggests a diagnosis, a medication or a dose.
- Every screen showing an AI-derived result also shows the non-diagnosis
  notice, and the doctor's summary is labelled as requiring physician
  verification until a clinician confirms it.
- All patient data in `src/data/` is synthetic. Kiosk answers are held in
  memory for the duration of one session and are never written to
  `localStorage`, `sessionStorage` or any other persistent browser store.
