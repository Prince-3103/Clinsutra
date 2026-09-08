from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.config import Settings, get_settings
from app.core.database import get_db
from app.schemas.patient import DoctorOut, PatientOut, StatusUpdate
from app.services import patient_service

router = APIRouter(tags=["patients"])


@router.get("/patients", response_model=list[PatientOut])
def list_patients(
    filter: str = Query("all", pattern="^(all|waiting|completed)$"),
    search: str = Query(""),
    db: Session = Depends(get_db),
):
    return patient_service.get_queue(db, filter, search)


@router.get("/patients/{patient_id}", response_model=PatientOut)
def get_patient(patient_id: str, db: Session = Depends(get_db)):
    patient = patient_service.get_patient(db, patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient


@router.patch("/patients/{patient_id}/status", response_model=PatientOut)
def update_patient_status(patient_id: str, body: StatusUpdate, db: Session = Depends(get_db)):
    if body.status not in ("Waiting", "In Consultation", "Completed"):
        raise HTTPException(status_code=422, detail="Invalid status")
    patient = patient_service.update_status(db, patient_id, body.status, body.resolve_red_flag)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient


@router.get("/doctors/me", response_model=DoctorOut)
def get_current_doctor(db: Session = Depends(get_db), settings: Settings = Depends(get_settings)):
    return patient_service.get_current_doctor(db, settings)
