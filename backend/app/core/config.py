"""
Environment-driven settings. Nothing here is hardcoded: the database
credentials, allowed CORS origin and upload limits all come from `.env`, so
this file never has to change between a laptop, a demo box and the sandbox
used to build this backend.
"""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # SQLAlchemy connection string. Any MySQL 5.7+/8.x server works — this
    # backend does not depend on MySQL-8-only features.
    database_url: str = "mysql+pymysql://root:password@localhost:3306/clinsutra?charset=utf8mb4"
    test_database_url: str = (
        "mysql+pymysql://root:password@localhost:3306/clinsutra_test?charset=utf8mb4"
    )

    # Comma-separated origins allowed to call the API. Kept restrictive on
    # purpose — see Phase 12 of the spec ("no unrestricted origins").
    frontend_url: str = "http://localhost:5173"

    upload_dir: str = "./uploads"
    max_upload_bytes: int = 10 * 1024 * 1024

    # Seeded single-clinician identity (name/room/etc). The login credentials
    # for this doctor come from the demo_doctor_* settings below.
    doctor_id: str = "DOC-01"
    doctor_name: str = "Dr. Anjali Mehta"
    doctor_specialty: str = "Cardiologist"
    doctor_room: str = "OPD 3"
    doctor_initials: str = "A"

    # --- Authentication (JWT + RBAC) ----------------------------------------
    # The signing secret MUST be provided via the environment in any real
    # deployment. The default below is an obvious dev-only placeholder so tests
    # and local runs work out of the box; it is not a real secret and must be
    # overridden with a long random value in production.
    jwt_secret_key: str = "dev-insecure-change-me-in-production"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60

    # Credentials the demo doctor is seeded with (see app/seed.py and
    # app/services/auth_service.seed_demo_doctor). The password is hashed with
    # bcrypt before it is ever stored — the plaintext never reaches the DB.
    # Override both in the environment; never commit real credentials.
    demo_doctor_email: str = "doctor@clinsutra.demo"
    demo_doctor_password: str = "change-me"

    # Gemini is the current MVP LLM provider (see app/services/ai_service.py).
    # Empty by default on purpose: with no key set, the AI service treats
    # itself as unconfigured and every AI endpoint falls back to
    # deterministic behaviour instead of failing — the app must work with
    # zero AI setup. The key never leaves the backend (never sent to, or
    # read from, the frontend).
    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.0-flash"
    gemini_timeout_seconds: float = 12.0

    # Separate model id for the Gemini Live (bidirectional audio) session used
    # by the voice relay (app/routers/voice.py). Live requires a *-live model —
    # the plain `gemini_model` above is text-only and cannot be used here. Voice
    # is speech-to-text only: the Live session's generative output is discarded,
    # so Gemini never diagnoses or triages (deterministic triage stays
    # authoritative). If this is unset or the session fails, the frontend falls
    # back to the browser Web Speech engine.
    gemini_live_model: str = "gemini-3.5-transcribe-live"

    @property
    def allowed_origins(self) -> list[str]:
        return [origin.strip() for origin in self.frontend_url.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
