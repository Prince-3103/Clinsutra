"""
FastAPI entrypoint. Routers are mounted under `/api` to match the frontend's
default `VITE_API_BASE_URL=http://localhost:8000/api`. Table creation is
Alembic's job (see `alembic/`) — this file never calls `Base.metadata.create_all`.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.routers import clinical, documents, interview, kiosk, patients

settings = get_settings()

app = FastAPI(
    title="Clinsutra API",
    description=(
        "Backend for the Clinsutra patient kiosk and doctor dashboard. "
        "Demo triage rules only — nothing here diagnoses or recommends treatment."
    ),
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,  # never "*" — see .env FRONTEND_URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(patients.router, prefix="/api")
app.include_router(kiosk.router, prefix="/api")
app.include_router(interview.router, prefix="/api")
app.include_router(clinical.router, prefix="/api")
app.include_router(documents.router, prefix="/api")


@app.get("/health", tags=["health"])
def health():
    return {"status": "ok"}
