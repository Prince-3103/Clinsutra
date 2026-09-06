from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.clinical import (
    ClinicalAlertOut,
    ClinicalHistoryOut,
    ClinicalHistoryPatch,
    TimelineEventOut,
    VitalObservationOut,
)
from app.services import clinical_service

router = APIRouter(tags=["clinical"])


@router.get("/patients/{patient_id}/history", response_model=ClinicalHistoryOut)
def get_history(patient_id: str, db: Session = Depends(get_db)):
    history = clinical_service.get_history(db, patient_id)
    if not history:
        raise HTTPException(status_code=404, detail="No clinical history for this patient")
    return history


@router.patch("/patients/{patient_id}/history", response_model=ClinicalHistoryOut)
def save_history(patient_id: str, patch: ClinicalHistoryPatch, db: Session = Depends(get_db)):
    return clinical_service.save_history(db, patient_id, patch)


@router.get("/patients/{patient_id}/timeline", response_model=list[TimelineEventOut])
def get_timeline(patient_id: str, db: Session = Depends(get_db)):
    return clinical_service.get_timeline(db, patient_id)


@router.get("/patients/{patient_id}/alerts", response_model=list[ClinicalAlertOut])
def get_alerts(patient_id: str, db: Session = Depends(get_db)):
    return clinical_service.get_alerts(db, patient_id)


@router.get("/patients/{patient_id}/vitals", response_model=list[VitalObservationOut])
def get_vitals(patient_id: str, db: Session = Depends(get_db)):
    return clinical_service.get_vitals(db, patient_id)
