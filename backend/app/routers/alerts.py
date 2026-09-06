"""Physician-facing clinical alerts (abnormal labs, cautions, interactions)."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.alert import ClinicalAlert
from app.schemas.alert import ClinicalAlertOut
from app.services import patient_service

router = APIRouter(tags=["alerts"])


@router.get("/patients/{patient_id}/alerts", response_model=list[ClinicalAlertOut])
def get_alerts(patient_id: str, db: Session = Depends(get_db)):
    if not patient_service.get_patient(db, patient_id):
        raise HTTPException(status_code=404, detail={"code": "patient_not_found", "message": f"Patient {patient_id} not found"})

    alerts = db.execute(
        select(ClinicalAlert).where(ClinicalAlert.patient_id == patient_id).order_by(ClinicalAlert.created_at.desc())
    ).scalars().all()

    return [
        ClinicalAlertOut(
            id=a.id,
            patientId=a.patient_id,
            category=a.category,
            severity=a.severity,
            title=a.title,
            value=a.value,
            referenceRange=a.reference_range,
            status=a.status,
            date=a.display_date,
            note=a.note,
        )
        for a in alerts
    ]
