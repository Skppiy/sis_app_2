# backend/app/schemas/academic_year.py

from pydantic import BaseModel, validator
from datetime import date
from typing import Optional
from uuid import UUID

class AcademicYearBase(BaseModel):
    name: str  # "2024-2025"
    start_date: date
    end_date: date
    is_active: Optional[bool] = False

    @validator('name')
    def validate_name_format(cls, v):
        """Validate academic year name format (YYYY-YYYY)"""
        if '-' in v:
            parts = v.split('-')
            if len(parts) == 2:
                try:
                    start_year = int(parts[0])
                    end_year = int(parts[1])
                    if end_year == start_year + 1:
                        return v
                except ValueError:
                    pass
        raise ValueError('Academic year name must be in format YYYY-YYYY (e.g., 2024-2025)')

    @validator('end_date')
    def end_date_after_start(cls, v, values):
        if 'start_date' in values and v <= values['start_date']:
            raise ValueError('End date must be after start date')
        return v

class AcademicYearCreate(AcademicYearBase):
    short_name: Optional[str] = None  # Auto-generated if not provided
    
    def generate_short_name(self):
        """Generate short name from full name"""
        if '-' in self.name:
            years = self.name.split('-')
            if len(years) == 2 and len(years[0]) == 4 and len(years[1]) == 4:
                return f"{years[0][-2:]}-{years[1][-2:]}"
        return self.name[:5]

class AcademicYearUpdate(BaseModel):
    name: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    is_active: Optional[bool] = None

class AcademicYearOut(AcademicYearBase):
    id: UUID
    short_name: str

    class Config:
        orm_mode = True