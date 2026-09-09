"""add_audit_logs

Revision ID: e4f5a6b7c8d9
Revises: d3e4f5a6b7c8
Create Date: 2026-09-09 01:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e4f5a6b7c8d9'
down_revision: Union[str, Sequence[str], None] = 'd3e4f5a6b7c8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """
    Upgrade schema:
    Create audit_logs table with composite indexes.
    """
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    tables = inspector.get_table_names()

    if 'audit_logs' not in tables:
        op.create_table(
            'audit_logs',
            sa.Column('id', sa.Integer(), primary_key=True, index=True),
            sa.Column(
                'actor_user_id',
                sa.Integer(),
                sa.ForeignKey('users.id', ondelete='SET NULL'),
                nullable=True,
                index=True,
            ),
            sa.Column('action', sa.String(length=100), nullable=False, index=True),
            sa.Column('entity_type', sa.String(length=50), nullable=False, index=True),
            sa.Column('entity_id', sa.Integer(), nullable=True, index=True),
            sa.Column('outcome', sa.String(length=20), server_default='success', nullable=False),
            sa.Column('request_id', sa.String(length=100), nullable=True, index=True),
            sa.Column('ip_address', sa.String(length=50), nullable=True),
            sa.Column('metadata_json', sa.JSON(), nullable=True),
            sa.Column(
                'timestamp',
                sa.DateTime(timezone=True),
                server_default=sa.func.now(),
                nullable=False,
                index=True,
            ),
        )

        op.create_index(
            'ix_audit_logs_action_timestamp',
            'audit_logs',
            ['action', 'timestamp'],
        )
        op.create_index(
            'ix_audit_logs_entity_composite',
            'audit_logs',
            ['entity_type', 'entity_id'],
        )


def downgrade() -> None:
    """
    Downgrade schema:
    Drop audit_logs table and its indexes.
    """
    op.drop_index('ix_audit_logs_entity_composite', table_name='audit_logs')
    op.drop_index('ix_audit_logs_action_timestamp', table_name='audit_logs')
    op.drop_table('audit_logs')
