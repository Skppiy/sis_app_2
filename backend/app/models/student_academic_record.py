# backend/app/models/student_academic_record.py

from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Float, Date, Boolean, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from datetime import date
from typing import Optional
import uuid
from .base import Base

class StudentAcademicRecord(Base):
    """Complete academic history - one record per student per academic year"""
    __tablename__ = "student_academic_records"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("students.id"), nullable=False)
    academic_year_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("academic_years.id"), nullable=False)
    school_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("schools.id"), nullable=False)
    
    # Grade Level Tracking (flexible for special programs)
    grade_level: Mapped[str] = mapped_column(String(10), nullable=False)  # "PS", "PK", "K", "1"..."8", "SPED", "UNGRADED"
    program_type: Mapped[str] = mapped_column(String(20), default="GENERAL")  # "GENERAL", "SPED", "GIFTED", "ELL"
    promotion_status: Mapped[str] = mapped_column(String(20), nullable=False)  # "promoted", "retained", "skipped", "transferred"
    
    # Academic Performance (stored for historical reference)
    final_gpa: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    attendance_rate: Mapped[Optional[float]] = mapped_column(Float, nullable=True)  # Percentage
    credits_earned: Mapped[Optional[float]] = mapped_column(Float, nullable=True)  # For middle/high school
    
    # Enrollment Tracking (supports mid-year changes)
    enrollment_date: Mapped[date] = mapped_column(Date, nullable=False)
    withdrawal_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    withdrawal_reason: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)  # "MOVED", "TRANSFERRED", "GRADUATED"
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    
    # Relationships
    student = relationship("Student", back_populates="academic_records")
    academic_year = relationship("AcademicYear", back_populates="academic_records")
    school = relationship("School")
    
    def __repr__(self):
        return f"<StudentAcademicRecord {self.student.first_name if self.student else 'Unknown'} - Grade {self.grade_level} ({self.academic_year.name if self.academic_year else 'Unknown Year'})>"
    
    @classmethod
    def get_current_record(cls, session, student_id):
        """Get student's current academic record (active year)"""
        from .academic_year import AcademicYear
        active_year = AcademicYear.get_active(session)
        if not active_year:
            return None
        return session.query(cls).filter(
            cls.student_id == student_id,
            cls.academic_year_id == active_year.id,
            cls.is_active == True
        ).first()
    
    @classmethod
    def get_student_progression(cls, session, student_id):
        """Get complete academic progression for a student"""
        return session.query(cls).join(AcademicYear).filter(
            cls.student_id == student_id
        ).order_by(AcademicYear.start_date).all()


