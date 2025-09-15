"""
Grade Band Configuration System
Allows schools to define their own elementary vs middle school boundaries
"""

from sqlalchemy import Enum
from sqlalchemy.orm import Mapped, mapped_column
from .base import Base

class GradeBandModel(Base):
    """
    School-level configuration for grade organization.
    Determines whether grades use homeroom or departmentalized instruction.
    """
    __tablename__ = "school_grade_band_configs"
    
    school_id: Mapped[str] = mapped_column(primary_key=True)
    
    # Elementary Configuration  
    elementary_start: Mapped[str] = mapped_column(default="K")  # "PK", "K" 
    elementary_end: Mapped[str] = mapped_column(default="5")    # "4", "5", "6"
    
    # Middle School Configuration
    middle_start: Mapped[str] = mapped_column(default="6")      # "5", "6", "7"
    middle_end: Mapped[str] = mapped_column(default="8")        # "8"
    
    # Special Grade Handling
    sixth_grade_model: Mapped[str] = mapped_column(
        Enum('homeroom', 'departmentalized', 'hybrid', name='sixth_grade_model'),
        default='homeroom'
    )
    
    # Homeroom Intelligence Rules
    homeroom_intelligence_enabled: Mapped[bool] = mapped_column(default=True)
    auto_assign_core_subjects: Mapped[bool] = mapped_column(default=True)


class GradeBandLogic:
    """Business logic for determining instruction model by grade."""
    
    @staticmethod
    def get_instruction_model(grade: str, school_config: GradeBandModel) -> str:
        """
        Determine if a grade uses 'homeroom' or 'departmentalized' instruction.
        
        Examples:
        - District A (K-5 elem): Grade 6 = 'departmentalized' 
        - District B (K-6 elem): Grade 6 = 'homeroom'
        - District C (K-8 elem): Grade 6 = 'homeroom'
        """
        
        # Elementary grades always use homeroom
        if grade >= school_config.elementary_start and grade <= school_config.elementary_end:
            return 'homeroom'
        
        # Middle school grades depend on configuration
        if grade >= school_config.middle_start and grade <= school_config.middle_end:
            # Special handling for 6th grade
            if grade == "6":
                return school_config.sixth_grade_model
            return 'departmentalized'
        
        # High school grades (9+) always departmentalized
        return 'departmentalized'
    
    @staticmethod 
    def should_use_homeroom_intelligence(grade: str, school_config: GradeBandModel) -> bool:
        """
        Determine if homeroom intelligence (auto-assignment) applies to this grade.
        """
        
        if not school_config.homeroom_intelligence_enabled:
            return False
            
        if not school_config.auto_assign_core_subjects:
            return False
            
        instruction_model = GradeBandLogic.get_instruction_model(grade, school_config)
        return instruction_model == 'homeroom'


# Example Usage in Homeroom Creation:

async def create_homeroom_with_intelligence(teacher_id: str, grade_level: str, school_id: str):
    """
    Creates homeroom using school-specific grade band configuration.
    """
    
    # Get school's grade band configuration
    school_config = await session.get(GradeBandModel, school_id)
    
    # Check if this grade should use homeroom intelligence
    if GradeBandLogic.should_use_homeroom_intelligence(grade_level, school_config):
        # Use homeroom intelligence - auto-assign CORE subjects
        await auto_assign_core_subjects(teacher_id, grade_level)
        print(f"Created homeroom for Grade {grade_level} with auto-assigned CORE subjects")
    else:
        # Use departmentalized model - manual subject assignment required
        await create_basic_classroom(teacher_id, grade_level)
        print(f"Created departmentalized classroom for Grade {grade_level} - manual subject assignment needed")


# Real-world Examples:

DISTRICT_A_CONFIG = {
    'elementary_start': 'K',
    'elementary_end': '5', 
    'middle_start': '6',
    'middle_end': '8',
    'sixth_grade_model': 'departmentalized'  # 6th grade = middle school
}

DISTRICT_B_CONFIG = {
    'elementary_start': 'K', 
    'elementary_end': '6',
    'middle_start': '7', 
    'middle_end': '8',
    'sixth_grade_model': 'homeroom'  # 6th grade = elementary
}

DISTRICT_C_CONFIG = {
    'elementary_start': 'K',
    'elementary_end': '8',  # K-8 school
    'middle_start': '9', 
    'middle_end': '8',  # No middle school
    'sixth_grade_model': 'homeroom'  # All grades use homeroom
}