"""Pydantic schemas for Interview/InterviewAnswer (`routers/interview.py`)."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.schemas.clinical import AnswerIn


class InterviewCreate(BaseModel):
    """`POST /api/interview` — starts a session. `patientId` is optional: the
    kiosk starts an interview before the patient exists (see `models/interview.py`)."""

    patientId: str | None = None
    complaintId: str | None = None


class InterviewAnswersIn(BaseModel):
    """`POST /api/interview/{interview_id}/answers` — appends one or more answers."""

    answers: list[AnswerIn]


class InterviewAnswerOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    questionId: str
    optionIds: list[str]
    transcript: str | None
    answeredAt: datetime


class InterviewOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    patientId: str | None
    complaintId: str | None
    startedAt: datetime
    completedAt: datetime | None
    answers: list[InterviewAnswerOut]
