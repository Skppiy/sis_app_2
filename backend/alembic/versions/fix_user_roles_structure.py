"""Fix user roles structure to follow proper entity relationships

Revision ID: fix_user_roles_structure
Revises: add_school_fields
Create Date: 2025-01-XX XX:XX:XX.XXXXXX

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'fix_user_roles_structure'
down_revision = 'add_school_fields'
branch_labels = None
depends_on = None

def upgrade():
    # Create user_roles table
    op.create_table('user_roles',
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('role', sa.String(), nullable=False),
        sa.Column('school_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, default=True),
        sa.Column('last_used_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['school_id'], ['schools.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('user_id', 'role', 'school_id')
    )
    
    # Create user_role_preferences table
    op.create_table('user_role_preferences',
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('role', sa.String(), nullable=False),
        sa.Column('school_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['school_id'], ['schools.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('user_id')
    )
    
    # Migrate existing data: create user_roles entries for existing users
    # Get the first school ID for existing users
    op.execute("""
        INSERT INTO user_roles (user_id, role, school_id, is_active, created_at, updated_at)
        SELECT u.id, u.role, s.id, u.is_active, u.created_at, u.updated_at
        FROM users u
        CROSS JOIN (SELECT id FROM schools LIMIT 1) s
        WHERE u.role IS NOT NULL
    """)
    
    # Remove the role column from users table
    op.drop_column('users', 'role')

def downgrade():
    # Add role column back to users table
    op.add_column('users', sa.Column('role', sa.String(), nullable=True))
    
    # Migrate data back (take first role for each user)
    op.execute("""
        UPDATE users 
        SET role = (
            SELECT ur.role 
            FROM user_roles ur 
            WHERE ur.user_id = users.id 
            ORDER BY ur.last_used_at DESC NULLS LAST, ur.created_at DESC 
            LIMIT 1
        )
    """)
    
    # Drop the new tables
    op.drop_table('user_role_preferences')
    op.drop_table('user_roles')

