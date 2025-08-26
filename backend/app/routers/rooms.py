# backend/app/routers/rooms.py - FIXED with proper relationship loading

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_
from sqlalchemy.orm import selectinload, joinedload  # ADDED: Missing import
from typing import List, Optional
from ..deps import get_db, require_admin, get_current_user
from ..models.room import Room
from ..models.classroom import Classroom
from ..schemas.room import RoomCreate, RoomOut, RoomUpdate
from uuid import UUID

router = APIRouter(prefix="/rooms", tags=["rooms"])

@router.get("", response_model=List[RoomOut])
async def list_rooms(
    school_id: Optional[str] = None,
    room_type: Optional[str] = None,
    bookable_only: bool = False,
    available_only: bool = False,
    min_capacity: Optional[int] = None,
    has_projector: Optional[bool] = None,
    has_computers: Optional[bool] = None,
    has_smartboard: Optional[bool] = None,
    has_sink: Optional[bool] = None,
    session: AsyncSession = Depends(get_db),
    _: any = Depends(get_current_user),
):
    """Get rooms with comprehensive filtering options"""
    # FIXED: Add joinedload for school relationship
    query = select(Room).options(
        joinedload(Room.school)
    ).where(Room.is_active == True).order_by(Room.name)
    
    if school_id:
        query = query.where(Room.school_id == UUID(school_id))
    
    if room_type:
        query = query.where(Room.room_type == room_type.upper())
    
    if bookable_only:
        query = query.where(Room.is_bookable == True)
    
    if min_capacity:
        query = query.where(Room.capacity >= min_capacity)
    
    # Equipment filters
    if has_projector is not None:
        query = query.where(Room.has_projector == has_projector)
    
    if has_computers is not None:
        query = query.where(Room.has_computers == has_computers)
    
    if has_smartboard is not None:
        query = query.where(Room.has_smartboard == has_smartboard)
    
    if has_sink is not None:
        query = query.where(Room.has_sink == has_sink)
    
    # Filter out rooms that are currently assigned to classrooms
    if available_only:
        # Subquery to get rooms that are in use
        used_rooms_subquery = select(Classroom.room_id).where(
            Classroom.room_id.isnot(None)
        )
        query = query.where(Room.id.notin_(used_rooms_subquery))
    
    result = await session.execute(query)
    return result.scalars().unique().all()  # FIXED: Added unique() to handle joined data

@router.get("/{room_id}/usage", response_model=dict)
async def get_room_usage(
    room_id: str,
    session: AsyncSession = Depends(get_db),
    _: any = Depends(get_current_user),
):
    """Get detailed usage information for a specific room"""
    
    # FIXED: Load room with its school relationship
    result = await session.execute(
        select(Room).options(joinedload(Room.school)).where(Room.id == UUID(room_id))
    )
    room = result.scalar_one_or_none()
    
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    
    # Get assigned classrooms with their relationships loaded
    classroom_result = await session.execute(
        select(Classroom).options(
            joinedload(Classroom.subject),
            joinedload(Classroom.academic_year)
        ).where(
            Classroom.room_id == UUID(room_id)
        )
    )
    
    assigned_classrooms = classroom_result.scalars().unique().all()
    
    usage_info = {
        "room": {
            "id": str(room.id),
            "name": room.name,
            "code": room.room_code,
            "type": room.room_type,
            "capacity": room.capacity
        },
        "is_available": len(assigned_classrooms) == 0,
        "assigned_classrooms": [
            {
                "id": str(classroom.id),
                "name": classroom.name,
                "grade_level": classroom.grade_level,
                "subject": classroom.subject.name if classroom.subject else None
            }
            for classroom in assigned_classrooms
        ],
        "usage_count": len(assigned_classrooms)
    }
    
    return usage_info

@router.post("", response_model=RoomOut)
async def create_room(
    payload: RoomCreate,
    session: AsyncSession = Depends(get_db),
    _: any = Depends(require_admin),
):
    """Create a new room with enhanced validation"""
    from ..models.school import School
    
    # Validate school exists
    school = await session.get(School, UUID(payload.school_id))
    if not school:
        raise HTTPException(status_code=400, detail="School not found")
    
    # Check for duplicate room code at school
    existing = await session.execute(
        select(Room).where(
            and_(
                Room.school_id == UUID(payload.school_id), 
                Room.room_code == payload.room_code,
                Room.is_active == True
            )
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=400, 
            detail=f"Room code '{payload.room_code}' already exists at this school"
        )
    
    # Validate capacity
    if payload.capacity < 1 or payload.capacity > 100:
        raise HTTPException(
            status_code=400,
            detail="Room capacity must be between 1 and 100"
        )
    
    room = Room(
        name=payload.name,
        room_code=payload.room_code.upper(),
        room_type=payload.room_type.upper(),
        capacity=payload.capacity,
        has_projector=payload.has_projector,
        has_computers=payload.has_computers,
        has_smartboard=payload.has_smartboard,
        has_sink=payload.has_sink,
        is_bookable=payload.is_bookable,
        school_id=UUID(payload.school_id),
    )
    
    session.add(room)
    await session.commit()
    await session.refresh(room)
    
    # FIXED: Load the school relationship before returning
    await session.execute(
        select(Room).options(joinedload(Room.school)).where(Room.id == room.id)
    )
    
    return room

@router.get("/{room_id}", response_model=RoomOut)
async def get_room(
    room_id: str,
    session: AsyncSession = Depends(get_db),
    _: any = Depends(get_current_user),
):
    """Get a specific room with usage information"""
    # FIXED: Load room with school relationship
    result = await session.execute(
        select(Room).options(joinedload(Room.school)).where(Room.id == UUID(room_id))
    )
    room = result.scalar_one_or_none()
    
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    return room

@router.patch("/{room_id}", response_model=RoomOut)
async def update_room(
    room_id: str,
    payload: RoomUpdate,
    session: AsyncSession = Depends(get_db),
    _: any = Depends(require_admin),
):
    """Update a room with enhanced validation"""
    
    room = await session.get(Room, UUID(room_id))
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    
    # Check if room code is being changed and if it conflicts
    if payload.room_code and payload.room_code != room.room_code:
        existing = await session.execute(
            select(Room).where(
                and_(
                    Room.school_id == room.school_id,
                    Room.room_code == payload.room_code,
                    Room.id != UUID(room_id),
                    Room.is_active == True
                )
            )
        )
        if existing.scalar_one_or_none():
            raise HTTPException(
                status_code=400,
                detail=f"Room code '{payload.room_code}' already exists at this school"
            )
    
    # Validate capacity if being updated
    if payload.capacity is not None:
        if payload.capacity < 1 or payload.capacity > 100:
            raise HTTPException(
                status_code=400,
                detail="Room capacity must be between 1 and 100"
            )
    
    # Update fields
    update_data = payload.dict(exclude_unset=True)
    for field, value in update_data.items():
        if field == 'room_type' and value:
            value = value.upper()
        elif field == 'room_code' and value:
            value = value.upper()
        setattr(room, field, value)
    
    await session.commit()
    await session.refresh(room)
    
    # FIXED: Load the school relationship before returning
    result = await session.execute(
        select(Room).options(joinedload(Room.school)).where(Room.id == room.id)
    )
    room = result.scalar_one_or_none()
    
    return room

@router.delete("/{room_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_room(
    room_id: str,
    session: AsyncSession = Depends(get_db),
    _: any = Depends(require_admin),
):
    """Delete a room (soft delete) with safety checks"""
    
    room = await session.get(Room, UUID(room_id))
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    
    # Check if room is currently in use
    classroom_result = await session.execute(
        select(Classroom).where(
            Classroom.room_id == UUID(room_id)
        )
    )
    assigned_classrooms = classroom_result.scalars().all()
    
    if assigned_classrooms:
        classroom_names = [c.name for c in assigned_classrooms]
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete room that is assigned to classrooms: {', '.join(classroom_names)}"
        )
    
    # Soft delete
    room.is_active = False
    await session.commit()

@router.post("/{room_id}/restore", response_model=RoomOut)
async def restore_room(
    room_id: str,
    session: AsyncSession = Depends(get_db),
    _: any = Depends(require_admin),
):
    """Restore a soft-deleted room"""
    
    room = await session.get(Room, UUID(room_id))
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    
    if room.is_active:
        raise HTTPException(status_code=400, detail="Room is already active")
    
    # Check for room code conflicts before restoring
    existing = await session.execute(
        select(Room).where(
            and_(
                Room.school_id == room.school_id,
                Room.room_code == room.room_code,
                Room.id != UUID(room_id),
                Room.is_active == True
            )
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=400,
            detail=f"Cannot restore: Room code '{room.room_code}' is already in use"
        )
    
    room.is_active = True
    await session.commit()
    await session.refresh(room)
    
    # FIXED: Load the school relationship before returning
    result = await session.execute(
        select(Room).options(joinedload(Room.school)).where(Room.id == room.id)
    )
    room = result.scalar_one_or_none()
    
    return room