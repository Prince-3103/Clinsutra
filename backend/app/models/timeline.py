from __future__ import annotations

import datetime as dt

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class TimelineEvent(Base):
    __tablename__ = "timeline_events"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    patient_id: Mapped[str] = mapped_column(ForeignKey("patients.id"), index=True)

    date: Mapped[str] = mapped_column(String(32))
    sort_key: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True))
    type: Mapped[str] = mapped_column(
        Enum("Lab Report", "Prescription", "Hospital Visit", "Diagnosis", "Surgery", name="timeline_event_type")
    )
    icon: Mapped[str] = mapped_column(String(16))
    color: Mapped[str] = mapped_column(Enum("blue", "green", "orange", "gray", "red", name="timeline_color"))
    title: Mapped[str] = mapped_column(String(200))
    summary: Mapped[str] = mapped_column(Text)
    detail: Mapped[str] = mapped_column(Text)
    abnormal: Mapped[bool] = mapped_column(Boolean, default=False)
    source: Mapped[str] = mapped_column(String(200))

    patient: Mapped["Patient"] = relationship(back_populates="timeline_events")  # noqa: F821


class ClinicalAlert(Base):
    __tablename__ = "clinical_alerts"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    patient_id: Mapped[str] = mapped_column(ForeignKey("patients.id"), index=True)

    category: Mapped[str] = mapped_column(Enum("lab", "interaction", "caution", "allergy", name="alert_category"))
    severity: Mapped[str] = mapped_column(Enum("high", "moderate", "low", name="alert_severity"))
    title: Mapped[str] = mapped_column(String(200))
    value: Mapped[str | None] = mapped_column(String(100), nullable=True)
    reference_range: Mapped[str | None] = mapped_column(String(100), nullable=True)
    status: Mapped[str | None] = mapped_column(Enum("HIGH", "LOW", name="alert_status"), nullable=True)
    date: Mapped[str | None] = mapped_column(String(32), nullable=True)
    # Physician-facing note. Never a diagnosis or a dosing instruction.
    note: Mapped[str] = mapped_column(Text)

    patient: Mapped["Patient"] = relationship(back_populates="alerts")  # noqa: F821


class VitalObservation(Base):
    __tablename__ = "vital_observations"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    patient_id: Mapped[str] = mapped_column(ForeignKey("patients.id"), index=True)

    label: Mapped[str] = mapped_column(String(100))
    value: Mapped[str] = mapped_column(String(50))
    unit: Mapped[str] = mapped_column(String(20))
    normal: Mapped[bool] = mapped_column(Boolean, default=True)

    patient: Mapped["Patient"] = relationship(back_populates="vitals")  # noqa: F821
