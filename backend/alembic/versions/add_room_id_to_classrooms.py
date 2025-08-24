"""add room_id to classrooms

Revision ID: add_room_id_to_classrooms
Revises: [your_latest_revision]
Create Date: 2025-01-XX XX:XX:XX.XXXXXX

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

# revision identifiers, used by Alembic.
revision = 'add_room_id_to_classrooms'
down_revision = 'phase_a_foundation_corrected'
branch_labels = None
depends_on = None

def upgrade():
    # Add room_id column to classrooms table
    op.add_column('classrooms', 
        sa.Column('room_id', UUID(as_uuid=True), nullable=True)
    )
    
    # Add foreign key constraint to rooms table
    op.create_foreign_key(
        'fk_classrooms_room_id', 
        'classrooms', 
        'rooms', 
        ['room_id'], 
        ['id'],
        ondelete='SET NULL'
    )
    
    # Add index for better query performance
    op.create_index('ix_classrooms_room_id', 'classrooms', ['room_id'])

def downgrade():
    # Drop the foreign key constraint
    op.drop_constraint('fk_classrooms_room_id', 'classrooms', type_='foreignkey')
    
    # Drop the index
    op.drop_index('ix_classrooms_room_id', table_name='classrooms')
    
    # Drop the column
    op.drop_column('classrooms', 'room_id')