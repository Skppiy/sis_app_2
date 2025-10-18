# backend/app/routers/enrollments.py
# ENHANCED ROUTER - Added Three-Tier Enrollment System

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from sqlalchemy.orm import selectinload
from typing import List, Optional
from uuid import UUID
from datetime import date
import logging

from ..deps import get_db, get_current_user, require_admin
from ..models.enrollment import Enrollment
from ..models.student import Student
from ..models.classroom import Classroom
from ..models.user import User
from ..schemas.enrollment import (
    EnrollmentCreate, 
    EnrollmentOut, 
    EnrollmentUpdate, 
    EnrollmentWithDetails,
    ClassroomRosterStudent
)
from ..schemas.enhanced_enrollment import (
    BulkHomeroomEnrollmentRequest,
    BulkHomeroomEnrollmentResponse,
    FlexibleSubjectEnrollmentRequest,
    FlexibleSubjectEnrollmentResponse,
    SpecialProgramEnrollmentRequest,
    SpecialProgramEnrollmentResponse,
    ConflictDetectionRequest,
    ConflictDetectionResponse,
    StudentEnrollmentSummaryRequest,
    StudentEnrollmentSummaryResponse
)
from ..services.enrollment_service import EnrollmentService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/enrollments", tags=["enrollments"])

@router.get("/test")
async def test_enrollment():
    """Simple test endpoint"""
    return {"message": "Enrollment router is working!", "status": "success"}

@router.get("", response_model=List[EnrollmentOut])
async def list_enrollments(
    student_id: Optional[str] = Query(None, description="Filter by student ID"),
    classroom_id: Optional[str] = Query(None, description="Filter by classroom ID"),
    is_active: Optional[bool] = Query(True, description="Filter by active status"),
    session: AsyncSession = Depends(get_db),
    _: any = Depends(get_current_user),
):
    """List enrollments with filtering"""
    print(f"🔍 DEBUG: Starting list_enrollments")
    print(f"🔍 Parameters: student_id={student_id}, classroom_id={classroom_id}, is_active={is_active}")
    
    try:
        print("🔍 Building query...")
        query = select(Enrollment)
        
        if student_id:
            print(f"🔍 Adding student_id filter")
            query = query.where(Enrollment.student_id == UUID(student_id))
        
        if classroom_id:
            print(f"🔍 Adding classroom_id filter")
            query = query.where(Enrollment.classroom_id == UUID(classroom_id))
        
        if is_active is not None:
            print(f"🔍 Adding is_active filter")
            query = query.where(Enrollment.is_active == is_active)
        
        print("🔍 Adding order by...")
        query = query.order_by(Enrollment.id.desc())
        
        print("🔍 Executing query...")
        result = await session.execute(query)
        
        print("🔍 Getting results...")
        enrollments = result.scalars().all()
        
        print(f"🔍 Found {len(enrollments)} enrollments")
        return enrollments
        
    except Exception as e:
        print(f"❌ ERROR in list_enrollments: {str(e)}")
        print(f"❌ ERROR type: {type(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to get enrollments: {str(e)}")

@router.get("/{enrollment_id}", response_model=EnrollmentWithDetails)
async def get_enrollment(
    enrollment_id: str,
    session: AsyncSession = Depends(get_db),
    _: any = Depends(get_current_user),
):
    """Get a specific enrollment with details"""
    try:
        query = select(Enrollment).options(
            selectinload(Enrollment.student),
            selectinload(Enrollment.classroom)
        ).where(Enrollment.id == UUID(enrollment_id))
        
        result = await session.execute(query)
        enrollment = result.scalar_one_or_none()
        
        if not enrollment:
            raise HTTPException(status_code=404, detail="Enrollment not found")
        
        # Create response with computed fields
        enrollment_dict = {
            **{k: v for k, v in enrollment.__dict__.items() if not k.startswith('_')},
            "student_name": enrollment.full_name,
            "classroom_name": enrollment.classroom_name_prop
        }
        
        return EnrollmentWithDetails(**enrollment_dict)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get enrollment: {str(e)}")

@router.post("", response_model=EnrollmentOut, status_code=status.HTTP_201_CREATED)
async def create_enrollment(
    payload: EnrollmentCreate,
    session: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user),
):
    """Create a new enrollment with grade level"""
    try:
        # Validate student exists
        student_result = await session.execute(
            select(Student).where(Student.id == UUID(payload.student_id))
        )
        student = student_result.scalar_one_or_none()
        if not student:
            raise HTTPException(status_code=400, detail="Student not found")
        
        # Validate classroom exists
        classroom_result = await session.execute(
            select(Classroom).where(Classroom.id == UUID(payload.classroom_id))
        )
        classroom = classroom_result.scalar_one_or_none()
        if not classroom:
            raise HTTPException(status_code=400, detail="Classroom not found")
        
        # Check for duplicate enrollment
        existing_result = await session.execute(
            select(Enrollment).where(
                and_(
                    Enrollment.student_id == UUID(payload.student_id),
                    Enrollment.classroom_id == UUID(payload.classroom_id),
                    Enrollment.is_active == True
                )
            )
        )
        if existing_result.scalar_one_or_none():
            raise HTTPException(status_code=409, detail="Student already enrolled in this classroom")
        
        # Check classroom capacity if specified
        if classroom.max_students:
            current_enrollment_result = await session.execute(
                select(func.count(Enrollment.id)).where(
                    and_(
                        Enrollment.classroom_id == UUID(payload.classroom_id),
                        Enrollment.is_active == True
                    )
                )
            )
            current_count = current_enrollment_result.scalar()
            if current_count >= classroom.max_students:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Classroom is at capacity ({classroom.max_students} students)"
                )
        
        # Create enrollment with grade level
        enrollment = Enrollment(
            student_id=UUID(payload.student_id),
            classroom_id=UUID(payload.classroom_id),
            academic_year_id=classroom.academic_year_id,  # Use classroom's academic year
            # IMPORTANT: Use provided grade or default to student's current grade
            grade_level=payload.grade_level or student.current_grade_level,
            enrollment_date=payload.enrollment_date or date.today(),
            enrollment_status=payload.enrollment_status,
            is_active=True,
            is_audit_only=payload.is_audit_only,
            requires_accommodation=payload.requires_accommodation,
            enrolled_by=current_user.id
        )
        
        session.add(enrollment)
        await session.commit()
        await session.refresh(enrollment)
        
        return enrollment
        
    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create enrollment: {str(e)}")

@router.patch("/{enrollment_id}", response_model=EnrollmentOut)
async def update_enrollment(
    enrollment_id: str,
    payload: EnrollmentUpdate,
    session: AsyncSession = Depends(get_db),
    _: any = Depends(require_admin),
):
    """Update an enrollment"""
    try:
        enrollment_result = await session.execute(
            select(Enrollment).where(Enrollment.id == UUID(enrollment_id))
        )
        enrollment = enrollment_result.scalar_one_or_none()
        
        if not enrollment:
            raise HTTPException(status_code=404, detail="Enrollment not found")
        
        # Update fields
        update_data = payload.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(enrollment, field, value)
        
        # If withdrawing, set is_active to False
        if payload.enrollment_status == "WITHDRAWN":
            enrollment.is_active = False
            if not enrollment.withdrawal_date:
                enrollment.withdrawal_date = date.today()
        
        await session.commit()
        await session.refresh(enrollment)
        
        return enrollment
        
    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update enrollment: {str(e)}")

@router.delete("/{enrollment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_enrollment(
    enrollment_id: str,
    session: AsyncSession = Depends(get_db),
    _: any = Depends(require_admin),
):
    """Soft delete an enrollment"""
    try:
        enrollment_result = await session.execute(
            select(Enrollment).where(Enrollment.id == UUID(enrollment_id))
        )
        enrollment = enrollment_result.scalar_one_or_none()
        
        if not enrollment:
            raise HTTPException(status_code=404, detail="Enrollment not found")
        
        # Soft delete by setting is_active to False
        enrollment.is_active = False
        enrollment.enrollment_status = "WITHDRAWN"
        enrollment.withdrawal_date = date.today()
        
        await session.commit()
        
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete enrollment: {str(e)}")

# Student enrollment endpoints
@router.get("/students/{student_id}/enrollments")
async def get_student_enrollments(
    student_id: str,
    session: AsyncSession = Depends(get_db),
    _: any = Depends(get_current_user),
):
    """Get all enrollments for a specific student"""
    try:
        # Verify student exists
        student_result = await session.execute(
            select(Student).where(Student.id == UUID(student_id))
        )
        student = student_result.scalar_one_or_none()
        if not student:
            raise HTTPException(status_code=404, detail="Student not found")
        
        # Get enrollments with classroom details
        result = await session.execute(
            select(Enrollment)
            .options(
                selectinload(Enrollment.classroom).selectinload(Classroom.subject),
                selectinload(Enrollment.classroom).selectinload(Classroom.room),
                selectinload(Enrollment.classroom).selectinload(Classroom.teacher_assignments).selectinload(ClassroomTeacherAssignment.teacher)
            )
            .where(Enrollment.student_id == UUID(student_id))
            .order_by(Enrollment.id.desc())
        )
        enrollments = result.scalars().all()

        # Debug logging
        print(f"DEBUG: Found {len(enrollments)} enrollments for student {student_id}")
        for enrollment in enrollments:
            print(f"  - Enrollment {enrollment.id}, classroom: {enrollment.classroom}")
            if enrollment.classroom:
                print(f"    - Classroom name: {enrollment.classroom.name}")
                print(f"    - Subject: {enrollment.classroom.subject}")
            else:
                print(f"    - No classroom found for enrollment {enrollment.id}")

        # Create custom response with classroom details
        enrollment_data = []
        for enrollment in enrollments:
            enrollment_dict = {
                "id": str(enrollment.id),
                "student_id": str(enrollment.student_id),
                "classroom_id": str(enrollment.classroom_id),
                "academic_year_id": str(enrollment.academic_year_id) if enrollment.academic_year_id else None,
                "grade_level": enrollment.grade_level,
                "enrollment_date": enrollment.enrollment_date.isoformat() if enrollment.enrollment_date else None,
                "withdrawal_date": enrollment.withdrawal_date.isoformat() if enrollment.withdrawal_date else None,
                "enrollment_status": enrollment.enrollment_status,
                "is_active": enrollment.is_active,
                "withdrawal_reason": enrollment.withdrawal_reason,
                "is_audit_only": enrollment.is_audit_only,
                "requires_accommodation": enrollment.requires_accommodation,
                "enrolled_by": str(enrollment.enrolled_by) if enrollment.enrolled_by else None,
                # Add classroom details
                "classroom": {
                    "id": str(enrollment.classroom.id),
                    "name": enrollment.classroom.name,
                    "subject": {
                        "id": str(enrollment.classroom.subject.id),
                        "name": enrollment.classroom.subject.name,
                        "code": enrollment.classroom.subject.code,
                        "subject_type": enrollment.classroom.subject.subject_type,
                    } if enrollment.classroom.subject else None,
                    "room": {
                        "id": str(enrollment.classroom.room.id),
                        "name": enrollment.classroom.room.name,
                    } if enrollment.classroom.room else None,
                    "teacher_assignments": [
                        {
                            "teacher": {
                                "id": str(assignment.teacher.id),
                                "first_name": assignment.teacher.first_name,
                                "last_name": assignment.teacher.last_name,
                            } if assignment.teacher else None
                        } for assignment in enrollment.classroom.teacher_assignments if assignment.teacher
                    ] if enrollment.classroom.teacher_assignments else []
                } if enrollment.classroom else None
            }
            enrollment_data.append(enrollment_dict)

        return enrollment_data
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get student enrollments: {str(e)}")

# Classroom roster endpoints
@router.get("/classrooms/{classroom_id}/students", response_model=List[ClassroomRosterStudent])
async def get_classroom_roster(
    classroom_id: str,
    active_only: bool = Query(True, description="Only show active enrollments"),
    session: AsyncSession = Depends(get_db),
    _: any = Depends(get_current_user),
):
    """Get all students enrolled in a specific classroom"""
    try:
        # Verify classroom exists
        classroom_result = await session.execute(
            select(Classroom).where(Classroom.id == UUID(classroom_id))
        )
        classroom = classroom_result.scalar_one_or_none()
        if not classroom:
            raise HTTPException(status_code=404, detail="Classroom not found")
        
        # Build query
        query = select(Enrollment).options(
            selectinload(Enrollment.student)
        ).where(Enrollment.classroom_id == UUID(classroom_id))
        
        if active_only:
            query = query.where(Enrollment.is_active == True)
        
        query = query.order_by(Enrollment.id.desc())
        
        result = await session.execute(query)
        enrollments = result.scalars().all()
        
        # Convert to roster format
        roster = []
        for enrollment in enrollments:
            if enrollment.student:
                student_data = ClassroomRosterStudent(
                    id=enrollment.student.id,
                    student_id=enrollment.student.student_id,
                    first_name=enrollment.student.first_name,
                    last_name=enrollment.student.last_name,
                    enrollment_id=enrollment.id,
                    enrollment_date=enrollment.enrollment_date,
                    enrollment_status=enrollment.enrollment_status,
                    is_active=enrollment.is_active,
                    requires_accommodation=enrollment.requires_accommodation
                )
                roster.append(student_data)
        
        return roster
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get classroom roster: {str(e)}")

# ========================================================================
# ENHANCED THREE-TIER ENROLLMENT SYSTEM ENDPOINTS
# ========================================================================

@router.post("/homeroom/bulk", response_model=BulkHomeroomEnrollmentResponse)
async def bulk_homeroom_enrollment(
    request: BulkHomeroomEnrollmentRequest,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Tier 1: Bulk enrollment of students in homeroom CORE subjects.
    
    This endpoint leverages the homeroom intelligence system to automatically
    enroll students in all CORE subjects taught by their homeroom teachers.
    
    Requirements:
    - Admin privileges required
    - Grade level must be K-5 (elementary homeroom model)
    - Students must exist and be active
    """
    try:
        logger.info(f"Bulk homeroom enrollment requested by {current_user.email}")
        
        enrollment_service = EnrollmentService(session)
        result = await enrollment_service.bulk_homeroom_enrollment(
            academic_year_id=request.academic_year_id,
            grade_level=request.grade_level,
            students=request.students,
            enrolled_by_user_id=current_user.id,
            auto_create_missing_assignments=request.auto_create_missing_assignments
        )
        
        logger.info(f"Bulk homeroom enrollment completed: {result.get('summary', {}).get('total_enrollments_created', 0)} enrollments")
        return BulkHomeroomEnrollmentResponse(**result)
        
    except ValueError as e:
        logger.warning(f"Invalid bulk homeroom enrollment request: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error in bulk homeroom enrollment: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/flexible/{subject_id}", response_model=FlexibleSubjectEnrollmentResponse)
async def flexible_subject_enrollment(
    subject_id: UUID,
    request: FlexibleSubjectEnrollmentRequest,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Tier 2: Flexible enrollment for non-CORE subjects with teacher options.
    
    This handles subjects like PE, Art, Music, etc. where students can be
    assigned to different teacher sections based on availability and preferences.
    
    Requirements:
    - Admin privileges required
    - Subject must be non-CORE type
    - Teacher assignments must exist for the subject
    """
    try:
        logger.info(f"Flexible subject enrollment requested by {current_user.email} for subject {subject_id}")
        
        enrollment_service = EnrollmentService(session)
        result = await enrollment_service.flexible_subject_enrollment(
            subject_id=subject_id,
            academic_year_id=request.academic_year_id,
            students=request.students,
            enrolled_by_user_id=current_user.id,
            teacher_preferences=request.teacher_preferences,
            enrollment_options=request.enrollment_options
        )
        
        logger.info(f"Flexible subject enrollment completed: {result.get('summary', {}).get('total_enrollments_created', 0)} enrollments")
        return FlexibleSubjectEnrollmentResponse(**result)
        
    except ValueError as e:
        logger.warning(f"Invalid flexible enrollment request: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error in flexible subject enrollment: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/special-program", response_model=SpecialProgramEnrollmentResponse)
async def special_program_enrollment(
    request: SpecialProgramEnrollmentRequest,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Tier 3: Individual enrollment for special programs, advanced classes, etc.
    
    This handles one-off enrollments that require individual consideration,
    such as gifted programs, special education, ESL, etc.
    
    Requirements:
    - Admin privileges required
    - Student must exist and be active
    - Teacher subject assignment must exist
    """
    try:
        logger.info(f"Special program enrollment requested by {current_user.email}")
        
        enrollment_service = EnrollmentService(session)
        result = await enrollment_service.special_program_enrollment(
            student_id=request.student_id,
            teacher_subject_assignment_id=request.teacher_subject_assignment_id,
            academic_year_id=request.academic_year_id,
            enrollment_details=request.enrollment_details,
            enrolled_by_user_id=current_user.id
        )
        
        logger.info(f"Special program enrollment completed for student {request.student_id}")
        return SpecialProgramEnrollmentResponse(**result)
        
    except ValueError as e:
        logger.warning(f"Invalid special program enrollment request: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error in special program enrollment: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/conflicts/{academic_year_id}", response_model=ConflictDetectionResponse)
async def detect_enrollment_conflicts(
    academic_year_id: UUID,
    grade_level: Optional[str] = Query(None, description="Optional grade level filter"),
    student_id: Optional[UUID] = Query(None, description="Optional specific student filter"),
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Detect and report enrollment conflicts across the system.
    
    This endpoint analyzes enrollments to identify:
    - Duplicate enrollments
    - Capacity violations
    - Schedule conflicts
    - Missing required subjects
    """
    try:
        logger.info(f"Conflict detection requested by {current_user.email} for academic year {academic_year_id}")
        
        enrollment_service = EnrollmentService(session)
        result = await enrollment_service.detect_enrollment_conflicts(
            academic_year_id=academic_year_id,
            grade_level=grade_level,
            student_id=student_id
        )
        
        logger.info(f"Conflict detection completed: {result.get('summary', {}).get('total_conflicts', 0)} conflicts found")
        return ConflictDetectionResponse(**result)
        
    except Exception as e:
        logger.error(f"Error detecting enrollment conflicts: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/student/{student_id}/summary", response_model=StudentEnrollmentSummaryResponse)
async def get_student_enrollment_summary(
    student_id: UUID,
    academic_year_id: UUID = Query(..., description="Academic year ID"),
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get comprehensive enrollment summary for a student.
    
    This endpoint provides:
    - All active and inactive enrollments
    - Enrollments categorized by subject type
    - Academic performance indicators
    - Special program participations
    - Identified conflicts
    """
    try:
        logger.info(f"Student enrollment summary requested by {current_user.email} for student {student_id}")
        
        enrollment_service = EnrollmentService(session)
        result = await enrollment_service.get_student_enrollment_summary(
            student_id=student_id,
            academic_year_id=academic_year_id
        )
        
        logger.info(f"Student enrollment summary completed for {result.get('student', {}).get('name', 'Unknown')}")
        return StudentEnrollmentSummaryResponse(**result)
        
    except ValueError as e:
        logger.warning(f"Invalid enrollment summary request: {str(e)}")
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error getting student enrollment summary: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

# Additional utility endpoints for the enhanced enrollment system

@router.get("/tiers/info")
async def get_enrollment_tiers_info(
    current_user: User = Depends(get_current_user)
):
    """
    Get information about the three-tier enrollment system.
    
    Returns descriptions and usage guidelines for each enrollment tier.
    """
    return {
        "enrollment_tiers": {
            "tier_1_core": {
                "name": "Bulk Homeroom Enrollment",
                "description": "Bulk enrollment of students in CORE subjects taught by homeroom teachers",
                "use_case": "Elementary grades (K-5) with homeroom model",
                "subjects": ["Mathematics", "English Language Arts", "Science", "Social Studies", "Reading"],
                "automation_level": "Full automation based on homeroom teacher assignments"
            },
            "tier_2_flexible": {
                "name": "Flexible Subject Enrollment",
                "description": "Flexible enrollment for non-CORE subjects with teacher distribution options",
                "use_case": "Specialist subjects like PE, Art, Music with multiple sections",
                "features": ["Teacher preference support", "Capacity-aware distribution", "Load balancing"],
                "automation_level": "Semi-automated with configuration options"
            },
            "tier_3_special": {
                "name": "Individual Special Program Enrollment",
                "description": "Individual enrollment for special programs and advanced classes",
                "use_case": "Gifted programs, special education, ESL, advanced placement",
                "features": ["Conflict detection", "Special accommodations", "IEP/504 plan support"],
                "automation_level": "Manual with validation and conflict checking"
            }
        },
        "workflow_recommendations": [
            "1. Start with Tier 1 for bulk CORE subject enrollment",
            "2. Use Tier 2 for specialist subjects and electives",
            "3. Handle special cases with Tier 3 individual enrollment",
            "4. Run conflict detection after each major enrollment operation",
            "5. Review student summaries to ensure complete enrollment"
        ]
    }