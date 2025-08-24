# backend/app/schemas/parent.py

from pydantic import BaseModel, EmailStr
from typing import Optional, List
from uuid import UUID

class ParentBase(BaseModel):
    relationship_type: str  # MOTHER, FATHER, GUARDIAN, GRANDPARENT
    emergency_contact: bool = True
    pickup_authorized: bool = True
    preferred_contact_method: str = "EMAIL"  # EMAIL, PHONE, TEXT

class ParentCreate(BaseModel):
    # User info for account creation
    email: EmailStr
    password: str
    first_name: str
    last_name: str
    # Parent-specific info
    relationship_type: str
    emergency_contact: bool = True
    pickup_authorized: bool = True
    preferred_contact_method: str = "EMAIL"

class ParentUpdate(BaseModel):
    relationship_type: Optional[str] = None
    emergency_contact: Optional[bool] = None
    pickup_authorized: Optional[bool] = None
    preferred_contact_method: Optional[str] = None

class ParentOut(ParentBase):
    id: UUID
    user_id: UUID
    full_name: str
    email: str

    class Config:
        orm_mode = True


class ParentStudentRelationshipBase(BaseModel):
    relationship_type: str  # MOTHER, FATHER, GUARDIAN, STEPPARENT
    custody_status: str = "FULL"  # FULL, JOINT, RESTRICTED, NONE
    can_view_grades: bool = True
    can_view_attendance: bool = True
    can_view_discipline: bool = True
    can_pickup_student: bool = True
    can_authorize_medical: bool = True
    is_emergency_contact: bool = True
    emergency_priority: int = 1

class ParentStudentRelationshipCreate(ParentStudentRelationshipBase):
    parent_id: str
    student_id: str

class ParentStudentRelationshipUpdate(BaseModel):
    relationship_type: Optional[str] = None
    custody_status: Optional[str] = None
    can_view_grades: Optional[bool] = None
    can_view_attendance: Optional[bool] = None
    can_view_discipline: Optional[bool] = None
    can_pickup_student: Optional[bool] = None
    can_authorize_medical: Optional[bool] = None
    is_emergency_contact: Optional[bool] = None
    emergency_priority: Optional[int] = None
    is_active: Optional[bool] = None

class ParentStudentRelationshipOut(ParentStudentRelationshipBase):
    id: UUID
    parent_id: UUID
    student_id: UUID
    is_active: bool

    class Config:
        orm_mode = True
