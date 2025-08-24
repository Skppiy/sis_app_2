# backend/app/schemas/room.py

from pydantic import BaseModel
from typing import Optional
from uuid import UUID

class RoomBase(BaseModel):
    name: str
    room_code: str
    room_type: str = "CLASSROOM"  # CLASSROOM, SPECIAL, OUTDOOR, MULTI_PURPOSE
    capacity: int = 25
    has_projector: bool = False
    has_computers: bool = False
    has_smartboard: bool = False
    has_sink: bool = False
    is_bookable: bool = True

class RoomCreate(RoomBase):
    school_id: str

class RoomUpdate(BaseModel):
    name: Optional[str] = None
    room_code: Optional[str] = None
    room_type: Optional[str] = None
    capacity: Optional[int] = None
    has_projector: Optional[bool] = None
    has_computers: Optional[bool] = None
    has_smartboard: Optional[bool] = None
    has_sink: Optional[bool] = None
    is_bookable: Optional[bool] = None
    is_active: Optional[bool] = None

class RoomOut(RoomBase):
    id: UUID
    school_id: UUID
    is_active: bool

    class Config:
        orm_mode = True