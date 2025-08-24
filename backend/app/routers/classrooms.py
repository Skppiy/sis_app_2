# backend/app/routers/classrooms.py
# Fixed with proper room loading and PUT endpoint

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from sqlalchemy.orm import joinedload, selectinload
from typing import List, Optional
import uuid
from uuid import UUID

from ..deps import get_db, require_admin, get_current_user
from ..models.classroom import Classroom
from ..models.subject import Subject
from ..models.academic_year import AcademicYear
from ..models.room import Room
from ..models.user import User
from ..models.classroom_teacher_assignment import ClassroomTeacherAssignment
from ..schemas.classroom import ClassroomCreate, ClassroomOut, ClassroomWithDetails, ClassroomUpdate

router = APIRouter(prefix="/classrooms", tags=["classrooms"])

@router.get("", response_model=List[ClassroomOut])
async def list_classrooms(
    academic_year_id: Optional[str] = None,
    subject_id: Optional[str] = None,
    teacher_user_id: Optional[str] = None,
    session: AsyncSession = Depends(get_db),
    _: any = Depends(get_current_user),
):
    """List classrooms with optional filtering - FIXED to load all relationships"""
    query = select(Classroom).options(
        joinedload(Classroom.subject),
        joinedload(Classroom.academic_year),
        joinedload(Classroom.room),  # FIXED: Load room relationship
        selectinload(Classroom.teacher_assignments).joinedload(ClassroomTeacherAssignment.teacher)  # FIXED: Load teacher assignments
    )
    
    if academic_year_id:
        query = query.where(Classroom.academic_year_id == UUID(academic_year_id))
    
    if subject_id:
        query = query.where(Classroom.subject_id == UUID(subject_id))
    
    if teacher_user_id:
        query = query.join(ClassroomTeacherAssignment).where(
            and_(
                ClassroomTeacherAssignment.teacher_user_id == UUID(teacher_user_id),
                ClassroomTeacherAssignment.is_active == True
            )
        )
    
    result = await session.execute(query)
    classrooms = result.scalars().all()
    
    # Add enrollment count for each classroom
    for classroom in classrooms:
        # Get enrollment count (when enrollment model exists)
        # For now, set to 0 as placeholder
        classroom.enrollment_count = 0
    
    return classrooms

@router.get("", response_model=List[ClassroomOut])
async def list_classrooms(
    academic_year_id: Optional[str] = None,
    subject_id: Optional[str] = None,
    teacher_user_id: Optional[str] = None,
    session: AsyncSession = Depends(get_db),
    _: any = Depends(get_current_user),
):
    """List classrooms with optional filtering - DEBUG VERSION"""
    print("🔍 DEBUG: Starting list_classrooms")
    
    query = select(Classroom).options(
        joinedload(Classroom.subject),
        joinedload(Classroom.academic_year),
        joinedload(Classroom.room),
        selectinload(Classroom.teacher_assignments).joinedload(ClassroomTeacherAssignment.teacher)
    )
    
    if academic_year_id:
        query = query.where(Classroom.academic_year_id == UUID(academic_year_id))
    
    if subject_id:
        query = query.where(Classroom.subject_id == UUID(subject_id))
    
    if teacher_user_id:
        query = query.join(ClassroomTeacherAssignment).where(
            and_(
                ClassroomTeacherAssignment.teacher_user_id == UUID(teacher_user_id),
                ClassroomTeacherAssignment.is_active == True
            )
        )
    
    result = await session.execute(query)
    classrooms = result.scalars().all()
    
    print(f"🔍 DEBUG: Found {len(classrooms)} classrooms")
    
    for i, classroom in enumerate(classrooms):
        print(f"🔍 DEBUG: Classroom {i+1}: {classroom.name}")
        print(f"   - Teacher assignments count: {len(classroom.teacher_assignments) if classroom.teacher_assignments else 0}")
        
        if classroom.teacher_assignments:
            for j, ta in enumerate(classroom.teacher_assignments):
                print(f"   - Assignment {j+1}: Role={ta.role_name}, Active={ta.is_active}")
                print(f"     Teacher: {ta.teacher.first_name if ta.teacher else 'None'} {ta.teacher.last_name if ta.teacher else ''}")
        else:
            print("   - No teacher assignments found!")
        
        # Set enrollment count
        classroom.enrollment_count = 0
    
    print("🔍 DEBUG: Returning classrooms")
    return classrooms

@router.post("", response_model=ClassroomOut, status_code=status.HTTP_201_CREATED)
async def create_classroom(
    payload: ClassroomCreate,
    session: AsyncSession = Depends(get_db),
    _: any = Depends(require_admin),
):
    """Create a new classroom with enhanced validation and room assignment"""
    
    # Validate subject exists
    subject = await session.get(Subject, UUID(payload.subject_id))
    if not subject:
        raise HTTPException(status_code=400, detail="Subject not found")
    
    # Validate academic year exists
    academic_year = await session.get(AcademicYear, UUID(payload.academic_year_id))
    if not academic_year:
        raise HTTPException(status_code=400, detail="Academic year not found")
    
    # Validate room exists if provided
    room = None
    if payload.room_id:
        room = await session.get(Room, UUID(payload.room_id))
        if not room:
            raise HTTPException(status_code=400, detail="Room not found")
    
    # Create classroom with room assignment
    classroom_data = {
        "id": uuid.uuid4(),
        "name": payload.name,
        "subject_id": UUID(payload.subject_id),
        "academic_year_id": UUID(payload.academic_year_id),
        "grade_level": payload.grade_level,
        "classroom_type": payload.classroom_type,
        "max_students": payload.max_students
    }
    
    # Add room assignment if provided
    if room:
        classroom_data["room_id"] = room.id
    
    classroom = Classroom(**classroom_data)
    session.add(classroom)
    await session.commit()
    await session.refresh(classroom)
    
    # Load related data for response
    await session.refresh(classroom, ["subject", "academic_year", "room"])
    
    return classroom

@router.post("/homeroom", response_model=ClassroomOut, status_code=status.HTTP_201_CREATED)
async def create_homeroom_classroom(
    payload: dict,
    session: AsyncSession = Depends(get_db),
    _: any = Depends(require_admin),
):
    """
    Create an elementary homeroom classroom with automatic core subject assignment
    Fixed to handle proper validation and creation
    """
    
    try:
        # Extract and validate required fields
        teacher_id = payload.get("teacher_id")
        grade_level = payload.get("grade_level")
        room_id = payload.get("room_id")
        academic_year_id = payload.get("academic_year_id")
        name = payload.get("name")
        max_students = payload.get("max_students", 25)
        
        # Validate required fields
        if not all([teacher_id, grade_level, academic_year_id]):
            raise HTTPException(
                status_code=400, 
                detail="teacher_id, grade_level, and academic_year_id are required for homeroom creation"
            )
        
        # Validate teacher exists
        teacher = await session.get(User, UUID(teacher_id))
        if not teacher:
            raise HTTPException(status_code=400, detail="Teacher not found")
        
        # Validate academic year exists
        academic_year = await session.get(AcademicYear, UUID(academic_year_id))
        if not academic_year:
            raise HTTPException(status_code=400, detail="Academic year not found")
        
        # Validate room exists if provided
        room = None
        if room_id:
            room = await session.get(Room, UUID(room_id))
            if not room:
                raise HTTPException(status_code=400, detail="Room not found")
        
        # Get a core subject for the homeroom
        core_subjects_result = await session.execute(
            select(Subject).where(Subject.is_homeroom_default == True).limit(1)
        )
        homeroom_subject = core_subjects_result.scalar_one_or_none()
        
        if not homeroom_subject:
            general_subjects_result = await session.execute(
                select(Subject).where(Subject.subject_type == 'CORE').limit(1)
            )
            homeroom_subject = general_subjects_result.scalar_one_or_none()
            
            if not homeroom_subject:
                raise HTTPException(
                    status_code=400, 
                    detail="No core subjects found. Please create core subjects first."
                )
        
        # Auto-generate name if not provided
        if not name:
            name = f"{teacher.first_name} {teacher.last_name}'s Grade {grade_level} Homeroom"
        
        # Create the homeroom classroom with room assignment
        classroom_data = {
            "id": uuid.uuid4(),
            "name": name,
            "subject_id": homeroom_subject.id,
            "academic_year_id": UUID(academic_year_id),
            "grade_level": grade_level,
            "classroom_type": "HOMEROOM",
            "max_students": max_students
        }
        
        # Add room assignment if provided
        if room:
            classroom_data["room_id"] = room.id
        
        classroom = Classroom(**classroom_data)
        session.add(classroom)
        await session.flush()  # Get the classroom ID
        
        # Create teacher assignment
        teacher_assignment = ClassroomTeacherAssignment(
            id=uuid.uuid4(),
            classroom_id=classroom.id,
            teacher_user_id=teacher.id,
            role_name="Homeroom Teacher",
            can_view_grades=True,
            can_modify_grades=True,
            can_take_attendance=True,
            can_view_parent_contact=True,
            can_create_assignments=True,
            start_date=academic_year.start_date,
            is_active=True
        )
        session.add(teacher_assignment)
        
        await session.commit()
        await session.refresh(classroom)
        
        # Load related data for response
        await session.refresh(classroom, ["subject", "academic_year", "room"])
        
        return classroom
        
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        # Handle any other errors
        await session.rollback()
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to create homeroom classroom: {str(e)}"
        )

@router.put("/{classroom_id}", response_model=ClassroomOut)
async def update_classroom(
    classroom_id: str,
    payload: ClassroomUpdate,
    session: AsyncSession = Depends(get_db),
    _: any = Depends(require_admin),
):
    """Update a classroom - FIXED to handle room_id"""
    classroom = await session.get(Classroom, UUID(classroom_id))
    if not classroom:
        raise HTTPException(status_code=404, detail="Classroom not found")
    
    # Validate room if being updated
    if payload.room_id is not None:
        if payload.room_id == "":
            # Empty string means remove room assignment
            classroom.room_id = None
        else:
            room = await session.get(Room, UUID(payload.room_id))
            if not room:
                raise HTTPException(status_code=400, detail="Room not found")
            classroom.room_id = room.id
    
    # Update other fields
    if payload.name is not None:
        classroom.name = payload.name
    if payload.grade_level is not None:
        classroom.grade_level = payload.grade_level
    if payload.classroom_type is not None:
        classroom.classroom_type = payload.classroom_type
    if payload.max_students is not None:
        classroom.max_students = payload.max_students
    
    await session.commit()
    await session.refresh(classroom, ["subject", "academic_year", "room"])
    return classroom

@router.delete("/{classroom_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_classroom(
    classroom_id: str,
    session: AsyncSession = Depends(get_db),
    _: any = Depends(require_admin),
):
    """Delete a classroom"""
    classroom = await session.get(Classroom, UUID(classroom_id))
    if not classroom:
        raise HTTPException(status_code=404, detail="Classroom not found")
    
    # TODO: Check for enrollments before deletion
    # For now, allow deletion
    
    await session.delete(classroom)
    await session.commit()