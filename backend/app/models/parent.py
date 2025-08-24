# backend/app/models/parent.py

from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Boolean, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
import uuid
from .base import Base

class Parent(Base):
    __tablename__ = "parents"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, unique=True)
    
    # Parent-specific info
    relationship_type: Mapped[str] = mapped_column(String(20), nullable=False)  # "MOTHER", "FATHER", "GUARDIAN", "GRANDPARENT"
    emergency_contact: Mapped[bool] = mapped_column(Boolean, default=True)
    pickup_authorized: Mapped[bool] = mapped_column(Boolean, default=True)
    
    # Contact preferences
    preferred_contact_method: Mapped[str] = mapped_column(String(20), default="EMAIL")  # "EMAIL", "PHONE", "TEXT"
    
    # Relationships
    user = relationship("User", back_populates="parent_profile")  # Link to user account
    student_relationships = relationship("ParentStudentRelationship", back_populates="parent", cascade="all, delete-orphan")
    
    def __repr__(self):
        user_name = f"{self.user.first_name} {self.user.last_name}" if self.user else "Unknown"
        return f"<Parent {user_name} ({self.relationship_type})>"
    
    @property
    def full_name(self):
        return f"{self.user.first_name} {self.user.last_name}" if self.user else "Unknown Parent"
    
    @property
    def email(self):
        return self.user.email if self.user else None
    
    def get_children(self, session):
        """Get all students this parent has relationships with"""
        return [rel.student for rel in self.student_relationships if rel.student]


