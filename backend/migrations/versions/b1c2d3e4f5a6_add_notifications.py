"""add_notifications

Revision ID: b1c2d3e4f5a6
Revises: a0b1c2d3e4f5
Create Date: 2026-09-08 21:18:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b1c2d3e4f5a6'
down_revision: Union[str, Sequence[str], None] = 'a0b1c2d3e4f5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """
    Upgrade schema:
    Create notifications table with user isolation indexes.
    """
    op.create_table(
        'notifications',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column(
            'user_id',
            sa.Integer(),
            sa.ForeignKey('users.id', ondelete='CASCADE'),
            nullable=False,
            index=True,
        ),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('type', sa.String(length=50), nullable=False, index=True),
        sa.Column('severity', sa.String(length=20), server_default='info', nullable=False),
        sa.Column('related_entity_type', sa.String(length=50), nullable=True, index=True),
        sa.Column('related_entity_id', sa.Integer(), nullable=True, index=True),
        sa.Column('is_read', sa.Boolean(), server_default=sa.text('false'), nullable=False, index=True),
        sa.Column('read_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            'created_at',
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
            index=True,
        ),
    )

    op.create_index(
        'ix_notifications_user_id_is_read',
        'notifications',
        ['user_id', 'is_read'],
    )
    op.create_index(
        'ix_notifications_user_id_created_at',
        'notifications',
        ['user_id', 'created_at'],
    )


def downgrade() -> None:
    """
    Downgrade schema:
    Drop notifications table and associated indexes.
    """
    op.drop_index('ix_notifications_user_id_created_at', table_name='notifications')
    op.drop_index('ix_notifications_user_id_is_read', table_name='notifications')
    op.drop_table('notifications')
