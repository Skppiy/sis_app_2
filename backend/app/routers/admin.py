from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from ..deps import get_db, require_admin, get_current_user
from ..models.user import User
from ..models.user_role import UserRole
from ..models.school import School
from ..schemas.user import UserCreate, UserOut
from ..security import get_password_hash


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


@router.get("/teachers")
async def list_teachers(
    school_id: str | None = None,
    session: AsyncSession = Depends(get_db),
    _: any = Depends(require_admin),
):
    # users having a teacher role at a given school (or any school if not provided)
    stmt = (
        select(User)
        .join(UserRole, UserRole.user_id == User.id)
        .where(UserRole.role.ilike("%teacher%"), UserRole.is_active == True)
    )
    if school_id:
        stmt = stmt.where(UserRole.school_id == school_id)
    stmt = stmt.order_by(User.last_name, User.first_name)
    users = (await session.execute(stmt)).scalars().all()
    return [
        {"id": u.id, "first_name": u.first_name, "last_name": u.last_name, "email": u.email}
        for u in users
    ]

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
