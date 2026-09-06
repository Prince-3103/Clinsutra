"""
ClinicalAlert — physician-facing alerts (abnormal labs, interactions, cautions).

Store only. No decision engine, no diagnosis, no dosing — per the project's
medical-safety constraints, this table is where the frontend's existing demo
red-flag/alert logic parks its output for the doctor to review.
"""

from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Enum, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.common import generate_id, utcnow

if TYPE_CHECKING:
    from app.models.patient import Patient

CATEGORIES = ("lab", "interaction", "caution", "allergy")
SEVERITIES = ("high", "moderate", "low")
LAB_STATUSES = ("HIGH", "LOW")


class ClinicalAlert(Base):
    __tablename__ = "clinical_alerts"

    id: Mapped[str] = mapped_column(String(40), primary_key=True, default=lambda: generate_id("alert"))
    patient_id: Mapped[str] = mapped_column(String(20), ForeignKey("patients.id", ondelete="CASCADE"), nullable=False)

    category: Mapped[str] = mapped_column(Enum(*CATEGORIES, name="alert_category"), nullable=False)
    severity: Mapped[str] = mapped_column(Enum(*SEVERITIES, name="alert_severity"), nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    value: Mapped[str | None] = mapped_column(String(100), nullable=True)
    reference_range: Mapped[str | None] = mapped_column(String(100), nullable=True)
    status: Mapped[str | None] = mapped_column(Enum(*LAB_STATUSES, name="alert_lab_status"), nullable=True)
    display_date: Mapped[str | None] = mapped_column(String(60), nullable=True)
    # Physician-facing note only — never a diagnosis or dosing instruction.
    note: Mapped[str] = mapped_column(Text, nullable=False, default="")

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utcnow)

    patient: Mapped["Patient"] = relationship(back_populates="alerts")
