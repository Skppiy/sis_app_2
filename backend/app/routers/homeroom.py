# backend/app/routers/homeroom.py

"""
Homeroom Intelligence System API Router

This router provides endpoints for the homeroom intelligence system,
including homeroom creation with auto-assignment, teacher subject management,
and student enrollment automation.

Key endpoints:
- POST /homeroom/create - Create homeroom with auto-assignment
- GET /teachers/{teacher_id}/subjects - Get teacher's assigned subjects  
- POST /subjects/auto-assign-existing - Auto-assign new CORE subject to existing teachers
- GET /homeroom/preview-assignment/{grade}/{teacher_id} - Preview auto-assignment
- POST /teacher-assignments/swap - Request subject swap between teachers
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func, desc
from sqlalchemy.orm import joinedload, selectinload
from typing import List, Optional, Dict
from uuid import UUID
import logging

from ..deps import get_db, require_admin, get_current_user
from ..models.user import User
from ..models.teacher_subject_assignment import TeacherSubjectAssignment
from ..models.student_subject_enrollment import StudentSubjectEnrollment  
from ..models.subject_assignment_event import SubjectAssignmentEvent
from ..models.teacher_subject_swap import TeacherSubjectSwap
from ..services.homeroom_service import HomeroomService
from ..schemas.homeroom import (
    HomeroomCreateRequest, HomeroomCreateResponse,
    AutoAssignSubjectRequest, AutoAssignResponse,
    TeacherAssignmentsRequest, TeacherAssignmentsResponse,
    AutoEnrollStudentsRequest, AutoEnrollResponse,
    PreviewAssignmentRequest, PreviewAssignmentResponse,
    TeacherSubjectAssignmentOut, StudentSubjectEnrollmentOut,
    TeacherSubjectSwapCreate, TeacherSubjectSwapOut,
    TeacherSubjectSwapResponse, TeacherSubjectSwapAdminReview
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/homeroom", tags=["homeroom"])

@router.post("/create", response_model=HomeroomCreateResponse)
async def create_homeroom_with_auto_assignment(
    request: HomeroomCreateRequest,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Create a homeroom setup with automatic CORE subject assignments.
    
    This endpoint creates teacher subject assignments for all active CORE subjects
    applicable to the specified elementary grade level. It also creates classrooms
    for each subject and logs all assignments in the audit trail.
    
    Requirements:
    - Grade level must be K-5 (elementary)
    - Teacher must exist and be active
    - Academic year must exist
    - Only admin users can create homerooms
    """
    try:
        homeroom_service = HomeroomService(session)
        result = await homeroom_service.create_homeroom_with_auto_assignment(
            teacher_id=request.teacher_id,
            grade_level=request.grade_level,
            academic_year_id=request.academic_year_id,
            created_by_user_id=current_user.id,
            room_id=request.room_id
        )
        
        logger.info(f"Homeroom created by {current_user.email} for teacher {request.teacher_id}, grade {request.grade_level}")
        return result
        
    except ValueError as e:
        logger.warning(f"Invalid homeroom creation request: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating homeroom: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/teachers/{teacher_id}/subjects", response_model=TeacherAssignmentsResponse)
async def get_teacher_assigned_subjects(
    teacher_id: UUID,
    academic_year_id: UUID = Query(..., description="Academic year ID"),
    grade_level: Optional[str] = Query(None, description="Optional grade level filter"),
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all subjects assigned to a teacher for a specific academic year.
    
    Returns teacher information along with their subject assignments grouped by
    grade level and assignment type (homeroom vs specialist).
    """
    try:
        homeroom_service = HomeroomService(session)
        result = await homeroom_service.get_teacher_assigned_subjects(
            teacher_id=teacher_id,
            academic_year_id=academic_year_id,
            grade_level=grade_level
        )
        
        return result
        
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error getting teacher assignments: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/subjects/auto-assign-existing", response_model=AutoAssignResponse)
async def auto_assign_new_core_subject_to_existing_teachers(
    request: AutoAssignSubjectRequest,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Auto-assign a new CORE subject to all existing elementary homeroom teachers.
    
    This endpoint is called when a new CORE subject is created and needs to be
    propagated to all existing elementary teachers. It creates teacher subject
    assignments and logs the actions in the audit trail.
    
    Requirements:
    - Subject must be CORE type and applicable to elementary
    - Only admin users can trigger auto-assignment
    """
    try:
        homeroom_service = HomeroomService(session)
        result = await homeroom_service.auto_assign_new_core_subject(
            subject_id=request.subject_id,
            academic_year_id=request.academic_year_id,
            created_by_user_id=current_user.id
        )
        
        logger.info(f"Auto-assigned subject {request.subject_id} by {current_user.email}")
        return result
        
    except ValueError as e:
        logger.warning(f"Invalid auto-assign request: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error auto-assigning subject: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/preview-assignment/{grade_level}/{teacher_id}", response_model=PreviewAssignmentResponse)
async def preview_homeroom_assignment(
    grade_level: str,
    teacher_id: UUID,
    academic_year_id: UUID = Query(..., description="Academic year ID"),
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Preview what would be created for a homeroom assignment without actually creating it.
    
    This endpoint shows:
    - Which CORE subjects would be assigned
    - Which assignments already exist
    - How many classrooms would be created
    - Whether the assignment is ready for creation
    """
    try:
        homeroom_service = HomeroomService(session)
        result = await homeroom_service.preview_homeroom_assignment(
            grade_level=grade_level,
            teacher_id=teacher_id,
            academic_year_id=academic_year_id
        )
        
        return result
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error previewing assignment: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/students/auto-enroll", response_model=AutoEnrollResponse)
async def auto_enroll_students_in_core_subjects(
    request: AutoEnrollStudentsRequest,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Auto-enroll all students in a homeroom teacher's CORE subjects.
    
    This finds students enrolled in the teacher's homeroom classrooms and creates
    subject enrollments for each of the teacher's assigned CORE subjects.
    """
    try:
        homeroom_service = HomeroomService(session)
        result = await homeroom_service.auto_enroll_students_in_core_subjects(
            teacher_id=request.teacher_id,
            grade_level=request.grade_level,
            academic_year_id=request.academic_year_id,
            enrolled_by_user_id=current_user.id
        )
        
        logger.info(f"Auto-enrolled students for teacher {request.teacher_id}, grade {request.grade_level}")
        return result
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error auto-enrolling students: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/teacher-assignments/swap", response_model=TeacherSubjectSwapOut)
async def request_teacher_subject_swap(
    request: TeacherSubjectSwapCreate,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Request a subject assignment swap between two teachers.
    
    Creates a swap request that needs to be accepted by the target teacher
    and potentially approved by an administrator.
    """
    try:
        # Validate that current user is one of the teachers in the swap
        if current_user.id != request.requesting_teacher_id and current_user.id != request.target_teacher_id:
            # Allow admins to create swaps for other teachers
            if not any('admin' in role.role.lower() for role in current_user.user_roles if role.is_active):
                raise HTTPException(status_code=403, detail="You can only create swaps involving yourself")
        
        # Create the swap request
        swap = await TeacherSubjectSwap.create_swap_request(
            session=session,
            requesting_teacher_id=request.requesting_teacher_id,
            target_teacher_id=request.target_teacher_id,
            requesting_assignment_id=request.requesting_assignment_id,
            target_assignment_id=request.target_assignment_id,
            academic_year_id=request.academic_year_id,
            reason=request.reason_for_swap,
            effective_date=request.requested_effective_date
        )
        
        # Set temporary swap details if applicable
        if request.is_temporary:
            swap.is_temporary = True
            swap.temporary_end_date = request.temporary_end_date
            swap.auto_revert = True
        
        await session.commit()
        
        # Load relationships for response
        await session.refresh(swap)
        result = await session.execute(
            select(TeacherSubjectSwap)
            .options(
                joinedload(TeacherSubjectSwap.requesting_teacher),
                joinedload(TeacherSubjectSwap.target_teacher),
                joinedload(TeacherSubjectSwap.requesting_assignment).joinedload("subject"),
                joinedload(TeacherSubjectSwap.target_assignment).joinedload("subject")
            )
            .where(TeacherSubjectSwap.id == swap.id)
        )
        swap_with_relations = result.scalar_one()
        
        logger.info(f"Swap request created by {current_user.email}: {swap.id}")
        
        # Convert to response format
        return TeacherSubjectSwapOut(
            id=swap_with_relations.id,
            requesting_teacher_id=swap_with_relations.requesting_teacher_id,
            target_teacher_id=swap_with_relations.target_teacher_id,
            requesting_assignment_id=swap_with_relations.requesting_assignment_id,
            target_assignment_id=swap_with_relations.target_assignment_id,
            academic_year_id=swap_with_relations.academic_year_id,
            requested_effective_date=swap_with_relations.requested_effective_date,
            reason_for_swap=swap_with_relations.reason_for_swap,
            is_temporary=swap_with_relations.is_temporary,
            temporary_end_date=swap_with_relations.temporary_end_date,
            swap_status=swap_with_relations.swap_status,
            swap_type=swap_with_relations.swap_type,
            request_date=swap_with_relations.request_date,
            requires_admin_approval=swap_with_relations.requires_admin_approval,
            requesting_teacher_name=swap_with_relations.requesting_teacher.full_name,
            target_teacher_name=swap_with_relations.target_teacher.full_name,
            requesting_subject_name=swap_with_relations.requesting_assignment.subject.name,
            target_subject_name=swap_with_relations.target_assignment.subject.name
        )
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating swap request: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/teacher-assignments/swaps/pending", response_model=List[TeacherSubjectSwapOut])
async def get_pending_swaps_for_teacher(
    teacher_id: Optional[UUID] = Query(None, description="Teacher ID (defaults to current user)"),
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all pending swap requests for a teacher (both outgoing and incoming).
    """
    # Use current user if no teacher_id specified
    if teacher_id is None:
        teacher_id = current_user.id
    
    # Validate access (users can only see their own swaps unless admin)
    if teacher_id != current_user.id:
        if not any('admin' in role.role.lower() for role in current_user.user_roles if role.is_active):
            raise HTTPException(status_code=403, detail="You can only view your own swap requests")
    
    try:
        swaps = await TeacherSubjectSwap.get_pending_for_teacher(session, teacher_id)
        
        # Convert to response format
        return [
            TeacherSubjectSwapOut(
                id=swap.id,
                requesting_teacher_id=swap.requesting_teacher_id,
                target_teacher_id=swap.target_teacher_id,
                requesting_assignment_id=swap.requesting_assignment_id,
                target_assignment_id=swap.target_assignment_id,
                academic_year_id=swap.academic_year_id,
                requested_effective_date=swap.requested_effective_date,
                reason_for_swap=swap.reason_for_swap,
                is_temporary=swap.is_temporary,
                temporary_end_date=swap.temporary_end_date,
                swap_status=swap.swap_status,
                swap_type=swap.swap_type,
                request_date=swap.request_date,
                target_response_date=swap.target_response_date,
                target_response=swap.target_response,
                target_response_notes=swap.target_response_notes,
                requires_admin_approval=swap.requires_admin_approval,
                admin_review_date=swap.admin_review_date,
                admin_decision=swap.admin_decision,
                admin_notes=swap.admin_notes,
                requesting_teacher_name=swap.requesting_teacher.full_name if swap.requesting_teacher else None,
                target_teacher_name=swap.target_teacher.full_name if swap.target_teacher else None
            ) for swap in swaps
        ]
        
    except Exception as e:
        logger.error(f"Error getting pending swaps: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.put("/teacher-assignments/swaps/{swap_id}/respond", response_model=TeacherSubjectSwapOut)
async def respond_to_swap_request(
    swap_id: UUID,
    response: TeacherSubjectSwapResponse,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Target teacher responds to a swap request (accept or reject).
    """
    try:
        # Get the swap with relationships
        result = await session.execute(
            select(TeacherSubjectSwap)
            .options(
                joinedload(TeacherSubjectSwap.requesting_teacher),
                joinedload(TeacherSubjectSwap.target_teacher)
            )
            .where(TeacherSubjectSwap.id == swap_id)
        )
        swap = result.scalar_one_or_none()
        
        if not swap:
            raise HTTPException(status_code=404, detail="Swap request not found")
        
        # Validate that current user is the target teacher
        if swap.target_teacher_id != current_user.id:
            raise HTTPException(status_code=403, detail="Only the target teacher can respond to this swap")
        
        # Respond to the swap
        await swap.respond_as_target(session, response.response, response.response_notes)
        
        logger.info(f"Swap {swap_id} responded to by {current_user.email}: {response.response}")
        
        # Return updated swap
        await session.refresh(swap)
        return TeacherSubjectSwapOut(
            id=swap.id,
            requesting_teacher_id=swap.requesting_teacher_id,
            target_teacher_id=swap.target_teacher_id,
            requesting_assignment_id=swap.requesting_assignment_id,
            target_assignment_id=swap.target_assignment_id,
            academic_year_id=swap.academic_year_id,
            requested_effective_date=swap.requested_effective_date,
            reason_for_swap=swap.reason_for_swap,
            is_temporary=swap.is_temporary,
            temporary_end_date=swap.temporary_end_date,
            swap_status=swap.swap_status,
            swap_type=swap.swap_type,
            request_date=swap.request_date,
            target_response_date=swap.target_response_date,
            target_response=swap.target_response,
            target_response_notes=swap.target_response_notes,
            requires_admin_approval=swap.requires_admin_approval,
            requesting_teacher_name=swap.requesting_teacher.full_name,
            target_teacher_name=swap.target_teacher.full_name
        )
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error responding to swap: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/admin/swaps/pending-approval", response_model=List[TeacherSubjectSwapOut])
async def get_swaps_pending_admin_approval(
    academic_year_id: Optional[UUID] = Query(None, description="Academic year ID filter"),
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Get all swaps pending administrative approval.
    """
    try:
        swaps = await TeacherSubjectSwap.get_pending_admin_approval(session, academic_year_id)
        
        return [
            TeacherSubjectSwapOut(
                id=swap.id,
                requesting_teacher_id=swap.requesting_teacher_id,
                target_teacher_id=swap.target_teacher_id,
                requesting_assignment_id=swap.requesting_assignment_id,
                target_assignment_id=swap.target_assignment_id,
                academic_year_id=swap.academic_year_id,
                requested_effective_date=swap.requested_effective_date,
                reason_for_swap=swap.reason_for_swap,
                is_temporary=swap.is_temporary,
                temporary_end_date=swap.temporary_end_date,
                swap_status=swap.swap_status,
                swap_type=swap.swap_type,
                request_date=swap.request_date,
                target_response_date=swap.target_response_date,
                target_response=swap.target_response,
                target_response_notes=swap.target_response_notes,
                requires_admin_approval=swap.requires_admin_approval,
                admin_review_date=swap.admin_review_date,
                admin_decision=swap.admin_decision,
                admin_notes=swap.admin_notes
            ) for swap in swaps
        ]
        
    except Exception as e:
        logger.error(f"Error getting swaps pending approval: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.put("/admin/swaps/{swap_id}/review", response_model=TeacherSubjectSwapOut)
async def admin_review_swap(
    swap_id: UUID,
    review: TeacherSubjectSwapAdminReview,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Administrator reviews and approves/rejects a swap request.
    """
    try:
        swap = await session.get(TeacherSubjectSwap, swap_id)
        if not swap:
            raise HTTPException(status_code=404, detail="Swap request not found")
        
        await swap.admin_review(session, current_user.id, review.decision, review.admin_notes)
        
        logger.info(f"Swap {swap_id} reviewed by admin {current_user.email}: {review.decision}")
        
        await session.refresh(swap)
        return TeacherSubjectSwapOut(
            id=swap.id,
            requesting_teacher_id=swap.requesting_teacher_id,
            target_teacher_id=swap.target_teacher_id,
            requesting_assignment_id=swap.requesting_assignment_id,
            target_assignment_id=swap.target_assignment_id,
            academic_year_id=swap.academic_year_id,
            requested_effective_date=swap.requested_effective_date,
            reason_for_swap=swap.reason_for_swap,
            is_temporary=swap.is_temporary,
            temporary_end_date=swap.temporary_end_date,
            swap_status=swap.swap_status,
            swap_type=swap.swap_type,
            request_date=swap.request_date,
            target_response_date=swap.target_response_date,
            target_response=swap.target_response,
            target_response_notes=swap.target_response_notes,
            requires_admin_approval=swap.requires_admin_approval,
            admin_review_date=swap.admin_review_date,
            admin_decision=swap.admin_decision,
            admin_notes=swap.admin_notes,
            reviewed_by_admin_id=swap.reviewed_by_admin_id
        )
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error reviewing swap: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

# Assignment history and audit endpoints
@router.get("/teachers/{teacher_id}/assignment-history", response_model=List[Dict])
async def get_teacher_assignment_history(
    teacher_id: UUID,
    academic_year_id: Optional[UUID] = Query(None, description="Academic year ID filter"),
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get assignment history for a teacher (audit trail).
    """
    # Validate access
    if teacher_id != current_user.id:
        if not any('admin' in role.role.lower() for role in current_user.user_roles if role.is_active):
            raise HTTPException(status_code=403, detail="You can only view your own assignment history")
    
    try:
        events = await SubjectAssignmentEvent.get_teacher_history(session, teacher_id, academic_year_id)
        
        return [
            {
                "id": str(event.id),
                "event_type": event.event_type,
                "event_date": event.event_date.isoformat(),
                "grade_level": event.grade_level,
                "triggered_by": event.triggered_by,
                "event_description": event.event_description,
                "subject_name": event.subject.name if event.subject else None,
                "old_values": event.old_values,
                "new_values": event.new_values,
                "system_notes": event.system_notes
            } for event in events
        ]
        
    except Exception as e:
        logger.error(f"Error getting assignment history: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")