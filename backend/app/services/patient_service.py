from __future__ import annotations

import datetime as dt
import re
import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import Settings
from app.models import Allergy, ClinicalHistory, Document, Doctor, Interview, InterviewAnswer, Medication, Patient
from app.schemas.patient import KioskSubmission

TOKEN_PATTERN = re.compile(r"OPD-(\d+)")
TOKEN_START = 850


def _next_token(db: Session) -> str:
    tokens = db.scalars(select(Patient.token)).all()
    highest = TOKEN_START
    for token in tokens:
        match = TOKEN_PATTERN.match(token)
        if match:
            highest = max(highest, int(match.group(1)))
    return f"OPD-{highest + 1:04d}"


def _wait_time(patient: Patient) -> str:
    """Derived, not stored — mirrors the mock's display-only `waitTime`."""
    if patient.status == "Completed":
        return "—"
    delta = dt.datetime.now(dt.timezone.utc) - patient.submitted_at.replace(tzinfo=dt.timezone.utc)
    minutes = max(0, int(delta.total_seconds() // 60))
    return "just now" if minutes < 1 else f"{minutes} min"


def to_patient_out(patient: Patient) -> dict:
    return {
        "id": patient.id,
        "name": patient.name,
        "age": patient.age,
        "gender": patient.gender,
        "token": patient.token,
        "abha": patient.abha,
        "priority": patient.priority,
        "status": patient.status,
        "complaint": patient.complaint,
        "waitTime": _wait_time(patient),
        "redFlag": patient.red_flag,
        "flags": patient.flags or [],
        "redFlagResolved": patient.red_flag_resolved,
        "submittedAt": patient.submitted_at,
    }


def get_queue(db: Session, filter_: str = "all", search: str = "") -> list[dict]:
    stmt = select(Patient)
    if filter_ == "waiting":
        stmt = stmt.where(Patient.status == "Waiting")
    elif filter_ == "completed":
        stmt = stmt.where(Patient.status == "Completed")

    patients = db.scalars(stmt.order_by(Patient.submitted_at.desc())).all()

    term = search.strip().lower()
    if term:
        patients = [
            p
            for p in patients
            if term in p.name.lower() or term in p.token.lower() or term in p.complaint.lower() or term in p.abha.lower()
        ]
    return [to_patient_out(p) for p in patients]


def get_patient(db: Session, patient_id: str) -> dict | None:
    patient = db.get(Patient, patient_id)
    return to_patient_out(patient) if patient else None


def get_current_doctor(db: Session, settings: Settings) -> dict:
    doctor = db.get(Doctor, settings.doctor_id)
    if not doctor:
        doctor = Doctor(
            id=settings.doctor_id,
            name=settings.doctor_name,
            specialty=settings.doctor_specialty,
            room=settings.doctor_room,
            initials=settings.doctor_initials,
        )
        db.add(doctor)
        db.commit()
        db.refresh(doctor)
    return {
        "id": doctor.id,
        "name": doctor.name,
        "specialty": doctor.specialty,
        "room": doctor.room,
        "initials": doctor.initials,
    }


def _parse_age(raw: str) -> int:
    try:
        value = int(raw)
        return value if value >= 0 else 0
    except (TypeError, ValueError):
        return 0


def _parse_gender(raw: str) -> str:
    return raw if raw in ("Male", "Female", "Other") else "Male"


def submit_kiosk_session(db: Session, submission: KioskSubmission) -> dict:
    token = _next_token(db)
    submitted_at = dt.datetime.now(dt.timezone.utc)
    identification = submission.identification

    patient = Patient(
        id=token,
        token=token,
        name=identification.full_name.strip() or "Kiosk Patient",
        age=_parse_age(identification.age),
        gender=_parse_gender(identification.gender),
        abha=identification.abha_id or "—",
        identification_mode=identification.mode if identification.mode in ("abha", "scan", "new") else "new",
        hospital_reg_number=identification.hospital_reg_number or None,
        phone=identification.phone or None,
        priority=submission.priority if submission.priority in ("P1", "P2", "P3") else "P3",
        status="Waiting",
        complaint=submission.complaint,
        red_flag=submission.red_flag,
        flags=submission.flags,
        submitted_at=submitted_at,
    )
    db.add(patient)
    db.flush()  # patient.id available for FKs below

    if submission.clinical_history is not None:
        patch = submission.clinical_history
        history = ClinicalHistory(
            patient_id=patient.id,
            chief_complaint=patch.chief_complaint or submission.complaint,
            history_of_present_illness=patch.history_of_present_illness or "",
            past_medical_history=patch.past_medical_history or "",
            past_surgical_history=patch.past_surgical_history or "",
            family_history=patch.family_history or "",
            personal_history=patch.personal_history or "",
            review_of_systems=patch.review_of_systems or "",
            investigations_summary=patch.investigations_summary or "",
            ai_generated=patch.ai_generated if patch.ai_generated is not None else True,
            confirmed_by_clinician=patch.confirmed_by_clinician or False,
        )
        db.add(history)
        for med in patch.medications or []:
            db.add(
                Medication(
                    id=med.id or f"med-{uuid.uuid4().hex[:8]}",
                    patient_id=patient.id,
                    name=med.name,
                    dose=med.dose,
                    frequency=med.frequency,
                )
            )
        for allergy in patch.allergies or []:
            db.add(
                Allergy(
                    id=allergy.id or f"all-{uuid.uuid4().hex[:8]}",
                    patient_id=patient.id,
                    substance=allergy.substance,
                    reaction=allergy.reaction,
                    severity=allergy.severity,
                )
            )

    if submission.answers:
        interview = Interview(
            id=f"iv-{uuid.uuid4().hex[:12]}",
            patient_id=patient.id,
            complaint_id=submission.complaint_id,
        )
        db.add(interview)
        db.flush()
        for answer in submission.answers:
            db.add(
                InterviewAnswer(
                    interview_id=interview.id,
                    question_id=answer.question_id,
                    option_ids=answer.option_ids,
                    transcript=answer.transcript,
                    answered_at=answer.answered_at,
                )
            )

    if submission.document_session_id:
        db.query(Document).filter(
            Document.document_session_id == submission.document_session_id,
            Document.patient_id.is_(None),
        ).update({"patient_id": patient.id})

    db.commit()
    db.refresh(patient)

    return {"token": token, "patientId": patient.id, "submittedAt": submitted_at}


def update_status(db: Session, patient_id: str, status: str, resolve_red_flag: bool = False) -> dict | None:
    patient = db.get(Patient, patient_id)
    if not patient:
        return None
    patient.status = status
    # Doctor-initiated only (see routers/patients.py + the "Mark as Reviewed"
    # flow). This never touches `priority`, `red_flag` or `flags` — the
    # original triage result stays intact for the audit trail; it only stops
    # the queue from still treating the patient as an active red-flag case.
    if resolve_red_flag:
        patient.red_flag_resolved = True
    db.commit()
    db.refresh(patient)
    return to_patient_out(patient)
