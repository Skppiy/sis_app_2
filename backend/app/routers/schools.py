from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from ..deps import get_db, require_admin, get_current_user
from ..models.school import School
from ..schemas.school import SchoolCreate, SchoolOut, SchoolUpdate

router = APIRouter(prefix="/schools", tags=["schools"])

@router.get("", response_model=List[SchoolOut])
async def list_schools(
    session: AsyncSession = Depends(get_db),
    _: any = Depends(get_current_user),
):
    res = await session.execute(select(School).order_by(School.name))
    return res.scalars().all()

@router.post("", response_model=SchoolOut, status_code=status.HTTP_201_CREATED)
async def create_school(
    payload: SchoolCreate,
    session: AsyncSession = Depends(get_db),
    _: any = Depends(require_admin),
):
    school = School(
        name=payload.name,
        address=payload.address,
        city=getattr(payload, "city", None),
        state=getattr(payload, "state", None),
        zip_code=getattr(payload, "zip_code", None),
        tz=payload.tz,
    )
    session.add(school)
    await session.commit()
    await session.refresh(school)
    return school

@router.get("/{school_id}", response_model=SchoolOut)
async def get_school(
    school_id: str,
    session: AsyncSession = Depends(get_db),
    _: any = Depends(get_current_user),
):
    from uuid import UUID
    school = await session.get(School, UUID(school_id))
    if not school:
        raise HTTPException(status_code=404, detail="School not found")
    return school

@router.patch("/{school_id}", response_model=SchoolOut)
async def update_school(
    school_id: str,
    payload: SchoolUpdate,
    session: AsyncSession = Depends(get_db),
    _: any = Depends(require_admin),
):
    from uuid import UUID
    school = await session.get(School, UUID(school_id))
    if not school:
        raise HTTPException(status_code=404, detail="School not found")

    # apply partial updates
    for field in ("name", "address", "city", "state", "zip_code", "tz"):
        val = getattr(payload, field, None)
        if val is not None:
            setattr(school, field, val)

    await session.commit()
    await session.refresh(school)
    return school
