"""
Direct port of `src/utils/redFlags.ts`. Same demo rules, same output shape —
explicitly not a diagnosis (Phase 9 / Phase 15). This function only combines
data that already exists in `app/data/`; it does not add any new clinical
judgement beyond what the frontend already ships.
"""

from __future__ import annotations

from app.data import COMPLAINTS, RED_FLAG_RULES

PRIORITY_ORDER = {"P1": 0, "P2": 1, "P3": 2}


def collect_signals(questions: list[dict], answers: list[dict]) -> set[str]:
    selected: set[str] = set()
    for answer in answers:
        selected.update(answer.get("optionIds") or answer.get("option_ids") or [])

    signals: set[str] = set()
    for question in questions:
        for option in question["options"]:
            if option["id"] in selected:
                signals.update(option.get("signals", []))
    return signals


def evaluate_red_flags(complaint_id: str | None, answers: list[dict]) -> dict:
    if not complaint_id or complaint_id not in COMPLAINTS:
        return {"triggered": False, "priority": "P3", "ruleIds": [], "reasons": []}

    questions = COMPLAINTS[complaint_id]["followUps"]
    signals = collect_signals(questions, answers)

    fired = [
        rule
        for rule in RED_FLAG_RULES
        if (not rule.get("complaint") or rule["complaint"] == complaint_id)
        and all(signal in signals for signal in rule["requires"])
    ]

    if not fired:
        return {"triggered": False, "priority": "P3", "ruleIds": [], "reasons": []}

    priority = "P3"
    for rule in fired:
        if PRIORITY_ORDER[rule["priority"]] < PRIORITY_ORDER[priority]:
            priority = rule["priority"]

    return {
        "triggered": True,
        "priority": priority,
        "ruleIds": [rule["id"] for rule in fired],
        "reasons": [rule["reason"] for rule in fired],
    }
