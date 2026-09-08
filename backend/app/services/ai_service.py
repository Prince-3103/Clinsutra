"""
Gemini-backed AI service: adaptive follow-up questions and AI-assisted
clinical summaries.

This module is the ONLY place that talks to Gemini. Two rules are load-bearing
and apply to every function here:

1. Never diagnose, prescribe, or decide a triage priority. The deterministic
   red-flag rules in `triage_service.py` are the sole, authoritative source
   of P1/P2/P3 — this module is never consulted for that decision, is told
   so explicitly in every prompt, and its output is never fed back into
   `triage_service.evaluate_red_flags`.
2. Never let a Gemini failure break the app. Every public function degrades
   to a deterministic fallback — built only from data the patient/doctor
   already provided, never fabricated — if Gemini is unconfigured, times
   out, errors, hits a rate limit, or returns something that doesn't parse
   as the expected shape. Every result carries `source: "ai" | "fallback"`
   so the UI never claims AI involvement that didn't happen.
"""

from __future__ import annotations

import concurrent.futures
import json
import logging
import re

from app.core.config import Settings, get_settings
from app.data import COMPLAINTS, CHIEF_COMPLAINT_QUESTION, is_complaint_id

logger = logging.getLogger("clinsutra.ai_service")

# One small pool for the (blocking) Gemini SDK calls, so a slow/hanging call
# can be bounded with a real timeout instead of blocking the request thread
# indefinitely.
_EXECUTOR = concurrent.futures.ThreadPoolExecutor(max_workers=4, thread_name_prefix="gemini")

MAX_FOLLOW_UP_QUESTIONS = 5

SAFETY_PREAMBLE = (
    "You are a clinical documentation assistant for an Indian OPD triage kiosk. "
    "Your only job is to help capture what a patient reports, in their own words. "
    "You must NEVER diagnose a condition, NEVER name or suggest a medication or dose, "
    "and NEVER decide, mention, or imply a triage priority (P1/P2/P3) or declare a "
    "patient medically normal — a separate, deterministic rule engine already owns "
    "triage and its decision is final. Only describe, structure, or ask about what "
    "the patient has said. Never invent medical facts, references, or history the "
    "patient did not report. When asked for JSON, respond with ONLY the JSON object — "
    "no markdown code fences, no commentary before or after it."
)


def is_configured(settings: Settings | None = None) -> bool:
    settings = settings or get_settings()
    return bool(settings.gemini_api_key.strip())


def _strip_code_fence(text: str) -> str:
    text = text.strip()
    match = re.match(r"^```(?:json)?\s*(.*?)\s*```$", text, re.DOTALL)
    return match.group(1) if match else text


def _call_gemini_json(prompt: str, settings: Settings) -> dict | None:
    """One bounded Gemini call expecting a JSON object back.

    Returns None on ANY failure path — not configured, auth error, network
    error, timeout, rate limit, or a response that isn't valid JSON — so
    every caller has exactly one place to fall back from.
    """
    if not is_configured(settings):
        return None

    def _run() -> str | None:
        from google import genai
        from google.genai import types

        client = genai.Client(api_key=settings.gemini_api_key)
        response = client.models.generate_content(
            model=settings.gemini_model,
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=SAFETY_PREAMBLE,
                response_mime_type="application/json",
                temperature=0.4,
                max_output_tokens=1024,
            ),
        )
        return response.text

    try:
        future = _EXECUTOR.submit(_run)
        text = future.result(timeout=settings.gemini_timeout_seconds)
    except concurrent.futures.TimeoutError:
        logger.warning("Gemini call timed out after %.1fs — falling back", settings.gemini_timeout_seconds)
        return None
    except Exception:  # noqa: BLE001 - any SDK/auth/network/rate-limit error degrades to fallback
        logger.exception("Gemini call failed — falling back")
        return None

    if not text or not text.strip():
        logger.warning("Gemini returned an empty response — falling back")
        return None

    try:
        parsed = json.loads(_strip_code_fence(text))
    except (json.JSONDecodeError, TypeError):
        logger.warning("Gemini response was not valid JSON — falling back")
        return None

    return parsed if isinstance(parsed, dict) else None


def _question_bank_for(complaint_id: str | None) -> list[dict]:
    if not complaint_id or not is_complaint_id(complaint_id):
        return []
    return COMPLAINTS[complaint_id]["followUps"]


def _option_label(question: dict, option_id: str) -> str | None:
    for option in question["options"]:
        if option["id"] == option_id:
            return option["label"]["en"]
    return None


def resolve_answer_labels(complaint_id: str | None, answers: list[dict]) -> list[dict]:
    """Turns raw `{questionId, optionIds, transcript}` answers into readable
    `{question, answer}` pairs using the same static question bank the kiosk
    already ships (`app/data/questions.py`) — no new question content, just a
    lookup. Used both as Gemini's context and as the deterministic fallback's
    source of "what the patient actually said"."""
    all_questions = {CHIEF_COMPLAINT_QUESTION["id"]: CHIEF_COMPLAINT_QUESTION}
    for question in _question_bank_for(complaint_id):
        all_questions[question["id"]] = question

    resolved = []
    for answer in answers:
        question = all_questions.get(answer.get("questionId") or answer.get("question_id"))
        prompt = question["prompt"]["en"] if question else answer.get("questionId", "Question")
        option_ids = answer.get("optionIds") or answer.get("option_ids") or []
        labels = [
            _option_label(question, option_id) or option_id for option_id in option_ids
        ] if question else list(option_ids)
        answer_text = answer.get("transcript") or ", ".join(labels) or "(no answer recorded)"
        resolved.append({"question": prompt, "answer": answer_text})
    return resolved


def generate_adaptive_question(
    complaint: str,
    language: str,
    history: list[dict],
    settings: Settings | None = None,
) -> dict:
    """Generates the next adaptive follow-up question for the kiosk's voice/
    text interview. `history` is `[{"question": str, "answer": str}]` for
    whatever has been asked so far in this session (AI-generated or not).

    Capped at `MAX_FOLLOW_UP_QUESTIONS` — this never turns into an endless
    conversation. On any failure, returns `source: "fallback"` with
    `question: None`; the caller (the kiosk interview flow) is expected to
    fall back to the existing predefined question bank in that case.
    """
    settings = settings or get_settings()
    question_number = len(history) + 1

    if question_number > MAX_FOLLOW_UP_QUESTIONS:
        return {"question": None, "questionNumber": question_number, "isFinal": True, "source": "fallback"}

    transcript = (
        "\n".join(f"Q{i + 1}: {turn['question']}\nA{i + 1}: {turn['answer']}" for i, turn in enumerate(history))
        or "(no answers yet — this is the first follow-up question)"
    )
    language_name = "Hindi" if language == "hi" else "English"
    prompt = (
        f"Patient's chief complaint (in their own words): {complaint!r}.\n\n"
        f"Conversation so far:\n{transcript}\n\n"
        f"Ask ONE short, specific follow-up question, in {language_name}, that a triage nurse "
        f"would reasonably ask next given what has and hasn't been covered yet. This would be "
        f"follow-up question {question_number} of at most {MAX_FOLLOW_UP_QUESTIONS} for this visit. "
        f'Respond as JSON only: {{"question": "<the question text, or null if you already have '
        f'enough information and no further question is needed>", "done": <true if no more '
        f"questions are needed, otherwise false>}}."
    )

    result = _call_gemini_json(prompt, settings)
    question_text = result.get("question") if result else None
    if isinstance(question_text, str) and question_text.strip():
        return {
            "question": question_text.strip(),
            "questionNumber": question_number,
            "isFinal": bool(result.get("done")) or question_number >= MAX_FOLLOW_UP_QUESTIONS,
            "source": "ai",
        }

    # Gemini unavailable, failed, or decided it has enough information —
    # either way, no AI question. The kiosk interview screen already knows
    # how to continue with its predefined questions when this happens.
    return {"question": None, "questionNumber": question_number, "isFinal": True, "source": "fallback"}


def _fallback_clinical_summary(
    complaint: str,
    complaint_id: str | None,
    history_of_present_illness: str,
    qa_pairs: list[dict],
    risk_flags: list[str],
) -> dict:
    """Built entirely from data already captured at the kiosk or by the
    deterministic triage rules — nothing here is invented. Used whenever
    Gemini is unavailable, and also serves as documentation of exactly what
    "AI-generated" adds on top of when Gemini does run."""
    key_symptoms = [pair["answer"] for pair in qa_pairs if pair.get("answer") and pair["answer"] != "(no answer recorded)"]

    answered_question_ids = {pair["question"] for pair in qa_pairs}
    suggested_questions = [
        question["prompt"]["en"]
        for question in _question_bank_for(complaint_id)
        if question["prompt"]["en"] not in answered_question_ids
    ][:3]

    summary_parts = [f"Patient reports: {complaint}."]
    if history_of_present_illness:
        summary_parts.append(history_of_present_illness)
    if risk_flags:
        summary_parts.append("Triage flagged: " + "; ".join(risk_flags) + ".")

    return {
        "chiefComplaint": complaint,
        "historyPresentIllness": history_of_present_illness or complaint,
        "keySymptoms": key_symptoms,
        "riskIndicators": list(risk_flags),
        "suggestedQuestions": suggested_questions,
        "clinicalSummary": " ".join(summary_parts),
        "source": "fallback",
    }


def generate_clinical_summary(
    complaint: str,
    complaint_id: str | None,
    history_of_present_illness: str,
    qa_pairs: list[dict],
    risk_flags: list[str],
    language: str = "en",
    settings: Settings | None = None,
) -> dict:
    """Produces the structured AI-assisted clinical summary for
    `/doctor/summary`. Never diagnoses or prescribes — see `SAFETY_PREAMBLE`.

    `risk_flags` are the human-readable flags the DETERMINISTIC red-flag
    rules already produced (`patient.flags`) — passed in only as context for
    the summary text, never as something Gemini is asked to confirm, change,
    or re-derive a priority from.
    """
    settings = settings or get_settings()
    fallback = _fallback_clinical_summary(complaint, complaint_id, history_of_present_illness, qa_pairs, risk_flags)

    transcript = (
        "\n".join(f"- {pair['question']} -> {pair['answer']}" for pair in qa_pairs) or "(no structured interview answers on file)"
    )
    language_name = "Hindi" if language == "hi" else "English"
    prompt = (
        f"Chief complaint: {complaint!r}\n"
        f"History of present illness on file: {history_of_present_illness or '(none recorded)'}\n"
        f"Interview answers:\n{transcript}\n"
        f"Deterministic triage already flagged (context only, do not restate as your own finding "
        f"or change it): {', '.join(risk_flags) if risk_flags else '(nothing flagged)'}\n\n"
        f"Write the clinical summary in {language_name}. Respond as JSON only, with exactly these "
        f'keys: {{"chief_complaint": "...", "history_present_illness": "...", "key_symptoms": '
        f'["..."], "risk_indicators": ["..."], "suggested_questions": ["..."], "clinical_summary": '
        f'"..."}}. "risk_indicators" should describe what the patient reported that a physician '
        f"should note — never a diagnosis, and never a priority level. Describe only what the "
        f"patient reported; do not add medical facts they did not state."
    )

    result = _call_gemini_json(prompt, settings)
    if not result:
        return fallback

    def _as_str(value: object, default: str) -> str:
        return value.strip() if isinstance(value, str) and value.strip() else default

    def _as_list(value: object) -> list[str]:
        if isinstance(value, list):
            return [str(item).strip() for item in value if str(item).strip()]
        if isinstance(value, str) and value.strip():
            return [value.strip()]
        return []

    chief_complaint = _as_str(result.get("chief_complaint"), "")
    clinical_summary = _as_str(result.get("clinical_summary"), "")
    if not chief_complaint or not clinical_summary:
        # Missing the two fields that matter most — treat the whole response
        # as malformed rather than show a half-populated "AI" summary.
        logger.warning("Gemini clinical summary missing required fields — falling back")
        return fallback

    return {
        "chiefComplaint": chief_complaint,
        "historyPresentIllness": _as_str(result.get("history_present_illness"), fallback["historyPresentIllness"]),
        "keySymptoms": _as_list(result.get("key_symptoms")) or fallback["keySymptoms"],
        "riskIndicators": _as_list(result.get("risk_indicators")) or fallback["riskIndicators"],
        "suggestedQuestions": _as_list(result.get("suggested_questions")) or fallback["suggestedQuestions"],
        "clinicalSummary": clinical_summary,
        "source": "ai",
    }
