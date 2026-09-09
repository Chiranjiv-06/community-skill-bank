"""add_knowledge_documents

Revision ID: c2d3e4f5a6b7
Revises: b1c2d3e4f5a6
Create Date: 2026-09-09 00:15:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c2d3e4f5a6b7'
down_revision: Union[str, Sequence[str], None] = 'b1c2d3e4f5a6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """
    Upgrade schema:
    Create knowledge_documents table with retrieval indexes if not already present.
    """
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    tables = inspector.get_table_names()

    if 'knowledge_documents' not in tables:
        op.create_table(
            'knowledge_documents',
            sa.Column('id', sa.Integer(), primary_key=True, index=True),
            sa.Column('title', sa.String(length=255), nullable=False, index=True),
            sa.Column('content', sa.Text(), nullable=False),
            sa.Column('description', sa.Text(), nullable=True),
            sa.Column('category', sa.String(length=50), nullable=False, index=True),
            sa.Column('disaster_type', sa.String(length=50), nullable=False, index=True),
            sa.Column('source', sa.String(length=255), nullable=False),
            sa.Column('source_url', sa.String(length=512), nullable=True),
            sa.Column('status', sa.String(length=20), server_default='draft', nullable=False, index=True),
            sa.Column(
                'created_by_id',
                sa.Integer(),
                sa.ForeignKey('users.id', ondelete='SET NULL'),
                nullable=True,
                index=True,
            ),
            sa.Column(
                'created_at',
                sa.DateTime(timezone=True),
                server_default=sa.func.now(),
                nullable=False,
                index=True,
            ),
            sa.Column(
                'updated_at',
                sa.DateTime(timezone=True),
                server_default=sa.func.now(),
                nullable=False,
            ),
        )

        op.create_index(
            'ix_knowledge_documents_status_disaster_type',
            'knowledge_documents',
            ['status', 'disaster_type'],
        )
        op.create_index(
            'ix_knowledge_documents_status_category',
            'knowledge_documents',
            ['status', 'category'],
        )


def downgrade() -> None:
    """
    Downgrade schema:
    Drop knowledge_documents table and associated indexes.
    """
    op.drop_index('ix_knowledge_documents_status_category', table_name='knowledge_documents')
    op.drop_index('ix_knowledge_documents_status_disaster_type', table_name='knowledge_documents')
    op.drop_table('knowledge_documents')
