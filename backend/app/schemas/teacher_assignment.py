# backend/app/schemas/teacher_assignment.py

from pydantic import BaseModel
from datetime import date
from typing import Optional
from uuid import UUID

class TeacherAssignmentBase(BaseModel):
    role_name: str
    can_view_grades: bool = True
    can_modify_grades: bool = False
    can_take_attendance: bool = False
    can_view_parent_contact: bool = False
    can_create_assignments: bool = False
    start_date: date
    end_date: Optional[date] = None

class TeacherAssignmentCreate(TeacherAssignmentBase):
    classroom_id: str
    teacher_user_id: str

class TeacherAssignmentUpdate(BaseModel):
    role_name: Optional[str] = None
    can_view_grades: Optional[bool] = None
    can_modify_grades: Optional[bool] = None
    can_take_attendance: Optional[bool] = None
    can_view_parent_contact: Optional[bool] = None
    can_create_assignments: Optional[bool] = None
    end_date: Optional[date] = None
    is_active: Optional[bool] = None

class TeacherAssignmentOut(TeacherAssignmentBase):
    id: UUID
    classroom_id: UUID
    teacher_user_id: UUID
    is_active: bool

    class Config:
        orm_mode = True
