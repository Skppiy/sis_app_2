# FILE: backend/app/models/student.py
# TYPE: FULL REPLACEMENT
# PATH: backend/app/models/student.py

from sqlalchemy import Column, String, Date, Boolean, DateTime, ForeignKey, func, select
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship, column_property
from sqlalchemy.ext.hybrid import hybrid_property
from datetime import date, datetime, timezone
import uuid
from .base import Base

class Student(Base):
    __tablename__ = "students"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    school_id = Column(UUID(as_uuid=True), ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    student_id = Column(String(32), nullable=True, index=True)  # External student ID
    first_name = Column(String(50), nullable=False)
    last_name = Column(String(50), nullable=False)
    email = Column(String(100), nullable=True, unique=True)
    date_of_birth = Column(Date, nullable=True)
    
    # Entry information (historical - never changes)
    entry_date = Column(Date, nullable=True)
    entry_grade_level = Column(String(10), nullable=False)  # Grade when first enrolled
    
    # ADDED: Current grade level (updated via promotion workflow)
    current_grade_level = Column(String(10), nullable=False)  # Current grade NOW
    
    # Status
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    school = relationship("School", back_populates="students")
    enrollments = relationship("Enrollment", back_populates="student", cascade="all, delete-orphan")
    academic_records = relationship("StudentAcademicRecord", back_populates="student", cascade="all, delete-orphan")
    special_needs = relationship("StudentSpecialNeed", back_populates="student", cascade="all, delete-orphan")
    parent_relationships = relationship("ParentStudentRelationship", back_populates="student", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Student {self.first_name} {self.last_name} ({self.student_id}) - Grade {self.current_grade_level}>"

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"
    
    @property
    def display_name(self):
        """Name with grade level for display"""
        return f"{self.full_name} (Grade {self.current_grade_level})"
    
    def get_active_enrollment(self):
        """Get the current active enrollment for this student"""
        for enrollment in self.enrollments:
            if enrollment.is_active and not enrollment.withdrawal_date:
                return enrollment
        return None
    
    def get_enrollment_for_year(self, academic_year_id):
        """Get enrollment for a specific academic year"""
        for enrollment in self.enrollments:
            if enrollment.academic_year_id == academic_year_id:
                return enrollment
        return None
    
    @hybrid_property
    def current_enrollment_grade(self):
        """Get grade from active enrollment (for complex queries)"""
        active_enrollment = self.get_active_enrollment()
        if active_enrollment:
            return active_enrollment.grade_level
        return self.current_grade_level
    
    def promote_to_next_grade(self):
        """Helper method for grade promotion"""
        grade_progression = {
            'PK': 'K',
            'K': '1',
            '1': '2',
            '2': '3',
            '3': '4',
            '4': '5',
            '5': '6',
            '6': '7',
            '7': '8',
            '8': 'GRADUATED'
        }
        
        if self.current_grade_level in grade_progression:
            self.current_grade_level = grade_progression[self.current_grade_level]
            return True
        return False