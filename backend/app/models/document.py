"""
`Document` mirrors `UploadedDocument` + `DocumentExtraction`. Uploads happen
*before* a patient record exists (during the kiosk flow), so `patient_id` is
nullable and `document_session_id` is how the frontend's client-generated
session id finds its way back to the new patient at `POST /kiosk/submissions`
(see documentService.ts / KioskSessionProvider).

No OCR or AI extraction runs here — `detected_type`/`confidence`/fields are
populated with whatever the caller (today: the frontend's mocked pipeline)
reports; a real extraction service can fill the same columns later without
changing this schema.
"""

from __future__ import annotations

import datetime as dt

from sqlalchemy import DateTime, Enum, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

DOCUMENT_TYPES = ("prescription", "lab", "discharge", "imaging", "other")
PROCESSING_STAGES = ("queued", "uploading", "ocr", "extracting", "structuring", "complete", "failed")


class Document(Base):
    __tablename__ = "documents"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    patient_id: Mapped[str | None] = mapped_column(ForeignKey("patients.id"), nullable=True, index=True)
    document_session_id: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)

    name: Mapped[str] = mapped_column(String(255))
    size: Mapped[int] = mapped_column(Integer)
    mime_type: Mapped[str] = mapped_column(String(120))
    doc_type: Mapped[str] = mapped_column(Enum(*DOCUMENT_TYPES, name="document_type"))
    stage: Mapped[str] = mapped_column(Enum(*PROCESSING_STAGES, name="processing_stage"), default="queued")
    progress: Mapped[int] = mapped_column(Integer, default=0)
    added_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), default=dt.datetime.utcnow)
    error: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Where the uploaded bytes live on disk. Never sent to the frontend.
    storage_path: Mapped[str | None] = mapped_column(String(500), nullable=True)

    detected_type: Mapped[str | None] = mapped_column(
        Enum(*DOCUMENT_TYPES, name="detected_document_type"), nullable=True
    )
    confidence: Mapped[float | None] = mapped_column(Float, nullable=True)

    patient: Mapped["Patient | None"] = relationship(back_populates="documents")  # noqa: F821
    extraction_fields: Mapped[list["DocumentExtractionField"]] = relationship(
        back_populates="document", cascade="all, delete-orphan"
    )


class DocumentExtractionField(Base):
    """One label/value pair from `DocumentExtraction.fields`."""

    __tablename__ = "document_extraction_fields"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    document_id: Mapped[str] = mapped_column(ForeignKey("documents.id"))
    label: Mapped[str] = mapped_column(String(200))
    value: Mapped[str] = mapped_column(String(500))

    document: Mapped["Document"] = relationship(back_populates="extraction_fields")
