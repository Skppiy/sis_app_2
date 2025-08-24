from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
import sqlalchemy as sa

from ..deps import get_db, require_admin, require_role, get_current_user
from ..models.user import User
from ..models.user_role import UserRole
from ..models.school import School
from ..models.school_year import SchoolYear
from ..models.enrollment import Enrollment
from ..models.classroom import Classroom
from ..models.student import Student

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/admin_overview")
async def admin_overview(session: AsyncSession = Depends(get_db), _: User = Depends(require_admin)):
    total_users = (await session.execute(select(func.count()).select_from(User))).scalar_one()
    total_schools = (await session.execute(select(func.count()).select_from(School))).scalar_one()

    # Roles summary
    roles_rows = (await session.execute(
        select(UserRole.role, func.count())
        .where(UserRole.is_active == True)
        .group_by(UserRole.role)
        .order_by(UserRole.role)
    )).all()
    roles_summary = [{"role": r[0], "count": r[1]} for r in roles_rows]

    # Recent users (by created_at if present; fallback to email)
    recent_users_rows = (await session.execute(
        select(User).order_by(User.created_at.desc()).limit(5)
    )).scalars().all()
    recent_users = [
        {
            "id": str(u.id),
            "name": f"{u.first_name} {u.last_name}",
            "email": u.email,
            "is_active": u.is_active,
        }
        for u in recent_users_rows
    ]

    return {
        "total_users": total_users,
        "total_schools": total_schools,
        "roles_summary": roles_summary,
        "recent_users": recent_users,
    }


@router.get("/teacher_overview")
async def teacher_overview(
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
    _: User = Depends(require_role("teacher")),
    school_year_id: str | None = None,
):
    # Schools where this user is a teacher
    teacher_roles = (await session.execute(
        select(UserRole).where(
            UserRole.user_id == user.id,
            UserRole.role.ilike("%teacher%"),
            UserRole.is_active == True,
        )
    )).scalars().all()
    school_ids = [tr.school_id for tr in teacher_roles]

    schools = []
    colleagues = []
    admins = []
    students = []
    if school_ids:
        schools = (await session.execute(select(School).where(School.id.in_(school_ids)))).scalars().all()
        # Colleagues: other teachers in same schools
        colleagues_rows = (await session.execute(
            select(User)
            .join(UserRole, UserRole.user_id == User.id)
            .where(
                UserRole.school_id.in_(school_ids),
                UserRole.role.ilike("%teacher%"),
                UserRole.is_active == True,
                User.id != user.id,
            )
            .order_by(User.last_name, User.first_name)
            .limit(10)
        )).scalars().all()
        colleagues = [
            {"id": str(u.id), "name": f"{u.first_name} {u.last_name}", "email": u.email}
            for u in colleagues_rows
        ]
        # Admin contacts in same schools
        admins_rows = (await session.execute(
            select(User)
            .join(UserRole, UserRole.user_id == User.id)
            .where(
                UserRole.school_id.in_(school_ids),
                UserRole.role.ilike("admin%"),
                UserRole.is_active == True,
            )
            .order_by(User.last_name, User.first_name)
            .limit(10)
        )).scalars().all()
        admins = [
            {"id": str(u.id), "name": f"{u.first_name} {u.last_name}", "email": u.email}
            for u in admins_rows
        ]

        # Determine selected/active year
        year_uuid = None
        if school_year_id:
            year_uuid = school_year_id
        else:
            active_year = (await session.execute(select(SchoolYear).where(SchoolYear.is_active == True))).scalar_one_or_none()
            if active_year:
                year_uuid = str(active_year.id)

        # Students taught by this teacher (homeroom classrooms owned by teacher), filtered by year when provided
        student_rows = (await session.execute(
            select(Student)
            .join(Enrollment, Enrollment.student_id == Student.id)
            .join(Classroom, Classroom.id == Enrollment.classroom_id)
            .where(
                Classroom.teacher_user_id == user.id,
                Classroom.school_id.in_(school_ids),
                (Enrollment.school_year_id == year_uuid) if year_uuid is not None else sa.true(),
            )
            .order_by(Student.last_name, Student.first_name)
        )).scalars().all()
        students = [
            {"id": str(s.id), "name": f"{s.first_name} {s.last_name}", "email": s.email}
            for s in student_rows
        ]

    # Student counts per school and per (active) year
    counts = []
    for sid in school_ids:
        # use selected/active year for counts
        if school_year_id:
            year_id = school_year_id
        else:
            active_year = (await session.execute(select(SchoolYear).where(SchoolYear.is_active == True))).scalar_one_or_none()
            year_id = active_year.id if active_year else None
        total = (await session.execute(
            select(func.count())
            .select_from(Enrollment)
            .join(Classroom, Classroom.id == Enrollment.classroom_id)
            .where(Classroom.school_id == sid, (Enrollment.school_year_id == year_id) if year_id is not None else sa.true(), Classroom.teacher_user_id == user.id)
        )).scalar_one()
        counts.append({"school_id": str(sid), "school_name": next((s.name for s in schools if s.id == sid), ""), "year_id": str(year_id) if year_id else None, "student_count": total})

    return {
        "schools": [{"id": s.id, "name": s.name} for s in schools],
        "colleagues": colleagues,
        "admins": admins,
        "students": students,
        "counts": counts,
    }


@router.get("/parent_overview")
async def parent_overview(
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
    _: User = Depends(require_role("parent")),
):
    # Schools where this user is a parent
    parent_roles = (await session.execute(
        select(UserRole).where(
            UserRole.user_id == user.id,
            UserRole.role.ilike("%parent%"),
            UserRole.is_active == True,
        )
    )).scalars().all()
    school_ids = [pr.school_id for pr in parent_roles]

    schools = []
    admins = []
    if school_ids:
        schools = (await session.execute(select(School).where(School.id.in_(school_ids)))).scalars().all()
        admins_rows = (await session.execute(
            select(User)
            .join(UserRole, UserRole.user_id == User.id)
            .where(
                UserRole.school_id.in_(school_ids),
                UserRole.role.ilike("admin%"),
                UserRole.is_active == True,
            )
            .order_by(User.last_name, User.first_name)
            .limit(10)
        )).scalars().all()
        admins = [
            {"id": str(u.id), "name": f"{u.first_name} {u.last_name}", "email": u.email}
            for u in admins_rows
        ]

    return {
        "schools": [{"id": s.id, "name": s.name} for s in schools],
        "admins": admins,
    }


