# backend/app/routers/subjects.py
# Fixed with missing PUT endpoint and homeroom sync logic

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from typing import List, Optional
import logging
from ..deps import get_db, require_admin, get_current_user
from ..models.subject import Subject
from ..schemas.subject import SubjectCreate, SubjectOut, SubjectUpdate

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/subjects", tags=["subjects"])

@router.get("", response_model=List[SubjectOut])
async def list_subjects(
    grade_band: Optional[str] = None,  # "elementary", "middle"
    subject_type: Optional[str] = None,  # "CORE", "ENRICHMENT", "SPECIAL"
    include_archived: bool = False,  # Show archived subjects
    session: AsyncSession = Depends(get_db),
    _: any = Depends(get_current_user),
):
    """Get subjects with optional filtering"""
    query = select(Subject).order_by(Subject.name)
    
    # By default, only show non-archived subjects
    if not include_archived:
        query = query.where(Subject.is_archived == False)
    
    if grade_band == "elementary":
        query = query.where(Subject.applies_to_elementary == True)
    elif grade_band == "middle":
        query = query.where(Subject.applies_to_middle == True)
    
    if subject_type:
        query = query.where(Subject.subject_type == subject_type.upper())
    
    result = await session.execute(query)
    return result.scalars().all()

@router.get("/core", response_model=List[SubjectOut])
async def get_core_subjects(
    session: AsyncSession = Depends(get_db),
    _: any = Depends(get_current_user),
):
    """Get system core subjects that cannot be deleted"""
    result = await session.execute(
        select(Subject).where(Subject.is_homeroom_default == True)
    )
    return result.scalars().all()

@router.post("", response_model=SubjectOut, status_code=status.HTTP_201_CREATED)
async def create_subject(
    payload: SubjectCreate,
    session: AsyncSession = Depends(get_db),
    _: any = Depends(require_admin),
):
    """Create a new subject"""
    # Check for duplicate code
    existing = await session.execute(select(Subject).where(Subject.code == payload.code.upper()))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Subject code already exists")
    
    subject = Subject(
        name=payload.name,
        code=payload.code.upper(),
        subject_type=payload.subject_type.upper(),
        applies_to_elementary=payload.applies_to_elementary,
        applies_to_middle=payload.applies_to_middle,
        is_homeroom_default=payload.is_homeroom_default,
        requires_specialist=payload.requires_specialist,
        allows_cross_grade=payload.allows_cross_grade,
        is_system_core=False,  # Admin-created subjects are never system core
        created_by_admin=True,
    )
    
    session.add(subject)
    await session.commit()
    await session.refresh(subject)
    
    # If this is a CORE subject applicable to elementary, auto-assign to existing homeroom teachers
    if (payload.subject_type.upper() == "CORE" and 
        payload.applies_to_elementary and 
        payload.is_homeroom_default):
        
        # Get active academic year for auto-assignment
        from ..models.academic_year import AcademicYear
        active_year_result = await session.execute(
            select(AcademicYear).where(AcademicYear.is_active == True)
        )
        active_year = active_year_result.scalar_one_or_none()
        
        if active_year:
            from ..services.homeroom_service import HomeroomService
            homeroom_service = HomeroomService(session)
            
            try:
                # Auto-assign to existing homeroom teachers
                auto_assign_result = await homeroom_service.auto_assign_new_core_subject(
                    subject_id=subject.id,
                    academic_year_id=active_year.id,
                    created_by_user_id=_.id  # Current admin user
                )
                logger.info(f"Auto-assigned new CORE subject {subject.name} to {auto_assign_result['total_assignments']} teachers")
            except Exception as e:
                logger.error(f"Failed to auto-assign new CORE subject {subject.name}: {str(e)}")
                # Don't fail the subject creation if auto-assignment fails
                pass
    
    return subject

# FIXED: Added the missing PUT endpoint
@router.put("/{subject_id}", response_model=SubjectOut)
async def update_subject_put(
    subject_id: str,
    payload: SubjectUpdate,
    session: AsyncSession = Depends(get_db),
    _: any = Depends(require_admin),
):
    """Update a subject using PUT method - calls the same logic as PATCH"""
    return await update_subject_patch(subject_id, payload, session, _)

@router.patch("/{subject_id}", response_model=SubjectOut)
async def update_subject_patch(
    subject_id: str,
    payload: SubjectUpdate,
    session: AsyncSession = Depends(get_db),
    _: any = Depends(require_admin),
):
    """Update a subject (cannot modify system core subjects significantly)"""
    from uuid import UUID
    
    subject = await session.get(Subject, UUID(subject_id))
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    
    # Track if homeroom assignment status changed
    old_homeroom_status = subject.is_homeroom_default
    
    # Prevent major changes to system core subjects
    if subject.is_system_core:
        # Only allow name changes for system subjects
        if payload.name:
            subject.name = payload.name
    else:
        # Full updates for admin-created subjects
        if payload.name:
            subject.name = payload.name
        if payload.subject_type:
            subject.subject_type = payload.subject_type.upper()
        if payload.applies_to_elementary is not None:
            subject.applies_to_elementary = payload.applies_to_elementary
        if payload.applies_to_middle is not None:
            subject.applies_to_middle = payload.applies_to_middle
        if payload.is_homeroom_default is not None:
            subject.is_homeroom_default = payload.is_homeroom_default
        if payload.requires_specialist is not None:
            subject.requires_specialist = payload.requires_specialist
        if payload.allows_cross_grade is not None:
            subject.allows_cross_grade = payload.allows_cross_grade
    
    await session.commit()
    await session.refresh(subject)
    
    # Handle homeroom assignment changes
    if not subject.is_system_core and payload.is_homeroom_default is not None:
        new_homeroom_status = subject.is_homeroom_default
        
        if old_homeroom_status != new_homeroom_status:
            if new_homeroom_status:
                # Subject was added to homeroom auto-assignment
                await _sync_homeroom_assignments(session, subject, added=True)
            else:
                # Subject was removed from homeroom auto-assignment
                await _sync_homeroom_assignments(session, subject, added=False)
    
    return subject

@router.delete("/{subject_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_subject(
    subject_id: str,
    session: AsyncSession = Depends(get_db),
    _: any = Depends(require_admin),
):
    """Delete a subject if no grade data exists, otherwise return error suggesting archive"""
    from uuid import UUID
    from ..services.grade_data_service import GradeDataService
    
    subject = await session.get(Subject, UUID(subject_id))
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    
    # Prevent deletion of system core subjects
    if subject.is_system_core:
        raise HTTPException(
            status_code=400, 
            detail="Cannot delete system core subjects. These are required for the system to function properly."
        )
    
    # Use comprehensive grade data service to check for academic data
    grade_service = GradeDataService(session)
    grade_check = await grade_service.check_subject_grade_data(subject.id)
    
    # If any grade data exists, block deletion and suggest archival
    if not grade_check["safe_to_delete"]:
        raise HTTPException(
            status_code=400, 
            detail=grade_check["error_message"]
        )
    
    # Additional safety check: Don't delete if subject is currently archived
    # (archived subjects should be restored first if admin wants to delete)
    if subject.is_archived:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete archived subject directly. Restore the subject first, then delete if no grade data exists."
        )
        
    # No grade data found - safe to delete
    await session.delete(subject)
    await session.commit()
    logger.info(f"Deleted subject {subject.name} (ID: {subject.id}) - no grade data found")

@router.get("/{subject_id}/grade-data-check")
async def check_subject_grade_data(
    subject_id: str,
    session: AsyncSession = Depends(get_db),
    _: any = Depends(require_admin),
):
    """Check if subject has grade data that would prevent deletion"""
    from uuid import UUID
    from ..services.grade_data_service import GradeDataService
    
    subject = await session.get(Subject, UUID(subject_id))
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    
    grade_service = GradeDataService(session)
    return await grade_service.get_subject_usage_summary(subject.id)

@router.post("/{subject_id}/archive", response_model=SubjectOut)
async def archive_subject(
    subject_id: str,
    archive_reason: Optional[str] = "Archived by administrator",
    session: AsyncSession = Depends(get_db),
    _: any = Depends(require_admin),
):
    """Archive a subject (soft delete) - for subjects with existing grade data"""
    from uuid import UUID
    from datetime import datetime
    from ..services.grade_data_service import GradeDataService
    
    subject = await session.get(Subject, UUID(subject_id))
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    
    if subject.is_archived:
        raise HTTPException(status_code=400, detail="Subject is already archived")
    
    # Check what data would be preserved by archiving
    grade_service = GradeDataService(session)
    usage_summary = await grade_service.get_subject_usage_summary(subject.id)
    
    # Generate detailed archive reason if not provided
    if not archive_reason or archive_reason == "Archived by administrator":
        if usage_summary["usage_summary"]:
            preserved_data = []
            if usage_summary["usage_summary"].get("student_enrollments_with_grades"):
                preserved_data.append(f"{usage_summary['usage_summary']['student_enrollments_with_grades']} student grades")
            if usage_summary["usage_summary"].get("classroom_enrollments"):
                preserved_data.append(f"{usage_summary['usage_summary']['classroom_enrollments']} classroom enrollments")
            if usage_summary["usage_summary"].get("teacher_assignments"):
                preserved_data.append(f"{usage_summary['usage_summary']['teacher_assignments']} teacher assignments")
            
            if preserved_data:
                years_text = f" from {', '.join(usage_summary['affected_years'])}" if usage_summary['affected_years'] else ""
                archive_reason = f"Archived to preserve {', '.join(preserved_data)}{years_text}"
    
    # Archive the subject
    subject.is_archived = True
    subject.archived_at = datetime.utcnow()
    subject.archived_reason = archive_reason or "Archived by administrator"
    
    await session.commit()
    await session.refresh(subject)
    
    logger.info(f"Archived subject {subject.name} - {archive_reason}")
    return subject

@router.post("/{subject_id}/restore", response_model=SubjectOut)
async def restore_subject(
    subject_id: str,
    session: AsyncSession = Depends(get_db),
    _: any = Depends(require_admin),
):
    """Restore an archived subject"""
    from uuid import UUID
    
    subject = await session.get(Subject, UUID(subject_id))
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    
    if not subject.is_archived:
        raise HTTPException(status_code=400, detail="Subject is not archived")
    
    subject.is_archived = False
    subject.archived_at = None
    subject.archived_reason = None
    
    await session.commit()
    await session.refresh(subject)
    
    logger.info(f"Restored subject {subject.name}")
    return subject

# Helper function for homeroom sync logic
async def _sync_homeroom_assignments(session: AsyncSession, subject: Subject, added: bool):
    """
    Sync homeroom assignments when a subject's homeroom status changes
    
    Args:
        subject: The subject that changed
        added: True if added to homeroom, False if removed
    """
    from ..models.classroom import Classroom
    from ..models.classroom_teacher_assignment import ClassroomTeacherAssignment
    from ..models.user import User
    from ..models.academic_year import AcademicYear
    import uuid
    
    try:
        if added:
            # Subject was added to homeroom auto-assignment
            # Find all elementary homeroom teachers and create classrooms for this subject
            
            # Get active academic year
            active_year_result = await session.execute(
                select(AcademicYear).where(AcademicYear.is_active == True)
            )
            active_year = active_year_result.scalar_one_or_none()
            
            if not active_year:
                print(f"⚠️  No active academic year found - skipping homeroom sync for {subject.name}")
                return
            
            # Find elementary homeroom teachers (those with existing Grade K-5 classrooms)
            homeroom_teachers_result = await session.execute(
                select(ClassroomTeacherAssignment.teacher_user_id)
                .join(Classroom)
                .where(
                    and_(
                        Classroom.grade_level.in_(['K', '1', '2', '3', '4', '5']),
                        Classroom.academic_year_id == active_year.id,
                        ClassroomTeacherAssignment.is_active == True
                    )
                )
                .distinct()
            )
            teacher_ids = [row[0] for row in homeroom_teachers_result.fetchall()]
            
            if not teacher_ids:
                print(f"⚠️  No elementary homeroom teachers found - skipping homeroom sync for {subject.name}")
                return
            
            # For each homeroom teacher, check if they already have a classroom for this subject
            for teacher_id in teacher_ids:
                # Check if teacher already has this subject
                existing_classroom = await session.execute(
                    select(Classroom)
                    .join(ClassroomTeacherAssignment)
                    .where(
                        and_(
                            Classroom.subject_id == subject.id,
                            ClassroomTeacherAssignment.teacher_user_id == teacher_id,
                            Classroom.academic_year_id == active_year.id,
                            ClassroomTeacherAssignment.is_active == True
                        )
                    )
                )
                
                if existing_classroom.scalar_one_or_none():
                    continue  # Teacher already has this subject
                
                # Get teacher info for classroom name
                teacher = await session.get(User, teacher_id)
                if not teacher:
                    continue
                
                # Get teacher's grade level from existing classrooms
                teacher_grade_result = await session.execute(
                    select(Classroom.grade_level)
                    .join(ClassroomTeacherAssignment)
                    .where(
                        and_(
                            ClassroomTeacherAssignment.teacher_user_id == teacher_id,
                            Classroom.academic_year_id == active_year.id,
                            ClassroomTeacherAssignment.is_active == True
                        )
                    )
                    .limit(1)
                )
                grade_level = teacher_grade_result.scalar_one_or_none()
                
                if not grade_level:
                    continue
                
                # Create new classroom for this subject
                new_classroom = Classroom(
                    id=uuid.uuid4(),
                    name=f"{teacher.first_name} {teacher.last_name}'s Grade {grade_level} - {subject.name}",
                    subject_id=subject.id,
                    academic_year_id=active_year.id,
                    grade_level=grade_level,
                    classroom_type="CORE",
                    max_students=25
                )
                session.add(new_classroom)
                await session.flush()  # Get classroom ID
                
                # Create teacher assignment
                teacher_assignment = ClassroomTeacherAssignment(
                    id=uuid.uuid4(),
                    classroom_id=new_classroom.id,
                    teacher_user_id=teacher_id,
                    role_name="Primary Teacher",
                    can_view_grades=True,
                    can_modify_grades=True,
                    can_take_attendance=True,
                    can_view_parent_contact=True,
                    can_create_assignments=True,
                    start_date=active_year.start_date,
                    is_active=True
                )
                session.add(teacher_assignment)
                
                print(f"✅ Created {subject.name} classroom for {teacher.first_name} {teacher.last_name} (Grade {grade_level})")
        
        else:
            # Subject was removed from homeroom auto-assignment
            # Handle removal based on whether classrooms have grades/students
            
            # Find all classrooms for this subject
            classrooms_result = await session.execute(
                select(Classroom).where(Classroom.subject_id == subject.id)
            )
            classrooms = classrooms_result.scalars().all()
            
            for classroom in classrooms:
                # TODO: Check if classroom has grades/assignments
                # For now, we'll leave the classrooms but could add logic to:
                # 1. Check for existing grades/assignments
                # 2. If none exist, remove the classroom
                # 3. If grades exist, just remove the auto-assignment flag
                
                print(f"ℹ️  {subject.name} removed from auto-assignment - classroom '{classroom.name}' preserved")
        
        await session.commit()
        
    except Exception as e:
        await session.rollback()
        print(f"❌ Error syncing homeroom assignments for {subject.name}: {str(e)}")
        # Don't raise the error - homeroom sync is non-critical
        pass