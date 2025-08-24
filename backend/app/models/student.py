# backend/app/models/student.py
from sqlalchemy import Column, String, Date, Boolean, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import date, datetime, timezone
import uuid
from .base import Base

class Student(Base):
    __tablename__ = "students"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    school_id = Column(UUID(as_uuid=True), ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    student_id = Column(String(32), nullable=True, index=True)
    first_name = Column(String(50), nullable=False)
    last_name = Column(String(50), nullable=False)
    email = Column(String(100), nullable=True, unique=True)
    date_of_birth = Column(Date, nullable=True)
    school = relationship("School", back_populates="students")
    
    
    # Student ID (like student number)
    # Commenting out for now: school_id = Column(UUID(as_uuid=True), ForeignKey("schools.id", ondelete="CASCADE"), nullable=False)
    
    # Entry information
    entry_date = Column(Date, nullable=True)
    entry_grade_level = Column(String(10), nullable=False)  # "K", "1", "2", etc.
    
    # Status
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Timestamps - IMPORTANT: These must match the database schema
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))

    # Relationships
    # Commenting out for now: school = relationship("School", back_populates="students")
    enrollments = relationship("Enrollment", back_populates="student", cascade="all, delete-orphan")
    academic_records = relationship("StudentAcademicRecord", back_populates="student", cascade="all, delete-orphan")
    special_needs = relationship("StudentSpecialNeed", back_populates="student", cascade="all, delete-orphan")
    parent_relationships = relationship("ParentStudentRelationship", back_populates="student", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Student {self.first_name} {self.last_name} ({self.student_id})>"

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"

    @property
    def current_grade(self):
        """Get current grade level from active academic record"""
        for record in self.academic_records:
            if record.is_active:
                return record.grade_level
        return self.entry_grade_level