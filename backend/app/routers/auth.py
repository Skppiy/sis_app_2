from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from ..db import get_session
from ..deps import get_current_user
from ..models.user import User
from ..models.user_role import UserRole
from ..models.user_role_preference import UserRolePreference
from ..models.school import School
from ..security import verify_password, create_access_token
from ..schemas.auth import Token
from ..schemas.user import UserOut

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post('/login', response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(User).where(User.email == form_data.username))
    user = result.scalar_one_or_none()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    token = create_access_token(subject=user.email)
    return {"access_token": token, "token_type": "bearer"}

@router.get('/me')
async def get_current_user_info(user: User = Depends(get_current_user)):
    return {
    "user": {
        "id": str(user.id),
        "email": user.email,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "is_active": user.is_active
    },
}


@router.get('/context')
async def get_auth_context(
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    # Roles for this user
    roles_result = await session.execute(
        select(UserRole).where(UserRole.user_id == user.id)
    )
    roles = roles_result.scalars().all()

    # Schools linked to the user's roles
    school_ids = [r.school_id for r in roles]
    schools = []
    if school_ids:
        schools_result = await session.execute(
            select(School).where(School.id.in_(school_ids))
        )
        schools = schools_result.scalars().all()

    # Preferred role/school; create a default if missing
    pref_result = await session.execute(
        select(UserRolePreference).where(UserRolePreference.user_id == user.id)
    )
    pref = pref_result.scalar_one_or_none()
    if not pref and roles:
        first_role = roles[0]
        pref = UserRolePreference(user_id=user.id, role=first_role.role, school_id=first_role.school_id)
        session.add(pref)
        await session.commit()
        await session.refresh(pref)

    return {
        "user": {
        "id": str(user.id),
        "email": user.email,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "is_active": user.is_active
            },
        "roles": [
            {"role": r.role, "school_id": str(r.school_id), "is_active": r.is_active}
            for r in roles
        ],
        "schools": [
            {"id": s.id, "name": s.name}
            for s in schools
        ],
        "active_role": pref.role if pref else None,
        "active_school": str(pref.school_id) if pref else None,
    }


@router.post('/preference')
async def set_preference(
    payload: dict,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    role = payload.get("role")
    school_id = payload.get("school_id")
    if not role or not school_id:
        raise HTTPException(status_code=400, detail="role and school_id are required")

    # Ensure the user actually has this role@school
    has_role = await session.execute(
        select(UserRole).where(
            UserRole.user_id == user.id,
            UserRole.role == role,
            UserRole.school_id == school_id,
            UserRole.is_active == True,
        )
    )
    if not has_role.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="User does not have this role at the specified school")

    # Upsert preference
    pref_result = await session.execute(
        select(UserRolePreference).where(UserRolePreference.user_id == user.id)
    )
    pref = pref_result.scalar_one_or_none()
    if not pref:
        pref = UserRolePreference(user_id=user.id, role=role, school_id=school_id)
        session.add(pref)
    else:
        pref.role = role
        pref.school_id = school_id
    await session.commit()
    await session.refresh(pref)
    return {"status": "ok", "active_role": pref.role, "active_school": str(pref.school_id)}
