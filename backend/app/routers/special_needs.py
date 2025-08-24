


# backend/app/routers/special_needs.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from ..deps import get_db, require_admin, get_current_user
from ..models.special_needs_tag_library import SpecialNeedsTagLibrary
from ..models.student_special_need import StudentSpecialNeed
from ..schemas.special_needs import (
    SpecialNeedsTagCreate, SpecialNeedsTagOut, SpecialNeedsTagUpdate,
    StudentSpecialNeedCreate, StudentSpecialNeedOut, StudentSpecialNeedUpdate
)

router = APIRouter(prefix="/special-needs", tags=["special-needs"])

# Tag Library Management
@router.get("/tags", response_model=List[SpecialNeedsTagOut])
async def list_special_needs_tags(
    school_id: Optional[str] = None,
    active_only: bool = True,
    session: AsyncSession = Depends(get_db),
    _: any = Depends(get_current_user),
):
    """Get special needs tags for a school (includes district-wide tags)"""
    if school_id:
        from uuid import UUID
        tags = SpecialNeedsTagLibrary.get_school_tags(session, UUID(school_id))
    else:
        tags = SpecialNeedsTagLibrary.get_district_tags(session)
    
    if active_only:
        tags = [tag for tag in tags if tag.is_active]
    
    return tags

@router.post("/tags", response_model=SpecialNeedsTagOut, status_code=status.HTTP_201_CREATED)
async def create_special_needs_tag(
    payload: SpecialNeedsTagCreate,
    session: AsyncSession = Depends(get_db),
    _: any = Depends(require_admin),
):
    """Create a new special needs tag"""
    from uuid import UUID
    
    # Check for duplicate tag code
    school_id_uuid = UUID(payload.school_id) if payload.school_id else None
    existing = await session.execute(
        select(SpecialNeedsTagLibrary).where(
            SpecialNeedsTagLibrary.tag_code == payload.tag_code.upper(),
            SpecialNeedsTagLibrary.school_id == school_id_uuid
        )
    )
    if existing.scalar_one_or_none():
        scope = "school" if payload.school_id else "district"
        raise HTTPException(status_code=400, detail=f"Tag code already exists for this {scope}")
    
    tag = SpecialNeedsTagLibrary(
        tag_name=payload.tag_name,
        tag_code=payload.tag_code.upper(),
        description=payload.description,
        school_id=school_id_uuid,
    )
    
    session.add(tag)
    await session.commit()
    await session.refresh(tag)
    return tag

# Student Special Needs Assignment
@router.get("/students/{student_id}", response_model=List[StudentSpecialNeedOut])
async def get_student_special_needs(
    student_id: str,
    active_only: bool = True,
    session: AsyncSession = Depends(get_db),
    _: any = Depends(get_current_user),
):
    """Get all special needs assignments for a student"""
    from uuid import UUID
    
    if active_only:
        assignments = StudentSpecialNeed.get_student_active_needs(session, UUID(student_id))
    else:
        result = await session.execute(
            select(StudentSpecialNeed).where(StudentSpecialNeed.student_id == UUID(student_id))
        )
        assignments = result.scalars().all()
    
    return assignments

@router.post("/assignments", response_model=StudentSpecialNeedOut, status_code=status.HTTP_201_CREATED)
async def assign_special_need_to_student(
    payload: StudentSpecialNeedCreate,
    session: AsyncSession = Depends(get_db),
    current_user: any = Depends(get_current_user),
    _: any = Depends(require_admin),
):
    """Assign a special need tag to a student"""
    from uuid import UUID
    from ..models.student import Student
    
    # Validate student and tag exist
    student = await session.get(Student, UUID(payload.student_id))
    if not student:
        raise HTTPException(status_code=400, detail="Student not found")
    
    tag = await session.get(SpecialNeedsTagLibrary, UUID(payload.tag_library_id))
    if not tag:
        raise HTTPException(status_code=400, detail="Special needs tag not found")
    
    # Check for duplicate active assignment
    existing = await session.execute(
        select(StudentSpecialNeed).where(
            StudentSpecialNeed.student_id == UUID(payload.student_id),
            StudentSpecialNeed.tag_library_id == UUID(payload.tag_library_id),
            StudentSpecialNeed.is_active == True
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Student already has this special need assignment")
    
    assignment = StudentSpecialNeed(
        student_id=UUID(payload.student_id),
        tag_library_id=UUID(payload.tag_library_id),
        severity_level=payload.severity_level,
        notes=payload.notes,
        start_date=payload.start_date,
        end_date=payload.end_date,
        review_date=payload.review_date,
        assigned_by=current_user.id,
    )
    
    session.add(assignment)
    await session.commit()
    await session.refresh(assignment)
    return assignment