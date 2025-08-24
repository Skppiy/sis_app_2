from sqlalchemy import Column, String, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime, timezone

from .base import Base

class UserRolePreference(Base):
    __tablename__ = 'user_role_preferences'
    
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='CASCADE'), primary_key=True)
    role = Column(String, nullable=False)
    school_id = Column(UUID(as_uuid=True), ForeignKey('schools.id'), nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="role_preference")
    school = relationship("School")
    
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)
