"""drop school_id from school_years

Revision ID: drop_school_year_school_id
Revises: add_school_year
Create Date: 2025-08-10
"""

from alembic import op

revision = 'drop_school_year_school_id'
down_revision = 'add_school_year'
branch_labels = None
depends_on = None


def upgrade():
    # Safely drop the school_id column if it exists (older schema)
    op.execute("ALTER TABLE school_years DROP COLUMN IF EXISTS school_id CASCADE")


def downgrade():
    # Downgrade is a no-op because we don't want to recreate the old schema
    pass












