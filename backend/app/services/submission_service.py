"""
The patient → doctor handoff (Phase 8): `POST /api/kiosk/submissions`.

    Patient completes kiosk
            |
    POST /api/kiosk/submissions
            |
    create/update patient -> save interview -> save clinical history shell
            |
    save red-flag info -> link uploaded documents -> generate OPD token
            |
    Doctor queue picks it up via GET /api/patients

Everything happens in one DB transaction so the doctor queue never sees a
half-written submission.
"""

from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models.alert import ClinicalAlert
from app.models.clinical import ClinicalHistory
from app.models.document import Document
from app.models.interview import Interview, InterviewAnswer
from app.models.patient import Patient
from app.schemas.kiosk import KioskSubmissionIn, SubmissionReceiptOut
from app.services.patient_service import generate_token

_GENDER_MAP = {"Female": "Female", "Other": "Other"}


def _parse_age(raw: str) -> int:
    try:
        value = int(raw)
        return value if 0 <= value <= 130 else 0
    except (TypeError, ValueError):
        return 0


def submit_kiosk_session(db: Session, payload: KioskSubmissionIn) -> SubmissionReceiptOut:
    token = generate_token(db)
    now = datetime.now(timezone.utc)
    ident = payload.identification

    patient = Patient(
        id=token,
        token=token,
        name=ident.fullName.strip() or "Kiosk Patient",
        age=_parse_age(ident.age),
        gender=_GENDER_MAP.get(ident.gender, "Male"),
        abha=ident.abhaId or "—",
        hospital_reg_number=ident.hospitalRegNumber or None,
        phone=ident.phone or None,
        priority=payload.priority,
        status="Waiting",
        complaint=payload.complaint,
        complaint_id=payload.complaintId,
        red_flag=payload.redFlag,
        flags=payload.flags,
        submitted_at=now,
    )
    db.add(patient)

    # Clinical history shell — chief complaint pre-filled from the kiosk;
    # everything else stays blank until AI drafting or clinician entry (later
    # phases), matching the project's "no AI generation yet" instruction.
    db.add(ClinicalHistory(patient_id=patient.id, chief_complaint=payload.complaint))

    if payload.answers:
        interview = Interview(patient_id=patient.id, complaint_id=payload.complaintId, completed_at=now)
        db.add(interview)
        db.flush()  # assigns interview.id
        for answer in payload.answers:
            db.add(
                InterviewAnswer(
                    interview_id=interview.id,
                    question_id=answer.questionId,
                    option_ids=answer.optionIds,
                    transcript=answer.transcript,
                    answered_at=answer.answeredAt or now,
                )
            )

    if payload.documentIds:
        db.query(Document).filter(Document.id.in_(payload.documentIds)).update(
            {Document.patient_id: patient.id}, synchronize_session=False
        )

    if payload.redFlag and payload.flags:
        db.add(
            ClinicalAlert(
                patient_id=patient.id,
                category="caution",
                severity="high",
                title="Kiosk red-flag triage",
                note="; ".join(payload.flags),
            )
        )

    db.commit()
    db.refresh(patient)

    return SubmissionReceiptOut(token=token, patientId=patient.id, submittedAt=now.isoformat())
