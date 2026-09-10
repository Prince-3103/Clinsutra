from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.auth import require_doctor
from app.core.database import get_db
from app.models import Doctor
from app.schemas.clinical import (
    AdaptiveQuestionOut,
    AdaptiveQuestionRequest,
    ClinicalAlertOut,
    ClinicalHistoryOut,
    ClinicalHistoryPatch,
    ClinicalSummaryOut,
    TimelineEventOut,
    VitalObservationOut,
)
from app.services import ai_service, clinical_service

router = APIRouter(tags=["clinical"])


# These expose or modify a specific patient's clinical record -> doctor-only.
# (`/ai/adaptive-question` below is kiosk-facing and stays open.)
@router.get("/patients/{patient_id}/history", response_model=ClinicalHistoryOut)
def get_history(
    patient_id: str,
    db: Session = Depends(get_db),
    _doctor: Doctor = Depends(require_doctor),
):
    history = clinical_service.get_history(db, patient_id)
    if not history:
        raise HTTPException(status_code=404, detail="No clinical history for this patient")
    return history


@router.patch("/patients/{patient_id}/history", response_model=ClinicalHistoryOut)
def save_history(
    patient_id: str,
    patch: ClinicalHistoryPatch,
    db: Session = Depends(get_db),
    _doctor: Doctor = Depends(require_doctor),
):
    return clinical_service.save_history(db, patient_id, patch)


@router.get("/patients/{patient_id}/timeline", response_model=list[TimelineEventOut])
def get_timeline(
    patient_id: str,
    db: Session = Depends(get_db),
    _doctor: Doctor = Depends(require_doctor),
):
    return clinical_service.get_timeline(db, patient_id)


@router.get("/patients/{patient_id}/alerts", response_model=list[ClinicalAlertOut])
def get_alerts(
    patient_id: str,
    db: Session = Depends(get_db),
    _doctor: Doctor = Depends(require_doctor),
):
    return clinical_service.get_alerts(db, patient_id)


@router.get("/patients/{patient_id}/vitals", response_model=list[VitalObservationOut])
def get_vitals(
    patient_id: str,
    db: Session = Depends(get_db),
    _doctor: Doctor = Depends(require_doctor),
):
    return clinical_service.get_vitals(db, patient_id)


@router.post("/ai/adaptive-question", response_model=AdaptiveQuestionOut)
def adaptive_question(body: AdaptiveQuestionRequest):
    """Next adaptive follow-up question for the kiosk interview (Gemini).

    Never used to diagnose or triage — see app/services/ai_service.py. Never
    raises: on any Gemini failure it returns `source: "fallback"` with
    `question: null`, and the kiosk falls back to the predefined bank.
    """
    return ai_service.generate_adaptive_question(
        complaint=body.complaint,
        language=body.language,
        history=[turn.model_dump() for turn in body.history],
    )


@router.post("/patients/{patient_id}/ai-summary", response_model=ClinicalSummaryOut)
def ai_summary(
    patient_id: str,
    db: Session = Depends(get_db),
    _doctor: Doctor = Depends(require_doctor),
):
    """Generates a draft AI-assisted clinical summary from what's already on
    file (Gemini). Read-only — nothing is persisted until the doctor Saves
    or Confirms & Saves through `PATCH /patients/{id}/history`."""
    result = clinical_service.generate_ai_summary(db, patient_id)
    if result is None:
        raise HTTPException(status_code=404, detail="Patient not found")
    return result
