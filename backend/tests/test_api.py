"""
Covers the Phase 18 test checklist: create/get patient, submit interview,
save answers, save clinical history, upload document metadata, kiosk
submission, doctor queue, clinical history retrieval, timeline, alerts, plus
`/docs` and the predictable-error-shape requirement.
"""

import io


def _identification(**overrides):
    base = {
        "mode": "new",
        "abhaId": "",
        "hospitalRegNumber": "",
        "fullName": "Test Patient",
        "age": "40",
        "gender": "Male",
        "phone": "9000000000",
    }
    base.update(overrides)
    return base


def test_docs_available(client):
    response = client.get("/docs")
    assert response.status_code == 200


def test_health_check(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_create_and_get_patient(client):
    created = client.post(
        "/api/patients", json={"name": "Asha Rao", "age": 34, "gender": "Female", "complaint": "Fever"}
    )
    assert created.status_code == 201
    body = created.json()
    assert body["name"] == "Asha Rao"
    assert body["status"] == "Waiting"
    assert body["id"] == body["token"]

    fetched = client.get(f"/api/patients/{body['id']}")
    assert fetched.status_code == 200
    assert fetched.json()["id"] == body["id"]


def test_get_unknown_patient_returns_predictable_404(client):
    response = client.get("/api/patients/DOES-NOT-EXIST")
    assert response.status_code == 404
    assert response.json() == {"code": "patient_not_found", "message": "Patient DOES-NOT-EXIST not found"}


def test_create_patient_validation_error_shape(client):
    response = client.post("/api/patients", json={"name": "Missing Fields"})
    assert response.status_code == 422
    body = response.json()
    assert set(body.keys()) == {"code", "message"}
    assert body["code"] == "invalid_request"


def test_submit_interview_and_answers(client):
    started = client.post("/api/interview", json={"complaintId": "fever"})
    assert started.status_code == 201
    interview_id = started.json()["id"]
    assert started.json()["answers"] == []

    answered = client.post(
        f"/api/interview/{interview_id}/answers",
        json={"answers": [{"questionId": "duration", "optionIds": ["3-days"]}]},
    )
    assert answered.status_code == 200
    assert len(answered.json()["answers"]) == 1
    assert answered.json()["answers"][0]["questionId"] == "duration"


def test_save_clinical_history(client):
    patient = client.post(
        "/api/patients", json={"name": "History Patient", "age": 50, "gender": "Male", "complaint": "Cough"}
    ).json()

    updated = client.patch(
        f"/api/patients/{patient['id']}/history",
        json={
            "chiefComplaint": "Cough for 5 days",
            "medications": [{"name": "Cetirizine", "dose": "10mg", "frequency": "OD"}],
            "allergies": [{"substance": "Dust", "reaction": "Sneezing", "severity": "low"}],
        },
    )
    assert updated.status_code == 200
    body = updated.json()
    assert body["chiefComplaint"] == "Cough for 5 days"
    assert body["medications"][0]["name"] == "Cetirizine"
    assert body["allergies"][0]["substance"] == "Dust"

    fetched = client.get(f"/api/patients/{patient['id']}/history")
    assert fetched.status_code == 200
    assert fetched.json()["chiefComplaint"] == "Cough for 5 days"


def test_upload_document_metadata(client):
    response = client.post(
        "/api/documents",
        files={"file": ("report.pdf", io.BytesIO(b"%PDF-1.4 fake"), "application/pdf")},
        data={"docType": "lab"},
    )
    assert response.status_code == 201
    body = response.json()
    assert body["detectedType"] == "lab"
    assert body["documentId"].startswith("doc-")


def test_upload_document_rejects_unsupported_type(client):
    response = client.post(
        "/api/documents",
        files={"file": ("notes.txt", io.BytesIO(b"hello"), "text/plain")},
        data={"docType": "other"},
    )
    assert response.status_code == 422
    assert response.json()["code"] == "invalid_document"


def _submit_kiosk_session(client) -> str:
    """Helper (not a test): runs the full kiosk handoff and returns the new patient id."""
    doc = client.post(
        "/api/documents",
        files={"file": ("scan.jpg", io.BytesIO(b"fake-bytes"), "image/jpeg")},
        data={"docType": "imaging"},
    ).json()

    submission = client.post(
        "/api/kiosk/submissions",
        json={
            "identification": _identification(fullName="Ramesh Kumar", age="52"),
            "complaint": "Chest pain radiating to left arm",
            "priority": "P1",
            "redFlag": True,
            "flags": ["Chest pain with radiation"],
            "complaintId": "chest-pain",
            "answers": [{"questionId": "onset", "optionIds": ["onset-sudden"]}],
            "documentIds": [doc["documentId"]],
        },
    )
    assert submission.status_code == 201
    patient_id = submission.json()["patientId"]
    assert submission.json()["token"] == patient_id
    return patient_id


def test_kiosk_submission_creates_full_handoff(client):
    patient_id = _submit_kiosk_session(client)
    assert patient_id.startswith("OPD-")


def test_doctor_queue_shows_submitted_patient(client):
    patient_id = _submit_kiosk_session(client)

    queue = client.get("/api/patients", params={"filter": "waiting"})
    assert queue.status_code == 200
    ids = [p["id"] for p in queue.json()]
    assert patient_id in ids


def test_retrieve_clinical_history_after_submission(client):
    patient_id = _submit_kiosk_session(client)

    history = client.get(f"/api/patients/{patient_id}/history")
    assert history.status_code == 200
    assert history.json()["chiefComplaint"] == "Chest pain radiating to left arm"


def test_retrieve_interview_and_documents_after_submission(client):
    patient_id = _submit_kiosk_session(client)

    interview = client.get(f"/api/patients/{patient_id}/interview")
    assert interview.status_code == 200
    assert interview.json()["complaintId"] == "chest-pain"

    documents = client.get(f"/api/patients/{patient_id}/documents")
    assert documents.status_code == 200
    assert len(documents.json()) == 1


def test_retrieve_timeline_empty_for_new_patient(client):
    patient_id = _submit_kiosk_session(client)

    timeline = client.get(f"/api/patients/{patient_id}/timeline")
    assert timeline.status_code == 200
    assert timeline.json() == []


def test_retrieve_alerts_after_red_flag_submission(client):
    patient_id = _submit_kiosk_session(client)

    alerts = client.get(f"/api/patients/{patient_id}/alerts")
    assert alerts.status_code == 200
    assert len(alerts.json()) == 1
    assert alerts.json()[0]["category"] == "caution"


def test_triage_assessment_flags_high_risk_signals(client):
    response = client.post(
        "/api/triage/assess",
        json={"complaintId": "chest-pain", "answers": [{"questionId": "q1", "optionIds": ["radiation-arm"]}]},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["triggered"] is True
    assert body["priority"] == "P1"


def test_update_patient_status(client):
    patient = client.post(
        "/api/patients", json={"name": "Status Patient", "age": 25, "gender": "Other", "complaint": "Check-up"}
    ).json()

    updated = client.patch(f"/api/patients/{patient['id']}/status", json={"status": "Completed"})
    assert updated.status_code == 200
    assert updated.json()["status"] == "Completed"
    assert updated.json()["waitTime"] == "—"
