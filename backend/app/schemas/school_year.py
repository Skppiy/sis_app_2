from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import date


class SchoolYearCreate(BaseModel):
    name: str
    start_date: date
    end_date: date
    is_active: Optional[bool] = False


class SchoolYearOut(BaseModel):
    id: UUID
    name: str
    start_date: date
    end_date: date
    is_active: bool

    class Config:
        orm_mode = True

