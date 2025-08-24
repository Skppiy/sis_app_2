# backend/app/models/room.py
# Fixed to include classrooms relationship

from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Integer, Boolean, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
import uuid
from .base import Base

class Room(Base):
    __tablename__ = "rooms"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(50), nullable=False)  # "Room 101", "Art Room", "Gymnasium"
    room_code: Mapped[str] = mapped_column(String(10), nullable=False)  # "101", "ART", "GYM"
    
    # Room Classification
    room_type: Mapped[str] = mapped_column(String(20), nullable=False, default="CLASSROOM")  # "CLASSROOM", "SPECIAL", "OUTDOOR", "MULTI_PURPOSE"
    
    # Capacity and Features
    capacity: Mapped[int] = mapped_column(Integer, default=25)
    has_projector: Mapped[bool] = mapped_column(Boolean, default=False)
    has_computers: Mapped[bool] = mapped_column(Boolean, default=False)
    has_smartboard: Mapped[bool] = mapped_column(Boolean, default=False)
    has_sink: Mapped[bool] = mapped_column(Boolean, default=False)  # For art, science rooms
    
    # Booking and Usage
    is_bookable: Mapped[bool] = mapped_column(Boolean, default=True)  # For special events
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    
    # School Association
    school_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("schools.id"), nullable=False)
    
    # Relationships
    school = relationship("School", back_populates="rooms")
    classrooms = relationship("Classroom", back_populates="room")  # ADDED: Missing relationship
    
    def __repr__(self):
        return f"<Room {self.name} ({self.room_type}) - Capacity: {self.capacity}>"
    
    @classmethod
    def get_bookable_rooms(cls, session, school_id):
        """Get all rooms available for booking at a school"""
        return session.query(cls).filter(
            cls.school_id == school_id,
            cls.is_bookable == True,
            cls.is_active == True
        ).all()
    
    @classmethod
    def get_by_type(cls, session, school_id, room_type):
        """Get rooms by type (CLASSROOM, SPECIAL, etc.)"""
        return session.query(cls).filter(
            cls.school_id == school_id,
            cls.room_type == room_type,
            cls.is_active == True
        ).all()
    
    @property
    def is_available(self):
        """Check if room is currently available for assignment"""
        # For now, just check if it's active
        # In the future, this could check scheduling conflicts
        return self.is_active
    
    @property
    def assigned_classrooms_count(self):
        """Get count of classrooms currently assigned to this room"""
        return len([c for c in self.classrooms if c.room_id == self.id])