"""add red_flag_resolved to patients

Revision ID: a17c9e4f2b3d
Revises: d223b55f7e73
Create Date: 2026-09-08 19:40:00.000000

Adds the single column the "Mark as Reviewed" doctor action needs. It is
purely additive: `priority`, `red_flag` and `flags` (the original triage
result) are never touched by this migration or by the feature that uses this
column, so existing rows and existing history stay intact.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a17c9e4f2b3d'
down_revision: Union[str, Sequence[str], None] = 'd223b55f7e73'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        'patients',
        sa.Column('red_flag_resolved', sa.Boolean(), nullable=False, server_default=sa.false()),
    )
    # Drop the server_default after backfilling existing rows so future
    # inserts rely on the SQLAlchemy-side default instead of a DB-level one.
    op.alter_column('patients', 'red_flag_resolved', server_default=None)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('patients', 'red_flag_resolved')
