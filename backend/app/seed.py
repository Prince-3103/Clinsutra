"""
Seed the demo doctor with login credentials.

Run once after applying migrations, against the real database:

    python -m app.seed

Idempotent: safe to re-run. Reads DEMO_DOCTOR_EMAIL / DEMO_DOCTOR_PASSWORD (and
the DOCTOR_* identity) from the environment/.env. The password is bcrypt-hashed
before storage — the plaintext is never written to the database or logged.
"""
from __future__ import annotations

from app.core.config import get_settings
from app.core.database import SessionLocal
from app.services import auth_service


def main() -> None:
    settings = get_settings()
    db = SessionLocal()
    try:
        doctor = auth_service.seed_demo_doctor(db, settings)
        # Print identity only — never the password or its hash.
        print(f"Seeded doctor id={doctor.id} email={doctor.email} role={doctor.role}")
    finally:
        db.close()


if __name__ == "__main__":
    main()
