# backend/app/models/teacher_role_template.py

from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String, Boolean
from sqlalchemy.dialects.postgresql import UUID
import uuid
from .base import Base

class TeacherRoleTemplate(Base):
    """Admin-created templates for common teacher role permissions"""
    __tablename__ = "teacher_role_templates"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    role_name: Mapped[str] = mapped_column(String(50), nullable=False, unique=True)  # "Primary Teacher", "Student Teacher"
    description: Mapped[str] = mapped_column(String(200), nullable=True)
    
    # Default permissions for this role (admin can override per assignment)
    default_can_view_grades: Mapped[bool] = mapped_column(Boolean, default=True)
    default_can_modify_grades: Mapped[bool] = mapped_column(Boolean, default=False)
    default_can_take_attendance: Mapped[bool] = mapped_column(Boolean, default=False)
    default_can_view_parent_contact: Mapped[bool] = mapped_column(Boolean, default=False)
    default_can_create_assignments: Mapped[bool] = mapped_column(Boolean, default=False)
    
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    
    def __repr__(self):
        return f"<TeacherRoleTemplate {self.role_name}>"
    
    def get_default_permissions(self):
        """Return dict of default permissions for this role"""
        return {
            'can_view_grades': self.default_can_view_grades,
            'can_modify_grades': self.default_can_modify_grades,
            'can_take_attendance': self.default_can_take_attendance,
            'can_view_parent_contact': self.default_can_view_parent_contact,
            'can_create_assignments': self.default_can_create_assignments,
        }