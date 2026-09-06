from __future__ import annotations

import uuid
from pathlib import Path

from fastapi import HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.core.config import Settings
from app.models import Document, DocumentExtractionField

# Same allowlist as src/data/documentTypes.ts — kept in sync deliberately.
ACCEPTED_MIME_TYPES = {
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/heic",
    "image/heif",
    "image/webp",
}
DOCUMENT_TYPES = {"prescription", "lab", "discharge", "imaging", "other"}

# Same fixed fields as documentService.ts's `mockExtraction` — no OCR/AI runs
# here yet (Phase 8: "Do NOT implement OCR yet").
_MOCK_FIELDS: dict[str, list[dict]] = {
    "prescription": [
        {"label": "Prescriber", "value": "Dr. R. Sharma"},
        {"label": "Date", "value": "05 Nov 2024"},
        {"label": "Medications", "value": "Amlodipine 5mg OD, Metformin 500mg BD"},
    ],
    "lab": [
        {"label": "Panel", "value": "Complete Blood Count"},
        {"label": "Haemoglobin", "value": "11.2 g/dL (low)"},
        {"label": "Collected", "value": "15 Jan 2025"},
    ],
    "discharge": [
        {"label": "Facility", "value": "Civil Hospital"},
        {"label": "Admitted", "value": "12 Feb 2024"},
        {"label": "Discharged", "value": "16 Feb 2024"},
    ],
    "imaging": [
        {"label": "Study", "value": "Chest X-ray PA view"},
        {"label": "Reported", "value": "18 Mar 2025"},
    ],
    "other": [{"label": "Document type", "value": "Other Document"}],
}


def _validate(file: UploadFile, size: int, settings: Settings) -> None:
    if file.content_type not in ACCEPTED_MIME_TYPES:
        raise HTTPException(status_code=422, detail=f"Unsupported file type: {file.content_type}")
    if size > settings.max_upload_bytes:
        raise HTTPException(status_code=422, detail="File exceeds the maximum upload size")


def save_upload(
    db: Session,
    file: UploadFile,
    doc_type: str,
    document_session_id: str | None,
    settings: Settings,
) -> dict:
    if doc_type not in DOCUMENT_TYPES:
        raise HTTPException(status_code=422, detail=f"Unknown document type: {doc_type}")

    contents = file.file.read()
    _validate(file, len(contents), settings)

    document_id = f"doc-{uuid.uuid4().hex[:12]}"
    upload_dir = Path(settings.upload_dir)
    upload_dir.mkdir(parents=True, exist_ok=True)
    storage_path = upload_dir / document_id
    storage_path.write_bytes(contents)

    fields = _MOCK_FIELDS[doc_type]
    document = Document(
        id=document_id,
        patient_id=None,
        document_session_id=document_session_id,
        name=file.filename or document_id,
        size=len(contents),
        mime_type=file.content_type or "application/octet-stream",
        doc_type=doc_type,
        stage="complete",
        progress=100,
        storage_path=str(storage_path),
        detected_type=doc_type,
        confidence=0.92,
    )
    db.add(document)
    db.flush()
    for field in fields:
        db.add(DocumentExtractionField(document_id=document.id, label=field["label"], value=field["value"]))
    db.commit()

    return {
        "documentId": document.id,
        "detectedType": document.detected_type,
        "confidence": document.confidence,
        "fields": fields,
    }


def remove(db: Session, document_id: str, settings: Settings) -> bool:
    document = db.get(Document, document_id)
    if not document:
        return False
    if document.storage_path:
        Path(document.storage_path).unlink(missing_ok=True)
    db.delete(document)
    db.commit()
    return True
