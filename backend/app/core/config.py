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

    # Seeded single-clinician identity. Real auth/RBAC is explicitly out of
    # scope for this phase.
    doctor_id: str = "DOC-01"
    doctor_name: str = "Dr. Anjali Mehta"
    doctor_specialty: str = "Cardiologist"
    doctor_room: str = "OPD 3"
    doctor_initials: str = "A"

    @property
    def allowed_origins(self) -> list[str]:
        return [origin.strip() for origin in self.frontend_url.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
