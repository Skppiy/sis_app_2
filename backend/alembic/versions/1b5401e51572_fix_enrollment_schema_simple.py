"""fix enrollment schema simple

Revision ID: 1b5401e51572
Revises: 20250911_fix_events_schema
Create Date: 2024-09-13 22:45:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

# revision identifiers, used by Alembic.
revision = '1b5401e51572'
down_revision = '20250911_fix_events_schema'
branch_labels = None
depends_on = None

def upgrade():
    """
    Simple fix for student_subject_enrollments table to support basic enrollment.
    Focus on minimum required columns to make enrollment system work.
    """

    # Add the critical teacher_subject_assignment_id column
    # This is the key missing link between students and teacher assignments
    op.add_column('student_subject_enrollments',
        sa.Column('teacher_subject_assignment_id', UUID(as_uuid=True), nullable=True))

    # Create foreign key constraint
    op.create_foreign_key(
        'fk_student_subject_enrollments_teacher_assignment',
        'student_subject_enrollments', 'teacher_subject_assignments',
        ['teacher_subject_assignment_id'], ['id'],
        ondelete='CASCADE'
    )

    # Add enrollment_status (different from enrollment_type)
    op.add_column('student_subject_enrollments',
        sa.Column('enrollment_status', sa.String(20), nullable=False, server_default='ACTIVE'))

    # Add enrolled_by tracking for audit trail (FERPA compliance)
    op.add_column('student_subject_enrollments',
        sa.Column('enrolled_by_user_id', UUID(as_uuid=True), nullable=True))

    op.create_foreign_key(
        'fk_student_subject_enrollments_enrolled_by',
        'student_subject_enrollments', 'users',
        ['enrolled_by_user_id'], ['id'],
        ondelete='SET NULL'
    )

    # Add is_homeroom_core flag for homeroom intelligence
    op.add_column('student_subject_enrollments',
        sa.Column('is_homeroom_core', sa.Boolean(), nullable=False, server_default='false'))

    # Create indexes for performance
    op.create_index('ix_student_subject_enrollments_teacher_assignment',
                   'student_subject_enrollments', ['teacher_subject_assignment_id'])
    op.create_index('ix_student_subject_enrollments_enrollment_status',
                   'student_subject_enrollments', ['enrollment_status'])
    op.create_index('ix_student_subject_enrollments_enrolled_by',
                   'student_subject_enrollments', ['enrolled_by_user_id'])
    op.create_index('ix_student_subject_enrollments_is_homeroom_core',
                   'student_subject_enrollments', ['is_homeroom_core'])

def downgrade():
    """
    Reverse the schema changes.
    """
    # Drop indexes
    op.drop_index('ix_student_subject_enrollments_is_homeroom_core')
    op.drop_index('ix_student_subject_enrollments_enrolled_by')
    op.drop_index('ix_student_subject_enrollments_enrollment_status')
    op.drop_index('ix_student_subject_enrollments_teacher_assignment')

    # Drop foreign key constraints
    op.drop_constraint('fk_student_subject_enrollments_enrolled_by',
                      'student_subject_enrollments', type_='foreignkey')
    op.drop_constraint('fk_student_subject_enrollments_teacher_assignment',
                      'student_subject_enrollments', type_='foreignkey')

    # Drop columns
    op.drop_column('student_subject_enrollments', 'is_homeroom_core')
    op.drop_column('student_subject_enrollments', 'enrolled_by_user_id')
    op.drop_column('student_subject_enrollments', 'enrollment_status')
    op.drop_column('student_subject_enrollments', 'teacher_subject_assignment_id')