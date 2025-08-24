from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, update
from typing import List
from ..deps import get_db, require_admin, get_current_user
from ..models.academic_year import AcademicYear
from ..schemas.academic_year import AcademicYearCreate, AcademicYearOut, AcademicYearUpdate

router = APIRouter(prefix="/academic-years", tags=["academic-years"])

@router.get("", response_model=List[AcademicYearOut])
async def list_academic_years(
    session: AsyncSession = Depends(get_db),
    _: any = Depends(get_current_user),
):
    """Get all academic years, ordered by start date"""
    result = await session.execute(
        select(AcademicYear).order_by(AcademicYear.start_date.desc())
    )
    return result.scalars().all()

@router.get("/active", response_model=AcademicYearOut)
async def get_active_academic_year(
    session: AsyncSession = Depends(get_db),
    _: any = Depends(get_current_user),
):
    """Get the currently active academic year"""
    result = await session.execute(select(AcademicYear).where(AcademicYear.is_active == True))
    active_year = result.scalar_one_or_none()
    if not active_year:
        raise HTTPException(status_code=404, detail="No active academic year found")
    return active_year

@router.post("", response_model=AcademicYearOut, status_code=status.HTTP_201_CREATED)
async def create_academic_year(
    payload: AcademicYearCreate,
    session: AsyncSession = Depends(get_db),
    _: any = Depends(require_admin),
):
    """Create a new academic year"""
    # Validate date range
    if payload.end_date <= payload.start_date:
        raise HTTPException(status_code=400, detail="End date must be after start date")
    
    # Auto-generate short name if not provided
    if not hasattr(payload, 'short_name') or not payload.short_name:
        # Simple short name generation: "2024-2025" -> "24-25"
        if '-' in payload.name:
            years = payload.name.split('-')
            if len(years) == 2 and len(years[0]) == 4 and len(years[1]) == 4:
                short_name = f"{years[0][-2:]}-{years[1][-2:]}"
            else:
                short_name = payload.name[:5]
        else:
            short_name = payload.name[:5]
    else:
        short_name = payload.short_name
    
    # If setting as active, deactivate other years first
    if hasattr(payload, 'is_active') and payload.is_active:
        await session.execute(
            update(AcademicYear).values(is_active=False).where(AcademicYear.is_active == True)
        )
    
    academic_year = AcademicYear(
        name=payload.name,
        short_name=short_name,
        start_date=payload.start_date,
        end_date=payload.end_date,
        is_active=getattr(payload, 'is_active', False)
    )
    
    session.add(academic_year)
    await session.commit()
    await session.refresh(academic_year)
    return academic_year

@router.patch("/{year_id}/activate", response_model=AcademicYearOut)
async def activate_academic_year(
    year_id: str,
    session: AsyncSession = Depends(get_db),
    _: any = Depends(require_admin),
):
    """Set an academic year as the active one"""
    from uuid import UUID
    
    # Deactivate all years
    await session.execute(
        update(AcademicYear).values(is_active=False)
    )
    
    # Activate the specified year
    academic_year = await session.get(AcademicYear, UUID(year_id))
    if not academic_year:
        raise HTTPException(status_code=404, detail="Academic year not found")
    
    academic_year.is_active = True
    await session.commit()
    await session.refresh(academic_year)
    return academic_year