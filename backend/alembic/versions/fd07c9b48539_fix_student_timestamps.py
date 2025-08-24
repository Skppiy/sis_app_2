# Create a new migration file: backend/alembic/versions/fix_student_timestamps.py
"""add missing student timestamps

Revision ID: fd07c9b48539
Revises: 1aca04b4daa6
Create Date: 2025-01-18
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.sql import func

revision = 'fd07c9b48539'
down_revision = '1aca04b4daa6'  # Replace with your actual latest revision
branch_labels = None
depends_on = None

def upgrade():
    # Check if columns exist before adding
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    existing_columns = [col['name'] for col in inspector.get_columns('students')]
    
    if 'created_at' not in existing_columns:
        op.add_column('students', 
            sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, 
                     server_default=sa.func.now()))
    
    if 'updated_at' not in existing_columns:
        op.add_column('students', 
            sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, 
                     server_default=sa.func.now()))

def downgrade():
    op.drop_column('students', 'updated_at')
    op.drop_column('students', 'created_at')