"""add_emergency_requirements_and_severity
 
Revision ID: c4d5e6f7a8b9
Revises: b3c4d5e6f7a8
Create Date: 2026-09-08 00:15:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c4d5e6f7a8b9'
down_revision: Union[str, Sequence[str], None] = 'b3c4d5e6f7a8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """
    Upgrade schema:
    1. Add severity, location, and updated_at columns to emergencies table.
    2. Create emergency_requirements table.
    """
    # 1. Alter emergencies table
    op.add_column(
        'emergencies',
        sa.Column(
            'severity',
            sa.String(length=20),
            nullable=False,
            server_default='medium',
        )
    )
    op.add_column(
        'emergencies',
        sa.Column(
            'location',
            sa.String(),
            nullable=True,
        )
    )
    op.add_column(
        'emergencies',
        sa.Column(
            'updated_at',
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=True,
        )
    )

    # 2. Create emergency_requirements table
    op.create_table(
        'emergency_requirements',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column(
            'emergency_id',
            sa.Integer(),
            sa.ForeignKey('emergencies.id', ondelete='CASCADE'),
            nullable=False,
            index=True,
        ),
        sa.Column('skill_category', sa.String(), nullable=False),
        sa.Column('skill_title', sa.String(), nullable=True),
        sa.Column(
            'min_volunteers_needed',
            sa.Integer(),
            nullable=False,
            server_default='1',
        ),
        sa.Column(
            'min_proficiency',
            sa.String(length=20),
            nullable=False,
            server_default='intermediate',
        ),
        sa.Column(
            'urgency',
            sa.String(length=20),
            nullable=False,
            server_default='medium',
        ),
        sa.Column(
            'created_at',
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=True,
        ),
        sa.Column(
            'updated_at',
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=True,
        ),
    )


def downgrade() -> None:
    """
    Downgrade schema:
    1. Drop emergency_requirements table.
    2. Remove updated_at, location, and severity columns from emergencies.
    """
    op.drop_table('emergency_requirements')
    op.drop_column('emergencies', 'updated_at')
    op.drop_column('emergencies', 'location')
    op.drop_column('emergencies', 'severity')
