"""add_certifications_and_trainings

Revision ID: e8f9a0b1c2d3
Revises: d5e6f7a8b9c0
Create Date: 2026-09-08 20:10:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e8f9a0b1c2d3'
down_revision: Union[str, Sequence[str], None] = 'd5e6f7a8b9c0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """
    Upgrade schema:
    1. Create volunteer_certifications table.
    2. Create volunteer_trainings table.
    """
    # 1. volunteer_certifications table
    op.create_table(
        'volunteer_certifications',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column(
            'user_id',
            sa.Integer(),
            sa.ForeignKey('users.id', ondelete='CASCADE'),
            nullable=False,
            index=True,
        ),
        sa.Column(
            'skill_id',
            sa.Integer(),
            sa.ForeignKey('skills.id', ondelete='SET NULL'),
            nullable=True,
            index=True,
        ),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('issuing_organization', sa.String(), nullable=False),
        sa.Column('credential_id', sa.String(), nullable=True),
        sa.Column('issue_date', sa.Date(), nullable=True),
        sa.Column('expiry_date', sa.Date(), nullable=True),
        sa.Column(
            'verification_status',
            sa.String(length=20),
            nullable=False,
            server_default='pending',
            index=True,
        ),
        sa.Column(
            'verified_by_id',
            sa.Integer(),
            sa.ForeignKey('users.id', ondelete='SET NULL'),
            nullable=True,
        ),
        sa.Column('verification_notes', sa.Text(), nullable=True),
        sa.Column('verified_at', sa.DateTime(timezone=True), nullable=True),
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
    )

    # 2. volunteer_trainings table
    op.create_table(
        'volunteer_trainings',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column(
            'user_id',
            sa.Integer(),
            sa.ForeignKey('users.id', ondelete='CASCADE'),
            nullable=False,
            index=True,
        ),
        sa.Column('course_name', sa.String(), nullable=False),
        sa.Column('provider', sa.String(), nullable=False),
        sa.Column('completion_date', sa.Date(), nullable=True),
        sa.Column(
            'hours_completed',
            sa.Integer(),
            nullable=False,
            server_default='0',
        ),
        sa.Column('credential_url', sa.String(), nullable=True),
        sa.Column(
            'status',
            sa.String(length=20),
            nullable=False,
            server_default='completed',
            index=True,
        ),
        sa.Column(
            'verified_by_id',
            sa.Integer(),
            sa.ForeignKey('users.id', ondelete='SET NULL'),
            nullable=True,
        ),
        sa.Column('verified_at', sa.DateTime(timezone=True), nullable=True),
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
    )


def downgrade() -> None:
    """
    Downgrade schema:
    1. Drop volunteer_trainings table.
    2. Drop volunteer_certifications table.
    """
    op.drop_table('volunteer_trainings')
    op.drop_table('volunteer_certifications')
