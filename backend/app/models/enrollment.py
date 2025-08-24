# backend/app/models/enrollment.py
# CLEAN ENROLLMENT MODEL - Final Version with academic_year_id

from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Date, Boolean, ForeignKey, Text, Integer, Numeric
from sqlalchemy.dialects.postgresql import UUID
from datetime import date
from typing import Optional
import uuid
from .base import Base

class Enrollment(Base):
    """
    Student enrollment in specific classroom sections.
    Tracks the complete enrollment lifecycle with academic and administrative data.
    """
    __tablename__ = "enrollments"

    # Primary identification
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Core relationships - Required
    student_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("students.id"), nullable=False)
    classroom_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("classrooms.id"), nullable=False)
    
    # Academic year context - Essential for SIS
    academic_year_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), 
        ForeignKey("academic_years.id"), 
        nullable=True,
        comment="Academic year for this enrollment"
    )
    
    # Enrollment lifecycle tracking
    enrollment_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    withdrawal_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    
    # Status management
    enrollment_status: Mapped[str] = mapped_column(String(20), default="ACTIVE")
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    
    # Withdrawal tracking
    withdrawal_reason: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    
    # Academic considerations
    is_audit_only: Mapped[bool] = mapped_column(Boolean, default=False)
    requires_accommodation: Mapped[bool] = mapped_column(Boolean, default=False)
    
    # Administrative tracking
    enrolled_by: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    
    # Relationships - Using back_populates for proper SQLAlchemy configuration
    student = relationship("Student", back_populates="enrollments")
    classroom = relationship("Classroom", back_populates="enrollments")
    academic_year = relationship("AcademicYear", back_populates="enrollments")
    enrolled_by_user = relationship("User", foreign_keys=[enrolled_by], post_update=True)
    
    def __repr__(self):
        student_name = f"{self.student.first_name} {self.student.last_name}" if self.student else "Unknown Student"
        classroom_name = self.classroom.name if self.classroom else "Unknown Classroom"
        return f"<Enrollment {student_name} in {classroom_name} ({self.enrollment_status})>"
    
    # Computed properties
    @property
    def full_name(self):
        """Get student's full name"""
        return f"{self.student.first_name} {self.student.last_name}" if self.student else "Unknown Student"
    
    @property
    def classroom_name_prop(self):
        """Get classroom name"""
        return self.classroom.name if self.classroom else "Unknown Classroom"
    
    @property
    def is_currently_active(self):
        """Check if enrollment is currently active"""
        return self.is_active and self.enrollment_status == "ACTIVE"
    
    @property
    def academic_year_name(self):
        """Get academic year name"""
        return self.academic_year.name if self.academic_year else "Unknown Year"
    
    # Business logic methods
    def withdraw(self, reason=None, withdrawal_date=None):
        """Withdraw student from classroom"""
        self.enrollment_status = "WITHDRAWN"
        self.is_active = False
        self.withdrawal_date = withdrawal_date or date.today()
        if reason:
            self.withdrawal_reason = reason
    
    def reactivate(self):
        """Reactivate a withdrawn enrollment"""
        if self.enrollment_status == "WITHDRAWN":
            self.enrollment_status = "ACTIVE"
            self.is_active = True
            self.withdrawal_date = None