"""Patient medical timeline (doctor dashboard)."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.timeline import TimelineEvent
from app.schemas.timeline import TimelineEventOut
from app.services import patient_service

router = APIRouter(tags=["timeline"])


@router.get("/patients/{patient_id}/timeline", response_model=list[TimelineEventOut])
def get_timeline(patient_id: str, db: Session = Depends(get_db)):
    if not patient_service.get_patient(db, patient_id):
        raise HTTPException(status_code=404, detail={"code": "patient_not_found", "message": f"Patient {patient_id} not found"})

    events = db.execute(
        select(TimelineEvent).where(TimelineEvent.patient_id == patient_id).order_by(TimelineEvent.occurred_at.desc())
    ).scalars().all()

    return [
        TimelineEventOut(
            id=e.id,
            patientId=e.patient_id,
            date=e.display_date,
            sortKey=e.occurred_at.isoformat(),
            type=e.type,
            icon=e.icon,
            color=e.color,
            title=e.title,
            summary=e.summary,
            detail=e.detail,
            abnormal=e.abnormal,
            source=e.source,
        )
        for e in events
    ]
