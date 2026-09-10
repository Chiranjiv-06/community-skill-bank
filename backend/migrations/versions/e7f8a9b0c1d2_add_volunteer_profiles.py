"""add_volunteer_profiles

Revision ID: e7f8a9b0c1d2
Revises: d0d2b217ce59
Create Date: 2026-09-07 23:55:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e7f8a9b0c1d2'
down_revision: Union[str, Sequence[str], None] = 'd0d2b217ce59'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema — creates volunteer_profiles table."""
    op.create_table(
        'volunteer_profiles',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('emergency_contact_name', sa.String(), nullable=True),
        sa.Column('emergency_contact_phone', sa.String(), nullable=True),
        sa.Column('transportation_type', sa.String(), nullable=True),
        sa.Column('max_travel_distance_km', sa.Float(), nullable=False, server_default='20.0'),
        sa.Column('experience_years', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id')
    )
    op.create_index(op.f('ix_volunteer_profiles_id'), 'volunteer_profiles', ['id'], unique=False)
    op.create_index(op.f('ix_volunteer_profiles_user_id'), 'volunteer_profiles', ['user_id'], unique=True)


def downgrade() -> None:
    """Downgrade schema — drops volunteer_profiles table."""
    op.drop_index(op.f('ix_volunteer_profiles_user_id'), table_name='volunteer_profiles')
    op.drop_index(op.f('ix_volunteer_profiles_id'), table_name='volunteer_profiles')
    op.drop_table('volunteer_profiles')
