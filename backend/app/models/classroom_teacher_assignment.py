# backend/app/models/classroom_teacher_assignment.py

from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Boolean, Date, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from datetime import date
import uuid
from .base import Base

class ClassroomTeacherAssignment(Base):
    __tablename__ = "classroom_teacher_assignments"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    classroom_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("classrooms.id"), nullable=False)
    teacher_user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    # Admin-Defined Role (no hardcoded values)
    role_name: Mapped[str] = mapped_column(String(50), nullable=False)  # "Primary Teacher", "Student Teacher", "Co-Teacher", "Aide"
    
    # Granular Permissions
    can_view_grades: Mapped[bool] = mapped_column(Boolean, default=True)
    can_modify_grades: Mapped[bool] = mapped_column(Boolean, default=False)
    can_take_attendance: Mapped[bool] = mapped_column(Boolean, default=False)
    can_view_parent_contact: Mapped[bool] = mapped_column(Boolean, default=False)
    can_create_assignments: Mapped[bool] = mapped_column(Boolean, default=False)
    
    # Time-based Assignment
    start_date: Mapped[date] = mapped_column(Date, nullable=False, default=date.today)
    end_date: Mapped[date] = mapped_column(Date, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    
    # Relationships
    classroom = relationship("Classroom", back_populates="teacher_assignments")
    teacher = relationship("User")  # Teacher user
    
    def __repr__(self):
        return f"<ClassroomTeacherAssignment {self.teacher.first_name if self.teacher else 'Unknown'} - {self.role_name} in {self.classroom.name if self.classroom else 'Unknown Classroom'}>"
    
    @classmethod
    def get_teacher_classrooms(cls, session, teacher_user_id, academic_year_id):
        """Get all classrooms a teacher is assigned to in a given academic year"""
        return session.query(cls).join(Classroom).filter(
            cls.teacher_user_id == teacher_user_id,
            cls.is_active == True,
            Classroom.academic_year_id == academic_year_id
        ).all()
    
    def has_permission(self, permission_name):
        """Check if this assignment has a specific permission"""
        return getattr(self, f"can_{permission_name}", False)

