"""add_community_activities

Revision ID: a0b1c2d3e4f5
Revises: f9a0b1c2d3e4
Create Date: 2026-09-08 20:36:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a0b1c2d3e4f5'
down_revision: Union[str, Sequence[str], None] = 'f9a0b1c2d3e4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """
    Upgrade schema:
    Create community_activities and community_participations tables.
    """
    op.create_table(
        'community_activities',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('activity_type', sa.String(length=50), nullable=False, index=True),
        sa.Column(
            'organizer_id',
            sa.Integer(),
            sa.ForeignKey('users.id', ondelete='CASCADE'),
            nullable=False,
            index=True,
        ),
        sa.Column('location_name', sa.String(length=255), nullable=False),
        sa.Column('latitude', sa.Float(), nullable=True),
        sa.Column('longitude', sa.Float(), nullable=True),
        sa.Column('start_datetime', sa.DateTime(timezone=True), nullable=False, index=True),
        sa.Column('end_datetime', sa.DateTime(timezone=True), nullable=False),
        sa.Column('capacity', sa.Integer(), nullable=True),
        sa.Column('status', sa.String(length=20), server_default='published', nullable=False, index=True),
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

    op.create_table(
        'community_participations',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column(
            'activity_id',
            sa.Integer(),
            sa.ForeignKey('community_activities.id', ondelete='CASCADE'),
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
        sa.Column('status', sa.String(length=20), server_default='registered', nullable=False, index=True),
        sa.Column('participation_hours', sa.Float(), nullable=True),
        sa.Column('feedback_notes', sa.Text(), nullable=True),
        sa.Column(
            'registered_at',
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column('attended_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
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
        sa.UniqueConstraint('activity_id', 'volunteer_id', name='uq_activity_volunteer_participation'),
    )


def downgrade() -> None:
    """
    Downgrade schema:
    Drop community_participations and community_activities tables.
    """
    op.drop_table('community_participations')
    op.drop_table('community_activities')
