from pydantic import BaseModel, EmailStr
from typing import Optional, List
from uuid import UUID

class UserRoleInfo(BaseModel):
    role: str
    school_name: str
    is_active: bool

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    first_name: str
    last_name: str
    role: str = 'teacher'
    school_id: Optional[str] = None

class UserOut(BaseModel):
    id: UUID
    email: EmailStr
    first_name: str
    last_name: str
    is_active: bool
    roles: List[UserRoleInfo] = []

    class Config:
        orm_mode = True
