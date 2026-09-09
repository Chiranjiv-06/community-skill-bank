"""add_experience_proficiency_to_skills

Revision ID: b3c4d5e6f7a8
Revises: e7f8a9b0c1d2
Create Date: 2026-09-08 00:04:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b3c4d5e6f7a8'
down_revision: Union[str, Sequence[str], None] = 'e7f8a9b0c1d2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema — adds experience_years and proficiency columns to skills table."""
    op.add_column(
        'skills',
        sa.Column(
            'experience_years',
            sa.Integer(),
            nullable=False,
            server_default='0',
        )
    )
    op.add_column(
        'skills',
        sa.Column(
            'proficiency',
            sa.String(length=20),
            nullable=False,
            server_default='intermediate',
        )
    )


def downgrade() -> None:
    """Downgrade schema — removes experience_years and proficiency columns from skills table."""
    op.drop_column('skills', 'proficiency')
    op.drop_column('skills', 'experience_years')
