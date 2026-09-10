from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session

from app.core.auth import get_current_user, require_doctor
from app.core.database import get_db
from app.models import Doctor
from app.schemas.patient import DoctorOut, PatientOut, StatusUpdate
from app.services import patient_service

# Every endpoint here is doctor-only: a valid doctor JWT is required for all of
# them (RBAC enforced at the router level — see app/core/auth.require_doctor).
router = APIRouter(tags=["patients"], dependencies=[Depends(require_doctor)])


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


@router.delete("/patients/{patient_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_patient(patient_id: str, db: Session = Depends(get_db)):
    """Permanently delete a completed/reviewed patient and all dependent records.

    Doctor-role only (enforced by the router-level require_doctor dependency:
    no/invalid/expired token -> 401, non-doctor -> 403). Refuses to delete an
    active patient (Waiting / In Consultation) with 409 — active records are
    never removable. Deletion is transactional and cascades to every child row
    (see patient_service.delete_patient)."""
    result = patient_service.delete_patient(db, patient_id)
    if result == "not_found":
        raise HTTPException(status_code=404, detail="Patient not found")
    if result == "not_deletable":
        raise HTTPException(
            status_code=409,
            detail="Only a completed/reviewed patient can be deleted.",
        )
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/doctors/me", response_model=DoctorOut)
def get_current_doctor(current_user: Doctor = Depends(get_current_user)):
    """The authenticated doctor's public profile (from the bearer token)."""
    return DoctorOut(
        id=current_user.id,
        name=current_user.name,
        specialty=current_user.specialty,
        room=current_user.room,
        initials=current_user.initials,
    )
