


# backend/app/models/parent_student_relationship.py

from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Boolean, Integer, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
import uuid
from .base import Base

class ParentStudentRelationship(Base):
    __tablename__ = "parent_student_relationships"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    parent_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("parents.id"), nullable=False)
    student_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("students.id"), nullable=False)
    
    # Relationship Details
    relationship_type: Mapped[str] = mapped_column(String(20), nullable=False)  # "MOTHER", "FATHER", "GUARDIAN", "STEPPARENT"
    custody_status: Mapped[str] = mapped_column(String(20), default="FULL")  # "FULL", "JOINT", "RESTRICTED", "NONE"
    
    # Access Permissions
    can_view_grades: Mapped[bool] = mapped_column(Boolean, default=True)
    can_view_attendance: Mapped[bool] = mapped_column(Boolean, default=True)
    can_view_discipline: Mapped[bool] = mapped_column(Boolean, default=True)
    can_pickup_student: Mapped[bool] = mapped_column(Boolean, default=True)
    can_authorize_medical: Mapped[bool] = mapped_column(Boolean, default=True)
    
    # Emergency Contact Info
    is_emergency_contact: Mapped[bool] = mapped_column(Boolean, default=True)
    emergency_priority: Mapped[int] = mapped_column(Integer, default=1)  # 1=first contact, 2=second, etc.
    
    # Status
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    
    # Relationships
    parent = relationship("Parent", back_populates="student_relationships")
    student = relationship("Student", back_populates="parent_relationships")
    
    def __repr__(self):
        parent_name = self.parent.full_name if self.parent else "Unknown Parent"
        student_name = self.student.full_name if self.student else "Unknown Student"
        return f"<ParentStudentRelationship {parent_name} -> {student_name} ({self.relationship_type})>"
    
    @classmethod
    def get_student_parents(cls, session, student_id, active_only=True):
        """Get all parents for a specific student"""
        query = session.query(cls).filter(cls.student_id == student_id)
        if active_only:
            query = query.filter(cls.is_active == True)
        return query.all()
    
    @classmethod
    def get_parent_students(cls, session, parent_id, active_only=True):
        """Get all students for a specific parent"""
        query = session.query(cls).filter(cls.parent_id == parent_id)
        if active_only:
            query = query.filter(cls.is_active == True)
        return query.all()
    
    @classmethod
    def get_emergency_contacts(cls, session, student_id):
        """Get emergency contacts for a student, ordered by priority"""
        return session.query(cls).filter(
            cls.student_id == student_id,
            cls.is_emergency_contact == True,
            cls.is_active == True
        ).order_by(cls.emergency_priority).all()
    
    def has_permission(self, permission_name):
        """Check if this relationship has a specific permission"""
        return getattr(self, f"can_{permission_name}", False)