from __future__ import annotations

import datetime as dt

from app.schemas.common import CamelModel, LocalizedText


class QuestionOptionOut(CamelModel):
    id: str
    label: LocalizedText
    signals: list[str] = []


class QuestionOut(CamelModel):
    id: str
    prompt: LocalizedText
    kind: str
    options: list[QuestionOptionOut]
    hint: LocalizedText | None = None


class AnswerOut(CamelModel):
    question_id: str
    option_ids: list[str]
    transcript: str | None = None
    answered_at: dt.datetime


class FollowUpRequest(CamelModel):
    complaint_id: str
    previous_answers: list[AnswerOut] = []


class TriageRequest(CamelModel):
    complaint_id: str | None = None
    answers: list[AnswerOut] = []


class RedFlagAssessmentOut(CamelModel):
    triggered: bool
    priority: str
    rule_ids: list[str]
    reasons: list[LocalizedText]


class MedicationIn(CamelModel):
    id: str | None = None
    name: str
    dose: str
    frequency: str


class MedicationOut(CamelModel):
    id: str
    name: str
    dose: str
    frequency: str


class AllergyIn(CamelModel):
    id: str | None = None
    substance: str
    reaction: str
    severity: str


class AllergyOut(CamelModel):
    id: str
    substance: str
    reaction: str
    severity: str


class ClinicalHistoryPatch(CamelModel):
    """Every field optional — this is the body of `PATCH .../history` and the
    `clinicalHistory` the kiosk submits, both of which send partial data."""

    chief_complaint: str | None = None
    history_of_present_illness: str | None = None
    past_medical_history: str | None = None
    past_surgical_history: str | None = None
    medications: list[MedicationIn] | None = None
    allergies: list[AllergyIn] | None = None
    family_history: str | None = None
    personal_history: str | None = None
    review_of_systems: str | None = None
    investigations_summary: str | None = None
    key_symptoms: list[str] | None = None
    risk_indicators: list[str] | None = None
    suggested_questions: list[str] | None = None
    clinical_summary: str | None = None
    ai_generated: bool | None = None
    confirmed_by_clinician: bool | None = None


class ClinicalHistoryOut(CamelModel):
    patient_id: str
    chief_complaint: str
    history_of_present_illness: str
    past_medical_history: str
    past_surgical_history: str
    medications: list[MedicationOut]
    allergies: list[AllergyOut]
    family_history: str
    personal_history: str
    review_of_systems: str
    investigations_summary: str
    key_symptoms: list[str] = []
    risk_indicators: list[str] = []
    suggested_questions: list[str] = []
    clinical_summary: str = ""
    ai_generated: bool
    confirmed_by_clinician: bool
    updated_at: dt.datetime


class AdaptiveQuestionTurn(CamelModel):
    question: str
    answer: str


class AdaptiveQuestionRequest(CamelModel):
    complaint: str
    language: str = "en"
    history: list[AdaptiveQuestionTurn] = []


class AdaptiveQuestionOut(CamelModel):
    question: str | None
    question_number: int
    is_final: bool
    # "ai" when Gemini produced the question, "fallback" when it didn't —
    # the kiosk falls back to the predefined question bank when this is
    # "fallback" and `question` is null.
    source: str


class ClinicalSummaryOut(CamelModel):
    chief_complaint: str
    history_present_illness: str
    key_symptoms: list[str]
    risk_indicators: list[str]
    suggested_questions: list[str]
    clinical_summary: str
    source: str


class TimelineEventOut(CamelModel):
    id: str
    patient_id: str
    date: str
    sort_key: dt.datetime
    type: str
    icon: str
    color: str
    title: str
    summary: str
    detail: str
    abnormal: bool
    source: str


class ClinicalAlertOut(CamelModel):
    id: str
    patient_id: str
    category: str
    severity: str
    title: str
    value: str | None = None
    reference_range: str | None = None
    status: str | None = None
    date: str | None = None
    note: str


class VitalObservationOut(CamelModel):
    id: str
    label: str
    value: str
    unit: str
    normal: bool
