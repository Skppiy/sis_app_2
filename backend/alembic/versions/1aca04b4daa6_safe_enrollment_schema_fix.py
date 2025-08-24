"""safe enrollment schema fix

Revision ID: 1aca04b4daa6
Revises: add_room_id_to_classrooms
Create Date: 2025-01-17 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers
revision = '1aca04b4daa6'
down_revision = 'add_room_id_to_classrooms'
branch_labels = None
depends_on = None

def upgrade():
    # Get connection to check existing columns
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    
    # Get existing columns
    existing_columns = [col['name'] for col in inspector.get_columns('enrollments')]
    print(f"Existing columns: {existing_columns}")
    
    # Add columns only if they don't exist
    columns_to_add = [
        ('enrollment_date', sa.Date(), True),
        ('withdrawal_date', sa.Date(), True), 
        ('enrollment_status', sa.String(20), False, 'ACTIVE'),
        ('withdrawal_reason', sa.String(100), True),
        ('is_audit_only', sa.Boolean(), False, False),
        ('requires_accommodation', sa.Boolean(), False, False),
        ('enrolled_by', postgresql.UUID(as_uuid=True), True),
    ]
    
    for col_name, col_type, nullable, *default in columns_to_add:
        if col_name not in existing_columns:
            print(f"Adding column: {col_name}")
            if default:
                op.add_column('enrollments', 
                    sa.Column(col_name, col_type, nullable=nullable, server_default=str(default[0])))
            else:
                op.add_column('enrollments', 
                    sa.Column(col_name, col_type, nullable=nullable))
        else:
            print(f"Column {col_name} already exists, skipping")
    
    # Check existing constraints
    existing_constraints = [con['name'] for con in inspector.get_foreign_keys('enrollments')]
    existing_constraints.extend([con['name'] for con in inspector.get_unique_constraints('enrollments')])
    
    # Add foreign key constraint if it doesn't exist
    if 'fk_enrollments_enrolled_by' not in existing_constraints:
        print("Adding foreign key constraint")
        op.create_foreign_key(
            'fk_enrollments_enrolled_by',
            'enrollments', 'users',
            ['enrolled_by'], ['id']
        )
    else:
        print("Foreign key constraint already exists")
    
    # Add unique constraint if it doesn't exist  
    if 'uq_enrollment_student_classroom' not in existing_constraints:
        print("Adding unique constraint")
        op.create_unique_constraint(
            'uq_enrollment_student_classroom',
            'enrollments',
            ['student_id', 'classroom_id']
        )
    else:
        print("Unique constraint already exists")

def downgrade():
    # Simple downgrade - remove added columns
    columns_to_remove = [
        'enrolled_by', 'requires_accommodation', 'is_audit_only',
        'withdrawal_reason', 'enrollment_status', 'withdrawal_date', 'enrollment_date'
    ]
    
    for col in columns_to_remove:
        try:
            op.drop_column('enrollments', col)
        except Exception as e:
            print(f"Could not drop {col}: {e}")