"""add_disaster_simulations

Revision ID: d3e4f5a6b7c8
Revises: c2d3e4f5a6b7
Create Date: 2026-09-09 01:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd3e4f5a6b7c8'
down_revision: Union[str, Sequence[str], None] = 'c2d3e4f5a6b7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """
    Upgrade schema:
    Create simulation_scenarios, simulation_requirements, and simulation_results tables.
    """
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    tables = inspector.get_table_names()

    if 'simulation_scenarios' not in tables:
        op.create_table(
            'simulation_scenarios',
            sa.Column('id', sa.Integer(), primary_key=True, index=True),
            sa.Column('name', sa.String(length=255), nullable=False),
            sa.Column('description', sa.Text(), nullable=True),
            sa.Column('disaster_type', sa.String(length=50), nullable=False),
            sa.Column('severity', sa.String(length=20), server_default='medium', nullable=False),
            sa.Column('center_latitude', sa.Float(), nullable=False),
            sa.Column('center_longitude', sa.Float(), nullable=False),
            sa.Column('affected_radius_km', sa.Float(), server_default='20.0', nullable=False),
            sa.Column('affected_population', sa.Integer(), server_default='1000', nullable=False),
            sa.Column('duration_hours', sa.Integer(), server_default='24', nullable=False),
            sa.Column('demand_multiplier', sa.Float(), server_default='1.0', nullable=False),
            sa.Column('status', sa.String(length=20), server_default='draft', nullable=False, index=True),
            sa.Column(
                'creator_id',
                sa.Integer(),
                sa.ForeignKey('users.id', ondelete='SET NULL'),
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
        )

    if 'simulation_requirements' not in tables:
        op.create_table(
            'simulation_requirements',
            sa.Column('id', sa.Integer(), primary_key=True, index=True),
            sa.Column(
                'scenario_id',
                sa.Integer(),
                sa.ForeignKey('simulation_scenarios.id', ondelete='CASCADE'),
                nullable=False,
                index=True,
            ),
            sa.Column('skill_category', sa.String(length=100), nullable=False),
            sa.Column('skill_title', sa.String(length=255), nullable=True),
            sa.Column('min_proficiency', sa.String(length=20), server_default='intermediate', nullable=False),
            sa.Column('urgency', sa.String(length=20), server_default='medium', nullable=False),
            sa.Column('required_volunteers', sa.Integer(), server_default='1', nullable=False),
            sa.Column(
                'created_at',
                sa.DateTime(timezone=True),
                server_default=sa.func.now(),
                nullable=False,
            ),
        )

    if 'simulation_results' not in tables:
        op.create_table(
            'simulation_results',
            sa.Column('id', sa.Integer(), primary_key=True, index=True),
            sa.Column(
                'scenario_id',
                sa.Integer(),
                sa.ForeignKey('simulation_scenarios.id', ondelete='CASCADE'),
                nullable=False,
                unique=True,
                index=True,
            ),
            sa.Column('total_demand', sa.Integer(), server_default='0', nullable=False),
            sa.Column('total_available_capacity', sa.Integer(), server_default='0', nullable=False),
            sa.Column('total_fulfilled', sa.Integer(), server_default='0', nullable=False),
            sa.Column('total_unfulfilled', sa.Integer(), server_default='0', nullable=False),
            sa.Column('fulfillment_percentage', sa.Float(), server_default='0.0', nullable=False),
            sa.Column('response_pressure', sa.String(length=20), server_default='low', nullable=False),
            sa.Column('geographic_coverage_percentage', sa.Float(), server_default='0.0', nullable=False),
            sa.Column('eligible_volunteer_count', sa.Integer(), server_default='0', nullable=False),
            sa.Column('skill_results_json', sa.JSON(), nullable=True),
            sa.Column('timeline_json', sa.JSON(), nullable=True),
            sa.Column(
                'executed_at',
                sa.DateTime(timezone=True),
                server_default=sa.func.now(),
                nullable=False,
            ),
        )


def downgrade() -> None:
    """
    Downgrade schema:
    Drop simulation_results, simulation_requirements, and simulation_scenarios tables.
    """
    op.drop_table('simulation_results')
    op.drop_table('simulation_requirements')
    op.drop_table('simulation_scenarios')
