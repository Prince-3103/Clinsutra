"""Authentication endpoints: login (issue JWT) and me (current user)."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.core.database import get_db
from app.core.security import create_access_token
from app.models import Doctor
from app.schemas.auth import AuthUserOut, LoginRequest, TokenResponse
from app.services import auth_service

router = APIRouter(tags=["auth"])


def _to_user_out(user: Doctor) -> AuthUserOut:
    return AuthUserOut(
        id=user.id,
        email=user.email,
        name=user.name,
        role=user.role,
        is_active=user.is_active,
        specialty=user.specialty,
        room=user.room,
        initials=user.initials,
    )


@router.post("/auth/login", response_model=TokenResponse)
def login(body: LoginRequest, db: Session = Depends(get_db)):
    """Exchange email + password for a JWT access token.

    Returns 401 for unknown email, wrong password, or an inactive account —
    without revealing which, to avoid user enumeration. Never returns or logs
    the password or its hash."""
    user = auth_service.authenticate(db, body.email, body.password)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = create_access_token(subject=user.id, role=user.role)
    return TokenResponse(access_token=token, token_type="bearer", user=_to_user_out(user))


@router.get("/auth/me", response_model=AuthUserOut)
def me(current_user: Doctor = Depends(get_current_user)):
    """Return the currently authenticated user (from the bearer token)."""
    return _to_user_out(current_user)
