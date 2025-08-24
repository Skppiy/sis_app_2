from alembic import op
import sqlalchemy as sa
import sqlalchemy.dialects.postgresql as psql
from datetime import datetime

# revision identifiers, used by Alembic.
revision = '20250809_141315'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    op.create_table('users',
        sa.Column('id', psql.UUID(as_uuid=True), primary_key=True),
        sa.Column('email', sa.String(), nullable=False, unique=True),
        sa.Column('hashed_password', sa.String(), nullable=False),
        sa.Column('first_name', sa.String(), nullable=False),
        sa.Column('last_name', sa.String(), nullable=False),
        sa.Column('role', sa.String(), nullable=False, server_default='teacher'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('last_login_at', sa.DateTime(timezone=True)),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('ix_users_email', 'users', ['email'], unique=True)

    op.create_table('schools',
        sa.Column('id', psql.UUID(as_uuid=True), primary_key=True),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('address', sa.String()),
        sa.Column('tz', sa.String(), nullable=False),
    )

def downgrade():
    op.drop_table('schools')
    op.drop_index('ix_users_email', table_name='users')
    op.drop_table('users')
