"""Fix subject_assignment_events schema mismatch

This migration fixes the schema mismatch between the database table and the SQLAlchemy model.
The original migration created a simple table, but the model expects a comprehensive audit log.

Revision ID: 20250911_fix_events_schema
Revises: 971720c29740
Create Date: 2025-09-11
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '20250911_fix_events_schema'
down_revision = '971720c29740'
branch_labels = None
depends_on = None


def upgrade():
    """
    Fix the subject_assignment_events table to match the SQLAlchemy model.
    
    The original migration created a simple table, but the model expects
    a comprehensive audit log with many additional fields.
    """
    
    print("Fixing subject_assignment_events table schema...")
    
    # Drop the existing table and recreate with correct schema
    # First drop indexes
    op.drop_index('ix_subject_assignment_events_created_at', table_name='subject_assignment_events')
    op.drop_index('ix_subject_assignment_events_event_type', table_name='subject_assignment_events')
    op.drop_index('ix_subject_assignment_events_academic_year_id', table_name='subject_assignment_events')
    op.drop_index('ix_subject_assignment_events_subject_id', table_name='subject_assignment_events')
    
    # Drop the table
    op.drop_table('subject_assignment_events')
    
    # Recreate with correct schema matching the SQLAlchemy model
    op.create_table(
        'subject_assignment_events',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, nullable=False, server_default=sa.text('gen_random_uuid()')),
        
        # Foreign Keys
        sa.Column('assignment_id', postgresql.UUID(as_uuid=True), nullable=True),  # Nullable for DELETE events
        sa.Column('teacher_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('subject_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('academic_year_id', postgresql.UUID(as_uuid=True), nullable=False),
        
        # Event Details
        sa.Column('event_type', sa.String(20), nullable=False),  # CREATE, UPDATE, DELETE, SWAP_REQUEST, SWAP_APPROVED, SWAP_REJECTED
        sa.Column('event_date', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('NOW()')),
        
        # Context
        sa.Column('grade_level', sa.String(2), nullable=False),  # Grade level this assignment affects
        sa.Column('triggered_by', sa.String(20), nullable=False),  # SYSTEM, ADMIN, USER, AUTO_ASSIGNMENT
        
        # Change Tracking
        sa.Column('old_values', postgresql.JSONB(), nullable=True),  # Previous values for UPDATE events
        sa.Column('new_values', postgresql.JSONB(), nullable=True),  # New values for CREATE/UPDATE events
        
        # Event Metadata
        sa.Column('event_description', sa.Text(), nullable=False),  # Human-readable description
        sa.Column('system_notes', sa.Text(), nullable=True),  # Internal system notes
        
        # User Context
        sa.Column('performed_by_user_id', postgresql.UUID(as_uuid=True), nullable=True),  # Who made the change
        sa.Column('affected_user_id', postgresql.UUID(as_uuid=True), nullable=True),  # Additional affected user (for swaps)
        
        # Administrative Fields
        sa.Column('requires_approval', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('approved_by_user_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('approved_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('rejection_reason', sa.Text(), nullable=True),
        
        # Foreign Key Constraints
        sa.ForeignKeyConstraint(['assignment_id'], ['teacher_subject_assignments.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['teacher_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['subject_id'], ['subjects.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['academic_year_id'], ['academic_years.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['performed_by_user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['affected_user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['approved_by_user_id'], ['users.id'], ondelete='CASCADE'),
        
        # Check Constraints
        sa.CheckConstraint("event_type IN ('CREATE', 'UPDATE', 'DELETE', 'SWAP_REQUEST', 'SWAP_APPROVED', 'SWAP_REJECTED')", 
                          name='ck_subject_assignment_events_event_type'),
        sa.CheckConstraint("triggered_by IN ('SYSTEM', 'ADMIN', 'USER', 'AUTO_ASSIGNMENT')", 
                          name='ck_subject_assignment_events_triggered_by'),
    )
    
    # Create indexes for performance
    op.create_index('ix_subject_assignment_events_assignment_id', 'subject_assignment_events', ['assignment_id'])
    op.create_index('ix_subject_assignment_events_teacher_id', 'subject_assignment_events', ['teacher_id'])
    op.create_index('ix_subject_assignment_events_subject_id', 'subject_assignment_events', ['subject_id'])
    op.create_index('ix_subject_assignment_events_academic_year_id', 'subject_assignment_events', ['academic_year_id'])
    op.create_index('ix_subject_assignment_events_event_type', 'subject_assignment_events', ['event_type'])
    op.create_index('ix_subject_assignment_events_event_date', 'subject_assignment_events', ['event_date'])
    op.create_index('ix_subject_assignment_events_grade_level', 'subject_assignment_events', ['grade_level'])
    op.create_index('ix_subject_assignment_events_triggered_by', 'subject_assignment_events', ['triggered_by'])
    op.create_index('ix_subject_assignment_events_performed_by_user_id', 'subject_assignment_events', ['performed_by_user_id'])
    
    print("subject_assignment_events table schema fixed successfully!")


def downgrade():
    """
    Revert to the original simple schema.
    WARNING: This will lose all audit log data!
    """
    
    print("Reverting subject_assignment_events table to original schema...")
    
    # Drop the comprehensive table and indexes
    op.drop_index('ix_subject_assignment_events_performed_by_user_id', table_name='subject_assignment_events')
    op.drop_index('ix_subject_assignment_events_triggered_by', table_name='subject_assignment_events')
    op.drop_index('ix_subject_assignment_events_grade_level', table_name='subject_assignment_events')
    op.drop_index('ix_subject_assignment_events_event_date', table_name='subject_assignment_events')
    op.drop_index('ix_subject_assignment_events_event_type', table_name='subject_assignment_events')
    op.drop_index('ix_subject_assignment_events_academic_year_id', table_name='subject_assignment_events')
    op.drop_index('ix_subject_assignment_events_subject_id', table_name='subject_assignment_events')
    op.drop_index('ix_subject_assignment_events_teacher_id', table_name='subject_assignment_events')
    op.drop_index('ix_subject_assignment_events_assignment_id', table_name='subject_assignment_events')
    
    op.drop_table('subject_assignment_events')
    
    # Recreate the original simple table
    op.create_table(
        'subject_assignment_events',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, nullable=False, server_default=sa.text('gen_random_uuid()')),
        sa.Column('subject_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('event_type', sa.String(20), nullable=False),  # 'CREATED', 'ACTIVATED', 'DEACTIVATED', 'RETIRED'
        sa.Column('academic_year_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('affected_teachers', postgresql.JSONB(), nullable=True),  # List of teacher IDs affected
        sa.Column('created_by', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('NOW()')),
        sa.ForeignKeyConstraint(['subject_id'], ['subjects.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['academic_year_id'], ['academic_years.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ondelete='CASCADE'),
        sa.CheckConstraint("event_type IN ('CREATED', 'ACTIVATED', 'DEACTIVATED', 'RETIRED')", name='ck_subject_assignment_events_event_type'),
    )
    
    # Recreate original indexes
    op.create_index('ix_subject_assignment_events_subject_id', 'subject_assignment_events', ['subject_id'])
    op.create_index('ix_subject_assignment_events_academic_year_id', 'subject_assignment_events', ['academic_year_id'])
    op.create_index('ix_subject_assignment_events_event_type', 'subject_assignment_events', ['event_type'])
    op.create_index('ix_subject_assignment_events_created_at', 'subject_assignment_events', ['created_at'])
    
    print("subject_assignment_events table reverted to original schema!")