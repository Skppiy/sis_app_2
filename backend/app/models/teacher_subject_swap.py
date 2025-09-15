# backend/app/models/teacher_subject_swap.py

from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Boolean, DateTime, Text, ForeignKey, Integer
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid
from .base import Base

class TeacherSubjectSwap(Base):
    """
    Manages subject assignment swap requests between teachers.
    Handles the workflow for teachers requesting to trade subject assignments.
    """
    __tablename__ = "teacher_subject_swaps"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Swap Participants
    requesting_teacher_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    target_teacher_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    # Swap Details
    requesting_assignment_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("teacher_subject_assignments.id"), nullable=False)
    target_assignment_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("teacher_subject_assignments.id"), nullable=False)
    academic_year_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("academic_years.id"), nullable=False)
    
    # Swap Status and Workflow
    swap_status: Mapped[str] = mapped_column(String(20), nullable=False, default="PENDING")  # PENDING, ACCEPTED, REJECTED, APPROVED, COMPLETED, CANCELLED
    swap_type: Mapped[str] = mapped_column(String(20), nullable=False, default="SUBJECT")  # SUBJECT, SCHEDULE, TEMPORARY
    
    # Request Details
    request_date: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    requested_effective_date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    reason_for_swap: Mapped[str] = mapped_column(Text, nullable=False)  # Why this swap is needed
    
    # Target Teacher Response
    target_response_date: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    target_response: Mapped[str] = mapped_column(String(10), nullable=True)  # ACCEPT, REJECT
    target_response_notes: Mapped[str] = mapped_column(Text, nullable=True)
    
    # Administrative Review
    requires_admin_approval: Mapped[bool] = mapped_column(Boolean, default=True)
    reviewed_by_admin_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    admin_review_date: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    admin_decision: Mapped[str] = mapped_column(String(10), nullable=True)  # APPROVE, REJECT
    admin_notes: Mapped[str] = mapped_column(Text, nullable=True)
    
    # Execution
    executed_date: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    executed_by_admin_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    
    # Temporary Swap Details (if applicable)
    is_temporary: Mapped[bool] = mapped_column(Boolean, default=False)
    temporary_end_date: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    auto_revert: Mapped[bool] = mapped_column(Boolean, default=False)
    
    # Student Impact Assessment
    affected_student_count: Mapped[int] = mapped_column(Integer, nullable=True)
    student_notification_required: Mapped[bool] = mapped_column(Boolean, default=True)
    parent_notification_required: Mapped[bool] = mapped_column(Boolean, default=False)
    
    # Relationships
    requesting_teacher = relationship("User", foreign_keys=[requesting_teacher_id])
    target_teacher = relationship("User", foreign_keys=[target_teacher_id])
    requesting_assignment = relationship("TeacherSubjectAssignment", foreign_keys=[requesting_assignment_id])
    target_assignment = relationship("TeacherSubjectAssignment", foreign_keys=[target_assignment_id])
    academic_year = relationship("AcademicYear")
    reviewed_by_admin = relationship("User", foreign_keys=[reviewed_by_admin_id])
    executed_by_admin = relationship("User", foreign_keys=[executed_by_admin_id])
    
    def __repr__(self):
        return f"<TeacherSubjectSwap {self.requesting_teacher.first_name if self.requesting_teacher else 'Unknown'} <-> {self.target_teacher.first_name if self.target_teacher else 'Unknown'} ({self.swap_status})>"
    
    @property
    def is_pending_target_response(self) -> bool:
        """Check if swap is waiting for target teacher response"""
        return self.swap_status == "PENDING" and self.target_response is None
    
    @property
    def is_pending_admin_approval(self) -> bool:
        """Check if swap is waiting for admin approval"""
        return (
            self.swap_status == "ACCEPTED" and 
            self.requires_admin_approval and 
            self.admin_decision is None
        )
    
    @property
    def can_be_executed(self) -> bool:
        """Check if swap is ready for execution"""
        if self.requires_admin_approval:
            return (
                self.swap_status == "APPROVED" and
                self.admin_decision == "APPROVE" and
                self.executed_date is None
            )
        else:
            return (
                self.swap_status == "ACCEPTED" and
                self.target_response == "ACCEPT" and
                self.executed_date is None
            )
    
    @classmethod
    async def create_swap_request(cls, session, requesting_teacher_id: uuid.UUID, target_teacher_id: uuid.UUID, 
                                 requesting_assignment_id: uuid.UUID, target_assignment_id: uuid.UUID,
                                 academic_year_id: uuid.UUID, reason: str, effective_date: datetime):
        """Create a new subject swap request"""
        swap = cls(
            requesting_teacher_id=requesting_teacher_id,
            target_teacher_id=target_teacher_id,
            requesting_assignment_id=requesting_assignment_id,
            target_assignment_id=target_assignment_id,
            academic_year_id=academic_year_id,
            reason_for_swap=reason,
            requested_effective_date=effective_date,
            swap_status="PENDING"
        )
        session.add(swap)
        await session.flush()  # Get ID
        return swap
    
    @classmethod
    async def get_pending_for_teacher(cls, session, teacher_id: uuid.UUID):
        """Get all pending swap requests for a teacher (both outgoing and incoming)"""
        from sqlalchemy import select, or_, and_
        
        query = (
            select(cls)
            .where(
                and_(
                    or_(
                        cls.requesting_teacher_id == teacher_id,
                        cls.target_teacher_id == teacher_id
                    ),
                    cls.swap_status.in_(["PENDING", "ACCEPTED"])
                )
            )
            .order_by(cls.request_date.desc())
        )
        
        result = await session.execute(query)
        return result.scalars().all()
    
    @classmethod
    async def get_pending_admin_approval(cls, session, academic_year_id: uuid.UUID = None):
        """Get all swaps pending administrative approval"""
        from sqlalchemy import select, and_
        
        query = (
            select(cls)
            .where(
                and_(
                    cls.swap_status == "ACCEPTED",
                    cls.requires_admin_approval == True,
                    cls.admin_decision.is_(None)
                )
            )
            .order_by(cls.target_response_date.desc())
        )
        
        if academic_year_id:
            query = query.where(cls.academic_year_id == academic_year_id)
            
        result = await session.execute(query)
        return result.scalars().all()
    
    async def respond_as_target(self, session, response: str, notes: str = None):
        """Target teacher responds to swap request"""
        if self.swap_status != "PENDING":
            raise ValueError("Swap is not in pending status")
        
        self.target_response = response
        self.target_response_notes = notes
        self.target_response_date = datetime.utcnow()
        
        if response == "ACCEPT":
            self.swap_status = "ACCEPTED"
        else:
            self.swap_status = "REJECTED"
        
        await session.commit()
    
    async def admin_review(self, session, admin_id: uuid.UUID, decision: str, notes: str = None):
        """Admin reviews and approves/rejects the swap"""
        if not self.is_pending_admin_approval:
            raise ValueError("Swap is not pending admin approval")
        
        self.reviewed_by_admin_id = admin_id
        self.admin_review_date = datetime.utcnow()
        self.admin_decision = decision
        self.admin_notes = notes
        
        if decision == "APPROVE":
            self.swap_status = "APPROVED"
        else:
            self.swap_status = "REJECTED"
        
        await session.commit()