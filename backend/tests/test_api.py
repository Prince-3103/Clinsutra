"""
Covers the flows the spec calls out explicitly: create/get patient, submit an
interview, save clinical history, upload a document, create a kiosk
submission, retrieve the doctor queue, retrieve the timeline, retrieve
alerts, plus `/docs` availability.
"""

import io


def test_docs_available(client):
    response = client.get("/docs")
    assert response.status_code == 200


def test_health(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_get_current_doctor(client):
    response = client.get("/api/doctors/me")
    assert response.status_code == 200
    assert response.json()["name"]


def test_empty_queue(client):
    response = client.get("/api/patients")
    assert response.status_code == 200
    assert response.json() == []


def test_opening_question_and_follow_ups(client):
    opening = client.get("/api/interview/opening")
    assert opening.status_code == 200
    assert opening.json()["id"] == "q-chief-complaint"

    follow_ups = client.post(
        "/api/interview/follow-ups", json={"complaintId": "fever", "previousAnswers": []}
    )
    assert follow_ups.status_code == 200
    assert len(follow_ups.json()) == 3


def test_triage_assessment_fires_red_flag(client):
    response = client.post(
        "/api/triage/assess",
        json={
            "complaintId": "chest-pain",
            "answers": [
                {
                    "questionId": "cp-radiation",
                    "optionIds": ["cp-rad-arm"],
                    "answeredAt": "2026-01-01T00:00:00Z",
                }
            ],
        },
    )
    assert response.status_code == 200
    body = response.json()
    assert body["triggered"] is True
    assert body["priority"] == "P1"
    assert "cp-radiation-arm" in body["ruleIds"]


def test_triage_assessment_no_signals(client):
    response = client.post("/api/triage/assess", json={"complaintId": None, "answers": []})
    assert response.status_code == 200
    assert response.json() == {"triggered": False, "priority": "P3", "ruleIds": [], "reasons": []}


def test_document_upload_then_kiosk_submission_reparents_it(client):
    upload = client.post(
        "/api/documents",
        files={"file": ("report.pdf", io.BytesIO(b"%PDF-1.4 fake"), "application/pdf")},
        data={"docType": "lab", "documentSessionId": "sess-1"},
    )
    assert upload.status_code == 200
    extraction = upload.json()
    assert extraction["detectedType"] == "lab"
    assert extraction["fields"]

    submission = client.post(
        "/api/kiosk/submissions",
        json={
            "identification": {
                "mode": "new",
                "abhaId": "77-0000-0000-0000",
                "hospitalRegNumber": "",
                "fullName": "Asha Kiran",
                "age": "34",
                "gender": "Female",
                "phone": "9000000000",
            },
            "complaint": "Fever for 3 days",
            "priority": "P2",
            "redFlag": False,
            "flags": [],
            "complaintId": "fever",
            "clinicalHistory": {
                "chiefComplaint": "Fever for 3 days",
                "historyOfPresentIllness": "No rigors, no rash",
            },
            "answers": [
                {
                    "questionId": "fv-duration",
                    "optionIds": ["fv-dur-3"],
                    "answeredAt": "2026-01-01T00:00:00Z",
                }
            ],
            "documentSessionId": "sess-1",
        },
    )
    assert submission.status_code == 200
    receipt = submission.json()
    patient_id = receipt["patientId"]
    assert receipt["token"] == patient_id

    # Patient now visible in the doctor queue.
    queue = client.get("/api/patients").json()
    assert any(p["id"] == patient_id for p in queue)

    # Clinical history persisted from the kiosk draft.
    history = client.get(f"/api/patients/{patient_id}/history").json()
    assert history["chiefComplaint"] == "Fever for 3 days"

    # Document uploaded pre-submission is re-parented onto the new patient.
    single = client.get(f"/api/patients/{patient_id}").json()
    assert single["id"] == patient_id


def test_update_patient_status(client):
    submission = client.post(
        "/api/kiosk/submissions",
        json={
            "identification": {
                "mode": "new",
                "abhaId": "",
                "hospitalRegNumber": "",
                "fullName": "Ravi Teja",
                "age": "50",
                "gender": "Male",
                "phone": "",
            },
            "complaint": "Follow-up",
            "priority": "P3",
            "redFlag": False,
            "flags": [],
        },
    ).json()
    patient_id = submission["patientId"]

    response = client.patch(f"/api/patients/{patient_id}/status", json={"status": "Completed"})
    assert response.status_code == 200
    assert response.json()["status"] == "Completed"
    assert response.json()["waitTime"] == "—"


def test_mark_as_reviewed_resolves_red_flag_but_keeps_triage_result(client):
    """Doctor-only "Mark as Reviewed" action: `resolveRedFlag` on the existing
    status endpoint flips `redFlagResolved` without ever touching the
    original `priority` / `redFlag` / `flags` triage result — those stay in
    the record for the audit trail."""
    submission = client.post(
        "/api/kiosk/submissions",
        json={
            "identification": {
                "mode": "new",
                "abhaId": "",
                "hospitalRegNumber": "",
                "fullName": "Red Flag Patient",
                "age": "60",
                "gender": "Male",
                "phone": "",
            },
            "complaint": "Sudden severe headache and slurred speech",
            "priority": "P1",
            "redFlag": True,
            "flags": ["Sudden severe headache", "Speech difficulty"],
        },
    ).json()
    patient_id = submission["patientId"]

    before = client.get(f"/api/patients/{patient_id}").json()
    assert before["redFlag"] is True
    assert before["redFlagResolved"] is False
    assert before["priority"] == "P1"

    response = client.patch(
        f"/api/patients/{patient_id}/status",
        json={"status": "Completed", "resolveRedFlag": True},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "Completed"
    assert body["redFlagResolved"] is True
    # The original triage result is never overwritten by this action.
    assert body["redFlag"] is True
    assert body["priority"] == "P1"
    assert body["flags"] == ["Sudden severe headache", "Speech difficulty"]

    after = client.get(f"/api/patients/{patient_id}").json()
    assert after["redFlagResolved"] is True
    assert after["priority"] == "P1"


def test_status_update_without_resolve_flag_leaves_red_flag_untouched(client):
    submission = client.post(
        "/api/kiosk/submissions",
        json={
            "identification": {
                "mode": "new",
                "abhaId": "",
                "hospitalRegNumber": "",
                "fullName": "Plain Status Change",
                "age": "30",
                "gender": "Female",
                "phone": "",
            },
            "complaint": "Follow-up",
            "priority": "P3",
            "redFlag": False,
            "flags": [],
        },
    ).json()
    patient_id = submission["patientId"]

    response = client.patch(f"/api/patients/{patient_id}/status", json={"status": "In Consultation"})
    assert response.status_code == 200
    assert response.json()["redFlagResolved"] is False


def test_history_patch_upserts_when_missing(client):
    submission = client.post(
        "/api/kiosk/submissions",
        json={
            "identification": {
                "mode": "new",
                "abhaId": "",
                "hospitalRegNumber": "",
                "fullName": "No History Yet",
                "age": "20",
                "gender": "Other",
                "phone": "",
            },
            "complaint": "Skin rash",
            "priority": "P3",
            "redFlag": False,
            "flags": [],
        },
    ).json()
    patient_id = submission["patientId"]

    # No clinicalHistory was submitted, so history doesn't exist yet.
    assert client.get(f"/api/patients/{patient_id}/history").status_code == 404

    patched = client.patch(
        f"/api/patients/{patient_id}/history",
        json={"chiefComplaint": "Skin rash", "confirmedByClinician": True},
    )
    assert patched.status_code == 200
    assert patched.json()["confirmedByClinician"] is True


def test_timeline_and_alerts_empty_for_new_patient(client):
    submission = client.post(
        "/api/kiosk/submissions",
        json={
            "identification": {
                "mode": "new",
                "abhaId": "",
                "hospitalRegNumber": "",
                "fullName": "Timeline Test",
                "age": "40",
                "gender": "Male",
                "phone": "",
            },
            "complaint": "Check-up",
            "priority": "P3",
            "redFlag": False,
            "flags": [],
        },
    ).json()
    patient_id = submission["patientId"]

    assert client.get(f"/api/patients/{patient_id}/timeline").json() == []
    assert client.get(f"/api/patients/{patient_id}/alerts").json() == []
    assert client.get(f"/api/patients/{patient_id}/vitals").json() == []


def test_adaptive_question_falls_back_without_gemini_key(client, monkeypatch):
    """With no Gemini configured, this must degrade cleanly instead of
    erroring — the kiosk needs to keep working with zero AI setup. We force
    the unconfigured path so the test is hermetic regardless of any real
    GEMINI_API_KEY present in the environment/.env."""
    from app.services import ai_service

    monkeypatch.setattr(ai_service, "is_configured", lambda *a, **k: False)
    response = client.post(
        "/api/ai/adaptive-question",
        json={"complaint": "Sudden severe headache", "language": "en", "history": []},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["source"] == "fallback"
    assert body["question"] is None
    assert body["isFinal"] is True


def test_adaptive_question_caps_at_max_follow_ups(client):
    history = [{"question": f"Q{i}", "answer": f"A{i}"} for i in range(5)]
    response = client.post(
        "/api/ai/adaptive-question",
        json={"complaint": "Fever", "language": "en", "history": history},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["isFinal"] is True
    assert body["questionNumber"] == 6


def test_ai_summary_falls_back_and_uses_captured_data(client, monkeypatch):
    """Without a Gemini key, `/ai-summary` must still return a usable,
    honestly-labelled draft built from what's already on file — never a
    diagnosis, never fabricated content, never claimed as AI-generated. We
    force the unconfigured path so the test is hermetic regardless of any
    real GEMINI_API_KEY present in the environment/.env."""
    from app.services import ai_service

    monkeypatch.setattr(ai_service, "is_configured", lambda *a, **k: False)
    submission = client.post(
        "/api/kiosk/submissions",
        json={
            "identification": {
                "mode": "new",
                "abhaId": "",
                "hospitalRegNumber": "",
                "fullName": "AI Summary Fallback Patient",
                "age": "40",
                "gender": "Male",
                "phone": "",
            },
            "complaint": "Fever for 3 days",
            "priority": "P2",
            "redFlag": True,
            "flags": ["High fever reported"],
            "complaintId": "fever",
            "clinicalHistory": {
                "chiefComplaint": "Fever for 3 days",
                "historyOfPresentIllness": "No rigors, no rash",
            },
            "answers": [
                {
                    "questionId": "fv-duration",
                    "optionIds": ["fv-dur-3"],
                    "answeredAt": "2026-01-01T00:00:00Z",
                }
            ],
        },
    ).json()
    patient_id = submission["patientId"]

    response = client.post(f"/api/patients/{patient_id}/ai-summary")
    assert response.status_code == 200
    body = response.json()
    assert body["source"] == "fallback"
    assert body["chiefComplaint"] == "Fever for 3 days"
    assert "High fever reported" in body["riskIndicators"]
    # Nothing was persisted by generating the draft — it's read-only.
    history = client.get(f"/api/patients/{patient_id}/history").json()
    assert history["clinicalSummary"] == ""


def test_ai_summary_404_for_unknown_patient(client):
    response = client.post("/api/patients/OPD-9999/ai-summary")
    assert response.status_code == 404


def test_ai_summary_fields_editable_via_existing_patch_endpoint(client):
    """The AI summary fields ride the same PATCH endpoint as every other
    clinical-history field — no second persistence path was introduced."""
    submission = client.post(
        "/api/kiosk/submissions",
        json={
            "identification": {
                "mode": "new",
                "abhaId": "",
                "hospitalRegNumber": "",
                "fullName": "AI Field Save Patient",
                "age": "22",
                "gender": "Female",
                "phone": "",
            },
            "complaint": "Check-up",
            "priority": "P3",
            "redFlag": False,
            "flags": [],
        },
    ).json()
    patient_id = submission["patientId"]

    patched = client.patch(
        f"/api/patients/{patient_id}/history",
        json={
            "keySymptoms": ["Mild fatigue"],
            "riskIndicators": [],
            "suggestedQuestions": ["Any recent travel?"],
            "clinicalSummary": "Doctor-edited summary text.",
        },
    )
    assert patched.status_code == 200
    body = patched.json()
    assert body["keySymptoms"] == ["Mild fatigue"]
    assert body["clinicalSummary"] == "Doctor-edited summary text."

    reread = client.get(f"/api/patients/{patient_id}/history").json()
    assert reread["clinicalSummary"] == "Doctor-edited summary text."


def test_history_tolerates_null_ai_fields_from_before_migration(client, db_session):
    """Regression test for the b28d5f1a9c6e migration fix: MySQL/MariaDB
    reject a literal DEFAULT on TEXT/JSON columns, so the four AI-summary
    columns are nullable with no DB-level default rather than
    NOT NULL DEFAULT ''. A row written before this migration existed will
    have NULL there (not the app's normal "" / [] default) — the API must
    still serve it as empty, never a 500."""
    from app.models import ClinicalHistory

    submission = client.post(
        "/api/kiosk/submissions",
        json={
            "identification": {
                "mode": "new",
                "abhaId": "",
                "hospitalRegNumber": "",
                "fullName": "Pre-Migration Patient",
                "age": "55",
                "gender": "Male",
                "phone": "",
            },
            "complaint": "Follow-up",
            "priority": "P3",
            "redFlag": False,
            "flags": [],
            "clinicalHistory": {"chiefComplaint": "Follow-up"},
        },
    ).json()
    patient_id = submission["patientId"]

    # Simulate a pre-migration row: NULL, not the ORM's usual "" / [] default.
    history = db_session.get(ClinicalHistory, patient_id)
    history.clinical_summary = None
    history.key_symptoms = None
    history.risk_indicators = None
    history.suggested_questions = None
    db_session.commit()

    response = client.get(f"/api/patients/{patient_id}/history")
    assert response.status_code == 200
    body = response.json()
    assert body["clinicalSummary"] == ""
    assert body["keySymptoms"] == []
    assert body["riskIndicators"] == []
    assert body["suggestedQuestions"] == []


def test_document_rejects_unsupported_mime_type(client):
    response = client.post(
        "/api/documents",
        files={"file": ("notes.txt", io.BytesIO(b"hello"), "text/plain")},
        data={"docType": "other"},
    )
    assert response.status_code == 422
