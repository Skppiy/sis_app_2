# backend/app/routers/rooms.py - Enhanced with availability checking

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_
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
    query = select(Room).where(Room.is_active == True).order_by(Room.name)
    
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
            and_(Classroom.room_id.isnot(None), Classroom.is_active == True)
        )
        query = query.where(Room.id.notin_(used_rooms_subquery))
    
    result = await session.execute(query)
    return result.scalars().all()

@router.get("/availability", response_model=dict)
async def get_room_availability(
    school_id: str,
    session: AsyncSession = Depends(get_db),
    _: any = Depends(get_current_user),
):
    """Get comprehensive room availability and utilization data"""
    
    # Get all rooms for the school
    rooms_result = await session.execute(
        select(Room).where(
            and_(Room.school_id == UUID(school_id), Room.is_active == True)
        )
    )
    all_rooms = rooms_result.scalars().all()
    
    # Get rooms currently in use by classrooms
    used_rooms_result = await session.execute(
        select(Room, Classroom)
        .join(Classroom, Room.id == Classroom.room_id)
        .where(
            and_(
                Room.school_id == UUID(school_id),
                Room.is_active == True,
                Classroom.is_active == True
            )
        )
    )
    used_rooms_data = used_rooms_result.all()
    
    # Process the data
    total_rooms = len(all_rooms)
    used_rooms = len(used_rooms_data)
    available_rooms = total_rooms - used_rooms
    utilization_rate = round((used_rooms / total_rooms * 100) if total_rooms > 0 else 0, 1)
    
    # Room usage details
    room_usage = []
    used_room_ids = {room.Room.id for room in used_rooms_data}
    
    for room in all_rooms:
        usage_info = {
            "room_id": str(room.id),
            "room_name": room.name,
            "room_code": room.room_code,
            "room_type": room.room_type,
            "capacity": room.capacity,
            "is_available": room.id not in used_room_ids,
            "assigned_classroom": None
        }
        
        # Find assigned classroom if any
        for used_room in used_rooms_data:
            if used_room.Room.id == room.id:
                usage_info["assigned_classroom"] = {
                    "id": str(used_room.Classroom.id),
                    "name": used_room.Classroom.name,
                    "grade_level": used_room.Classroom.grade_level
                }
                break
        
        room_usage.append(usage_info)
    
    # Available rooms by type
    available_by_type = {}
    for room in all_rooms:
        if room.id not in used_room_ids:
            room_type = room.room_type
            if room_type not in available_by_type:
                available_by_type[room_type] = []
            available_by_type[room_type].append({
                "id": str(room.id),
                "name": room.name,
                "code": room.room_code,
                "capacity": room.capacity
            })
    
    return {
        "summary": {
            "total_rooms": total_rooms,
            "used_rooms": used_rooms,
            "available_rooms": available_rooms,
            "utilization_rate": utilization_rate
        },
        "room_usage": room_usage,
        "available_by_type": available_by_type
    }

@router.get("/suggestions", response_model=List[dict])
async def get_room_suggestions(
    school_id: str,
    required_capacity: Optional[int] = None,
    room_type: Optional[str] = None,
    needs_projector: bool = False,
    needs_computers: bool = False,
    needs_smartboard: bool = False,
    needs_sink: bool = False,
    session: AsyncSession = Depends(get_db),
    _: any = Depends(get_current_user),
):
    """Get smart room suggestions based on requirements"""
    
    # Start with available rooms
    query = select(Room).where(
        and_(
            Room.school_id == UUID(school_id),
            Room.is_active == True
        )
    )
    
    # Exclude rooms currently in use
    used_rooms_subquery = select(Classroom.room_id).where(
        and_(Classroom.room_id.isnot(None), Classroom.is_active == True)
    )
    query = query.where(Room.id.notin_(used_rooms_subquery))
    
    # Apply requirements
    if required_capacity:
        query = query.where(Room.capacity >= required_capacity)
    
    if room_type:
        query = query.where(Room.room_type == room_type.upper())
    
    if needs_projector:
        query = query.where(Room.has_projector == True)
    
    if needs_computers:
        query = query.where(Room.has_computers == True)
    
    if needs_smartboard:
        query = query.where(Room.has_smartboard == True)
    
    if needs_sink:
        query = query.where(Room.has_sink == True)
    
    result = await session.execute(query.order_by(Room.capacity))
    rooms = result.scalars().all()
    
    # Score rooms based on how well they match requirements
    suggestions = []
    for room in rooms:
        score = 0
        reasons = []
        
        # Base score for being available
        score += 10
        reasons.append("Available")
        
        # Capacity scoring
        if required_capacity:
            if room.capacity >= required_capacity:
                if room.capacity <= required_capacity * 1.2:  # Perfect size
                    score += 20
                    reasons.append("Perfect size")
                else:
                    score += 10
                    reasons.append("Large enough")
        
        # Equipment matching
        if needs_projector and room.has_projector:
            score += 15
            reasons.append("Has projector")
        if needs_computers and room.has_computers:
            score += 15
            reasons.append("Has computers")
        if needs_smartboard and room.has_smartboard:
            score += 15
            reasons.append("Has smartboard")
        if needs_sink and room.has_sink:
            score += 15
            reasons.append("Has sink")
        
        # Room type bonus
        if room_type and room.room_type == room_type.upper():
            score += 10
            reasons.append(f"Correct type ({room.room_type})")
        
        suggestions.append({
            "room": {
                "id": str(room.id),
                "name": room.name,
                "code": room.room_code,
                "type": room.room_type,
                "capacity": room.capacity,
                "has_projector": room.has_projector,
                "has_computers": room.has_computers,
                "has_smartboard": room.has_smartboard,
                "has_sink": room.has_sink
            },
            "score": score,
            "match_reasons": reasons,
            "recommendation_level": (
                "Excellent" if score >= 50 else
                "Good" if score >= 30 else
                "Fair"
            )
        })
    
    # Sort by score (highest first)
    suggestions.sort(key=lambda x: x["score"], reverse=True)
    
    return suggestions

@router.post("", response_model=RoomOut, status_code=status.HTTP_201_CREATED)
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
    return room

@router.get("/{room_id}", response_model=RoomOut)
async def get_room(
    room_id: str,
    session: AsyncSession = Depends(get_db),
    _: any = Depends(get_current_user),
):
    """Get a specific room with usage information"""
    room = await session.get(Room, UUID(room_id))
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    return room

@router.get("/{room_id}/usage", response_model=dict)
async def get_room_usage(
    room_id: str,
    session: AsyncSession = Depends(get_db),
    _: any = Depends(get_current_user),
):
    """Get detailed usage information for a specific room"""
    
    room = await session.get(Room, UUID(room_id))
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    
    # Check if room is currently assigned to any classrooms
    classroom_result = await session.execute(
        select(Classroom).where(
            and_(
                Classroom.room_id == UUID(room_id),
                Classroom.is_active == True
            )
        )
    )
    assigned_classrooms = classroom_result.scalars().all()
    
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
                "subject": classroom.subject.name if hasattr(classroom, 'subject') else None
            }
            for classroom in assigned_classrooms
        ],
        "usage_count": len(assigned_classrooms)
    }
    
    return usage_info

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
            and_(
                Classroom.room_id == UUID(room_id),
                Classroom.is_active == True
            )
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
    return room