# backend/app/schemas/special_needs.py

from pydantic import BaseModel
from datetime import date
from typing import Optional, List
from uuid import UUID

class SpecialNeedsTagBase(BaseModel):
    tag_name: str
    tag_code: str
    description: Optional[str] = None

class SpecialNeedsTagCreate(SpecialNeedsTagBase):
    school_id: Optional[str] = None  # None = district-wide

class SpecialNeedsTagUpdate(BaseModel):
    tag_name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None

class SpecialNeedsTagOut(SpecialNeedsTagBase):
    id: UUID
    school_id: Optional[UUID] = None
    is_active: bool

    class Config:
        orm_mode = True
       

class StudentSpecialNeedBase(BaseModel):
    severity_level: Optional[str] = None  # MILD, MODERATE, INTENSIVE
    notes: Optional[str] = None
    start_date: date
    end_date: Optional[date] = None
    review_date: Optional[date] = None

class StudentSpecialNeedCreate(StudentSpecialNeedBase):
    student_id: str
    tag_library_id: str

class StudentSpecialNeedUpdate(BaseModel):
    severity_level: Optional[str] = None
    notes: Optional[str] = None
    end_date: Optional[date] = None
    review_date: Optional[date] = None
    is_active: Optional[bool] = None

class StudentSpecialNeedOut(StudentSpecialNeedBase):
    id: UUID
    student_id: UUID
    tag_library_id: UUID
    tag_name: str
    is_active: bool
    assigned_by: Optional[UUID] = None
    last_reviewed_by: Optional[UUID] = None
    last_reviewed_date: Optional[date] = None

    class Config:
        orm_mode = True
   
