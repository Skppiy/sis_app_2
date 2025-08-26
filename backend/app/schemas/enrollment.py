# FILE: backend/app/schemas/enrollment.py
# TYPE: FULL REPLACEMENT
# PATH: backend/app/schemas/enrollment.py

from pydantic import BaseModel, validator
from datetime import date, datetime
from typing import Optional, List
from uuid import UUID

class EnrollmentBase(BaseModel):
    """Base enrollment fields"""
    enrollment_date: Optional[date] = None
    enrollment_status: str = "ACTIVE"
    grade_level: str  # ADDED: Required grade level for enrollment
    is_audit_only: bool = False
    requires_accommodation: bool = False

class EnrollmentCreate(BaseModel):
    """Schema for creating a new enrollment"""
    student_id: str  # UUID as string from frontend
    classroom_id: str  # UUID as string from frontend
    grade_level: str  # ADDED: Required - "PK", "K", "1", "2", etc.
    enrollment_date: Optional[date] = None
    enrollment_status: str = "ACTIVE"
    is_audit_only: bool = False
    requires_accommodation: bool = False

    @validator('student_id', 'classroom_id')
    def validate_uuids(cls, v):
        """Validate UUID strings"""
        try:
            UUID(v)
            return v
        except ValueError:
            raise ValueError('Invalid UUID format')
    
    @validator('grade_level')
    def validate_grade_level(cls, v):
        """Validate grade level"""
        valid_grades = ['PK', 'K', '1', '2', '3', '4', '5', '6', '7', '8', 'MULTI', 'SPED', 'UNGRADED']
        if v.upper() not in valid_grades:
            raise ValueError(f'Invalid grade level. Must be one of: {", ".join(valid_grades)}')
        return v.upper()

class EnrollmentUpdate(BaseModel):
    """Schema for updating an enrollment"""
    grade_level: Optional[str] = None  # ADDED: Can update grade if needed
    enrollment_status: Optional[str] = None
    withdrawal_date: Optional[date] = None
    withdrawal_reason: Optional[str] = None
    is_audit_only: Optional[bool] = None
    requires_accommodation: Optional[bool] = None

class EnrollmentOut(EnrollmentBase):
    """Schema for enrollment output"""
    id: UUID
    student_id: UUID
    classroom_id: UUID
    grade_level: str  # ADDED: Output includes grade
    is_active: bool
    enrollment_date: Optional[date] = None
    withdrawal_date: Optional[date] = None
    withdrawal_reason: Optional[str] = None
    enrolled_by: Optional[UUID] = None
    academic_year_id: Optional[UUID] = None

    class Config:
        orm_mode = True

class EnrollmentWithDetails(EnrollmentOut):
    """Extended enrollment schema with relationship data"""
    student_name: Optional[str] = None
    classroom_name: Optional[str] = None
    subject_name: Optional[str] = None
    teacher_name: Optional[str] = None

class ClassroomRosterStudent(BaseModel):
    """Student info for classroom rosters"""
    id: UUID
    student_id: Optional[str]
    first_name: str
    last_name: str
    current_grade_level: str  # ADDED: Show current grade
    enrollment_id: UUID
    enrollment_date: Optional[date]
    enrollment_status: str
    is_active: bool
    requires_accommodation: bool = False

    class Config:
        orm_mode = True