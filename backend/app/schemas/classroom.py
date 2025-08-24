# backend/app/schemas/classroom.py
# Fixed to include teacher_assignments without circular references

from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID
from .subject import SubjectOut
from .academic_year import AcademicYearOut
from .room import RoomOut

class ClassroomBase(BaseModel):
    name: str
    grade_level: str  # "K", "1", "2"..."8", "MULTI"
    classroom_type: str = "CORE"  # CORE, ENRICHMENT, SPECIAL
    max_students: Optional[int] = None

class ClassroomCreate(ClassroomBase):
    subject_id: str
    academic_year_id: str
    room_id: Optional[str] = None  # ADDED: Room assignment

class ClassroomUpdate(BaseModel):
    name: Optional[str] = None
    grade_level: Optional[str] = None
    classroom_type: Optional[str] = None
    max_students: Optional[int] = None
    room_id: Optional[str] = None  # ADDED: Room update

class TeacherInfo(BaseModel):
    """Simple teacher info for display purposes"""
    id: UUID
    first_name: str
    last_name: str
    email: str

    class Config:
        orm_mode = True


class TeacherAssignmentOut(BaseModel):
    id: UUID
    teacher_user_id: UUID
    role_name: str
    can_view_grades: bool
    can_modify_grades: bool
    can_take_attendance: bool
    can_view_parent_contact: bool
    can_create_assignments: bool
    is_active: bool
    
    # Teacher information - use the simple TeacherInfo to avoid circular reference
    teacher: Optional[TeacherInfo] = None

    class Config:
        orm_mode = True


class ClassroomOut(ClassroomBase):
    id: UUID
    subject_id: UUID
    academic_year_id: UUID
    room_id: Optional[UUID] = None  # ADDED: Room ID
    subject: Optional[SubjectOut] = None
    academic_year: Optional[AcademicYearOut] = None
    room: Optional[RoomOut] = None  # ADDED: Room details
    teacher_assignments: List[TeacherAssignmentOut] = []  # ADDED: Teacher assignments
    enrollment_count: int = 0

    class Config:
        orm_mode = True
 

class ClassroomWithDetails(ClassroomOut):
    # enrollments: List[EnrollmentOut] = []  # Will add when we create enrollment schema
    pass

    class Config:
        orm_mode = True
    