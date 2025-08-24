


# backend/app/routers/parents.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from ..deps import get_db, require_admin, get_current_user
from ..models.parent import Parent
from ..models.parent_student_relationship import ParentStudentRelationship
from ..models.user import User
from ..models.student import Student
from ..schemas.parent import (
    ParentCreate, ParentOut, ParentUpdate,
    ParentStudentRelationshipCreate, ParentStudentRelationshipOut, ParentStudentRelationshipUpdate
)
from ..security import get_password_hash

router = APIRouter(prefix="/parents", tags=["parents"])

@router.get("", response_model=List[ParentOut])
async def list_parents(
    session: AsyncSession = Depends(get_db),
    _: any = Depends(require_admin),
):
    """Get all parents"""
    result = await session.execute(
        select(Parent).join(User).order_by(User.last_name, User.first_name)
    )
    return result.scalars().all()

@router.post("", response_model=ParentOut, status_code=status.HTTP_201_CREATED)
async def create_parent(
    payload: ParentCreate,
    session: AsyncSession = Depends(get_db),
    _: any = Depends(require_admin),
):
    """Create a new parent with user account"""
    
    # Check if user already exists
    existing_user = await session.execute(select(User).where(User.email == payload.email))
    user = existing_user.scalar_one_or_none()
    
    if user:
        # Check if user already has parent profile
        existing_parent = await session.execute(select(Parent).where(Parent.user_id == user.id))
        if existing_parent.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="User already has a parent profile")
    else:
        # Create new user account
        user = User(
            email=payload.email,
            hashed_password=get_password_hash(payload.password),
            first_name=payload.first_name,
            last_name=payload.last_name,
        )
        session.add(user)
        await session.flush()  # Get user ID for parent creation
    
    # Create parent profile
    parent = Parent(
        user_id=user.id,
        relationship_type=payload.relationship_type.upper(),
        emergency_contact=payload.emergency_contact,
        pickup_authorized=payload.pickup_authorized,
        preferred_contact_method=payload.preferred_contact_method.upper(),
    )
    
    session.add(parent)
    await session.commit()
    await session.refresh(parent)
    return parent

@router.get("/{parent_id}/students", response_model=List[ParentStudentRelationshipOut])
async def get_parent_students(
    parent_id: str,
    session: AsyncSession = Depends(get_db),
    _: any = Depends(get_current_user),
):
    """Get all students for a parent"""
    from uuid import UUID
    
    relationships = ParentStudentRelationship.get_parent_students(session, UUID(parent_id))
    return relationships

@router.post("/relationships", response_model=ParentStudentRelationshipOut, status_code=status.HTTP_201_CREATED)
async def create_parent_student_relationship(
    payload: ParentStudentRelationshipCreate,
    session: AsyncSession = Depends(get_db),
    _: any = Depends(require_admin),
):
    """Create a parent-student relationship"""
    from uuid import UUID
    
    # Validate parent and student exist
    parent = await session.get(Parent, UUID(payload.parent_id))
    if not parent:
        raise HTTPException(status_code=400, detail="Parent not found")
    
    student = await session.get(Student, UUID(payload.student_id))
    if not student:
        raise HTTPException(status_code=400, detail="Student not found")
    
    # Check for duplicate relationship
    existing = await session.execute(
        select(ParentStudentRelationship).where(
            ParentStudentRelationship.parent_id == UUID(payload.parent_id),
            ParentStudentRelationship.student_id == UUID(payload.student_id),
            ParentStudentRelationship.is_active == True
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Parent-student relationship already exists")
    
    relationship = ParentStudentRelationship(
        parent_id=UUID(payload.parent_id),
        student_id=UUID(payload.student_id),
        relationship_type=payload.relationship_type.upper(),
        custody_status=payload.custody_status.upper(),
        can_view_grades=payload.can_view_grades,
        can_view_attendance=payload.can_view_attendance,
        can_view_discipline=payload.can_view_discipline,
        can_pickup_student=payload.can_pickup_student,
        can_authorize_medical=payload.can_authorize_medical,
        is_emergency_contact=payload.is_emergency_contact,
        emergency_priority=payload.emergency_priority,
    )
    
    session.add(relationship)
    await session.commit()
    await session.refresh(relationship)
    return relationship