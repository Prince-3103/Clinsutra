"""add AI-assisted summary fields to clinical_histories

Revision ID: b28d5f1a9c6e
Revises: a17c9e4f2b3d
Create Date: 2026-09-08 20:05:00.000000

Purely additive — four new columns on the existing `clinical_histories`
table (no new table) for the AI-assisted clinical summary (see
app/services/ai_service.py). Every existing column, row and value is left
untouched.

All four columns are added as NULLable with no server-side default.
MySQL/MariaDB reject a literal `DEFAULT` on BLOB/TEXT/GEOMETRY/JSON columns
(error 1101, "BLOB/TEXT/GEOMETRY/JSON column can't have a default value"),
so `clinical_summary TEXT NOT NULL DEFAULT ''` fails outright — that's what
broke this migration originally. Making it nullable (matching the three
JSON columns, which were already nullable) avoids a DB-level default
entirely; the app supplies the actual default ("" / []) at the ORM layer
for every row it writes going forward (see app/models/clinical.py), and
`clinical_service._history_to_out` treats a NULL here (existing rows from
before this migration) the same as empty.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b28d5f1a9c6e'
down_revision: Union[str, Sequence[str], None] = 'a17c9e4f2b3d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('clinical_histories', sa.Column('key_symptoms', sa.JSON(), nullable=True))
    op.add_column('clinical_histories', sa.Column('risk_indicators', sa.JSON(), nullable=True))
    op.add_column('clinical_histories', sa.Column('suggested_questions', sa.JSON(), nullable=True))
    op.add_column('clinical_histories', sa.Column('clinical_summary', sa.Text(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('clinical_histories', 'clinical_summary')
    op.drop_column('clinical_histories', 'suggested_questions')
    op.drop_column('clinical_histories', 'risk_indicators')
    op.drop_column('clinical_histories', 'key_symptoms')
