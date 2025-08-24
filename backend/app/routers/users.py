from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from ..deps import get_db, require_admin
from ..models.user import User
from ..models.user_role import UserRole
from ..models.school import School
from ..schemas.user import UserOut

router = APIRouter(prefix="/users", tags=["users"])

@router.get("", response_model=List[UserOut])
async def list_users(
    session: AsyncSession = Depends(get_db),
    _: any = Depends(require_admin),
):
    result = await session.execute(select(User).order_by(User.last_name, User.first_name))
    users = result.scalars().all()

    data = []
    for u in users:
        roles_res = await session.execute(select(UserRole).where(UserRole.user_id == u.id))
        roles = roles_res.scalars().all()
        out_roles = []
        for r in roles:
            school = (await session.execute(select(School).where(School.id == r.school_id))).scalar_one_or_none()
            out_roles.append({
                "role": r.role,
                "school_name": school.name if school else "Unknown",
                "is_active": r.is_active
            })
        data.append({
            "id": u.id, "email": u.email, "first_name": u.first_name, "last_name": u.last_name,
            "is_active": u.is_active, "roles": out_roles
        })
    return data
