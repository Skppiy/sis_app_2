"""fix_classroom_types_from_subject_specialist_flag

Revision ID: b5942bb4a17f
Revises: 20250810_drop_school_year_school_id
Create Date: 2025-09-26

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.sql import text

# revision identifiers, used by Alembic.
revision = 'b5942bb4a17f'
down_revision = '1b5401e51572'
branch_labels = None
depends_on = None

def upgrade():
    """Fix classroom types to be derived from subject.requires_specialist flag"""

    # Update classroom types based on subject.requires_specialist
    # Set to 'SPECIALIST' if subject.requires_specialist is True, otherwise 'CORE'
    op.execute(text("""
        UPDATE classrooms
        SET classroom_type = CASE
            WHEN subjects.requires_specialist = true THEN 'SPECIALIST'
            ELSE 'CORE'
        END
        FROM subjects
        WHERE classrooms.subject_id = subjects.id
    """))

def downgrade():
    """Revert classroom types to their previous values"""

    # Note: This is a data migration. Since we're fixing incorrect data,
    # the downgrade would potentially restore incorrect classifications.
    # For safety, we'll leave the corrected data in place.
    pass
