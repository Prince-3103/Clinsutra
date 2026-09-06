"""
Kiosk submission — the patient → doctor handoff (`POST /api/kiosk/submissions`).

The frontend's current `KioskSubmission` type (`services/patientService.ts`) is
just `{identification, complaint, priority, redFlag, flags}`. This schema
extends it with `complaintId`, `answers`, and `documentIds` — additive,
optional fields — so the backend can build the interview record and link
already-uploaded documents in the same call. See the audit note in the final
report: this needs a matching (small, additive) change in
`patientService.submitKioskSession`.
"""

from pydantic import BaseModel

from app.schemas.clinical import AnswerIn
from app.schemas.patient import PatientIdentification, Priority


class KioskSubmissionIn(BaseModel):
    identification: PatientIdentification
    complaint: str
    priority: Priority
    redFlag: bool = False
    flags: list[str] = []

    # Additive fields, not in the original mock payload — see module docstring.
    complaintId: str | None = None
    answers: list[AnswerIn] = []
    documentIds: list[str] = []


class SubmissionReceiptOut(BaseModel):
    token: str
    patientId: str
    submittedAt: str
