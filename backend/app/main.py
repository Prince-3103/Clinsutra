"""
FastAPI entrypoint. Routers are mounted under `/api` to match the frontend's
default `VITE_API_BASE_URL=http://localhost:8000/api`. Table creation is
Alembic's job (see `alembic/`) — this file never calls `Base.metadata.create_all`.
"""

import logging
import traceback

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import get_settings
from app.routers import clinical, documents, interview, kiosk, patients

settings = get_settings()
logger = logging.getLogger("clinsutra")

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


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """
    Without this, an unhandled exception is caught by Starlette's default
    ServerErrorMiddleware, which sits *outside* CORSMiddleware — so the
    response it sends back has no Access-Control-Allow-Origin header. The
    browser then reports the failure as a CORS error, hiding the real 500
    and its cause. A handler registered on the app runs *inside* the
    middleware stack instead, so CORSMiddleware still gets to add its
    headers, and we get one place to log the actual traceback.

    The response body stays generic on purpose — never echo exception
    details (which can include patient data) back to the browser.
    """
    logger.error(
        "Unhandled error on %s %s:\n%s",
        request.method,
        request.url.path,
        traceback.format_exc(),
    )
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error. See the backend server log for details."},
    )


app.include_router(patients.router, prefix="/api")
app.include_router(kiosk.router, prefix="/api")
app.include_router(interview.router, prefix="/api")
app.include_router(clinical.router, prefix="/api")
app.include_router(documents.router, prefix="/api")


@app.get("/health", tags=["health"])
def health():
    return {"status": "ok"}
