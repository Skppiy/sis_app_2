"""add school year and enrollment year

Revision ID: add_school_year
Revises: 99f0476a11b6
Create Date: 2025-08-10
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = 'add_school_year'
down_revision = '99f0476a11b6'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'school_years',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('start_date', sa.Date(), nullable=False),
        sa.Column('end_date', sa.Date(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    )

    # add school_year_id to enrollments
    op.add_column('enrollments', sa.Column('school_year_id', postgresql.UUID(as_uuid=True), nullable=True))
    op.create_index('ix_enrollments_school_year_id', 'enrollments', ['school_year_id'])
    op.create_foreign_key(None, 'enrollments', 'school_years', ['school_year_id'], ['id'], ondelete='SET NULL')

    # Adjust unique constraint to include year
    try:
        op.drop_constraint('uq_classroom_student', 'enrollments', type_='unique')
    except Exception:
        pass
    op.create_unique_constraint('uq_classroom_student_year', 'enrollments', ['classroom_id', 'student_id', 'school_year_id'])


def downgrade():
    try:
        op.drop_constraint('uq_classroom_student_year', 'enrollments', type_='unique')
    except Exception:
        pass
    op.create_unique_constraint('uq_classroom_student', 'enrollments', ['classroom_id', 'student_id'])

    op.drop_index('ix_enrollments_school_year_id', table_name='enrollments')
    op.drop_column('enrollments', 'school_year_id')

    op.drop_table('school_years')


