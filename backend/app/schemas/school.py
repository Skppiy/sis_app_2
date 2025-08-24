from pydantic import BaseModel, validator
from typing import Optional
from uuid import UUID
from ..config import ALLOWED_TZS_US

class SchoolBase(BaseModel):
    name: str
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    tz: str

    @validator('tz')
    def tz_allowed(cls, v):
        if v not in ALLOWED_TZS_US:
            raise ValueError('Time zone must be a U.S. zone')
        return v

class SchoolCreate(SchoolBase):
    pass

class SchoolUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    tz: Optional[str] = None

    @validator('tz')
    def tz_allowed_optional(cls, v):
        if v and v not in ALLOWED_TZS_US:
            raise ValueError('Time zone must be a U.S. zone')
        return v

class SchoolOut(SchoolBase):
    id: UUID

    class Config:
        orm_mode = True
