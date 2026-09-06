from __future__ import annotations

import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.data import CHIEF_COMPLAINT_QUESTION, COMPLAINTS, is_complaint_id
from app.models import Allergy, ClinicalAlert, ClinicalHistory, Medication, TimelineEvent, VitalObservation
from app.schemas.clinical import ClinicalHistoryPatch


def get_opening_question() -> dict:
    return CHIEF_COMPLAINT_QUESTION


def get_follow_up_questions(complaint_id: str) -> list[dict]:
    if not is_complaint_id(complaint_id):
        return []
    return COMPLAINTS[complaint_id]["followUps"]


def _history_to_out(history: ClinicalHistory) -> dict:
    return {
        "patientId": history.patient_id,
        "chiefComplaint": history.chief_complaint,
        "historyOfPresentIllness": history.history_of_present_illness,
        "pastMedicalHistory": history.past_medical_history,
        "pastSurgicalHistory": history.past_surgical_history,
        "medications": [
            {"id": m.id, "name": m.name, "dose": m.dose, "frequency": m.frequency} for m in history.medications
        ],
        "allergies": [
            {"id": a.id, "substance": a.substance, "reaction": a.reaction, "severity": a.severity}
            for a in history.allergies
        ],
        "familyHistory": history.family_history,
        "personalHistory": history.personal_history,
        "reviewOfSystems": history.review_of_systems,
        "investigationsSummary": history.investigations_summary,
        "aiGenerated": history.ai_generated,
        "confirmedByClinician": history.confirmed_by_clinician,
        "updatedAt": history.updated_at,
    }


def get_history(db: Session, patient_id: str) -> dict | None:
    history = db.get(ClinicalHistory, patient_id)
    return _history_to_out(history) if history else None


def save_history(db: Session, patient_id: str, patch: ClinicalHistoryPatch) -> dict:
    history = db.get(ClinicalHistory, patient_id)
    if not history:
        history = ClinicalHistory(patient_id=patient_id)
        db.add(history)

    data = patch.model_dump(exclude_unset=True, exclude={"medications", "allergies"})
    for field, value in data.items():
        setattr(history, field, value)

    if patch.medications is not None:
        history.medications.clear()
        for med in patch.medications:
            history.medications.append(
                Medication(
                    id=med.id or f"med-{uuid.uuid4().hex[:8]}",
                    patient_id=patient_id,
                    name=med.name,
                    dose=med.dose,
                    frequency=med.frequency,
                )
            )

    if patch.allergies is not None:
        history.allergies.clear()
        for allergy in patch.allergies:
            history.allergies.append(
                Allergy(
                    id=allergy.id or f"all-{uuid.uuid4().hex[:8]}",
                    patient_id=patient_id,
                    substance=allergy.substance,
                    reaction=allergy.reaction,
                    severity=allergy.severity,
                )
            )

    db.commit()
    db.refresh(history)
    return _history_to_out(history)


def get_timeline(db: Session, patient_id: str) -> list[dict]:
    events = db.scalars(
        select(TimelineEvent).where(TimelineEvent.patient_id == patient_id).order_by(TimelineEvent.sort_key.desc())
    ).all()
    return [
        {
            "id": e.id,
            "patientId": e.patient_id,
            "date": e.date,
            "sortKey": e.sort_key,
            "type": e.type,
            "icon": e.icon,
            "color": e.color,
            "title": e.title,
            "summary": e.summary,
            "detail": e.detail,
            "abnormal": e.abnormal,
            "source": e.source,
        }
        for e in events
    ]


def get_alerts(db: Session, patient_id: str) -> list[dict]:
    alerts = db.scalars(select(ClinicalAlert).where(ClinicalAlert.patient_id == patient_id)).all()
    return [
        {
            "id": a.id,
            "patientId": a.patient_id,
            "category": a.category,
            "severity": a.severity,
            "title": a.title,
            "value": a.value,
            "referenceRange": a.reference_range,
            "status": a.status,
            "date": a.date,
            "note": a.note,
        }
        for a in alerts
    ]


def get_vitals(db: Session, patient_id: str) -> list[dict]:
    vitals = db.scalars(select(VitalObservation).where(VitalObservation.patient_id == patient_id)).all()
    return [{"id": v.id, "label": v.label, "value": v.value, "unit": v.unit, "normal": v.normal} for v in vitals]
