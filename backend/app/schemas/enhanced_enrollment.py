# backend/app/schemas/enhanced_enrollment.py

"""
Pydantic schemas for the Enhanced Three-Tier Enrollment System

These schemas define the request/response models for the new enrollment endpoints:
- Tier 1: Bulk homeroom enrollment
- Tier 2: Flexible subject enrollment 
- Tier 3: Individual special program enrollment
"""

from pydantic import BaseModel, validator, Field
from datetime import date, datetime
from typing import Optional, List, Dict, Any
from uuid import UUID
from enum import Enum

class EnrollmentTier(str, Enum):
    """Enrollment tier classification"""
    TIER_1_CORE = "TIER_1_CORE"
    TIER_2_FLEXIBLE = "TIER_2_FLEXIBLE" 
    TIER_3_SPECIAL = "TIER_3_SPECIAL"

class ConflictType(str, Enum):
    """Types of enrollment conflicts"""
    SCHEDULE_CONFLICT = "SCHEDULE_CONFLICT"
    PREREQUISITE_MISSING = "PREREQUISITE_MISSING"
    GRADE_MISMATCH = "GRADE_MISMATCH"
    CAPACITY_EXCEEDED = "CAPACITY_EXCEEDED"
    DUPLICATE_ENROLLMENT = "DUPLICATE_ENROLLMENT"
    STUDENT_NOT_FOUND = "STUDENT_NOT_FOUND"

# Tier 1: Bulk Homeroom Enrollment Schemas
class BulkHomeroomEnrollmentRequest(BaseModel):
    """Request schema for bulk homeroom enrollment"""
    academic_year_id: UUID = Field(..., description="Academic year for enrollment")
    grade_level: str = Field(..., description="Grade level (K-5 for homeroom model)")
    students: List[UUID] = Field(..., description="List of student IDs to enroll")
    auto_create_missing_assignments: bool = Field(True, description="Create teacher assignments if missing")
    
    @validator('grade_level')
    def validate_grade_level(cls, v):
        """Validate elementary grade levels"""
        valid_grades = ['K', '1', '2', '3', '4', '5']
        if v not in valid_grades:
            raise ValueError(f'Grade level must be one of: {", ".join(valid_grades)} for homeroom model')
        return v
    
    @validator('students')
    def validate_students_not_empty(cls, v):
        """Ensure students list is not empty"""
        if not v:
            raise ValueError('Students list cannot be empty')
        return v

class BulkHomeroomEnrollmentResponse(BaseModel):
    """Response schema for bulk homeroom enrollment"""
    enrollments_created: List[Dict[str, Any]] = Field(..., description="Successfully created enrollments")
    conflicts: List[Dict[str, Any]] = Field(..., description="Enrollment conflicts encountered")
    summary: Dict[str, Any] = Field(..., description="Summary statistics")
    message: str = Field(..., description="Result message")

# Tier 2: Flexible Subject Enrollment Schemas
class FlexibleSubjectEnrollmentRequest(BaseModel):
    """Request schema for flexible subject enrollment"""
    subject_id: UUID = Field(..., description="Subject to enroll students in")
    academic_year_id: UUID = Field(..., description="Academic year")
    students: List[UUID] = Field(..., description="List of student IDs to enroll")
    teacher_preferences: Optional[Dict[str, List[UUID]]] = Field(None, description="Teacher preferences mapping")
    enrollment_options: Optional[Dict[str, Any]] = Field(None, description="Additional enrollment settings")
    
    @validator('students')
    def validate_students_not_empty(cls, v):
        """Ensure students list is not empty"""
        if not v:
            raise ValueError('Students list cannot be empty')
        return v

class FlexibleSubjectEnrollmentResponse(BaseModel):
    """Response schema for flexible subject enrollment"""
    enrollments_created: List[Dict[str, Any]] = Field(..., description="Successfully created enrollments")
    conflicts: List[Dict[str, Any]] = Field(..., description="Enrollment conflicts encountered")
    teacher_distribution: Dict[str, Any] = Field(..., description="Teacher assignment distribution")
    summary: Dict[str, Any] = Field(..., description="Summary statistics")
    message: str = Field(..., description="Result message")

# Tier 3: Special Program Enrollment Schemas
class SpecialProgramEnrollmentRequest(BaseModel):
    """Request schema for special program enrollment"""
    student_id: UUID = Field(..., description="Student to enroll")
    teacher_subject_assignment_id: UUID = Field(..., description="Specific teacher-subject assignment")
    academic_year_id: UUID = Field(..., description="Academic year")
    enrollment_details: Dict[str, Any] = Field(..., description="Special program details and requirements")
    
    class Config:
        schema_extra = {
            "example": {
                "student_id": "123e4567-e89b-12d3-a456-426614174000",
                "teacher_subject_assignment_id": "123e4567-e89b-12d3-a456-426614174001",
                "academic_year_id": "123e4567-e89b-12d3-a456-426614174002",
                "enrollment_details": {
                    "enrollment_type": "GIFTED",
                    "reason": "Advanced mathematics program enrollment",
                    "has_iep": False,
                    "has_504": True,
                    "accommodation_notes": "Extended time on assessments",
                    "override_conflicts": False
                }
            }
        }

class SpecialProgramEnrollmentResponse(BaseModel):
    """Response schema for special program enrollment"""
    enrollment_created: Optional[Dict[str, Any]] = Field(None, description="Created enrollment details")
    conflicts: List[Dict[str, Any]] = Field(..., description="Any conflicts encountered")
    message: str = Field(..., description="Result message")

# Conflict Detection Schemas
class ConflictDetectionRequest(BaseModel):
    """Request schema for conflict detection"""
    academic_year_id: UUID = Field(..., description="Academic year to check")
    grade_level: Optional[str] = Field(None, description="Optional grade level filter")
    student_id: Optional[UUID] = Field(None, description="Optional specific student filter")

class EnrollmentConflict(BaseModel):
    """Schema for individual enrollment conflict"""
    type: ConflictType = Field(..., description="Type of conflict")
    student_id: Optional[str] = Field(None, description="Student ID involved")
    subject_name: Optional[str] = Field(None, description="Subject name")
    teacher_name: Optional[str] = Field(None, description="Teacher name")
    message: str = Field(..., description="Conflict description")
    severity: Optional[str] = Field("MEDIUM", description="Conflict severity level")

class ConflictDetectionResponse(BaseModel):
    """Response schema for conflict detection"""
    conflicts: Dict[str, List[Dict[str, Any]]] = Field(..., description="Categorized conflicts")
    summary: Dict[str, Any] = Field(..., description="Conflict summary statistics")
    recommendations: List[str] = Field(..., description="Recommended actions")

# Student Enrollment Summary Schemas
class StudentEnrollmentSummaryRequest(BaseModel):
    """Request schema for student enrollment summary"""
    student_id: UUID = Field(..., description="Student ID")
    academic_year_id: UUID = Field(..., description="Academic year")

class EnrollmentSummaryItem(BaseModel):
    """Schema for individual enrollment in summary"""
    id: str = Field(..., description="Enrollment ID")
    subject_name: str = Field(..., description="Subject name")
    subject_code: str = Field(..., description="Subject code")
    subject_type: str = Field(..., description="Subject type (CORE, ENRICHMENT, SPECIAL)")
    teacher_name: str = Field(..., description="Teacher name")
    classroom_name: str = Field(..., description="Classroom name")
    enrollment_type: str = Field(..., description="Enrollment type")
    enrollment_status: str = Field(..., description="Enrollment status")
    enrollment_date: Optional[str] = Field(None, description="Enrollment date")
    current_grade: Optional[float] = Field(None, description="Current grade percentage")
    grade_letter: Optional[str] = Field(None, description="Letter grade")
    attendance_rate: Optional[float] = Field(None, description="Attendance rate percentage")
    is_auto_enrolled: bool = Field(..., description="Whether auto-enrolled")
    has_iep: bool = Field(False, description="Has IEP")
    has_504: bool = Field(False, description="Has 504 plan")

class StudentEnrollmentSummaryResponse(BaseModel):
    """Response schema for student enrollment summary"""
    student: Dict[str, Any] = Field(..., description="Student information")
    academic_year_id: str = Field(..., description="Academic year ID")
    enrollment_summary: Dict[str, List[EnrollmentSummaryItem]] = Field(..., description="Categorized enrollments")
    statistics: Dict[str, int] = Field(..., description="Enrollment statistics")
    conflicts: List[Dict[str, Any]] = Field(..., description="Any conflicts for this student")
    message: str = Field(..., description="Summary message")

# Teacher Distribution Schema for Flexible Enrollment
class TeacherDistributionInfo(BaseModel):
    """Schema for teacher distribution information"""
    teacher_name: str = Field(..., description="Teacher name")
    classroom_name: str = Field(..., description="Classroom name")
    students_enrolled: int = Field(..., description="Number of students enrolled")
    capacity_remaining: int = Field(..., description="Remaining capacity")
    max_capacity: int = Field(..., description="Maximum capacity")

# Enrollment Options Schema
class EnrollmentOptions(BaseModel):
    """Schema for enrollment configuration options"""
    respect_capacity_limits: bool = Field(True, description="Respect classroom capacity limits")
    allow_cross_grade_enrollment: bool = Field(False, description="Allow cross-grade enrollment")
    prioritize_preferences: bool = Field(True, description="Prioritize teacher preferences")
    balance_class_sizes: bool = Field(True, description="Attempt to balance class sizes")
    conflict_resolution_strategy: str = Field("REJECT", description="How to handle conflicts (REJECT, OVERRIDE, ASK)")

# Student Enrollment Detail Schema
class StudentEnrollmentDetail(BaseModel):
    """Detailed enrollment information for student profile"""
    enrollment_id: UUID
    subject_id: UUID
    subject_name: str
    classroom_id: UUID
    classroom_name: str
    teacher_name: Optional[str] = None
    enrollment_type: str
    enrollment_status: str
    enrolled_date: date
    is_homeroom_core: bool = False

    class Config:
        orm_mode = True

class StudentSubjectEnrollmentOut(BaseModel):
    """Output schema for student subject enrollments matching frontend expectations"""
    id: UUID
    student_id: UUID
    classroom_id: UUID
    subject_name: str
    classroom_name: str
    teacher_name: Optional[str] = None
    grade_level: Optional[str] = None
    enrollment_date: Optional[date] = None
    enrollment_status: str
    is_active: bool
    requires_accommodation: bool = False

    class Config:
        orm_mode = True

# General Response Schemas
class EnrollmentOperationResponse(BaseModel):
    """Generic response schema for enrollment operations"""
    success: bool = Field(..., description="Whether operation was successful")
    data: Optional[Dict[str, Any]] = Field(None, description="Operation result data")
    errors: List[str] = Field(default_factory=list, description="Any errors encountered")
    warnings: List[str] = Field(default_factory=list, description="Any warnings generated")
    message: str = Field(..., description="Operation result message")

# Validation helpers
def validate_uuid_string(v: str) -> str:
    """Validate UUID string format"""
    try:
        UUID(v)
        return v
    except ValueError:
        raise ValueError('Invalid UUID format')

def validate_grade_level(v: str) -> str:
    """Validate grade level format"""
    valid_grades = ['PK', 'K', '1', '2', '3', '4', '5', '6', '7', '8', 'MULTI', 'SPED', 'UNGRADED']
    if v.upper() not in valid_grades:
        raise ValueError(f'Invalid grade level. Must be one of: {", ".join(valid_grades)}')
    return v.upper()