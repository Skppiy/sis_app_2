# backend/app/routers/students.py
# FIXED VERSION - Simplified response handling
import logging
import re
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from sqlalchemy.orm import joinedload, selectinload
from typing import List, Optional
from uuid import UUID

from ..deps import get_db, require_admin, get_current_user
from ..models.student import Student
from ..models.student_academic_record import StudentAcademicRecord
from ..models.academic_year import AcademicYear
from ..schemas.student import StudentCreate, StudentOut, StudentUpdate, StudentWithDetails
from ..models.enrollment import Enrollment
from ..models.classroom import Classroom  
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
    try:
        stmt = select(Student)
        if school_id:
            stmt = stmt.where(Student.school_id == school_id)
        result = await session.execute(stmt)
        return result.scalars().all()
    except Exception:
        logging.getLogger("uvicorn.error").exception("Failed to fetch students")
        raise HTTPException(status_code=500, detail="Failed to fetch students")

@router.get("/next-id", tags=["students"])
async def next_student_id(
    school_id: UUID = Query(...),
    session: AsyncSession = Depends(get_db),
    _: object = Depends(require_admin),
):
    sid = await generate_next_student_id(session, school_id)
    return {"student_id": sid}

@router.get("/{student_id}", response_model=StudentWithDetails)
async def get_student(
    student_id: UUID,
    session: AsyncSession = Depends(get_db),
    _: any = Depends(get_current_user),
):
    """Get a specific student by ID"""
    try:
        # Load student with relationships like your other routers
        query = select(Student).options(
            selectinload(Student.academic_records).joinedload(StudentAcademicRecord.academic_year),
            selectinload(Student.special_needs),
            selectinload(Student.parent_relationships)
        ).where(Student.id == student_id)
        
        result = await session.execute(query)
        student = result.scalar_one_or_none()
        
        if not student:
            raise HTTPException(status_code=404, detail="Student not found")
        
        # Set current grade
        current_record = None
        for record in student.academic_records:
            if (record.is_active and 
                record.academic_year and 
                record.academic_year.is_active):
                current_record = record
                break
        
        student.current_grade = current_record.grade_level if current_record else student.entry_grade_level
        
        return student
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ ERROR in get_student: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("", response_model=StudentOut, status_code=status.HTTP_201_CREATED)
async def create_student(
    payload: StudentCreate,
    session: AsyncSession = Depends(get_db),
    _: any = Depends(require_admin),
):
    """Create a new student - Following your working router patterns"""
    try:
        # Check for duplicate student_id if provided (like your other routers)
        if payload.student_id:
            existing_student = await session.execute(
                select(Student).where(Student.student_id == payload.student_id)
            )
            if existing_student.scalar_one_or_none():
                raise HTTPException(status_code=400, detail="Student ID already exists")
        
        # Check for duplicate email if provided
        if payload.email:
            existing_email = await session.execute(
                select(Student).where(Student.email == payload.email)
            )
            if existing_email.scalar_one_or_none():
                raise HTTPException(status_code=400, detail="Email already exists")
        
        if payload.student_id:
            dup = await session.execute(
                select(Student.id).where(
                    (Student.school_id == payload.school_id) &
                    (Student.student_id == payload.student_id)
                )
            )
            if dup.scalar_one_or_none():
                raise HTTPException(status_code=409, detail="Student ID already exists in this school")
        
        # Create student (following your model patterns)
        student_id = payload.student_id or await generate_next_student_id(session, payload.school_id)

        student = Student(
            id=uuid.uuid4(),
            first_name=payload.first_name,
            last_name=payload.last_name,
            email=payload.email,
            date_of_birth=payload.date_of_birth,
            student_id=payload.student_id,
            entry_date=payload.entry_date,
            entry_grade_level=payload.entry_grade_level,
            school_id=school_id,
            is_active=True
        )
        
        session.add(student)
        await session.commit()
        await session.refresh(student)
        
        # Set current_grade for response
        student.current_grade = payload.entry_grade_level
        
        return student
        
    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        print(f"❌ ERROR in create_student: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create student")

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
    student_id: UUID,
    academic_year_id: Optional[str] = Query(None, description="Filter by academic year"),
    active_only: bool = Query(True, description="Only return active enrollments"),
    session: AsyncSession = Depends(get_db),
    _: any = Depends(get_current_user),
):
    """Get all enrollments for a specific student - Frontend expects this exact endpoint"""
    try:
        # Validate student exists
        student = await session.get(Student, student_id)
        if not student:
            raise HTTPException(status_code=404, detail="Student not found")
        
        query = select(Enrollment).where(Enrollment.student_id == student_id)
        
        if academic_year_id:
            query = query.join(Classroom).where(Classroom.academic_year_id == academic_year_id)
        
        if active_only:
            query = query.where(Enrollment.is_active == True)
        
        query = query.order_by(Enrollment.created_at.desc())
        
        result = await session.execute(query)
        enrollments = result.scalars().all()
        
        return enrollments
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get enrollments: {str(e)}")