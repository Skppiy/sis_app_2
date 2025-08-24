"""students classrooms enrollments

Revision ID: 99f0476a11b6
Revises: fix_user_roles_structure
Create Date: 2025-08-10
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '99f0476a11b6'
down_revision = 'fix_user_roles_structure'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'students',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column('school_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('first_name', sa.String(), nullable=False),
        sa.Column('last_name', sa.String(), nullable=False),
        sa.Column('email', sa.String(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['school_id'], ['schools.id'], ondelete='CASCADE'),
    )
    op.execute("DROP INDEX IF EXISTS ix_students_school_id")
    op.execute("DROP INDEX IF EXISTS ix_students_email")
    op.create_index('ix_students_school_id', 'students', ['school_id'])
    op.create_index('ix_students_email', 'students', ['email'])

    op.create_table(
        'classrooms',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column('school_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('teacher_user_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['school_id'], ['schools.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['teacher_user_id'], ['users.id']),
    )
    op.execute("DROP INDEX IF EXISTS ix_classrooms_school_id")
    op.execute("DROP INDEX IF EXISTS ix_classrooms_teacher_user_id")
    op.create_index('ix_classrooms_school_id', 'classrooms', ['school_id'])
    op.create_index('ix_classrooms_teacher_user_id', 'classrooms', ['teacher_user_id'])

    op.create_table(
        'enrollments',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column('classroom_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('student_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['classroom_id'], ['classrooms.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['student_id'], ['students.id'], ondelete='CASCADE'),
        sa.UniqueConstraint('classroom_id', 'student_id', name='uq_classroom_student'),
    )
    op.execute("DROP INDEX IF EXISTS ix_enrollments_classroom_id")
    op.execute("DROP INDEX IF EXISTS ix_enrollments_student_id")
    op.create_index('ix_enrollments_classroom_id', 'enrollments', ['classroom_id'])
    op.create_index('ix_enrollments_student_id', 'enrollments', ['student_id'])


def downgrade():
    op.drop_index('ix_enrollments_student_id', table_name='enrollments')
    op.drop_index('ix_enrollments_classroom_id', table_name='enrollments')
    op.drop_table('enrollments')

    op.drop_index('ix_classrooms_teacher_user_id', table_name='classrooms')
    op.drop_index('ix_classrooms_school_id', table_name='classrooms')
    op.drop_table('classrooms')

    op.drop_index('ix_students_email', table_name='students')
    op.drop_index('ix_students_school_id', table_name='students')
    op.drop_table('students')
