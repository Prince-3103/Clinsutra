from __future__ import annotations

import datetime as dt

from app.schemas.clinical import AnswerOut, ClinicalHistoryPatch
from app.schemas.common import CamelModel


class PatientIdentification(CamelModel):
    mode: str
    abha_id: str = ""
    hospital_reg_number: str = ""
    full_name: str
    age: str
    gender: str
    phone: str = ""


class PatientOut(CamelModel):
    id: str
    name: str
    age: int
    gender: str
    token: str
    abha: str
    priority: str
    status: str
    complaint: str
    wait_time: str
    red_flag: bool
    flags: list[str]
    # True once a doctor has explicitly marked the patient reviewed. The
    # underlying triage result (`priority`, `red_flag`, `flags`) is preserved
    # for the audit trail regardless of this flag.
    red_flag_resolved: bool = False
    submitted_at: dt.datetime


class DoctorOut(CamelModel):
    id: str
    name: str
    specialty: str
    room: str
    initials: str


class KioskSubmission(CamelModel):
    """
    Matches the frontend's (extended) `KioskSubmission`. `clinical_history` and
    `answers` are additive to the original shape — see the frontend wiring
    change in `KioskSessionProvider`/`ReviewPage` — so a submission with
    neither still works exactly as it did before (just a queue row, no
    structured history).
    """

    identification: PatientIdentification
    complaint: str
    priority: str
    red_flag: bool
    flags: list[str] = []

    # Additive fields for real persistence (Phase 7).
    complaint_id: str | None = None
    clinical_history: ClinicalHistoryPatch | None = None
    answers: list[AnswerOut] = []
    document_session_id: str | None = None


class SubmissionReceipt(CamelModel):
    token: str
    patient_id: str
    submitted_at: dt.datetime


class StatusUpdate(CamelModel):
    status: str
    # Set by the "Mark as Reviewed" action. Never set automatically by AI —
    # only a doctor's explicit click reaches this endpoint with it True.
    resolve_red_flag: bool = False
