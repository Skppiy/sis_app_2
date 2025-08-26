# FILE: backend/app/schemas/student.py
# TYPE: FULL REPLACEMENT
# PATH: backend/app/schemas/student.py

from pydantic import BaseModel, EmailStr
from datetime import date
from typing import Optional, List
from uuid import UUID

class StudentBase(BaseModel):
    first_name: str
    last_name: str
    email: Optional[EmailStr] = None
    date_of_birth: Optional[date] = None
    student_id: Optional[str] = None

class StudentCreate(StudentBase):
    """Schema for creating a new student"""
    entry_date: Optional[date] = None
    entry_grade_level: str  # Required: "PK", "K", "1", "2", etc.
    # Note: current_grade_level will be set to entry_grade_level on creation

class StudentUpdate(BaseModel):
    """Schema for updating a student - all fields optional"""
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    date_of_birth: Optional[date] = None
    student_id: Optional[str] = None
    current_grade_level: Optional[str] = None  # Can be updated directly
    is_active: Optional[bool] = None

class StudentOut(BaseModel):
    """Basic student output"""
    id: UUID
    school_id: UUID
    first_name: str
    last_name: str
    email: Optional[str] = None
    date_of_birth: Optional[date] = None
    student_id: Optional[str] = None
    entry_date: Optional[date] = None
    entry_grade_level: str  # Historical: grade when enrolled
    current_grade_level: str  # Current: grade now
    is_active: bool = True

    class Config:
        orm_mode = True

class StudentWithDetails(StudentOut):
    """Extended student schema with relationships"""
    # Will be populated by the router with relationship data
    enrollment_count: int = 0
    has_special_needs: bool = False
    parent_count: int = 0
    
    class Config:
        orm_mode = True

class StudentEnrollmentInfo(BaseModel):
    """Basic student info for enrollment operations"""
    id: UUID
    first_name: str
    last_name: str
    current_grade_level: str  # Updated to use current
    student_id: Optional[str] = None

    class Config:
        orm_mode = True

class StudentPromotionRequest(BaseModel):
    """Request to promote students to next grade"""
    student_ids: List[UUID]
    target_grade: Optional[str] = None  # If None, auto-advance
    academic_year_id: UUID
    promotion_date: Optional[date] = None
    notes: Optional[str] = None