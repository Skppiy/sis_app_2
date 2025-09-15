# backend/app/models/teacher_subject_assignment.py

from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid
from .base import Base

class TeacherSubjectAssignment(Base):
    """
    Tracks which subjects are assigned to which teachers.
    Core table for homeroom intelligence system.
    """
    __tablename__ = "teacher_subject_assignments"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Foreign Keys - Matching database schema
    teacher_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    subject_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("subjects.id"), nullable=False)
    classroom_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("classrooms.id"), nullable=True)  # May be null for specialist teachers
    academic_year_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("academic_years.id"), nullable=False)
    
    # Assignment Context - Matching database schema
    assignment_type: Mapped[str] = mapped_column(String(20), nullable=False)  # AUTO_HOMEROOM, AUTO_NEW_CORE, MANUAL, SWAPPED
    
    # Assignment Status
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    
    # Timestamps - Matching database schema  
    assigned_date: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    removed_date: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    
    # Assignment authority - Matching database schema
    assigned_by: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    # Relationships
    teacher = relationship("User", foreign_keys=[teacher_id], back_populates="subject_assignments")
    subject = relationship("Subject", back_populates="teacher_assignments")
    classroom = relationship("Classroom")
    academic_year = relationship("AcademicYear")
    assigned_by_user = relationship("User", foreign_keys=[assigned_by])
    
    # Related events and enrollments
    student_enrollments = relationship("StudentSubjectEnrollment", back_populates="teacher_assignment", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<TeacherSubjectAssignment {self.teacher.first_name if self.teacher else 'Unknown'} -> {self.subject.name if self.subject else 'Unknown'} (Type: {self.assignment_type})>"
    
    @classmethod
    async def get_teacher_assignments(cls, session, teacher_id: uuid.UUID, academic_year_id: uuid.UUID = None):
        """Get all active subject assignments for a teacher in a specific academic year"""
        from sqlalchemy import select, and_
        
        query = (
            select(cls)
            .where(
                and_(
                    cls.teacher_id == teacher_id,
                    cls.is_active == True
                )
            )
        )
        
        if academic_year_id:
            query = query.where(cls.academic_year_id == academic_year_id)
            
        result = await session.execute(query)
        return result.scalars().all()
    
    @classmethod 
    async def get_subject_teachers(cls, session, subject_id: uuid.UUID, academic_year_id: uuid.UUID):
        """Get all teachers assigned to a specific subject in an academic year"""
        from sqlalchemy import select, and_
        
        query = (
            select(cls)
            .where(
                and_(
                    cls.subject_id == subject_id,
                    cls.academic_year_id == academic_year_id,
                    cls.is_active == True
                )
            )
        )
        
        result = await session.execute(query)
        return result.scalars().all()