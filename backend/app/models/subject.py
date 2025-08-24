# backend/app/models/subject.py

from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Boolean
from sqlalchemy.dialects.postgresql import UUID
import uuid
from .base import Base

class Subject(Base):
    __tablename__ = "subjects"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(50), nullable=False)  # "Math", "Reading", "PE", "Art"
    code: Mapped[str] = mapped_column(String(10), nullable=False, unique=True)  # "MATH", "READ", "PE", "ART"
    
    # Subject Type Classification
    subject_type: Mapped[str] = mapped_column(String(20), nullable=False, default="CORE")  # "CORE", "ENRICHMENT", "SPECIAL"
    
    # Grade Band Applicability
    applies_to_elementary: Mapped[bool] = mapped_column(Boolean, default=True)   # K-5 or K-6
    applies_to_middle: Mapped[bool] = mapped_column(Boolean, default=True)       # 6-8 or 7-8
    
    # Assignment Rules
    is_homeroom_default: Mapped[bool] = mapped_column(Boolean, default=False)    # True for elementary core subjects
    requires_specialist: Mapped[bool] = mapped_column(Boolean, default=False)    # True for PE, Art, Music
    allows_cross_grade: Mapped[bool] = mapped_column(Boolean, default=False)     # True for advanced subjects
    
    # System vs Admin Created
    is_system_core: Mapped[bool] = mapped_column(Boolean, default=False)         # Can't be deleted if True
    created_by_admin: Mapped[bool] = mapped_column(Boolean, default=True)        # Track origin
    
    # Relationships
    classrooms = relationship("Classroom", back_populates="subject", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Subject {self.name} ({self.subject_type})>"
    
    @classmethod
    def get_core_subjects(cls, session):
        """Get all core subjects that ship with system"""
        return session.query(cls).filter(cls.is_system_core == True).all()
    
    @classmethod
    def get_elementary_subjects(cls, session):
        """Get subjects applicable to elementary grades"""
        return session.query(cls).filter(cls.applies_to_elementary == True).all()
    
    @classmethod
    def get_middle_subjects(cls, session):
        """Get subjects applicable to middle school grades"""
        return session.query(cls).filter(cls.applies_to_middle == True).all()