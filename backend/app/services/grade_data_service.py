# backend/app/services/grade_data_service.py

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_, text
from typing import Dict, List, Optional, Tuple
import uuid
import logging

logger = logging.getLogger(__name__)

class GradeDataService:
    """
    Comprehensive service to check for grade data across all related tables.
    Used to determine if a subject can be safely deleted or should be archived.
    """
    
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def check_subject_grade_data(self, subject_id: uuid.UUID) -> Dict:
        """
        Check for any grade data associated with a subject across all possible tables.
        
        Returns:
            Dict containing:
            - has_grade_data: bool - True if any grade data exists
            - blocking_data: List[Dict] - Details of what's blocking deletion
            - safe_to_delete: bool - True if no grade data exists
            - detailed_counts: Dict - Counts for each type of data found
        """
        
        result = {
            "has_grade_data": False,
            "blocking_data": [],
            "safe_to_delete": True,
            "detailed_counts": {},
            "affected_academic_years": [],
            "error_message": None
        }
        
        try:
            # Check 1: Student Subject Enrollments with grades
            enrollment_data = await self._check_student_subject_enrollments(subject_id)
            if enrollment_data["count"] > 0:
                result["has_grade_data"] = True
                result["safe_to_delete"] = False
                result["blocking_data"].append(enrollment_data)
                result["detailed_counts"]["student_enrollments_with_grades"] = enrollment_data["count"]
                result["affected_academic_years"].extend(enrollment_data["academic_years"])
            
            # Check 2: Academic Records with final grades
            academic_records_data = await self._check_academic_records(subject_id)
            if academic_records_data["count"] > 0:
                result["has_grade_data"] = True
                result["safe_to_delete"] = False
                result["blocking_data"].append(academic_records_data)
                result["detailed_counts"]["academic_records_with_gpa"] = academic_records_data["count"]
                result["affected_academic_years"].extend(academic_records_data["academic_years"])
            
            # Check 3: Classroom enrollments (students in classrooms for this subject)
            classroom_enrollments = await self._check_classroom_enrollments(subject_id)
            if classroom_enrollments["count"] > 0:
                result["blocking_data"].append(classroom_enrollments)
                result["detailed_counts"]["classroom_enrollments"] = classroom_enrollments["count"]
                result["affected_academic_years"].extend(classroom_enrollments["academic_years"])
                
                # If enrollments exist, we should archive rather than delete to preserve history
                if classroom_enrollments["count"] > 0:
                    result["has_grade_data"] = True
                    result["safe_to_delete"] = False
            
            # Check 4: Teacher assignments with historical data
            teacher_assignments = await self._check_teacher_assignments(subject_id)
            if teacher_assignments["count"] > 0:
                result["blocking_data"].append(teacher_assignments)
                result["detailed_counts"]["teacher_assignments"] = teacher_assignments["count"]
                result["affected_academic_years"].extend(teacher_assignments["academic_years"])
            
            # Check 5: Assignment events (audit history)
            assignment_events = await self._check_assignment_events(subject_id)
            if assignment_events["count"] > 0:
                result["blocking_data"].append(assignment_events)
                result["detailed_counts"]["assignment_events"] = assignment_events["count"]
                result["affected_academic_years"].extend(assignment_events["academic_years"])
            
            # Remove duplicate academic years and sort
            result["affected_academic_years"] = sorted(list(set(result["affected_academic_years"])))
            
            # Generate error message if deletion is blocked
            if not result["safe_to_delete"]:
                result["error_message"] = self._generate_error_message(result)
            
            return result
            
        except Exception as e:
            logger.error(f"Error checking grade data for subject {subject_id}: {str(e)}")
            result["error_message"] = f"Error checking grade data: {str(e)}"
            result["safe_to_delete"] = False
            return result
    
    async def _check_student_subject_enrollments(self, subject_id: uuid.UUID) -> Dict:
        """Check for student enrollments with grade data"""
        # Use raw SQL to work with actual database schema
        query = text("""
            SELECT 
                COUNT(sse.id) as count,
                ARRAY_AGG(DISTINCT ay.name) as years
            FROM student_subject_enrollments sse
            JOIN academic_years ay ON sse.academic_year_id = ay.id
            WHERE sse.subject_id = :subject_id
            AND sse.is_active = true
        """)
        
        result = await self.session.execute(query, {"subject_id": subject_id})
        row = result.first()
        
        count = row.count if row and row.count else 0
        years = [year for year in (row.years if row and row.years else []) if year is not None]
        
        return {
            "type": "student_subject_enrollments",
            "description": "Student enrollments with recorded grades or attendance data",
            "count": count,
            "academic_years": years,
            "details": f"Found {count} student enrollments with grade or attendance data"
        }
    
    async def _check_academic_records(self, subject_id: uuid.UUID) -> Dict:
        """Check for academic records that might be related to this subject"""
        from ..models.student_academic_record import StudentAcademicRecord
        from ..models.academic_year import AcademicYear
        from ..models.classroom import Classroom
        from ..models.enrollment import Enrollment
        
        # Check for academic records where students were enrolled in classrooms for this subject
        query = (
            select(
                func.count(StudentAcademicRecord.id.distinct()).label("count"),
                func.array_agg(AcademicYear.name.distinct()).label("years")
            )
            .join(AcademicYear, StudentAcademicRecord.academic_year_id == AcademicYear.id)
            .join(Enrollment, and_(
                Enrollment.student_id == StudentAcademicRecord.student_id,
                Enrollment.academic_year_id == StudentAcademicRecord.academic_year_id
            ))
            .join(Classroom, Enrollment.classroom_id == Classroom.id)
            .where(
                and_(
                    Classroom.subject_id == subject_id,
                    or_(
                        StudentAcademicRecord.final_gpa.is_not(None),
                        StudentAcademicRecord.attendance_rate.is_not(None),
                        StudentAcademicRecord.credits_earned.is_not(None)
                    )
                )
            )
        )
        
        result = await self.session.execute(query)
        row = result.first()
        
        count = row.count if row and row.count else 0
        years = [year for year in (row.years if row and row.years else []) if year is not None]
        
        return {
            "type": "academic_records",
            "description": "Academic records with GPA or performance data for students who took this subject",
            "count": count,
            "academic_years": years,
            "details": f"Found {count} academic records with performance data from students who took this subject"
        }
    
    async def _check_classroom_enrollments(self, subject_id: uuid.UUID) -> Dict:
        """Check for classroom enrollments"""
        from ..models.enrollment import Enrollment
        from ..models.classroom import Classroom
        from ..models.academic_year import AcademicYear
        
        query = (
            select(
                func.count(Enrollment.id).label("count"),
                func.array_agg(AcademicYear.name.distinct()).label("years")
            )
            .join(Classroom, Enrollment.classroom_id == Classroom.id)
            .join(AcademicYear, Enrollment.academic_year_id == AcademicYear.id)
            .where(Classroom.subject_id == subject_id)
        )
        
        result = await self.session.execute(query)
        row = result.first()
        
        count = row.count if row and row.count else 0
        years = [year for year in (row.years if row and row.years else []) if year is not None]
        
        return {
            "type": "classroom_enrollments",
            "description": "Student enrollments in classrooms for this subject",
            "count": count,
            "academic_years": years,
            "details": f"Found {count} student enrollments in classrooms for this subject"
        }
    
    async def _check_teacher_assignments(self, subject_id: uuid.UUID) -> Dict:
        """Check for teacher subject assignments"""
        from ..models.teacher_subject_assignment import TeacherSubjectAssignment
        from ..models.academic_year import AcademicYear
        
        query = (
            select(
                func.count(TeacherSubjectAssignment.id).label("count"),
                func.array_agg(AcademicYear.name.distinct()).label("years")
            )
            .join(AcademicYear, TeacherSubjectAssignment.academic_year_id == AcademicYear.id)
            .where(TeacherSubjectAssignment.subject_id == subject_id)
        )
        
        result = await self.session.execute(query)
        row = result.first()
        
        count = row.count if row and row.count else 0
        years = [year for year in (row.years if row and row.years else []) if year is not None]
        
        return {
            "type": "teacher_assignments",
            "description": "Teacher assignments for this subject",
            "count": count,
            "academic_years": years,
            "details": f"Found {count} teacher assignments for this subject"
        }
    
    async def _check_assignment_events(self, subject_id: uuid.UUID) -> Dict:
        """Check for assignment events (audit history)"""
        from ..models.subject_assignment_event import SubjectAssignmentEvent
        from ..models.academic_year import AcademicYear
        
        query = (
            select(
                func.count(SubjectAssignmentEvent.id).label("count"),
                func.array_agg(AcademicYear.name.distinct()).label("years")
            )
            .join(AcademicYear, SubjectAssignmentEvent.academic_year_id == AcademicYear.id)
            .where(SubjectAssignmentEvent.subject_id == subject_id)
        )
        
        result = await self.session.execute(query)
        row = result.first()
        
        count = row.count if row and row.count else 0
        years = [year for year in (row.years if row and row.years else []) if year is not None]
        
        return {
            "type": "assignment_events",
            "description": "Assignment event history for this subject",
            "count": count,
            "academic_years": years,
            "details": f"Found {count} assignment events in audit history"
        }
    
    def _generate_error_message(self, check_result: Dict) -> str:
        """Generate a user-friendly error message explaining why deletion is blocked"""
        
        blocking_items = []
        grade_data_items = []
        
        for block in check_result["blocking_data"]:
            if block["type"] in ["student_subject_enrollments", "academic_records"]:
                grade_data_items.append(f"{block['count']} {block['description'].lower()}")
            else:
                blocking_items.append(f"{block['count']} {block['description'].lower()}")
        
        years_text = ""
        if check_result["affected_academic_years"]:
            if len(check_result["affected_academic_years"]) == 1:
                years_text = f" from {check_result['affected_academic_years'][0]}"
            else:
                years_text = f" from academic years: {', '.join(check_result['affected_academic_years'])}"
        
        # Prioritize grade data in error message
        if grade_data_items:
            error_msg = f"Cannot delete subject - contains {', '.join(grade_data_items)}{years_text}. Use archive instead to preserve academic records."
        elif blocking_items:
            error_msg = f"Cannot delete subject - has {', '.join(blocking_items)}{years_text}. Use archive instead to preserve historical data."
        else:
            error_msg = "Cannot delete subject - contains academic data that must be preserved. Use archive instead."
        
        return error_msg
    
    async def get_subject_usage_summary(self, subject_id: uuid.UUID) -> Dict:
        """Get a comprehensive summary of how a subject is being used"""
        
        check_result = await self.check_subject_grade_data(subject_id)
        
        from ..models.subject import Subject
        subject = await self.session.get(Subject, subject_id)
        
        summary = {
            "subject_name": subject.name if subject else "Unknown",
            "subject_code": subject.code if subject else "Unknown",
            "can_delete": check_result["safe_to_delete"],
            "should_archive": not check_result["safe_to_delete"],
            "usage_summary": check_result["detailed_counts"],
            "affected_years": check_result["affected_academic_years"],
            "recommendation": "DELETE" if check_result["safe_to_delete"] else "ARCHIVE",
            "reason": check_result["error_message"] if not check_result["safe_to_delete"] else "No grade data found - safe to delete"
        }
        
        return summary