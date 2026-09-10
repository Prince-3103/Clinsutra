"""add auth fields to doctors (email, password_hash, role, is_active, timestamps)

Revision ID: c39e7a4d5b21
Revises: b28d5f1a9c6e
Create Date: 2026-09-10 10:00:00.000000

Phase 1 authentication/RBAC. Purely additive — six new columns on the existing
`doctors` table; no table is created or dropped and no existing row is deleted.

All new columns are nullable or carry a server-side default, so existing rows
(e.g. the pre-auth seeded doctor) stay valid. `email` / `password_hash` are
nullable and filled in by the seed step (app/seed.py); `role` defaults to
'doctor' and `is_active` to true. No DEFAULT is placed on a TEXT column, so this
is MySQL/MariaDB compatible.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "c39e7a4d5b21"
down_revision: Union[str, Sequence[str], None] = "b28d5f1a9c6e"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column("doctors", sa.Column("email", sa.String(length=255), nullable=True))
    op.add_column("doctors", sa.Column("password_hash", sa.String(length=255), nullable=True))
    op.add_column(
        "doctors",
        sa.Column("role", sa.String(length=20), nullable=False, server_default="doctor"),
    )
    op.add_column(
        "doctors",
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
    )
    op.add_column(
        "doctors",
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "doctors",
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_unique_constraint("uq_doctors_email", "doctors", ["email"])


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_constraint("uq_doctors_email", "doctors", type_="unique")
    op.drop_column("doctors", "updated_at")
    op.drop_column("doctors", "created_at")
    op.drop_column("doctors", "is_active")
    op.drop_column("doctors", "role")
    op.drop_column("doctors", "password_hash")
    op.drop_column("doctors", "email")
