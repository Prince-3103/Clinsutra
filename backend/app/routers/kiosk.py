from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.patient import KioskSubmission, SubmissionReceipt
from app.services import patient_service

router = APIRouter(tags=["kiosk"])


@router.post("/kiosk/submissions", response_model=SubmissionReceipt)
def submit_kiosk_session(submission: KioskSubmission, db: Session = Depends(get_db)):
    return patient_service.submit_kiosk_session(db, submission)
