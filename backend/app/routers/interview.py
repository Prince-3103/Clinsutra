from __future__ import annotations

from fastapi import APIRouter

from app.schemas.clinical import FollowUpRequest, QuestionOut, RedFlagAssessmentOut, TriageRequest
from app.services import clinical_service, triage_service

router = APIRouter(tags=["interview"])


@router.get("/interview/opening", response_model=QuestionOut)
def get_opening_question():
    return clinical_service.get_opening_question()


@router.post("/interview/follow-ups", response_model=list[QuestionOut])
def get_follow_up_questions(body: FollowUpRequest):
    # `previousAnswers` is accepted for forward-compatibility with an
    # LLM-driven version of this endpoint; the demo bank is static per
    # complaint, exactly like clinicalService.ts's mock branch.
    return clinical_service.get_follow_up_questions(body.complaint_id)


@router.post("/triage/assess", response_model=RedFlagAssessmentOut)
def assess_red_flags(body: TriageRequest):
    answers = [a.model_dump(by_alias=True) for a in body.answers]
    return triage_service.evaluate_red_flags(body.complaint_id, answers)
