"""
`patients` holds both the kiosk-collected identification (mode, hospital reg
number, phone — `PatientIdentification` in the frontend) and the queue-facing
fields the doctor dashboard reads (`Patient` in the frontend). They are kept
as one table because a patient row is created exactly once, at
`POST /kiosk/submissions`, from exactly one `KioskSubmission`.
"""

from __future__ import annotations

import datetime as dt

from sqlalchemy import JSON, DateTime, Enum, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Patient(Base):
    __tablename__ = "patients"

    # The OPD token doubles as the primary key — the frontend's `Patient.id`
    # and `Patient.token` are always the same value (see patientService.ts).
    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    token: Mapped[str] = mapped_column(String(32), unique=True, index=True)

    name: Mapped[str] = mapped_column(String(120))
    age: Mapped[int] = mapped_column(Integer)
    gender: Mapped[str] = mapped_column(Enum("Male", "Female", "Other", name="gender"))
    abha: Mapped[str] = mapped_column(String(64), default="—")

    # Raw identification as captured at the kiosk (PatientIdentification).
    identification_mode: Mapped[str] = mapped_column(
        Enum("abha", "scan", "new", name="identification_mode"), default="new"
    )
    hospital_reg_number: Mapped[str | None] = mapped_column(String(64), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(32), nullable=True)

    priority: Mapped[str] = mapped_column(Enum("P1", "P2", "P3", name="priority"))
    status: Mapped[str] = mapped_column(
        Enum("Waiting", "In Consultation", "Completed", name="patient_status"),
        default="Waiting",
    )

    complaint: Mapped[str] = mapped_column(Text)
    red_flag: Mapped[bool] = mapped_column(default=False)
    flags: Mapped[list[str]] = mapped_column(JSON, default=list)

    submitted_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), default=dt.datetime.utcnow)
    updated_at: Mapped[dt.datetime] = mapped_column(
        DateTime(timezone=True), default=dt.datetime.utcnow, onupdate=dt.datetime.utcnow
    )

    clinical_history: Mapped["ClinicalHistory | None"] = relationship(  # noqa: F821
        back_populates="patient", uselist=False, cascade="all, delete-orphan"
    )
    interviews: Mapped[list["Interview"]] = relationship(  # noqa: F821
        back_populates="patient", cascade="all, delete-orphan"
    )
    documents: Mapped[list["Document"]] = relationship(  # noqa: F821
        back_populates="patient", cascade="all, delete-orphan"
    )
    timeline_events: Mapped[list["TimelineEvent"]] = relationship(  # noqa: F821
        back_populates="patient", cascade="all, delete-orphan"
    )
    alerts: Mapped[list["ClinicalAlert"]] = relationship(  # noqa: F821
        back_populates="patient", cascade="all, delete-orphan"
    )
    vitals: Mapped[list["VitalObservation"]] = relationship(  # noqa: F821
        back_populates="patient", cascade="all, delete-orphan"
    )


class Doctor(Base):
    """Single seeded row today — real auth/RBAC is out of scope for this phase."""

    __tablename__ = "doctors"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    name: Mapped[str] = mapped_column(String(120))
    specialty: Mapped[str] = mapped_column(String(120))
    room: Mapped[str] = mapped_column(String(32))
    initials: Mapped[str] = mapped_column(String(4))
