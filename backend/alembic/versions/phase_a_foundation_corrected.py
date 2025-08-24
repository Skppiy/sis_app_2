# alembic/versions/phase_a_foundation_corrected.py

"""Phase A Foundation Corrected - Only Missing Tables

Revision ID: phase_a_foundation_corrected
Revises: drop_school_year_school_id
Create Date: 2025-01-XX XX:XX:XX.XXXXXX

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

# revision identifiers, used by Alembic.
revision = 'phase_a_foundation_corrected'
down_revision = 'drop_school_year_school_id'
branch_labels = None
depends_on = None

def upgrade():
    # Academic Years table (NEW)
    op.create_table('academic_years',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('name', sa.String(9), nullable=False),
        sa.Column('short_name', sa.String(5), nullable=False),
        sa.Column('start_date', sa.Date(), nullable=False),
        sa.Column('end_date', sa.Date(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('false')),
    )
    op.create_index('ix_academic_years_active', 'academic_years', ['is_active'])
    op.create_index('ix_academic_years_dates', 'academic_years', ['start_date', 'end_date'])

    # Subjects table (NEW)
    op.create_table('subjects',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('name', sa.String(50), nullable=False),
        sa.Column('code', sa.String(10), nullable=False, unique=True),
        sa.Column('subject_type', sa.String(20), nullable=False, server_default='CORE'),
        sa.Column('applies_to_elementary', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('applies_to_middle', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('is_homeroom_default', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('requires_specialist', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('allows_cross_grade', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('is_system_core', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('created_by_admin', sa.Boolean(), nullable=False, server_default=sa.text('true')),
    )
    op.create_index('ix_subjects_type', 'subjects', ['subject_type'])
    op.create_index('ix_subjects_grade_bands', 'subjects', ['applies_to_elementary', 'applies_to_middle'])

    # Rooms table (NEW)
    op.create_table('rooms',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('name', sa.String(50), nullable=False),
        sa.Column('room_code', sa.String(10), nullable=False),
        sa.Column('room_type', sa.String(20), nullable=False, server_default='CLASSROOM'),
        sa.Column('capacity', sa.Integer(), nullable=False, server_default='25'),
        sa.Column('has_projector', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('has_computers', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('has_smartboard', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('has_sink', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('is_bookable', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('school_id', UUID(as_uuid=True), sa.ForeignKey('schools.id'), nullable=False),
    )
    op.create_index('ix_rooms_school', 'rooms', ['school_id'])
    op.create_index('ix_rooms_type_bookable', 'rooms', ['room_type', 'is_bookable'])

    # Teacher Role Templates table (NEW)
    op.create_table('teacher_role_templates',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('role_name', sa.String(50), nullable=False, unique=True),
        sa.Column('description', sa.String(200), nullable=True),
        sa.Column('default_can_view_grades', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('default_can_modify_grades', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('default_can_take_attendance', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('default_can_view_parent_contact', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('default_can_create_assignments', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('true')),
    )

    # Update existing classrooms table structure if needed
    # First check what columns classrooms currently has and add missing ones
    try:
        # Add missing columns to classrooms if they don't exist
        op.add_column('classrooms', sa.Column('subject_id', UUID(as_uuid=True), nullable=True))
        op.add_column('classrooms', sa.Column('academic_year_id', UUID(as_uuid=True), nullable=True))
        op.add_column('classrooms', sa.Column('grade_level', sa.String(10), nullable=True))
        op.add_column('classrooms', sa.Column('classroom_type', sa.String(20), server_default='CORE'))
        op.add_column('classrooms', sa.Column('max_students', sa.Integer(), nullable=True))
    except:
        # Columns might already exist, continue
        pass

    # Classroom Teacher Assignments table (NEW)
    op.create_table('classroom_teacher_assignments',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('classroom_id', UUID(as_uuid=True), sa.ForeignKey('classrooms.id'), nullable=False),
        sa.Column('teacher_user_id', UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('role_name', sa.String(50), nullable=False),
        sa.Column('can_view_grades', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('can_modify_grades', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('can_take_attendance', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('can_view_parent_contact', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('can_create_assignments', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('start_date', sa.Date(), nullable=False),
        sa.Column('end_date', sa.Date(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('true')),
    )
    op.create_index('ix_classroom_teacher_active', 'classroom_teacher_assignments', ['teacher_user_id', 'is_active'])
    op.create_index('ix_classroom_assignments', 'classroom_teacher_assignments', ['classroom_id'])

    # Student Academic Records table (NEW)
    op.create_table('student_academic_records',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('student_id', UUID(as_uuid=True), sa.ForeignKey('students.id'), nullable=False),
        sa.Column('academic_year_id', UUID(as_uuid=True), sa.ForeignKey('academic_years.id'), nullable=False),
        sa.Column('school_id', UUID(as_uuid=True), sa.ForeignKey('schools.id'), nullable=False),
        sa.Column('grade_level', sa.String(10), nullable=False),
        sa.Column('program_type', sa.String(20), nullable=False, server_default='GENERAL'),
        sa.Column('promotion_status', sa.String(20), nullable=False),
        sa.Column('final_gpa', sa.Float(), nullable=True),
        sa.Column('attendance_rate', sa.Float(), nullable=True),
        sa.Column('credits_earned', sa.Float(), nullable=True),
        sa.Column('enrollment_date', sa.Date(), nullable=False),
        sa.Column('withdrawal_date', sa.Date(), nullable=True),
        sa.Column('withdrawal_reason', sa.String(50), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('true')),
    )
    op.create_index('ix_academic_records_student_year', 'student_academic_records', ['student_id', 'academic_year_id'])
    op.create_index('ix_academic_records_school_grade', 'student_academic_records', ['school_id', 'grade_level'])

    # Special Needs Tag Library table (NEW)
    op.create_table('special_needs_tag_library',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('tag_name', sa.String(50), nullable=False),
        sa.Column('tag_code', sa.String(20), nullable=False),
        sa.Column('description', sa.String(200), nullable=True),
        sa.Column('school_id', UUID(as_uuid=True), sa.ForeignKey('schools.id'), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('true')),
    )
    op.create_index('ix_special_needs_tags_school', 'special_needs_tag_library', ['school_id'])
    op.create_index('ix_special_needs_tags_code', 'special_needs_tag_library', ['tag_code'])

    # Student Special Needs table (NEW)
    op.create_table('student_special_needs',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('student_id', UUID(as_uuid=True), sa.ForeignKey('students.id'), nullable=False),
        sa.Column('tag_library_id', UUID(as_uuid=True), sa.ForeignKey('special_needs_tag_library.id'), nullable=False),
        sa.Column('severity_level', sa.String(20), nullable=True),
        sa.Column('notes', sa.String(500), nullable=True),
        sa.Column('start_date', sa.Date(), nullable=False),
        sa.Column('end_date', sa.Date(), nullable=True),
        sa.Column('review_date', sa.Date(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('assigned_by', UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=True),
        sa.Column('last_reviewed_by', UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=True),
        sa.Column('last_reviewed_date', sa.Date(), nullable=True),
    )
    op.create_index('ix_student_special_needs_student', 'student_special_needs', ['student_id'])
    op.create_index('ix_student_special_needs_tag', 'student_special_needs', ['tag_library_id'])
    op.create_index('ix_student_special_needs_active', 'student_special_needs', ['is_active'])

    # Parents table (NEW)
    op.create_table('parents',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False, unique=True),
        sa.Column('relationship_type', sa.String(20), nullable=False),
        sa.Column('emergency_contact', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('pickup_authorized', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('preferred_contact_method', sa.String(20), nullable=False, server_default='EMAIL'),
    )
    op.create_index('ix_parents_user', 'parents', ['user_id'])

    # Parent Student Relationships table (NEW)
    op.create_table('parent_student_relationships',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('parent_id', UUID(as_uuid=True), sa.ForeignKey('parents.id'), nullable=False),
        sa.Column('student_id', UUID(as_uuid=True), sa.ForeignKey('students.id'), nullable=False),
        sa.Column('relationship_type', sa.String(20), nullable=False),
        sa.Column('custody_status', sa.String(20), nullable=False, server_default='FULL'),
        sa.Column('can_view_grades', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('can_view_attendance', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('can_view_discipline', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('can_pickup_student', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('can_authorize_medical', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('is_emergency_contact', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('emergency_priority', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('true')),
    )
    op.create_index('ix_parent_student_relationships_parent', 'parent_student_relationships', ['parent_id'])
    op.create_index('ix_parent_student_relationships_student', 'parent_student_relationships', ['student_id'])
    op.create_index('ix_parent_student_emergency', 'parent_student_relationships', ['student_id', 'is_emergency_contact', 'emergency_priority'])

    # Update students table with new fields
    try:
        op.add_column('students', sa.Column('date_of_birth', sa.Date(), nullable=True))
        op.add_column('students', sa.Column('student_id', sa.String(20), nullable=True, unique=True))
        op.add_column('students', sa.Column('entry_date', sa.Date(), nullable=True))
        op.add_column('students', sa.Column('entry_grade_level', sa.String(10), nullable=True))
        
        # Create indexes for new student fields
        op.create_index('ix_students_student_id', 'students', ['student_id'])
        op.create_index('ix_students_entry_info', 'students', ['entry_date', 'entry_grade_level'])
    except:
        # Columns might already exist
        pass

    # Add foreign key constraints to classrooms table if needed
    try:
        op.create_foreign_key('fk_classrooms_subject', 'classrooms', 'subjects', ['subject_id'], ['id'])
        op.create_foreign_key('fk_classrooms_academic_year', 'classrooms', 'academic_years', ['academic_year_id'], ['id'])
    except:
        # Foreign keys might already exist
        pass

    # Insert system core subjects
    op.execute("""
        INSERT INTO subjects (id, name, code, subject_type, applies_to_elementary, applies_to_middle, 
                             is_homeroom_default, requires_specialist, allows_cross_grade, is_system_core, created_by_admin)
        VALUES 
        (gen_random_uuid(), 'Mathematics', 'MATH', 'CORE', true, true, true, false, true, true, false),
        (gen_random_uuid(), 'English Language Arts', 'ELA', 'CORE', true, true, true, false, true, true, false),
        (gen_random_uuid(), 'Science', 'SCI', 'CORE', true, true, true, false, true, true, false),
        (gen_random_uuid(), 'Social Studies', 'SS', 'CORE', true, true, true, false, false, true, false),
        (gen_random_uuid(), 'Physical Education', 'PE', 'ENRICHMENT', true, true, false, true, false, false, false),
        (gen_random_uuid(), 'Art', 'ART', 'ENRICHMENT', true, true, false, true, false, false, false),
        (gen_random_uuid(), 'Music', 'MUS', 'ENRICHMENT', true, true, false, true, false, false, false),
        (gen_random_uuid(), 'Library', 'LIB', 'ENRICHMENT', true, true, false, true, false, false, false)
    """)

    # Insert default teacher role templates
    op.execute("""
        INSERT INTO teacher_role_templates (id, role_name, description, default_can_view_grades, 
                                          default_can_modify_grades, default_can_take_attendance, 
                                          default_can_view_parent_contact, default_can_create_assignments)
        VALUES 
        (gen_random_uuid(), 'Primary Teacher', 'Lead teacher with full classroom permissions', true, true, true, true, true),
        (gen_random_uuid(), 'Co-Teacher', 'Team teaching partner with full academic permissions', true, true, true, false, true),
        (gen_random_uuid(), 'Student Teacher', 'Teaching intern with limited permissions', true, false, true, false, false),
        (gen_random_uuid(), 'Teaching Assistant', 'Classroom aide with view-only access', true, false, false, false, false),
        (gen_random_uuid(), 'Substitute Teacher', 'Temporary teacher with basic permissions', true, false, true, false, false)
    """)

    # Insert common special needs tags
    op.execute("""
        INSERT INTO special_needs_tag_library (id, tag_name, tag_code, description, school_id)
        VALUES 
        (gen_random_uuid(), 'Speech Therapy', 'SPEECH', 'Students requiring speech-language services', null),
        (gen_random_uuid(), 'Reading Support', 'READ_SUPP', 'Students needing additional reading intervention', null),
        (gen_random_uuid(), 'English Language Learner', 'ELL', 'Students learning English as second language', null),
        (gen_random_uuid(), 'IEP Services', 'IEP', 'Students with Individualized Education Plans', null),
        (gen_random_uuid(), '504 Plan', '504', 'Students with Section 504 accommodation plans', null),
        (gen_random_uuid(), 'Gifted and Talented', 'GATE', 'Students in gifted education program', null),
        (gen_random_uuid(), 'Occupational Therapy', 'OT', 'Students requiring occupational therapy services', null),
        (gen_random_uuid(), 'Physical Therapy', 'PT', 'Students requiring physical therapy services', null)
    """)


def downgrade():
    # Drop tables in reverse order to handle foreign keys
    op.drop_table('parent_student_relationships')
    op.drop_table('parents')
    op.drop_table('student_special_needs')
    op.drop_table('special_needs_tag_library')
    op.drop_table('student_academic_records')
    op.drop_table('classroom_teacher_assignments')
    op.drop_table('teacher_role_templates')
    op.drop_table('rooms')
    op.drop_table('subjects')
    op.drop_table('academic_years')
    
    # Remove added columns from students table
    try:
        op.drop_column('students', 'entry_grade_level')
        op.drop_column('students', 'entry_date')
        op.drop_column('students', 'student_id')
        op.drop_column('students', 'date_of_birth')
    except:
        pass
