"""Small shared helpers for the ORM models."""

import secrets
from datetime import datetime, timezone

from sqlalchemy import DateTime
from sqlalchemy.orm import Mapped, mapped_column


def generate_id(prefix: str) -> str:
    """A short, URL-safe id, e.g. `doc-a1b2c3d4e5f6`.

    Good enough for an SIH prototype's volumes; swap for UUIDs or DB sequences
    if this ever needs to scale past a single MySQL instance.
    """
    return f"{prefix}-{secrets.token_hex(6)}"


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class TimestampMixin:
    """Adds `created_at` / `updated_at`, kept server-side so clients can't spoof them."""

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False
    )
