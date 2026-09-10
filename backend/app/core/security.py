"""
Password hashing (bcrypt) and JWT creation/verification.

Nothing here logs or returns a plaintext password or a hash. The JWT carries
only the user id (`sub`), the `role`, and standard `iat`/`exp` claims — never
any patient data. The signing secret and expiry come from settings (env).
"""
from __future__ import annotations

import datetime as dt

import bcrypt
import jwt

from app.core.config import get_settings

# bcrypt hashes at most the first 72 bytes of a password; longer inputs raise in
# bcrypt 4.x. Guard so an over-long password fails cleanly rather than 500ing.
_BCRYPT_MAX_BYTES = 72


def hash_password(password: str) -> str:
    """Return a bcrypt hash of `password`. The plaintext is never stored."""
    pw = password.encode("utf-8")[:_BCRYPT_MAX_BYTES]
    return bcrypt.hashpw(pw, bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, password_hash: str | None) -> bool:
    """Constant-time check of a plaintext password against a stored hash."""
    if not password_hash:
        return False
    try:
        return bcrypt.checkpw(
            password.encode("utf-8")[:_BCRYPT_MAX_BYTES],
            password_hash.encode("utf-8"),
        )
    except (ValueError, TypeError):
        return False


def create_access_token(*, subject: str, role: str) -> str:
    """Mint a signed JWT for `subject` (user id) with its `role` and an expiry."""
    settings = get_settings()
    now = dt.datetime.now(dt.timezone.utc)
    payload = {
        "sub": subject,
        "role": role,
        "iat": now,
        "exp": now + dt.timedelta(minutes=settings.access_token_expire_minutes),
    }
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


class TokenError(Exception):
    """Raised when a token is missing, malformed, invalid, or expired."""


def decode_access_token(token: str) -> dict:
    """Decode and verify a JWT, or raise TokenError (invalid/expired/etc.)."""
    settings = get_settings()
    try:
        return jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
    except jwt.PyJWTError as exc:  # covers expired, bad signature, malformed
        raise TokenError(str(exc)) from exc
