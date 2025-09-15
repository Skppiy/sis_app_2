# backend/app/schemas/homeroom.py

from pydantic import BaseModel, validator, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, date
from uuid import UUID
from enum import Enum

# Enums for validation
class AssignmentType(str, Enum):
    HOMEROOM = "HOMEROOM"
    SPECIALIST = "SPECIALIST"  
    TEMPORARY = "TEMPORARY"

class EnrollmentType(str, Enum):
    STANDARD = "STANDARD"
    ADVANCED = "ADVANCED"
    REMEDIAL = "REMEDIAL"
    SUPPORT = "SUPPORT"

class EnrollmentStatus(str, Enum):
    ACTIVE = "ACTIVE"
    DROPPED = "DROPPED"
    COMPLETED = "COMPLETED"
    TRANSFERRED = "TRANSFERRED"

class SwapStatus(str, Enum):
    PENDING = "PENDING"
    ACCEPTED = "ACCEPTED"
    REJECTED = "REJECTED"
    APPROVED = "APPROVED"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"

class EventType(str, Enum):
    CREATE = "CREATE"
    UPDATE = "UPDATE"
    DELETE = "DELETE"
    SWAP_REQUEST = "SWAP_REQUEST"
    SWAP_APPROVED = "SWAP_APPROVED"
    SWAP_REJECTED = "SWAP_REJECTED"

# Teacher Subject Assignment Schemas
class TeacherSubjectAssignmentBase(BaseModel):
    teacher_user_id: UUID
    subject_id: UUID
    academic_year_id: UUID
    assignment_type: AssignmentType = AssignmentType.HOMEROOM
    grade_level: str
    effective_start_date: datetime
    effective_end_date: Optional[datetime] = None
    assignment_reason: Optional[str] = None
    
    @validator('grade_level')
    def validate_grade_level(cls, v):
        valid_grades = ['PK', 'K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']
        if v not in valid_grades:
            raise ValueError(f'Grade level must be one of: {valid_grades}')
        return v

class TeacherSubjectAssignmentCreate(TeacherSubjectAssignmentBase):
    pass

class TeacherSubjectAssignmentUpdate(BaseModel):
    assignment_type: Optional[AssignmentType] = None
    is_active: Optional[bool] = None
    effective_end_date: Optional[datetime] = None
    assignment_reason: Optional[str] = None

class TeacherSubjectAssignmentOut(TeacherSubjectAssignmentBase):
    id: UUID
    is_active: bool
    is_auto_assigned: bool
    assigned_date: datetime
    assigned_by_user_id: Optional[UUID] = None
    
    # Nested objects
    teacher_name: Optional[str] = None
    subject_name: Optional[str] = None
    subject_code: Optional[str] = None

    class Config:
        orm_mode = True

# Student Subject Enrollment Schemas  
class StudentSubjectEnrollmentBase(BaseModel):
    student_id: UUID
    teacher_subject_assignment_id: UUID
    academic_year_id: UUID
    enrollment_type: EnrollmentType = EnrollmentType.STANDARD
    enrollment_status: EnrollmentStatus = EnrollmentStatus.ACTIVE
    effective_start_date: datetime
    effective_end_date: Optional[datetime] = None
    enrollment_reason: Optional[str] = None

class StudentSubjectEnrollmentCreate(StudentSubjectEnrollmentBase):
    pass

class StudentSubjectEnrollmentUpdate(BaseModel):
    enrollment_type: Optional[EnrollmentType] = None
    enrollment_status: Optional[EnrollmentStatus] = None
    current_grade: Optional[float] = Field(None, ge=0, le=100)
    grade_letter: Optional[str] = None
    effective_end_date: Optional[datetime] = None
    has_iep: Optional[bool] = None
    has_504: Optional[bool] = None
    accommodation_notes: Optional[str] = None

class StudentSubjectEnrollmentOut(StudentSubjectEnrollmentBase):
    id: UUID
    current_grade: Optional[float] = None
    grade_letter: Optional[str] = None
    total_classes: Optional[int] = None
    classes_attended: Optional[int] = None
    tardies: Optional[int] = None
    enrollment_date: datetime
    is_auto_enrolled: bool
    has_iep: bool
    has_504: bool
    accommodation_notes: Optional[str] = None
    
    # Calculated field
    attendance_rate: Optional[float] = None
    
    # Nested objects
    student_name: Optional[str] = None
    subject_name: Optional[str] = None
    teacher_name: Optional[str] = None

    class Config:
        orm_mode = True

# Teacher Subject Swap Schemas
class TeacherSubjectSwapBase(BaseModel):
    requesting_teacher_id: UUID
    target_teacher_id: UUID
    requesting_assignment_id: UUID
    target_assignment_id: UUID
    academic_year_id: UUID
    requested_effective_date: datetime
    reason_for_swap: str
    is_temporary: bool = False
    temporary_end_date: Optional[datetime] = None

class TeacherSubjectSwapCreate(TeacherSubjectSwapBase):
    @validator('temporary_end_date')
    def validate_temporary_end_date(cls, v, values):
        if values.get('is_temporary') and not v:
            raise ValueError('temporary_end_date is required when is_temporary is True')
        return v

class TeacherSubjectSwapUpdate(BaseModel):
    requested_effective_date: Optional[datetime] = None
    reason_for_swap: Optional[str] = None
    is_temporary: Optional[bool] = None
    temporary_end_date: Optional[datetime] = None

class TeacherSubjectSwapResponse(BaseModel):
    response: str = Field(..., regex="^(ACCEPT|REJECT)$")
    response_notes: Optional[str] = None

class TeacherSubjectSwapAdminReview(BaseModel):
    decision: str = Field(..., regex="^(APPROVE|REJECT)$")
    admin_notes: Optional[str] = None

class TeacherSubjectSwapOut(TeacherSubjectSwapBase):
    id: UUID
    swap_status: SwapStatus
    swap_type: str
    request_date: datetime
    target_response_date: Optional[datetime] = None
    target_response: Optional[str] = None
    target_response_notes: Optional[str] = None
    requires_admin_approval: bool
    admin_review_date: Optional[datetime] = None
    admin_decision: Optional[str] = None
    admin_notes: Optional[str] = None
    executed_date: Optional[datetime] = None
    
    # Nested objects
    requesting_teacher_name: Optional[str] = None
    target_teacher_name: Optional[str] = None
    requesting_subject_name: Optional[str] = None
    target_subject_name: Optional[str] = None

    class Config:
        orm_mode = True

# Homeroom Service Schemas
class HomeroomCreateRequest(BaseModel):
    teacher_id: UUID
    grade_level: str
    academic_year_id: UUID
    room_id: Optional[UUID] = None
    
    @validator('grade_level')
    def validate_elementary_grade(cls, v):
        elementary_grades = ['K', '1', '2', '3', '4', '5']
        if v not in elementary_grades:
            raise ValueError(f'Grade level must be elementary (K-5), got: {v}')
        return v

class AutoAssignSubjectRequest(BaseModel):
    subject_id: UUID
    academic_year_id: UUID

class TeacherAssignmentsRequest(BaseModel):
    teacher_id: UUID
    academic_year_id: UUID
    grade_level: Optional[str] = None

class AutoEnrollStudentsRequest(BaseModel):
    teacher_id: UUID
    grade_level: str
    academic_year_id: UUID

class PreviewAssignmentRequest(BaseModel):
    grade_level: str
    teacher_id: UUID
    academic_year_id: UUID

# Response Schemas
class AssignmentSummary(BaseModel):
    id: str
    subject_name: str
    subject_code: str
    assignment_type: str
    grade_level: str

class ClassroomSummary(BaseModel):
    id: str
    name: str
    subject_name: str
    grade_level: str

class TeacherSummary(BaseModel):
    id: str
    name: str
    email: Optional[str] = None

class SubjectSummary(BaseModel):
    id: str
    name: str
    code: str
    subject_type: Optional[str] = None

class HomeroomCreateResponse(BaseModel):
    assignments_created: List[AssignmentSummary]
    classrooms_created: List[ClassroomSummary]
    teacher: TeacherSummary
    grade_level: str
    academic_year_id: str
    total_assignments: int
    message: str

class AutoAssignResponse(BaseModel):
    assignments_created: List[Dict[str, Any]]
    subject: SubjectSummary
    total_assignments: int
    message: str

class TeacherAssignmentsResponse(BaseModel):
    teacher: TeacherSummary
    academic_year_id: str
    assignments_by_grade: Dict[str, Dict[str, List[Dict[str, Any]]]]
    total_assignments: int
    total_grades: int

class EnrollmentSummary(BaseModel):
    id: str
    student_id: str
    subject_name: str
    enrollment_type: str
    enrollment_status: str

class AutoEnrollResponse(BaseModel):
    enrollments_created: List[EnrollmentSummary]
    teacher_id: str
    grade_level: str
    total_enrollments: int
    total_students: int
    total_subjects: int
    message: str

class PreviewAssignmentResponse(BaseModel):
    teacher: TeacherSummary
    grade_level: str
    academic_year_id: str
    subjects_to_assign: List[SubjectSummary]
    existing_assignments: List[Dict[str, Any]]
    total_new_assignments: int
    total_existing_assignments: int
    will_create_classrooms: int
    ready_for_creation: bool