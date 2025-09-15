# backend/app/models/subject_assignment_event.py

from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Boolean, DateTime, Text, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid
from .base import Base

class SubjectAssignmentEvent(Base):
    """
    Audit log for all teacher subject assignment changes.
    Tracks the history of assignments for reporting and compliance.
    """
    __tablename__ = "subject_assignment_events"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Foreign Keys
    assignment_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("teacher_subject_assignments.id"), nullable=True)  # Nullable for DELETE events
    teacher_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    subject_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("subjects.id"), nullable=False)
    academic_year_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("academic_years.id"), nullable=False)
    
    # Event Details
    event_type: Mapped[str] = mapped_column(String(20), nullable=False)  # CREATE, UPDATE, DELETE, SWAP_REQUEST, SWAP_APPROVED, SWAP_REJECTED
    event_date: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    # Context
    grade_level: Mapped[str] = mapped_column(String(2), nullable=False)  # Grade level this assignment affects
    triggered_by: Mapped[str] = mapped_column(String(20), nullable=False)  # SYSTEM, ADMIN, USER, AUTO_ASSIGNMENT
    
    # Change Tracking
    old_values: Mapped[dict] = mapped_column(JSON, nullable=True)  # Previous values for UPDATE events
    new_values: Mapped[dict] = mapped_column(JSON, nullable=True)  # New values for CREATE/UPDATE events
    
    # Event Metadata
    event_description: Mapped[str] = mapped_column(Text, nullable=False)  # Human-readable description
    system_notes: Mapped[str] = mapped_column(Text, nullable=True)  # Internal system notes
    
    # User Context
    performed_by_user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)  # Who made the change
    affected_user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)  # Additional affected user (for swaps)
    
    # Administrative Fields
    requires_approval: Mapped[bool] = mapped_column(Boolean, default=False)
    approved_by_user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    approved_date: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    rejection_reason: Mapped[str] = mapped_column(Text, nullable=True)
    
    # Relationships
    assignment = relationship("TeacherSubjectAssignment")
    teacher = relationship("User", foreign_keys=[teacher_id])
    subject = relationship("Subject")
    academic_year = relationship("AcademicYear")
    performed_by = relationship("User", foreign_keys=[performed_by_user_id])
    affected_user = relationship("User", foreign_keys=[affected_user_id])
    approved_by = relationship("User", foreign_keys=[approved_by_user_id])
    
    def __repr__(self):
        return f"<SubjectAssignmentEvent {self.event_type}: {self.teacher.first_name if self.teacher else 'Unknown'} -> {self.subject.name if self.subject else 'Unknown'}>"
    
    @classmethod
    async def log_assignment_created(cls, session, assignment, performed_by_user_id: uuid.UUID = None, description: str = None):
        """Log creation of a new teacher subject assignment"""
        # Get grade level from associated classroom, or default if none
        grade_level = "Unknown"
        if assignment.classroom_id:
            from sqlalchemy import select
            from .classroom import Classroom
            classroom_result = await session.execute(
                select(Classroom.grade_level).where(Classroom.id == assignment.classroom_id)
            )
            grade_level = classroom_result.scalar_one_or_none() or "Unknown"
        
        event = cls(
            assignment_id=assignment.id,
            teacher_id=assignment.teacher_id,
            subject_id=assignment.subject_id,
            academic_year_id=assignment.academic_year_id,
            event_type="CREATE",
            grade_level=grade_level,
            triggered_by="SYSTEM" if assignment.assignment_type.startswith("AUTO_") else "ADMIN",
            new_values={
                "assignment_type": assignment.assignment_type,
                "is_active": assignment.is_active,
                "classroom_id": str(assignment.classroom_id) if assignment.classroom_id else None
            },
            event_description=description or f"Subject assignment created for Grade {grade_level}",
            performed_by_user_id=performed_by_user_id
        )
        session.add(event)
        return event
    
    @classmethod
    async def log_assignment_updated(cls, session, assignment, old_values: dict, performed_by_user_id: uuid.UUID = None, description: str = None):
        """Log update to a teacher subject assignment"""
        # Get grade level from associated classroom, or default if none
        grade_level = "Unknown"
        if assignment.classroom_id:
            from sqlalchemy import select
            from .classroom import Classroom
            classroom_result = await session.execute(
                select(Classroom.grade_level).where(Classroom.id == assignment.classroom_id)
            )
            grade_level = classroom_result.scalar_one_or_none() or "Unknown"
        
        event = cls(
            assignment_id=assignment.id,
            teacher_id=assignment.teacher_id,
            subject_id=assignment.subject_id,
            academic_year_id=assignment.academic_year_id,
            event_type="UPDATE",
            grade_level=grade_level,
            triggered_by="ADMIN",
            old_values=old_values,
            new_values={
                "assignment_type": assignment.assignment_type,
                "is_active": assignment.is_active,
                "classroom_id": str(assignment.classroom_id) if assignment.classroom_id else None
            },
            event_description=description or f"Subject assignment updated for Grade {grade_level}",
            performed_by_user_id=performed_by_user_id
        )
        session.add(event)
        return event
    
    @classmethod
    async def log_assignment_deleted(cls, session, assignment, performed_by_user_id: uuid.UUID = None, description: str = None):
        """Log deletion of a teacher subject assignment"""
        # Get grade level from associated classroom, or default if none
        grade_level = "Unknown"
        if assignment.classroom_id:
            from sqlalchemy import select
            from .classroom import Classroom
            classroom_result = await session.execute(
                select(Classroom.grade_level).where(Classroom.id == assignment.classroom_id)
            )
            grade_level = classroom_result.scalar_one_or_none() or "Unknown"
        
        event = cls(
            assignment_id=None,  # Assignment will be deleted
            teacher_id=assignment.teacher_id,
            subject_id=assignment.subject_id,
            academic_year_id=assignment.academic_year_id,
            event_type="DELETE",
            grade_level=grade_level,
            triggered_by="ADMIN",
            old_values={
                "assignment_type": assignment.assignment_type,
                "is_active": assignment.is_active,
                "classroom_id": str(assignment.classroom_id) if assignment.classroom_id else None
            },
            event_description=description or f"Subject assignment deleted for Grade {grade_level}",
            performed_by_user_id=performed_by_user_id
        )
        session.add(event)
        return event
    
    @classmethod
    async def get_teacher_history(cls, session, teacher_id: uuid.UUID, academic_year_id: uuid.UUID = None):
        """Get assignment history for a teacher"""
        from sqlalchemy import select, and_, desc
        
        query = (
            select(cls)
            .where(cls.teacher_id == teacher_id)
            .order_by(desc(cls.event_date))
        )
        
        if academic_year_id:
            query = query.where(cls.academic_year_id == academic_year_id)
            
        result = await session.execute(query)
        return result.scalars().all()
    
    @classmethod
    async def get_subject_history(cls, session, subject_id: uuid.UUID, academic_year_id: uuid.UUID = None):
        """Get assignment history for a subject"""
        from sqlalchemy import select, and_, desc
        
        query = (
            select(cls)
            .where(cls.subject_id == subject_id)
            .order_by(desc(cls.event_date))
        )
        
        if academic_year_id:
            query = query.where(cls.academic_year_id == academic_year_id)
            
        result = await session.execute(query)
        return result.scalars().all()