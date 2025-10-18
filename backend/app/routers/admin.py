from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_
from sqlalchemy.orm import joinedload, selectinload
from typing import List, Optional
from ..deps import get_db, require_admin, get_current_user
from ..models.user import User
from ..models.user_role import UserRole
from ..models.school import School
from ..models.classroom import Classroom
from ..models.classroom_teacher_assignment import ClassroomTeacherAssignment
from ..models.room import Room
from ..models.student_subject_enrollment import StudentSubjectEnrollment
from ..models.teacher_subject_assignment import TeacherSubjectAssignment
from ..schemas.user import UserCreate, UserOut
from ..security import get_password_hash
from uuid import UUID
from typing import Optional


router = APIRouter(prefix="/admin", tags=["admin"])

@router.get("/test")
async def test_admin_access(user: User = Depends(get_current_user), session: AsyncSession = Depends(get_db)):
    """Test endpoint to check user roles"""
    result = await session.execute(
        select(UserRole).where(UserRole.user_id == user.id)
    )
    user_roles = result.scalars().all()
    
    return {
        "user_email": user.email,
        "user_roles": [{"role": ur.role, "school_id": str(ur.school_id), "is_active": ur.is_active} for ur in user_roles],
        "has_admin_role": any('admin' in ur.role.lower() for ur in user_roles)
    }

@router.get("/users", response_model=List[UserOut])
async def list_users(session: AsyncSession = Depends(get_db), _: any = Depends(require_admin)):
    # Get users with their roles and schools
    result = await session.execute(
        select(User)
        .order_by(User.last_name, User.first_name)
    )
    users = result.scalars().all()
    
    # For each user, get their roles
    user_data = []
    for user in users:
        user_roles_result = await session.execute(
            select(UserRole).where(UserRole.user_id == user.id)
        )
        user_roles = user_roles_result.scalars().all()
        
        # Get school names for roles
        roles_with_schools = []
        for user_role in user_roles:
            school_result = await session.execute(
                select(School).where(School.id == user_role.school_id)
            )
            school = school_result.scalar_one_or_none()
            roles_with_schools.append({
                "role": user_role.role,
                "school_name": school.name if school else "Unknown",
                "is_active": user_role.is_active
            })
        
        user_data.append({
            "id": user.id,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "is_active": user.is_active,
            "roles": roles_with_schools
        })
    
    return user_data


@router.get("/teachers/homeroom")
async def list_homeroom_teachers(
    academic_year_id: UUID,
    school_id: Optional[UUID] = None,
    grade_level: Optional[str] = None,
    is_active: bool = True,
    session: AsyncSession = Depends(get_db),
    _: any = Depends(require_admin),
):
    """Get teachers who have homeroom assignments"""
    
    print(f"DEBUG: Homeroom teachers query - academic_year_id: {academic_year_id}, grade_level: {grade_level}")
    
    # Simple query for teachers with homeroom assignments
    query = (
        select(User.id, User.first_name, User.last_name, User.email, User.is_active)
        .join(ClassroomTeacherAssignment, ClassroomTeacherAssignment.teacher_user_id == User.id)
        .join(Classroom, ClassroomTeacherAssignment.classroom_id == Classroom.id)
        .where(
            and_(
                ClassroomTeacherAssignment.role_name.ilike("%homeroom%"),
                Classroom.academic_year_id == academic_year_id,
                ClassroomTeacherAssignment.is_active == True,
                User.is_active == is_active
            )
        )
        .distinct()
    )
    
    # Add optional filters
    if grade_level:
        query = query.where(Classroom.grade_level == grade_level)
    
    result = await session.execute(query)
    teachers = result.fetchall()
    
    # Build simple teacher data
    teacher_data = []
    for teacher in teachers:
        teacher_data.append({
            'id': str(teacher.id),
            'first_name': teacher.first_name,
            'last_name': teacher.last_name,
            'email': teacher.email,
            'is_active': teacher.is_active,
            'homeroom_assignments': []  # Simplified for now
        })
    
    return teacher_data


@router.get("/teachers")
async def list_teachers(
    school_id: str | None = None,
    academic_year_id: str | None = None,
    session: AsyncSession = Depends(get_db),
    _: any = Depends(require_admin),
):
    """Enhanced teachers endpoint with complete classroom and room assignment data"""
    
    # Get users with teacher roles
    stmt = (
        select(User)
        .join(UserRole, UserRole.user_id == User.id)
        .where(UserRole.role.ilike("%teacher%"), UserRole.is_active == True)
    )
    if school_id:
        stmt = stmt.where(UserRole.school_id == school_id)
    stmt = stmt.order_by(User.last_name, User.first_name)
    teachers = (await session.execute(stmt)).scalars().all()
    
    # Build enhanced teacher data with room assignments
    teacher_data = []
    
    for teacher in teachers:
        # Get teacher's classroom assignments for the given academic year
        assignment_query = (
            select(ClassroomTeacherAssignment)
            .options(
                joinedload(ClassroomTeacherAssignment.classroom)
                .joinedload(Classroom.room),
                joinedload(ClassroomTeacherAssignment.classroom)
                .joinedload(Classroom.subject)
            )
            .where(
                and_(
                    ClassroomTeacherAssignment.teacher_user_id == teacher.id,
                    ClassroomTeacherAssignment.is_active == True
                )
            )
        )
        
        # Filter by academic year if provided
        if academic_year_id:
            assignment_query = assignment_query.join(Classroom).where(
                Classroom.academic_year_id == academic_year_id
            )
        
        assignments = (await session.execute(assignment_query)).scalars().all()
        
        # Analyze teacher assignments to determine type and room assignments
        homeroom_assignment = None
        specialist_assignment = None
        total_classes = len(assignments)  # SME-approved: Count classes, not students

        for assignment in assignments:
            classroom = assignment.classroom

            # Classify as homeroom or specialist based on classroom type and subject FIRST
            # Then fall back to role names (which can be misleading)
            if (classroom.subject and classroom.subject.requires_specialist) or classroom.classroom_type == "SPECIALIST":
                specialist_assignment = assignment
            elif classroom.classroom_type == "HOMEROOM" or assignment.role_name.lower().find("homeroom") >= 0:
                homeroom_assignment = assignment
            elif assignment.role_name.lower().find("specialist") >= 0:
                specialist_assignment = assignment
            elif assignment.role_name.lower().find("primary") >= 0:
                homeroom_assignment = assignment
        
        # Build teacher response data matching frontend TeacherSchema
        teacher_response = {
            "id": str(teacher.id),
            "first_name": teacher.first_name,
            "last_name": teacher.last_name,
            "email": teacher.email,
            "is_active": teacher.is_active,
            "student_count": total_classes,  # Legacy field name for compatibility
            "class_count": total_classes,    # SME-approved: Show number of classes for workload visibility
            "is_specialist": specialist_assignment is not None,
        }
        
        # Prioritize specialist assignments over homeroom assignments
        # If a teacher has both types, they should be classified as a specialist
        if specialist_assignment:
            classroom = specialist_assignment.classroom
            teacher_response.update({
                "specialist_subject": classroom.subject.name if classroom.subject else None,
                "specialist_room_id": str(classroom.room_id) if classroom.room else None,
                "specialist_room_name": classroom.room.name if classroom.room else None,
                # Ensure specialist teachers don't have homeroom data that could cause display confusion
                "grade_level": None,
                "homeroom_id": None,
                "homeroom_name": None,
            })
        elif homeroom_assignment:
            classroom = homeroom_assignment.classroom
            teacher_response.update({
                "grade_level": classroom.grade_level,
                "homeroom_id": str(classroom.room_id) if classroom.room else None,
                "homeroom_name": classroom.room.name if classroom.room else None,
                # Ensure homeroom teachers don't have specialist data
                "specialist_subject": None,
                "specialist_room_id": None,
                "specialist_room_name": None,
            })
        
        # Ensure all expected fields are present (with None for missing values)
        expected_fields = [
            "grade_level", "homeroom_id", "homeroom_name", 
            "specialist_subject", "specialist_room_id", "specialist_room_name"
        ]
        for field in expected_fields:
            if field not in teacher_response:
                teacher_response[field] = None
        
        teacher_data.append(teacher_response)
    
    return teacher_data

@router.post("/users", response_model=UserOut)
async def create_user(
    user_data: UserCreate, 
    session: AsyncSession = Depends(get_db), 
    _: any = Depends(require_admin)
):
    # Helper to serialize user with roles (like list_users)
    async def _serialize_user(u: User) -> dict:
        user_roles_result = await session.execute(select(UserRole).where(UserRole.user_id == u.id))
        user_roles = user_roles_result.scalars().all()
        roles_with_schools = []
        for ur in user_roles:
            school_result = await session.execute(select(School).where(School.id == ur.school_id))
            school = school_result.scalar_one_or_none()
            roles_with_schools.append({
                "role": ur.role,
                "school_name": school.name if school else "Unknown",
                "is_active": ur.is_active,
            })
        return {
            "id": u.id,
            "email": u.email,
            "first_name": u.first_name,
            "last_name": u.last_name,
            "is_active": u.is_active,
            "roles": roles_with_schools,
        }

    # Check if user already exists
    existing = await session.execute(select(User).where(User.email == user_data.email))
    user = existing.scalar_one_or_none()

    if user:
        # Upsert: allow assigning additional roles (even at same school) for same email
        if not user_data.school_id:
            # No role assignment requested; just return existing
            return await _serialize_user(user)
        # Verify school exists
        school_result = await session.execute(select(School).where(School.id == user_data.school_id))
        school = school_result.scalar_one_or_none()
        if not school:
            raise HTTPException(status_code=400, detail="School not found")

        # Check if the role@school already exists
        dup_check = await session.execute(
            select(UserRole).where(
                UserRole.user_id == user.id,
                UserRole.role == user_data.role,
                UserRole.school_id == user_data.school_id,
            )
        )
        if dup_check.scalar_one_or_none():
            # Already has this assignment
            return await _serialize_user(user)

        # Create new role assignment
        session.add(UserRole(user_id=user.id, role=user_data.role, school_id=user_data.school_id, is_active=True))
        await session.commit()
        return await _serialize_user(user)

    # Create new user
    user = User(
        email=user_data.email,
        hashed_password=get_password_hash(user_data.password),
        first_name=user_data.first_name,
        last_name=user_data.last_name,
    )
    session.add(user)
    await session.commit()
    await session.refresh(user)

    # Create initial role assignment if provided
    if user_data.school_id:
        school_result = await session.execute(select(School).where(School.id == user_data.school_id))
        school = school_result.scalar_one_or_none()
        if not school:
            raise HTTPException(status_code=400, detail="School not found")
        session.add(UserRole(user_id=user.id, role=user_data.role, school_id=user_data.school_id, is_active=True))
        await session.commit()

    return await _serialize_user(user)
