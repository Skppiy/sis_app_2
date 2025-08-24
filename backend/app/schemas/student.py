# backend/app/schemas/student.py
# Fixed to work with your actual model structure and router patterns

from pydantic import BaseModel, EmailStr
from datetime import date
from typing import Optional
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
    entry_grade_level: Optional[str] = None

class StudentUpdate(BaseModel):
    """Schema for updating a student - all fields optional"""
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    date_of_birth: Optional[date] = None
    student_id: Optional[str] = None
    entry_date: Optional[date] = None
    entry_grade_level: Optional[str] = None
    is_active: Optional[bool] = None

class StudentOut(BaseModel):
    id: UUID
    school_id: UUID
    first_name: str
    last_name: str
    email: Optional[str] = None
    date_of_birth: Optional[date] = None
    student_id: Optional[str] = None   # your external ID if present
    is_active: Optional[bool] = True

    class Config:
        orm_mode = True

class StudentWithDetails(StudentOut):
    """Extended student schema with relationships"""
    # Will be populated by the router with relationship data
    # Keeping it simple for now to avoid circular import issues
    
    class Config:
        orm_mode = True

# For enrollment and classroom management
class StudentEnrollmentInfo(BaseModel):
    """Basic student info for enrollment operations"""
    id: UUID
    first_name: str
    last_name: str
    current_grade: Optional[str] = None
    student_id: Optional[str] = None

    class Config:
        orm_mode = True