# backend/app/models/academic_year.py

from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Date, Boolean
from sqlalchemy.dialects.postgresql import UUID
from datetime import date
import uuid
from .base import Base

class AcademicYear(Base):
    __tablename__ = "academic_years"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(9), nullable=False)  # "2024-2025"
    short_name: Mapped[str] = mapped_column(String(5), nullable=False)  # "24-25" (auto-generated)
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=False)  # Only one active at a time
    
    # Relationships
    academic_records = relationship("StudentAcademicRecord", back_populates="academic_year", cascade="all, delete-orphan")
    classrooms = relationship("Classroom", back_populates="academic_year", cascade="all, delete-orphan")
    enrollments = relationship("Enrollment", back_populates="academic_year", cascade="all, delete-orphan")
    classrooms = relationship("Classroom", back_populates="academic_year", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<AcademicYear {self.name} ({'Active' if self.is_active else 'Inactive'})>"
    
    @classmethod
    def get_active(cls, session):
        """Get the currently active academic year"""
        return session.query(cls).filter(cls.is_active == True).first()
    
    def generate_short_name(self):
        """Auto-generate short name from full name (2024-2025 -> 24-25)"""
        if "-" in self.name:
            years = self.name.split("-")
            if len(years) == 2 and len(years[0]) == 4 and len(years[1]) == 4:
                return f"{years[0][-2:]}-{years[1][-2:]}"
        return self.name[:5]  # Fallback