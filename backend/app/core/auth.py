"""
FastAPI authentication/authorization dependencies (JWT bearer + RBAC).

`get_current_user` validates the `Authorization: Bearer <JWT>` header, decodes
the token, loads the user, and rejects missing/invalid/expired tokens and
inactive accounts with 401. `require_doctor` additionally enforces the doctor
role (403 otherwise).

Authorization is derived ONLY from the verified JWT — never from client-supplied
state or headers such as the old `X-User-Role` (which is no longer trusted).
"""
from __future__ import annotations

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import TokenError, decode_access_token
from app.models import Doctor

# auto_error=False so a missing header yields our own 401 (with WWW-Authenticate)
# instead of FastAPI's generic 403.
_bearer = HTTPBearer(auto_error=False)

_UNAUTHENTICATED = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Not authenticated",
    headers={"WWW-Authenticate": "Bearer"},
)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
    db: Session = Depends(get_db),
) -> Doctor:
    """Resolve the authenticated user from a valid bearer token, or raise 401."""
    if credentials is None or not credentials.credentials:
        raise _UNAUTHENTICATED

    try:
        payload = decode_access_token(credentials.credentials)
    except TokenError:
        raise _UNAUTHENTICATED

    user_id = payload.get("sub")
    if not user_id:
        raise _UNAUTHENTICATED

    user = db.get(Doctor, user_id)
    if user is None or not user.is_active:
        raise _UNAUTHENTICATED

    return user


def require_doctor(user: Doctor = Depends(get_current_user)) -> Doctor:
    """Allow only authenticated users whose role is 'doctor'."""
    if (user.role or "").strip().lower() != "doctor":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This action requires the doctor role.",
        )
    return user
