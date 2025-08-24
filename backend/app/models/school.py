# backend/app/models/school.py - Updated with new relationships

from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String
from sqlalchemy.dialects.postgresql import UUID
import uuid
from .base import Base

class School(Base):
    __tablename__ = "schools"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String, nullable=False)
    address: Mapped[str | None] = mapped_column(String, nullable=True)
    city: Mapped[str | None] = mapped_column(String, nullable=True)
    state: Mapped[str | None] = mapped_column(String, nullable=True)
    zip_code: Mapped[str | None] = mapped_column(String, nullable=True)
    tz: Mapped[str] = mapped_column(String, nullable=False)
    
    # Relationships
    user_roles = relationship("UserRole", back_populates="school", cascade="all, delete-orphan")
    rooms = relationship("Room", back_populates="school", cascade="all, delete-orphan")
    special_needs_tags = relationship("SpecialNeedsTagLibrary", back_populates="school", cascade="all, delete-orphan")
    students = relationship("Student", back_populates="school", cascade="all, delete-orphan")
