from __future__ import annotations

from app.schemas.common import CamelModel


class ExtractionField(CamelModel):
    label: str
    value: str


class DocumentExtractionOut(CamelModel):
    document_id: str
    detected_type: str
    confidence: float
    fields: list[ExtractionField]
