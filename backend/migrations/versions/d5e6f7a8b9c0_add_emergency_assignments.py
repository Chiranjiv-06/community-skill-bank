"""add_emergency_assignments

Revision ID: d5e6f7a8b9c0
Revises: c4d5e6f7a8b9
Create Date: 2026-09-08 20:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd5e6f7a8b9c0'
down_revision: Union[str, Sequence[str], None] = 'c4d5e6f7a8b9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """
    Upgrade schema:
    Create emergency_assignments table for Response & Assignment Lifecycle.
    """
    op.create_table(
        'emergency_assignments',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column(
            'emergency_id',
            sa.Integer(),
            sa.ForeignKey('emergencies.id', ondelete='CASCADE'),
            nullable=False,
            index=True,
        ),
        sa.Column(
            'volunteer_id',
            sa.Integer(),
            sa.ForeignKey('users.id', ondelete='CASCADE'),
            nullable=False,
            index=True,
        ),
        sa.Column(
            'requirement_id',
            sa.Integer(),
            sa.ForeignKey('emergency_requirements.id', ondelete='SET NULL'),
            nullable=True,
            index=True,
        ),
        sa.Column(
            'status',
            sa.String(length=20),
            nullable=False,
            server_default='pending',
            index=True,
        ),
        sa.Column(
            'assigned_by_id',
            sa.Integer(),
            sa.ForeignKey('users.id', ondelete='SET NULL'),
            nullable=True,
        ),
        sa.Column(
            'match_score_at_assignment',
            sa.Float(),
            nullable=True,
        ),
        sa.Column(
            'volunteer_notes',
            sa.Text(),
            nullable=True,
        ),
        sa.Column(
            'admin_notes',
            sa.Text(),
            nullable=True,
        ),
        sa.Column(
            'responded_at',
            sa.DateTime(timezone=True),
            nullable=True,
        ),
        sa.Column(
            'deployed_at',
            sa.DateTime(timezone=True),
            nullable=True,
        ),
        sa.Column(
            'completed_at',
            sa.DateTime(timezone=True),
            nullable=True,
        ),
        sa.Column(
            'cancelled_at',
            sa.DateTime(timezone=True),
            nullable=True,
        ),
        sa.Column(
            'created_at',
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            'updated_at',
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.UniqueConstraint('emergency_id', 'volunteer_id', name='uq_emergency_volunteer'),
    )


def downgrade() -> None:
    """
    Downgrade schema:
    Drop emergency_assignments table.
    """
    op.drop_table('emergency_assignments')
