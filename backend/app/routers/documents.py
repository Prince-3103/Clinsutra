from __future__ import annotations

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.core.config import Settings, get_settings
from app.core.database import get_db
from app.schemas.document import DocumentExtractionOut
from app.services import document_service

router = APIRouter(tags=["documents"])


@router.post("/documents", response_model=DocumentExtractionOut)
def upload_document(
    file: UploadFile = File(...),
    docType: str = Form(...),
    documentSessionId: str | None = Form(None),
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
):
    return document_service.save_upload(db, file, docType, documentSessionId, settings)


@router.delete("/documents/{document_id}", status_code=204)
def delete_document(document_id: str, db: Session = Depends(get_db), settings: Settings = Depends(get_settings)):
    removed = document_service.remove(db, document_id, settings)
    if not removed:
        raise HTTPException(status_code=404, detail="Document not found")
    return None
