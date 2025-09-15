"""Add subject archival fields

Revision ID: e54a0aa73ff3
Revises: 
Create Date: 2025-09-11 15:30:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'e54a0aa73ff3'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    # Add archival fields to subjects table if it exists
    try:
        op.add_column('subjects', sa.Column('is_archived', sa.Boolean(), nullable=False, server_default='false'))
        op.add_column('subjects', sa.Column('archived_at', sa.DateTime(), nullable=True))
        op.add_column('subjects', sa.Column('archived_reason', sa.String(length=200), nullable=True))
    except Exception as e:
        print(f"Could not add archival columns to subjects table: {e}")
        # Table might not exist yet, which is fine

def downgrade():
    # Remove archival fields from subjects table if it exists
    try:
        op.drop_column('subjects', 'archived_reason')
        op.drop_column('subjects', 'archived_at') 
        op.drop_column('subjects', 'is_archived')
    except Exception as e:
        print(f"Could not remove archival columns from subjects table: {e}")
