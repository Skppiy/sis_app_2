# backend/app/schemas/student_services.py
# Pydantic schemas for student services

from pydantic import BaseModel, validator
from datetime import date
from typing import Optional
from uuid import UUID

class StudentServiceTagBase(BaseModel):
    tag_name: str
    category: str = "ACADEMIC"  # ACADEMIC, BEHAVIORAL, HEALTH, ACCESSIBILITY, LANGUAGE, ENRICHMENT, OTHER
    description: Optional[str] = None
    display_color: str = "#e53e3e"
    requires_documentation: bool = True
    is_confidential: bool = False

    @validator('category')
    def category_must_be_valid(cls, v):
        valid_categories = ['ACADEMIC', 'BEHAVIORAL', 'HEALTH', 'ACCESSIBILITY', 'LANGUAGE', 'ENRICHMENT', 'OTHER']
        v = v.upper()
        if v not in valid_categories:
            raise ValueError(f'Category must be one of: {valid_categories}')
        return v

    @validator('tag_name')
    def tag_name_not_empty(cls, v):
        if not v or not v.strip():
            raise ValueError('Tag name cannot be empty')
        return v.strip()

class StudentServiceTagCreate(StudentServiceTagBase):
    school_id: str

class StudentServiceTagUpdate(BaseModel):
    tag_name: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    display_color: Optional[str] = None
    requires_documentation: Optional[bool] = None
    is_confidential: Optional[bool] = None

    @validator('category')
    def category_must_be_valid(cls, v):
        if v is not None:
            valid_categories = ['ACADEMIC', 'BEHAVIORAL', 'HEALTH', 'ACCESSIBILITY', 'LANGUAGE', 'ENRICHMENT', 'OTHER']
            v = v.upper()
            if v not in valid_categories:
                raise ValueError(f'Category must be one of: {valid_categories}')
        return v

class StudentServiceTagOut(StudentServiceTagBase):
    id: UUID
    school_id: UUID
    is_active: bool
    student_count: int = 0

    class Config:
        orm_mode = True


class StudentServiceAssignmentBase(BaseModel):
    tag_id: str
    severity_level: Optional[str] = None  # MILD, MODERATE, INTENSIVE
    notes: Optional[str] = None
    start_date: date
    end_date: Optional[date] = None
    review_date: Optional[date] = None

class StudentServiceAssignmentCreate(StudentServiceAssignmentBase):
    pass

class StudentServiceAssignmentUpdate(BaseModel):
    severity_level: Optional[str] = None
    notes: Optional[str] = None
    end_date: Optional[date] = None
    review_date: Optional[date] = None
    is_active: Optional[bool] = None

class StudentServiceAssignmentOut(StudentServiceAssignmentBase):
    id: UUID
    student_id: UUID
    tag_name: str
    category: str
    is_active: bool

    class Config:
        orm_mode = True
