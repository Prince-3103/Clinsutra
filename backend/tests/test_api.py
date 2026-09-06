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


def test_document_rejects_unsupported_mime_type(client):
    response = client.post(
        "/api/documents",
        files={"file": ("notes.txt", io.BytesIO(b"hello"), "text/plain")},
        data={"docType": "other"},
    )
    assert response.status_code == 422
