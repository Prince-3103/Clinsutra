"""
Role gate for doctor-only actions.

Real authentication/RBAC is out of scope for this phase (there is a single
seeded doctor — see app/services/patient_service.get_current_doctor). This is a
deliberate, minimal placeholder so destructive doctor-only endpoints (e.g.
DELETE /patients/{id}) are enforced on the server, not just hidden in the UI.

The doctor dashboard sends `X-User-Role: doctor`; a request without it is
rejected with 403. When real auth arrives, replace the header check here with
the authenticated session/JWT role claim — no endpoint code needs to change.
"""
from __future__ import annotations

from fastapi import Header, HTTPException


def require_doctor(x_user_role: str | None = Header(default=None, alias="X-User-Role")) -> str:
    """FastAPI dependency: allow only requests carrying the doctor role."""
    role = (x_user_role or "").strip().lower()
    if role != "doctor":
        raise HTTPException(status_code=403, detail="This action requires the doctor role.")
    return role
