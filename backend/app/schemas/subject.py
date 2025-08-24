# backend/app/schemas/subject.py

from pydantic import BaseModel, validator
from typing import Optional
from uuid import UUID

class SubjectBase(BaseModel):
    name: str
    code: str
    subject_type: str = "CORE"  # CORE, ENRICHMENT, SPECIAL
    applies_to_elementary: bool = True
    applies_to_middle: bool = True
    is_homeroom_default: bool = False
    requires_specialist: bool = False
    allows_cross_grade: bool = False

    @validator('code')
    def code_uppercase_alphanumeric(cls, v):
        """Ensure code is uppercase and alphanumeric"""
        v = v.upper().replace(' ', '_')
        if not v.replace('_', '').isalnum():
            raise ValueError('Subject code must be alphanumeric')
        return v

    @validator('subject_type')
    def subject_type_valid(cls, v):
        valid_types = ['CORE', 'ENRICHMENT', 'SPECIAL']
        v = v.upper()
        if v not in valid_types:
            raise ValueError(f'Subject type must be one of: {valid_types}')
        return v

class SubjectCreate(SubjectBase):
    pass

class SubjectUpdate(BaseModel):
    name: Optional[str] = None
    subject_type: Optional[str] = None
    applies_to_elementary: Optional[bool] = None
    applies_to_middle: Optional[bool] = None
    is_homeroom_default: Optional[bool] = None
    requires_specialist: Optional[bool] = None
    allows_cross_grade: Optional[bool] = None

class SubjectOut(SubjectBase):
    id: UUID
    is_system_core: bool
    created_by_admin: bool

    class Config:
        orm_mode = True
