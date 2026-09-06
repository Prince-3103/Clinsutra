# Clinsutra API

FastAPI backend for the Clinsutra patient kiosk and doctor dashboard, backed
by MySQL via SQLAlchemy 2.x. It implements exactly the endpoints
`src/services/*` already call — no other contract was invented.

Demo triage rules only. Nothing here diagnoses, recommends a medication, or
suggests a dose.

## Stack

React + TypeScript (existing frontend) → FastAPI + Python → MySQL, via
SQLAlchemy 2.x + PyMySQL. No OCR, no AI/LLM calls, no auth/RBAC, no FHIR/ABDM
— all explicitly out of scope for this phase.

## Setup

```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate   # optional but recommended
pip install -r requirements.txt

cp .env.example .env
# edit .env: point DATABASE_URL at your own MySQL (Workbench-managed or
# otherwise) — any MySQL 5.7+/8.x server works, e.g.:
#   DATABASE_URL=mysql+pymysql://root:yourpassword@localhost:3306/clinsutra?charset=utf8mb4

# Create the two databases in MySQL Workbench (or the CLI) first:
#   CREATE DATABASE clinsutra CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
#   CREATE DATABASE clinsutra_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

alembic upgrade head        # creates every table — never create them by hand
uvicorn app.main:app --reload --port 8000
```

Swagger UI: http://localhost:8000/docs · health check: http://localhost:8000/health

## Connecting the existing frontend

In the frontend's `.env.local`:

```
VITE_API_BASE_URL=http://localhost:8000/api
VITE_USE_MOCK_API=false
```

Nothing else changes — every screen already calls `src/services/*`, never
the mock data directly.

## Structure

```
backend/
├── app/
│   ├── main.py                FastAPI app, CORS, router mounting
│   ├── core/
│   │   ├── config.py          Settings (env-driven — see .env.example)
│   │   └── database.py        SQLAlchemy engine/session, declarative Base
│   ├── models/                SQLAlchemy ORM models (one file per entity group)
│   ├── schemas/                Pydantic v2 request/response schemas (camelCase on the wire)
│   ├── routers/                One file per resource; thin — delegate to services/
│   ├── services/                Business logic; the only place that touches models/
│   └── data/                    Server-side mirror of the frontend's demo question
│                                 bank + red-flag rules (src/data/questions.ts,
│                                 src/data/redFlagRules.ts) — same content, ported
│                                 so real-mode behaves identically to mock mode.
├── alembic/                     Migrations. `alembic/env.py` reads DATABASE_URL
│                                 from Settings — there is no second copy of the
│                                 connection string in alembic.ini.
├── tests/                       pytest + FastAPI TestClient, run against
│                                 TEST_DATABASE_URL (a second, disposable database)
├── uploads/                     Where uploaded documents land on disk (gitignored)
├── requirements.txt
├── .env.example
└── README.md
```

## Database

12 tables, created by the single Alembic migration in `alembic/versions/`:

| Table | Purpose | Key relationships |
| --- | --- | --- |
| `patients` | Queue + kiosk identification, one row per OPD token | — |
| `doctors` | Single seeded clinician (no auth yet) | — |
| `clinical_histories` | The AI-drafted / clinician-edited history | 1:1 → `patients` |
| `medications` | Structured medication list | → `clinical_histories` |
| `allergies` | Structured allergy list | → `clinical_histories` |
| `interviews` | One kiosk interview session | → `patients` |
| `interview_answers` | Raw question/option trail | → `interviews` |
| `documents` | Uploaded file metadata + mocked extraction result | → `patients` (nullable until re-parented) |
| `document_extraction_fields` | Label/value pairs from `DocumentExtraction.fields` | → `documents` |
| `timeline_events` | Medical timeline entries | → `patients` |
| `clinical_alerts` | Lab/interaction/caution/allergy alerts | → `patients` |
| `vital_observations` | Vitals panel | → `patients` |

`documents.patient_id` is nullable and `documents.document_session_id` is
indexed because the kiosk uploads documents **before** a patient exists.
`POST /kiosk/submissions` re-parents that session's documents onto the new
patient in the same transaction that creates it.

## Endpoints

All mounted under `/api`, matching the frontend's default
`VITE_API_BASE_URL=http://localhost:8000/api`. These are the exact paths
`src/services/*` calls today — not the generic placeholder names from an
earlier draft of this spec.

| Method | Path | Frontend caller |
| --- | --- | --- |
| GET | `/patients` | `patientService.getQueue` |
| GET | `/patients/{id}` | `patientService.getPatient` |
| PATCH | `/patients/{id}/status` | `patientService.updateStatus` |
| GET | `/doctors/me` | `patientService.getCurrentDoctor` |
| POST | `/kiosk/submissions` | `patientService.submitKioskSession` |
| GET | `/interview/opening` | `clinicalService.getOpeningQuestion` |
| POST | `/interview/follow-ups` | `clinicalService.getFollowUpQuestions` |
| POST | `/triage/assess` | `clinicalService.assessRedFlags` |
| GET | `/patients/{id}/history` | `clinicalService.getHistory` |
| PATCH | `/patients/{id}/history` | `clinicalService.saveHistory` / `confirmHistory` |
| GET | `/patients/{id}/timeline` | `clinicalService.getTimeline` |
| GET | `/patients/{id}/alerts` | `clinicalService.getAlerts` |
| GET | `/patients/{id}/vitals` | `clinicalService.getVitals` |
| POST | `/documents` (multipart) | `documentService.process` |
| DELETE | `/documents/{id}` | `documentService.remove` |

## Testing

```bash
pytest -v
```

Runs against `TEST_DATABASE_URL` (a separate database — never the one the
app itself points at), creating and dropping tables per test via
`Base.metadata`. Covers: patient create/get, kiosk submission → doctor queue
handoff, document upload + re-parenting onto the new patient, clinical
history persistence and upsert, triage rule evaluation, timeline/alerts, and
`/docs` availability.

## Security notes

- No credential is hardcoded anywhere — `DATABASE_URL` and every other
  setting come from `.env` (see `app/core/config.py`).
- CORS is restricted to `FRONTEND_URL` (comma-separated for multiple
  origins) — never a wildcard.
- Uploaded files are validated against the same MIME allowlist and 10 MB
  limit as the frontend (`src/data/documentTypes.ts`).
- No OCR, no call to an external AI service, no medical decision engine —
  triage is the same static demo rule set the frontend already ships.
