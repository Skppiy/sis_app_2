# backend/app/routers/enrollments.py
# CLEAN ROUTER - Fixed syntax errors

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from sqlalchemy.orm import selectinload
from typing import List, Optional
from uuid import UUID
from datetime import date

from ..deps import get_db, get_current_user, require_admin
from ..models.enrollment import Enrollment
from ..models.student import Student
from ..models.classroom import Classroom
from ..schemas.enrollment import (
    EnrollmentCreate, 
    EnrollmentOut, 
    EnrollmentUpdate, 
    EnrollmentWithDetails,
    ClassroomRosterStudent
)

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
    """Create a new enrollment with validation"""
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
                raise HTTPException(status_code=409, detail="Classroom is at capacity")
        
        # Create enrollment with proper async operations
        db_enrollment = Enrollment(
            student_id=UUID(payload.student_id),
            classroom_id=UUID(payload.classroom_id),
            enrollment_date=payload.enrollment_date or date.today(),
            enrollment_status=payload.enrollment_status,
            is_audit_only=payload.is_audit_only,
            requires_accommodation=payload.requires_accommodation,
            enrolled_by=current_user.id,
            is_active=True
        )
        
        session.add(db_enrollment)
        await session.commit()
        await session.refresh(db_enrollment)
        
        return db_enrollment
        
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
@router.get("/students/{student_id}/enrollments", response_model=List[EnrollmentOut])
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
            .options(selectinload(Enrollment.classroom))
            .where(Enrollment.student_id == UUID(student_id))
            .order_by(Enrollment.id.desc())
        )
        enrollments = result.scalars().all()
        
        return enrollments
        
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