# backend/app/models/special_needs_tag_library.py

from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Boolean, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from typing import Optional
import uuid
from .base import Base

class SpecialNeedsTagLibrary(Base):
    """Admin-configurable library of special needs tags"""
    __tablename__ = "special_needs_tag_library"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tag_name: Mapped[str] = mapped_column(String(50), nullable=False)  # "Speech Therapy", "Reading Support"
    tag_code: Mapped[str] = mapped_column(String(20), nullable=False)  # "SPEECH", "READ_SUPP"
    description: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    
    # Scope - null means district-wide, otherwise school-specific
    school_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("schools.id"), nullable=True)
    
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    
    # Relationships
    school = relationship("School", back_populates="special_needs_tags")
    student_assignments = relationship("StudentSpecialNeed", back_populates="tag_library", cascade="all, delete-orphan")
    
    def __repr__(self):
        scope = f"School-specific" if self.school_id else "District-wide"
        return f"<SpecialNeedsTag {self.tag_name} ({scope})>"
    
    @classmethod
    def get_district_tags(cls, session):
        """Get all district-wide special needs tags"""
        return session.query(cls).filter(
            cls.school_id.is_(None),
            cls.is_active == True
        ).all()
    
    @classmethod
    def get_school_tags(cls, session, school_id):
        """Get all tags available to a specific school (district + school-specific)"""
        return session.query(cls).filter(
            (cls.school_id.is_(None)) | (cls.school_id == school_id),
            cls.is_active == True
        ).all()


