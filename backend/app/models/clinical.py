"""
`ClinicalHistory` is the AI-drafted / clinician-edited record
(`saveHistory`/`confirmHistory` in clinicalService.ts). `Interview` +
`InterviewAnswer` capture the raw question/answer trail from the kiosk's
chief-complaint + adaptive follow-up screens, submitted once at
`POST /kiosk/submissions` alongside the drafted history.

Nothing here diagnoses or recommends a medication/dose — these tables store
exactly what the frontend already computes or the patient already typed.
"""

from __future__ import annotations

import datetime as dt

from sqlalchemy import JSON, DateTime, Enum, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class ClinicalHistory(Base):
    __tablename__ = "clinical_histories"

    # One-to-one with patients: the patient id is also this table's PK.
    patient_id: Mapped[str] = mapped_column(ForeignKey("patients.id"), primary_key=True)

    chief_complaint: Mapped[str] = mapped_column(Text, default="")
    history_of_present_illness: Mapped[str] = mapped_column(Text, default="")
    past_medical_history: Mapped[str] = mapped_column(Text, default="")
    past_surgical_history: Mapped[str] = mapped_column(Text, default="")
    family_history: Mapped[str] = mapped_column(Text, default="")
    personal_history: Mapped[str] = mapped_column(Text, default="")
    review_of_systems: Mapped[str] = mapped_column(Text, default="")
    investigations_summary: Mapped[str] = mapped_column(Text, default="")

    # True until a clinician confirms the draft — see confirmHistory().
    ai_generated: Mapped[bool] = mapped_column(default=True)
    confirmed_by_clinician: Mapped[bool] = mapped_column(default=False)

    updated_at: Mapped[dt.datetime] = mapped_column(
        DateTime(timezone=True), default=dt.datetime.utcnow, onupdate=dt.datetime.utcnow
    )

    patient: Mapped["Patient"] = relationship(back_populates="clinical_history")  # noqa: F821
    medications: Mapped[list["Medication"]] = relationship(
        back_populates="history", cascade="all, delete-orphan"
    )
    allergies: Mapped[list["Allergy"]] = relationship(
        back_populates="history", cascade="all, delete-orphan"
    )


class Medication(Base):
    __tablename__ = "medications"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    patient_id: Mapped[str] = mapped_column(ForeignKey("clinical_histories.patient_id"))
    name: Mapped[str] = mapped_column(String(200))
    dose: Mapped[str] = mapped_column(String(100))
    frequency: Mapped[str] = mapped_column(String(100))

    history: Mapped["ClinicalHistory"] = relationship(back_populates="medications")


class Allergy(Base):
    __tablename__ = "allergies"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    patient_id: Mapped[str] = mapped_column(ForeignKey("clinical_histories.patient_id"))
    substance: Mapped[str] = mapped_column(String(200))
    reaction: Mapped[str] = mapped_column(String(200))
    severity: Mapped[str] = mapped_column(Enum("high", "moderate", "low", name="allergy_severity"))

    history: Mapped["ClinicalHistory"] = relationship(back_populates="allergies")


class Interview(Base):
    """One row per kiosk interview session (today: one per patient)."""

    __tablename__ = "interviews"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    patient_id: Mapped[str] = mapped_column(ForeignKey("patients.id"))
    complaint_id: Mapped[str | None] = mapped_column(String(32), nullable=True)
    created_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), default=dt.datetime.utcnow)

    patient: Mapped["Patient"] = relationship(back_populates="interviews")  # noqa: F821
    answers: Mapped[list["InterviewAnswer"]] = relationship(
        back_populates="interview", cascade="all, delete-orphan"
    )


class InterviewAnswer(Base):
    __tablename__ = "interview_answers"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    interview_id: Mapped[str] = mapped_column(ForeignKey("interviews.id"))
    question_id: Mapped[str] = mapped_column(String(64))
    option_ids: Mapped[list[str]] = mapped_column(JSON, default=list)
    transcript: Mapped[str | None] = mapped_column(Text, nullable=True)
    answered_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True))

    interview: Mapped["Interview"] = relationship(back_populates="answers")
