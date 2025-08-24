"""Add city, state, zip_code to schools table

Revision ID: add_school_fields
Revises: 20250809_141315
Create Date: 2025-01-XX XX:XX:XX.XXXXXX

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'add_school_fields'
down_revision = '20250809_141315'
branch_labels = None
depends_on = None

def upgrade():
    # Add missing columns to schools table
    op.add_column('schools', sa.Column('city', sa.String(), nullable=True))
    op.add_column('schools', sa.Column('state', sa.String(), nullable=True))
    op.add_column('schools', sa.Column('zip_code', sa.String(), nullable=True))

def downgrade():
    op.drop_column('schools', 'zip_code')
    op.drop_column('schools', 'state')
    op.drop_column('schools', 'city')
