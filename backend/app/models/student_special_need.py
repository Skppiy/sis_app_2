# backend/app/models/student_special_need.py

from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Date, Boolean, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from datetime import date
from typing import Optional
import uuid
from .base import Base

class StudentSpecialNeed(Base):
    """Individual student special needs assignments"""
    __tablename__ = "student_special_needs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("students.id"), nullable=False)
    tag_library_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("special_needs_tag_library.id"), nullable=False)
    
    # Assignment Details
    severity_level: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)  # "MILD", "MODERATE", "INTENSIVE"
    notes: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)  # Internal notes
    
    # Time Period
    start_date: Mapped[date] = mapped_column(Date, nullable=False, default=date.today)
    end_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    review_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)  # When to review this assignment
    
    # Status
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    
    # Assignment/Review Info
    assigned_by: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    last_reviewed_by: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    last_reviewed_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    
    # Relationships
    student = relationship("Student", back_populates="special_needs")
    tag_library = relationship("SpecialNeedsTagLibrary", back_populates="student_assignments")
    assigned_by_user = relationship("User", foreign_keys=[assigned_by])
    reviewed_by_user = relationship("User", foreign_keys=[last_reviewed_by])
    
    def __repr__(self):
        tag_name = self.tag_library.tag_name if self.tag_library else "Unknown Tag"
        student_name = f"{self.student.first_name} {self.student.last_name}" if self.student else "Unknown Student"
        return f"<StudentSpecialNeed {student_name} - {tag_name}>"
    
    @classmethod
    def get_students_by_tag(cls, session, tag_library_id, is_active=True):
        """Get all students with"""