# backend/app/routers/students.py
# FIXED VERSION - Simplified response handling
import logging
import re
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func, case
from sqlalchemy.orm import joinedload, selectinload
from typing import List, Optional
from uuid import UUID
from datetime import date

from ..deps import get_db, require_admin, get_current_user
from ..models.student import Student
from ..models.student_academic_record import StudentAcademicRecord
from ..models.academic_year import AcademicYear
from ..schemas.student import StudentCreate, StudentOut, StudentUpdate, StudentWithDetails
from ..models.enrollment import Enrollment
from ..models.classroom import Classroom
from ..models.classroom_teacher_assignment import ClassroomTeacherAssignment
from ..schemas.enrollment import EnrollmentOut
from ..models.school import School

router = APIRouter(prefix="/students", tags=["students"])

ID_WIDTH_DEFAULT = 4

async def _derive_prefix(session: AsyncSession, school_id: UUID) -> str:
    # Try to reuse any existing prefix for this school
    res = await session.execute(
        select(Student.student_id).where(
            Student.school_id == school_id, Student.student_id.isnot(None)
        )
    )
    for (sid,) in res:
        if not sid:
            continue
        m = re.match(r'^[A-Za-z]+', sid)
        if m:
            return m.group(0)
    # Fallback: derive from school name (first 3 letters)
    school = await session.get(School, school_id)
    if school and getattr(school, "name", None):
        letters = re.sub(r'[^A-Za-z]', '', school.name or '').upper()
        return letters[:3] or "STD"
    return "STD"

async def generate_next_student_id(session: AsyncSession, school_id: UUID) -> str:
    """Return next ID like SPR1001 -> SPR1002 for the given school."""
    res = await session.execute(
        select(Student.student_id).where(
            Student.school_id == school_id, Student.student_id.isnot(None)
        )
    )
    max_num = 0
    pad = ID_WIDTH_DEFAULT
    prefix: Optional[str] = None

    for (sid,) in res:
        if not sid:
            continue
        mpfx = re.match(r'^[A-Za-z]+', sid)
        mnum = re.search(r'(\d+)$', sid)
        if mnum:
            num = int(mnum.group(1))
            if num > max_num:
                max_num = num
                pad = len(mnum.group(1))
                prefix = mpfx.group(0) if mpfx else prefix
        elif mpfx and prefix is None:
            prefix = mpfx.group(0)

    if not prefix:
        prefix = await _derive_prefix(session, school_id)

    next_num = max_num + 1
    return f"{prefix}{str(next_num).zfill(pad)}"

@router.get("", response_model=List[StudentOut], operation_id="list_students")  
async def list_students(
    school_id: Optional[UUID] = Query(None),
    session: AsyncSession = Depends(get_db),
    _: object = Depends(require_admin),
):
    """Enhanced to include enrollment count for frontend display"""
    try:
        # Build query with enrollment count aggregation
        # This follows PostgreSQL best practices for computed fields
        query = (
            select(
                Student,
                func.count(
                    case(
                        (and_(Enrollment.is_active == True, Enrollment.enrollment_status == 'ACTIVE'), 1),
                        else_=None
                    )
                ).label("active_enrollment_count")
            )
            .outerjoin(Enrollment, Student.id == Enrollment.student_id)
            .group_by(Student.id)
            .order_by(Student.last_name, Student.first_name)
        )
        
        # Apply school filter if provided
        if school_id:
            query = query.where(Student.school_id == school_id)
        
        # Execute query
        result = await session.execute(query)
        student_enrollment_data = result.all()
        
        # Convert to enhanced StudentOut with computed enrollment_count
        students_with_enrollment = []
        for student_obj, enrollment_count in student_enrollment_data:
            # Create student dict with all StudentOut fields
            student_dict = {
                "id": student_obj.id,
                "school_id": student_obj.school_id,
                "first_name": student_obj.first_name,
                "last_name": student_obj.last_name,
                "email": student_obj.email,
                "date_of_birth": student_obj.date_of_birth,
                "student_id": student_obj.student_id,
                "entry_date": student_obj.entry_date,
                "entry_grade_level": student_obj.entry_grade_level,
                "current_grade_level": student_obj.current_grade_level,
                "is_active": student_obj.is_active,
                # Add computed field for frontend
                "enrollment_count": enrollment_count or 0
            }
            students_with_enrollment.append(student_dict)
        
        return students_with_enrollment
        
    except Exception:
        logging.getLogger("uvicorn.error").exception("Failed to fetch students")
        raise HTTPException(status_code=500, detail="Failed to fetch students")

@router.get("/", response_model=List[StudentWithDetails])  # CHANGED: Use StudentWithDetails
async def get_students(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, le=1000),
    grade_level: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    session: AsyncSession = Depends(get_db),
    current_user: any = Depends(get_current_user),
):
    """
    Get students with enrollment counts - Enhanced for better UX
    Returns StudentWithDetails including enrollment_count for "Enrolled" column
    """
    try:
        # Build base query with enrollment count aggregation
        query = (
            select(
                Student,
                func.coalesce(
                    func.count(case((Enrollment.is_active == True, 1))), 0
                ).label("enrollment_count")
            )
            .outerjoin(Enrollment, Student.id == Enrollment.student_id)
            .group_by(Student.id)
            .order_by(Student.last_name, Student.first_name)
        )
        
        # Apply filters
        if grade_level:
            query = query.where(Student.current_grade_level == grade_level.upper())
        
        if is_active is not None:
            query = query.where(Student.is_active == is_active)
        
        # Apply pagination
        query = query.offset(skip).limit(limit)
        
        # Execute query
        result = await session.execute(query)
        student_enrollment_data = result.all()
        
        # Transform to StudentWithDetails format
        students_with_details = []
        for student_obj, enrollment_count in student_enrollment_data:
            student_dict = {
                # Basic student fields
                "id": student_obj.id,
                "school_id": student_obj.school_id,
                "first_name": student_obj.first_name,
                "last_name": student_obj.last_name,
                "email": student_obj.email,
                "date_of_birth": student_obj.date_of_birth,
                "student_id": student_obj.student_id,
                "entry_date": student_obj.entry_date,
                "entry_grade_level": student_obj.entry_grade_level,
                "current_grade_level": student_obj.current_grade_level,
                "is_active": student_obj.is_active,
                # Enhanced fields
                "enrollment_count": enrollment_count,
                "has_special_needs": False,  # TODO: Add special needs count if needed
                "parent_count": 0,  # TODO: Add parent count if needed
            }
            students_with_details.append(StudentWithDetails(**student_dict))
        
        return students_with_details
        
    except Exception as e:
        print(f"❌ ERROR in get_students: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get students: {str(e)}")

# UPDATE: create_student function
@router.post("", response_model=StudentOut, status_code=status.HTTP_201_CREATED)
async def create_student(
    payload: StudentCreate,
    session: AsyncSession = Depends(get_db),
    current_user: any = Depends(get_current_user),
    _: any = Depends(require_admin),
):
    """Create a new student with proper grade level initialization"""
    try:
        # Get school_id from current user's context
        from ..models.user_role import UserRole
        
        user_roles = await session.execute(
            select(UserRole).where(
                UserRole.user_id == current_user.id,
                UserRole.is_active == True
            )
        )
        user_role = user_roles.scalars().first()
        
        if not user_role or not user_role.school_id:
            raise HTTPException(status_code=400, detail="No active school found for user")
        
        school_id = user_role.school_id
        
        # Auto-generate student_id if not provided
        student_id = payload.student_id
        if not student_id:
            student_id = await generate_next_student_id(session, school_id)
        else:
            # Check for duplicate student_id if provided
            existing = await session.execute(
                select(Student).where(
                    and_(
                        Student.school_id == school_id,
                        Student.student_id == student_id
                    )
                )
            )
            if existing.scalar_one_or_none():
                raise HTTPException(status_code=400, detail="Student ID already exists at this school")
        
        # Create student with both entry and current grade levels
        student = Student(
            id=uuid.uuid4(),
            school_id=school_id,
            first_name=payload.first_name,
            last_name=payload.last_name,
            email=payload.email,
            date_of_birth=payload.date_of_birth,
            student_id=student_id,  # Use auto-generated or provided ID
            entry_date=payload.entry_date or date.today(),
            entry_grade_level=payload.entry_grade_level,
            # IMPORTANT: Set current grade to entry grade on creation
            current_grade_level=payload.entry_grade_level,
            is_active=True
        )
        
        session.add(student)
        await session.commit()
        await session.refresh(student)
        
        # Load school relationship before returning
        result = await session.execute(
            select(Student).options(joinedload(Student.school)).where(Student.id == student.id)
        )
        student = result.scalar_one_or_none()
        
        return student
        
    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        logging.error(f"Failed to create student: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create student")


@router.post("/promote", response_model=dict)
async def promote_students(
    academic_year_id: str = Query(..., description="Target academic year"),
    grade_level: Optional[str] = Query(None, description="Specific grade to promote"),
    session: AsyncSession = Depends(get_db),
    _: any = Depends(require_admin),
):
    """Bulk promote students to next grade level"""
    try:
        from ..models.academic_year import AcademicYear
        
        # Verify academic year exists
        target_year = await session.get(AcademicYear, UUID(academic_year_id))
        if not target_year:
            raise HTTPException(status_code=404, detail="Academic year not found")
        
        # Build query for students to promote
        query = select(Student).where(Student.is_active == True)
        
        if grade_level:
            # Promote only specific grade
            query = query.where(Student.current_grade_level == grade_level)
        else:
            # Promote all except graduated
            query = query.where(Student.current_grade_level != 'GRADUATED')
        
        result = await session.execute(query)
        students = result.scalars().all()
        
        promoted_count = 0
        held_back = []
        graduated = []
        
        for student in students:
            # Check if student can be promoted (could add logic here for grades, attendance, etc.)
            old_grade = student.current_grade_level
            
            if student.promote_to_next_grade():
                promoted_count += 1
                
                if student.current_grade_level == 'GRADUATED':
                    graduated.append(f"{student.full_name}")
                    student.is_active = False  # Mark graduated students as inactive
            else:
                held_back.append(f"{student.full_name} (Grade {old_grade})")
        
        await session.commit()
        
        return {
            "promoted": promoted_count,
            "graduated": graduated,
            "held_back": held_back,
            "message": f"Successfully promoted {promoted_count} students"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        logging.error(f"Failed to promote students: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to promote students")

@router.put("/{student_id}", response_model=StudentOut)
async def update_student(
    student_id: UUID,
    payload: StudentUpdate,
    session: AsyncSession = Depends(get_db),
    _: any = Depends(require_admin),
):
    """Update a student - Following your working router patterns"""
    try:
        student = await session.get(Student, student_id)
        if not student:
            raise HTTPException(status_code=404, detail="Student not found")
        
        # Check for duplicate student_id if being updated
        if payload.student_id and payload.student_id != student.student_id:
            existing_student = await session.execute(
                select(Student).where(
                    and_(
                        Student.student_id == payload.student_id,
                        Student.id != student.id
                    )
                )
            )
            if existing_student.scalar_one_or_none():
                raise HTTPException(status_code=400, detail="Student ID already exists")
        
        # Check for duplicate email if being updated
        if payload.email and payload.email != student.email:
            existing_email = await session.execute(
                select(Student).where(
                    and_(
                        Student.email == payload.email,
                        Student.id != student.id
                    )
                )
            )
            if existing_email.scalar_one_or_none():
                raise HTTPException(status_code=400, detail="Email already exists")
        
        # Update fields (like your classroom router)
        update_data = payload.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(student, field, value)
        
        await session.commit()
        await session.refresh(student)
        
        # Set current_grade for response
        student.current_grade = student.entry_grade_level
        
        return student
        
    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        print(f"❌ ERROR in update_student: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update student")

@router.delete("/{student_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_student(
    student_id: UUID,
    session: AsyncSession = Depends(get_db),
    _: any = Depends(require_admin),
):
    """Delete a student (soft delete) - Following your working router patterns"""
    try:
        student = await session.get(Student, student_id)
        if not student:
            raise HTTPException(status_code=404, detail="Student not found")
        
        # Soft delete by setting is_active to False (like your room router)
        student.is_active = False
        
        await session.commit()
        
    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        print(f"❌ ERROR in delete_student: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to delete student")

@router.get("/{student_id}/academic-records")
async def get_student_academic_records(
    student_id: UUID,
    session: AsyncSession = Depends(get_db),
    _: any = Depends(get_current_user),
):
    """Get academic history for a student"""
    try:
        student = await session.get(Student, student_id)
        if not student:
            raise HTTPException(status_code=404, detail="Student not found")
        
        records_result = await session.execute(
            select(StudentAcademicRecord)
            .options(joinedload(StudentAcademicRecord.academic_year))
            .where(StudentAcademicRecord.student_id == student_id)
            .order_by(StudentAcademicRecord.enrollment_date.desc())
        )
        records = records_result.scalars().all()
        
        # Convert to dict for simple response
        return [
            {
                "id": str(record.id),
                "grade_level": record.grade_level,
                "promotion_status": record.promotion_status,
                "is_active": record.is_active,
                "enrollment_date": record.enrollment_date.isoformat() if record.enrollment_date else None,
                "academic_year": record.academic_year.name if record.academic_year else None,
            }
            for record in records
        ]
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ ERROR in get_student_academic_records: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get academic records")

@router.get("/debug/info")
async def debug_student_info(
    session: AsyncSession = Depends(get_db),
):
    """Debug endpoint to check student data - No auth required for debugging"""
    try:
        # Count all students
        total_result = await session.execute(select(Student))
        total_students = len(total_result.scalars().all())
        
        # Count active students  
        active_result = await session.execute(select(Student).where(Student.is_active == True))
        active_students = len(active_result.scalars().all())
        
        # Get sample student data
        sample_result = await session.execute(
            select(Student).where(Student.is_active == True).limit(3)
        )
        sample_students = sample_result.scalars().all()
        
        return {
            "total_students": total_students,
            "active_students": active_students,
            "sample_students": [
                {
                    "id": str(s.id),
                    "name": f"{s.first_name} {s.last_name}",
                    "entry_grade": s.entry_grade_level,
                    "is_active": s.is_active
                }
                for s in sample_students
            ],
            "debug": "Check if students exist in database"
        }
        
    except Exception as e:
        return {"error": str(e)}

@router.get("/{student_id}/enrollments", response_model=List[EnrollmentOut])
async def get_student_enrollments(
    student_id: str,  # Changed to string
    academic_year_id: Optional[str] = Query(None, description="Filter by academic year"),
    active_only: bool = Query(True, description="Only return active enrollments"),
    session: AsyncSession = Depends(get_db),
    _: any = Depends(get_current_user),
):
    """Get all enrollments for a specific student with full classroom details"""
    try:
        # Validate student exists
        student = await session.get(Student, UUID(student_id))
        if not student:
            raise HTTPException(status_code=404, detail="Student not found")
        
        # Build query with FULL relationship loading
        query = select(Enrollment).options(
            selectinload(Enrollment.classroom).selectinload(Classroom.subject),
            selectinload(Enrollment.classroom).selectinload(Classroom.room),
            selectinload(Enrollment.classroom).selectinload(Classroom.teacher_assignments).selectinload(ClassroomTeacherAssignment.teacher),
            selectinload(Enrollment.academic_year)
        ).where(Enrollment.student_id == UUID(student_id))
        
        if academic_year_id:
            query = query.where(Enrollment.academic_year_id == UUID(academic_year_id))
        
        if active_only:
            query = query.where(Enrollment.is_active == True)
        
        query = query.order_by(Enrollment.enrollment_date.desc().nullsfirst())
        
        result = await session.execute(query)
        enrollments = result.scalars().unique().all()
        
        return enrollments
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Failed to get enrollments: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get enrollments: {str(e)}")

@router.get("/next-id")
async def get_next_student_id(
    school_id: UUID = Query(..., description="School ID"),
    session: AsyncSession = Depends(get_db),
    _: any = Depends(get_current_user),
):
    """Generate next available student ID for the school"""
    try:
        next_id = await generate_next_student_id(session, school_id)
        return {"student_id": next_id}
    except Exception as e:
        logging.error(f"Failed to generate student ID: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to generate student ID")