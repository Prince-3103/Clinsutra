"""Pydantic schemas for ClinicalAlert — mirrors `types/clinical.ts::ClinicalAlert`."""

from typing import Literal

from pydantic import BaseModel, ConfigDict

AlertCategory = Literal["lab", "interaction", "caution", "allergy"]
AlertSeverity = Literal["high", "moderate", "low"]
LabStatus = Literal["HIGH", "LOW"]


class ClinicalAlertOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    patientId: str
    category: AlertCategory
    severity: AlertSeverity
    title: str
    value: str | None = None
    referenceRange: str | None = None
    status: LabStatus | None = None
    date: str | None = None  # populated from `display_date` in the router
    note: str
