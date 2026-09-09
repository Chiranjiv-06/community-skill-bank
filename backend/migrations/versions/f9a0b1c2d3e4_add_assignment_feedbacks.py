"""add_assignment_feedbacks

Revision ID: f9a0b1c2d3e4
Revises: e8f9a0b1c2d3
Create Date: 2026-09-08 20:25:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f9a0b1c2d3e4'
down_revision: Union[str, Sequence[str], None] = 'e8f9a0b1c2d3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """
    Upgrade schema:
    Create assignment_feedbacks table for post-incident evaluations and service hours.
    """
    op.create_table(
        'assignment_feedbacks',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column(
            'assignment_id',
            sa.Integer(),
            sa.ForeignKey('emergency_assignments.id', ondelete='CASCADE'),
            nullable=False,
            unique=True,
            index=True,
        ),
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
            'submitted_by_id',
            sa.Integer(),
            sa.ForeignKey('users.id', ondelete='SET NULL'),
            nullable=True,
        ),
        sa.Column('rating', sa.Integer(), nullable=False),
        sa.Column('hours_served', sa.Float(), nullable=False),
        sa.Column('feedback_notes', sa.Text(), nullable=True),
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
        sa.UniqueConstraint('assignment_id', name='uq_assignment_feedback'),
    )


def downgrade() -> None:
    """
    Downgrade schema:
    Drop assignment_feedbacks table.
    """
    op.drop_table('assignment_feedbacks')
