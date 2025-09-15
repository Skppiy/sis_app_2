"""homeroom intelligence system

This migration implements the core homeroom intelligence system that enables:
- Auto-assignment of CORE subjects to elementary teachers
- Subject lifecycle management with activation/deactivation
- Teacher-subject assignment tracking with history
- Student auto-enrollment in core subjects
- Teacher subject swap functionality

Revision ID: 20250910_homeroom_intelligence
Revises: drop_school_year_school_id
Create Date: 2025-09-10
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '20250910_homeroom_intelligence'
down_revision = 'fd07c9b48539'
branch_labels = None
depends_on = None


def upgrade():
    """
    Implement the homeroom intelligence system database schema.
    
    This migration adds:
    1. Enhanced subjects table for lifecycle management
    2. Subject assignment events tracking
    3. Teacher-subject assignments with history
    4. Student subject enrollments (auto-enrollment)
    5. Teacher subject swaps functionality
    """
    
    # 1. Enhanced subjects table for lifecycle management
    print("Adding lifecycle management columns to subjects table...")
    op.add_column('subjects', sa.Column('is_active_current_year', sa.Boolean(), nullable=False, server_default=sa.text('true')))
    op.add_column('subjects', sa.Column('retired_date', sa.Date(), nullable=True))
    op.add_column('subjects', sa.Column('auto_assign_to_existing_teachers', sa.Boolean(), nullable=False, server_default=sa.text('false')))
    
    # Add indexes for performance
    op.create_index('ix_subjects_is_active_current_year', 'subjects', ['is_active_current_year'])
    op.create_index('ix_subjects_retired_date', 'subjects', ['retired_date'])
    
    # 2. Create subject_assignment_events table - Track subject assignment lifecycle
    print("Creating subject_assignment_events table...")
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
    
    # Indexes for subject_assignment_events
    op.create_index('ix_subject_assignment_events_subject_id', 'subject_assignment_events', ['subject_id'])
    op.create_index('ix_subject_assignment_events_academic_year_id', 'subject_assignment_events', ['academic_year_id'])
    op.create_index('ix_subject_assignment_events_event_type', 'subject_assignment_events', ['event_type'])
    op.create_index('ix_subject_assignment_events_created_at', 'subject_assignment_events', ['created_at'])
    
    # 3. Create teacher_subject_assignments table - Track teacher-subject assignments with history
    print("Creating teacher_subject_assignments table...")
    op.create_table(
        'teacher_subject_assignments',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, nullable=False, server_default=sa.text('gen_random_uuid()')),
        sa.Column('teacher_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('subject_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('classroom_id', postgresql.UUID(as_uuid=True), nullable=True),  # May be null for specialist teachers
        sa.Column('assignment_type', sa.String(20), nullable=False),  # 'AUTO_HOMEROOM', 'AUTO_NEW_CORE', 'MANUAL', 'SWAPPED'
        sa.Column('academic_year_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('assigned_date', sa.Date(), nullable=False, server_default=sa.text('CURRENT_DATE')),
        sa.Column('removed_date', sa.Date(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('assigned_by', postgresql.UUID(as_uuid=True), nullable=False),
        sa.ForeignKeyConstraint(['teacher_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['subject_id'], ['subjects.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['classroom_id'], ['classrooms.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['academic_year_id'], ['academic_years.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['assigned_by'], ['users.id'], ondelete='CASCADE'),
        sa.CheckConstraint("assignment_type IN ('AUTO_HOMEROOM', 'AUTO_NEW_CORE', 'MANUAL', 'SWAPPED')", name='ck_teacher_subject_assignments_assignment_type'),
        sa.CheckConstraint("removed_date IS NULL OR removed_date >= assigned_date", name='ck_teacher_subject_assignments_date_logic'),
        # Unique constraint: one teacher can only have one active assignment per subject per academic year
        sa.UniqueConstraint('teacher_id', 'subject_id', 'academic_year_id', 'is_active', name='uq_teacher_subject_active_assignment', 
                          sqlite_on_conflict='IGNORE'),
    )
    
    # Indexes for teacher_subject_assignments
    op.create_index('ix_teacher_subject_assignments_teacher_id', 'teacher_subject_assignments', ['teacher_id'])
    op.create_index('ix_teacher_subject_assignments_subject_id', 'teacher_subject_assignments', ['subject_id'])
    op.create_index('ix_teacher_subject_assignments_classroom_id', 'teacher_subject_assignments', ['classroom_id'])
    op.create_index('ix_teacher_subject_assignments_academic_year_id', 'teacher_subject_assignments', ['academic_year_id'])
    op.create_index('ix_teacher_subject_assignments_is_active', 'teacher_subject_assignments', ['is_active'])
    op.create_index('ix_teacher_subject_assignments_assignment_type', 'teacher_subject_assignments', ['assignment_type'])
    
    # 4. Create student_subject_enrollments table - Student subject enrollments (auto-enrollment)
    print("Creating student_subject_enrollments table...")
    op.create_table(
        'student_subject_enrollments',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, nullable=False, server_default=sa.text('gen_random_uuid()')),
        sa.Column('student_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('subject_id', postgresql.UUID(as_uuid=True), nullable=False), 
        sa.Column('classroom_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('enrollment_type', sa.String(20), nullable=False),  # 'AUTO_CORE', 'MANUAL', 'SPECIALIST'
        sa.Column('academic_year_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('enrolled_date', sa.Date(), nullable=False, server_default=sa.text('CURRENT_DATE')),
        sa.Column('withdrawn_date', sa.Date(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.ForeignKeyConstraint(['student_id'], ['students.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['subject_id'], ['subjects.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['classroom_id'], ['classrooms.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['academic_year_id'], ['academic_years.id'], ondelete='CASCADE'),
        sa.CheckConstraint("enrollment_type IN ('AUTO_CORE', 'MANUAL', 'SPECIALIST')", name='ck_student_subject_enrollments_enrollment_type'),
        sa.CheckConstraint("withdrawn_date IS NULL OR withdrawn_date >= enrolled_date", name='ck_student_subject_enrollments_date_logic'),
        # Unique constraint: one student can only be actively enrolled in one instance of a subject per academic year
        sa.UniqueConstraint('student_id', 'subject_id', 'academic_year_id', 'is_active', name='uq_student_subject_active_enrollment',
                          sqlite_on_conflict='IGNORE'),
    )
    
    # Indexes for student_subject_enrollments
    op.create_index('ix_student_subject_enrollments_student_id', 'student_subject_enrollments', ['student_id'])
    op.create_index('ix_student_subject_enrollments_subject_id', 'student_subject_enrollments', ['subject_id'])
    op.create_index('ix_student_subject_enrollments_classroom_id', 'student_subject_enrollments', ['classroom_id'])
    op.create_index('ix_student_subject_enrollments_academic_year_id', 'student_subject_enrollments', ['academic_year_id'])
    op.create_index('ix_student_subject_enrollments_is_active', 'student_subject_enrollments', ['is_active'])
    op.create_index('ix_student_subject_enrollments_enrollment_type', 'student_subject_enrollments', ['enrollment_type'])
    
    # 5. Create teacher_subject_swaps table - Teacher subject swaps
    print("Creating teacher_subject_swaps table...")
    op.create_table(
        'teacher_subject_swaps',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, nullable=False, server_default=sa.text('gen_random_uuid()')),
        sa.Column('from_teacher_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('to_teacher_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('subject_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('classroom_id', postgresql.UUID(as_uuid=True), nullable=True),  # May be null for specialist subjects
        sa.Column('swap_reason', sa.Text(), nullable=True),
        sa.Column('status', sa.String(20), nullable=False, server_default=sa.text("'PENDING'")),  # 'PENDING', 'APPROVED', 'COMPLETED', 'REJECTED'
        sa.Column('requested_date', sa.Date(), nullable=False, server_default=sa.text('CURRENT_DATE')),
        sa.Column('approved_date', sa.Date(), nullable=True),
        sa.Column('completed_date', sa.Date(), nullable=True),
        sa.Column('approved_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.ForeignKeyConstraint(['from_teacher_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['to_teacher_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['subject_id'], ['subjects.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['classroom_id'], ['classrooms.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['approved_by'], ['users.id'], ondelete='CASCADE'),
        sa.CheckConstraint("status IN ('PENDING', 'APPROVED', 'COMPLETED', 'REJECTED')", name='ck_teacher_subject_swaps_status'),
        sa.CheckConstraint("from_teacher_id != to_teacher_id", name='ck_teacher_subject_swaps_different_teachers'),
        sa.CheckConstraint("approved_date IS NULL OR approved_date >= requested_date", name='ck_teacher_subject_swaps_approved_date_logic'),
        sa.CheckConstraint("completed_date IS NULL OR (approved_date IS NOT NULL AND completed_date >= approved_date)", 
                          name='ck_teacher_subject_swaps_completed_date_logic'),
    )
    
    # Indexes for teacher_subject_swaps
    op.create_index('ix_teacher_subject_swaps_from_teacher_id', 'teacher_subject_swaps', ['from_teacher_id'])
    op.create_index('ix_teacher_subject_swaps_to_teacher_id', 'teacher_subject_swaps', ['to_teacher_id'])
    op.create_index('ix_teacher_subject_swaps_subject_id', 'teacher_subject_swaps', ['subject_id'])
    op.create_index('ix_teacher_subject_swaps_classroom_id', 'teacher_subject_swaps', ['classroom_id'])
    op.create_index('ix_teacher_subject_swaps_status', 'teacher_subject_swaps', ['status'])
    op.create_index('ix_teacher_subject_swaps_requested_date', 'teacher_subject_swaps', ['requested_date'])
    
    print("Homeroom intelligence system migration completed successfully!")


def downgrade():
    """
    Reverse the homeroom intelligence system migration.
    
    This will remove all tables and columns added by the upgrade function.
    WARNING: This will permanently delete all homeroom intelligence data!
    """
    
    print("Rolling back homeroom intelligence system migration...")
    
    # Drop teacher_subject_swaps table and indexes
    op.drop_index('ix_teacher_subject_swaps_requested_date', table_name='teacher_subject_swaps')
    op.drop_index('ix_teacher_subject_swaps_status', table_name='teacher_subject_swaps')
    op.drop_index('ix_teacher_subject_swaps_classroom_id', table_name='teacher_subject_swaps')
    op.drop_index('ix_teacher_subject_swaps_subject_id', table_name='teacher_subject_swaps')
    op.drop_index('ix_teacher_subject_swaps_to_teacher_id', table_name='teacher_subject_swaps')
    op.drop_index('ix_teacher_subject_swaps_from_teacher_id', table_name='teacher_subject_swaps')
    op.drop_table('teacher_subject_swaps')
    
    # Drop student_subject_enrollments table and indexes
    op.drop_index('ix_student_subject_enrollments_enrollment_type', table_name='student_subject_enrollments')
    op.drop_index('ix_student_subject_enrollments_is_active', table_name='student_subject_enrollments')
    op.drop_index('ix_student_subject_enrollments_academic_year_id', table_name='student_subject_enrollments')
    op.drop_index('ix_student_subject_enrollments_classroom_id', table_name='student_subject_enrollments')
    op.drop_index('ix_student_subject_enrollments_subject_id', table_name='student_subject_enrollments')
    op.drop_index('ix_student_subject_enrollments_student_id', table_name='student_subject_enrollments')
    op.drop_table('student_subject_enrollments')
    
    # Drop teacher_subject_assignments table and indexes
    op.drop_index('ix_teacher_subject_assignments_assignment_type', table_name='teacher_subject_assignments')
    op.drop_index('ix_teacher_subject_assignments_is_active', table_name='teacher_subject_assignments')
    op.drop_index('ix_teacher_subject_assignments_academic_year_id', table_name='teacher_subject_assignments')
    op.drop_index('ix_teacher_subject_assignments_classroom_id', table_name='teacher_subject_assignments')
    op.drop_index('ix_teacher_subject_assignments_subject_id', table_name='teacher_subject_assignments')
    op.drop_index('ix_teacher_subject_assignments_teacher_id', table_name='teacher_subject_assignments')
    op.drop_table('teacher_subject_assignments')
    
    # Drop subject_assignment_events table and indexes
    op.drop_index('ix_subject_assignment_events_created_at', table_name='subject_assignment_events')
    op.drop_index('ix_subject_assignment_events_event_type', table_name='subject_assignment_events')
    op.drop_index('ix_subject_assignment_events_academic_year_id', table_name='subject_assignment_events')
    op.drop_index('ix_subject_assignment_events_subject_id', table_name='subject_assignment_events')
    op.drop_table('subject_assignment_events')
    
    # Remove enhanced subjects table columns
    op.drop_index('ix_subjects_retired_date', table_name='subjects')
    op.drop_index('ix_subjects_is_active_current_year', table_name='subjects')
    op.drop_column('subjects', 'auto_assign_to_existing_teachers')
    op.drop_column('subjects', 'retired_date')
    op.drop_column('subjects', 'is_active_current_year')
    
    print("Homeroom intelligence system rollback completed!")