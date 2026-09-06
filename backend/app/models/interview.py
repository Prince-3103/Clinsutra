"""
Interview + InterviewAnswer.

Stores the kiosk's adaptive-question session: which complaint branch was
picked and every answer given. Questions themselves stay static frontend data
for this phase (see `src/data/questions.ts`) — nothing here defines question
content, only responses, so the LLM-driven version described in the project's
Phase 10 can slot in without a schema change.

`patient_id` is nullable because, in the current UI, the interview happens
*before* the kiosk submission that creates the patient record. It gets linked
by `POST /api/kiosk/submissions` (see `services/submission_service.py`).
"""

from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import JSON, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.common import generate_id, utcnow

if TYPE_CHECKING:
    from app.models.patient import Patient


class Interview(Base):
    __tablename__ = "interviews"

    id: Mapped[str] = mapped_column(String(40), primary_key=True, default=lambda: generate_id("intv"))
    patient_id: Mapped[str | None] = mapped_column(
        String(20), ForeignKey("patients.id", ondelete="CASCADE"), nullable=True
    )
    complaint_id: Mapped[str | None] = mapped_column(String(40), nullable=True)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utcnow)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    patient: Mapped["Patient | None"] = relationship(back_populates="interviews")
    answers: Mapped[list["InterviewAnswer"]] = relationship(
        back_populates="interview", cascade="all, delete-orphan", order_by="InterviewAnswer.answered_at"
    )


class InterviewAnswer(Base):
    __tablename__ = "interview_answers"

    id: Mapped[str] = mapped_column(String(40), primary_key=True, default=lambda: generate_id("ans"))
    interview_id: Mapped[str] = mapped_column(
        String(40), ForeignKey("interviews.id", ondelete="CASCADE"), nullable=False
    )
    question_id: Mapped[str] = mapped_column(String(80), nullable=False)
    # Option ids selected — a JSON list even for single-choice questions, to
    # mirror `Answer.optionIds: string[]` in the frontend type exactly.
    option_ids: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    transcript: Mapped[str | None] = mapped_column(Text, nullable=True)
    answered_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utcnow)

    interview: Mapped["Interview"] = relationship(back_populates="answers")
