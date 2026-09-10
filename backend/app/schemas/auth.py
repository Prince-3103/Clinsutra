"""Auth request/response schemas. Never include the password hash on the wire."""
from __future__ import annotations

from pydantic import EmailStr

from app.schemas.common import CamelModel


class LoginRequest(CamelModel):
    email: EmailStr
    password: str


class AuthUserOut(CamelModel):
    """Safe view of the authenticated user — no password/hash is ever exposed."""

    id: str
    email: str | None = None
    name: str
    role: str
    is_active: bool
    specialty: str
    room: str
    initials: str


class TokenResponse(CamelModel):
    access_token: str
    token_type: str = "bearer"
    user: AuthUserOut
