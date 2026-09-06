"""Pydantic schemas for TimelineEvent — mirrors `types/clinical.ts` timeline types."""

from typing import Literal

from pydantic import BaseModel, ConfigDict

TimelineEventType = Literal["Lab Report", "Prescription", "Hospital Visit", "Diagnosis", "Surgery"]
TimelineColor = Literal["blue", "green", "orange", "gray", "red"]


class TimelineEventOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    patientId: str
    date: str = ""  # populated from `display_date` in the router
    sortKey: str = ""  # populated from `occurred_at` (ISO) in the router
    type: TimelineEventType
    icon: str
    color: TimelineColor
    title: str
    summary: str
    detail: str
    abnormal: bool
    source: str
