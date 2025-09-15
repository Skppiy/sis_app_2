# backend/app/models/special_program.py

"""
Special Programs Model for Enhanced Enrollment System

This model tracks special educational programs that students can be enrolled in,
such as:
- Gifted and Talented programs
- Special Education services
- English as Second Language (ESL)
- Advanced Placement courses
- Remedial programs
- Title I services

This supports Tier 3 (Individual Special Program Enrollment) functionality.
"""

from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Boolean, DateTime, Text, ForeignKey, Integer
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
from typing import Optional, List
import uuid
from .base import Base

class SpecialProgram(Base):
    """
    Tracks special educational programs available in the school system.
    """
    __tablename__ = "special_programs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Program Identification
    program_name: Mapped[str] = mapped_column(String(100), nullable=False)
    program_code: Mapped[str] = mapped_column(String(20), nullable=False, unique=True)
    program_description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Program Classification
    program_type: Mapped[str] = mapped_column(String(30), nullable=False)  # GIFTED, SPED, ESL, AP, REMEDIAL, TITLE_I, etc.
    service_delivery_model: Mapped[str] = mapped_column(String(30), default="PULL_OUT")  # PULL_OUT, PUSH_IN, SELF_CONTAINED, INCLUSION
    
    # Eligibility and Requirements
    requires_evaluation: Mapped[bool] = mapped_column(Boolean, default=True)
    requires_iep: Mapped[bool] = mapped_column(Boolean, default=False)
    requires_504_plan: Mapped[bool] = mapped_column(Boolean, default=False)
    requires_parent_consent: Mapped[bool] = mapped_column(Boolean, default=True)
    
    # Grade Level Applicability
    min_grade_level: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)  # "K", "1", etc.
    max_grade_level: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)  # "5", "8", etc.
    
    # Capacity and Staffing
    max_students_per_section: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    requires_certified_teacher: Mapped[bool] = mapped_column(Boolean, default=True)
    staff_student_ratio: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)  # "1:8", "1:12", etc.
    
    # Program Status
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_year_round: Mapped[bool] = mapped_column(Boolean, default=True)
    start_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    end_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    
    # Administrative
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    created_by: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    
    # Relationships
    program_enrollments = relationship("SpecialProgramEnrollment", back_populates="special_program")
    created_by_user = relationship("User", foreign_keys=[created_by])
    
    def __repr__(self):
        return f"<SpecialProgram {self.program_name} ({self.program_type})>"
    
    @property
    def is_special_education(self) -> bool:
        """Check if this is a special education program"""
        return self.program_type in ["SPED", "SPECIAL_EDUCATION", "IEP"]
    
    @property
    def requires_special_certification(self) -> bool:
        """Check if program requires special teacher certification"""
        special_cert_types = ["SPED", "ESL", "GIFTED", "TITLE_I"]
        return self.program_type in special_cert_types or self.requires_certified_teacher

class SpecialProgramEnrollment(Base):
    """
    Tracks student enrollment in special programs.
    
    This is separate from StudentSubjectEnrollment to handle the unique
    requirements and tracking needs of special programs.
    """
    __tablename__ = "special_program_enrollments"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Core Relationships
    student_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("students.id"), nullable=False)
    special_program_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("special_programs.id"), nullable=False)
    academic_year_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("academic_years.id"), nullable=False)
    
    # Enrollment Details
    enrollment_status: Mapped[str] = mapped_column(String(20), default="ACTIVE")  # ACTIVE, INACTIVE, COMPLETED, TRANSFERRED, EXITED
    enrollment_date: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    exit_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    exit_reason: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    
    # Legal and Administrative Requirements
    has_signed_consent: Mapped[bool] = mapped_column(Boolean, default=False)
    consent_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    has_evaluation: Mapped[bool] = mapped_column(Boolean, default=False)
    evaluation_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    
    # Service Provision
    service_frequency: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)  # "Daily", "3x per week", etc.
    service_duration: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)  # Minutes per session
    service_location: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    
    # Academic Integration
    is_integrated_with_core: Mapped[bool] = mapped_column(Boolean, default=True)  # Integrated with core curriculum
    requires_modified_curriculum: Mapped[bool] = mapped_column(Boolean, default=False)
    requires_assistive_technology: Mapped[bool] = mapped_column(Boolean, default=False)
    
    # Progress Tracking
    initial_assessment_score: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    current_progress_level: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    last_progress_review: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    next_review_due: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    
    # Administrative
    enrolled_by: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    enrollment_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Relationships
    student = relationship("Student", back_populates="special_program_enrollments")
    special_program = relationship("SpecialProgram", back_populates="program_enrollments")
    academic_year = relationship("AcademicYear")
    enrolled_by_user = relationship("User", foreign_keys=[enrolled_by])
    
    def __repr__(self):
        return f"<SpecialProgramEnrollment {self.student.full_name if self.student else 'Unknown'} in {self.special_program.program_name if self.special_program else 'Unknown'}>"
    
    @property
    def is_current_enrollment(self) -> bool:
        """Check if this is a current, active enrollment"""
        return (
            self.enrollment_status == "ACTIVE" 
            and (self.exit_date is None or self.exit_date > datetime.utcnow())
        )
    
    @property
    def days_enrolled(self) -> int:
        """Calculate number of days student has been enrolled"""
        end_date = self.exit_date or datetime.utcnow()
        return (end_date - self.enrollment_date).days
    
    @classmethod
    async def get_student_special_programs(cls, session, student_id: uuid.UUID, academic_year_id: uuid.UUID = None):
        """Get all special program enrollments for a student"""
        from sqlalchemy import select, and_
        from sqlalchemy.orm import joinedload
        
        query = (
            select(cls)
            .options(joinedload(cls.special_program))
            .where(cls.student_id == student_id)
        )
        
        if academic_year_id:
            query = query.where(cls.academic_year_id == academic_year_id)
            
        result = await session.execute(query)
        return result.scalars().all()
    
    @classmethod  
    async def get_program_enrollments(cls, session, program_id: uuid.UUID, academic_year_id: uuid.UUID = None):
        """Get all student enrollments for a specific program"""
        from sqlalchemy import select, and_
        from sqlalchemy.orm import joinedload
        
        query = (
            select(cls)
            .options(joinedload(cls.student))
            .where(cls.special_program_id == program_id)
        )
        
        if academic_year_id:
            query = query.where(cls.academic_year_id == academic_year_id)
            
        result = await session.execute(query)
        return result.scalars().all()