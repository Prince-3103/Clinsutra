"""
Authentication service: credential checks and demo-doctor seeding.

Kept separate from the JWT/hashing primitives (app/core/security.py) and the
FastAPI dependencies (app/core/auth.py) so the rules live in one place.
"""
from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import Settings
from app.core.security import hash_password, verify_password
from app.models import Doctor


def get_by_email(db: Session, email: str) -> Doctor | None:
    normalized = (email or "").strip().lower()
    if not normalized:
        return None
    return db.scalar(select(Doctor).where(Doctor.email == normalized))


def authenticate(db: Session, email: str, password: str) -> Doctor | None:
    """Return the doctor iff the email exists, is active, and the password
    matches. Returns None otherwise — the caller maps that to a 401 without
    revealing which part failed (no user enumeration)."""
    user = get_by_email(db, email)
    if user is None or not user.is_active:
        return None
    if not verify_password(password, user.password_hash):
        return None
    return user


def seed_demo_doctor(db: Session, settings: Settings) -> Doctor:
    """Idempotently ensure the demo doctor exists with login credentials.

    Uses the seeded identity (settings.doctor_*) as the same row, so
    `/doctors/me` and login refer to one clinician. Safe to call repeatedly:
    it fills in missing auth fields on an older row and never overwrites an
    existing password hash.
    """
    doctor = db.get(Doctor, settings.doctor_id)
    email = settings.demo_doctor_email.strip().lower()

    if doctor is None:
        doctor = Doctor(
            id=settings.doctor_id,
            name=settings.doctor_name,
            specialty=settings.doctor_specialty,
            room=settings.doctor_room,
            initials=settings.doctor_initials,
            email=email,
            password_hash=hash_password(settings.demo_doctor_password),
            role="doctor",
            is_active=True,
        )
        db.add(doctor)
    else:
        if not doctor.email:
            doctor.email = email
        if not doctor.password_hash:
            doctor.password_hash = hash_password(settings.demo_doctor_password)
        if not doctor.role:
            doctor.role = "doctor"
    db.commit()
    db.refresh(doctor)
    return doctor
