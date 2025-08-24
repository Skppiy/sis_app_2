from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime, timezone

from .base import Base

class UserRole(Base):
    __tablename__ = 'user_roles'
    
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='CASCADE'), primary_key=True)
    role = Column(String, nullable=False, primary_key=True)  # allow multiple roles per user per school
    school_id = Column(UUID(as_uuid=True), ForeignKey('schools.id'), nullable=False, primary_key=True)
    is_active = Column(Boolean, default=True, nullable=False)
    last_used_at = Column(DateTime(timezone=True))
    
    # Relationships
    user = relationship("User", back_populates="user_roles")
    school = relationship("School", back_populates="user_roles")
    
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)
