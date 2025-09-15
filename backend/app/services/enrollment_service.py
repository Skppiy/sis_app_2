# backend/app/services/enrollment_service.py

"""
Enhanced Enrollment Service for Three-Tier Enrollment System

This service implements the comprehensive three-tier enrollment system with:
1. Bulk enrollment for CORE subjects (Tier 1)
2. Flexible enrollment for non-CORE subjects (Tier 2) 
3. Individual special program enrollment (Tier 3)

Built on top of the existing homeroom intelligence system and follows
the established patterns from homeroom_service.py
"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func, text
from sqlalchemy.orm import joinedload, selectinload
from typing import List, Optional, Dict, Tuple, Any
from datetime import datetime, date
from enum import Enum
import uuid
import logging

from ..models.user import User
from ..models.subject import Subject
from ..models.academic_year import AcademicYear
from ..models.classroom import Classroom
from ..models.classroom_teacher_assignment import ClassroomTeacherAssignment
from ..models.teacher_subject_assignment import TeacherSubjectAssignment
from ..models.student_subject_enrollment import StudentSubjectEnrollment
from ..models.subject_assignment_event import SubjectAssignmentEvent
from ..models.student import Student
from ..models.enrollment import Enrollment
from .homeroom_service import HomeroomService

logger = logging.getLogger(__name__)

class EnrollmentTier(Enum):
    """Enrollment tier classification"""
    TIER_1_CORE = "TIER_1_CORE"           # Bulk homeroom CORE subjects
    TIER_2_FLEXIBLE = "TIER_2_FLEXIBLE"   # Flexible non-CORE subjects with options
    TIER_3_SPECIAL = "TIER_3_SPECIAL"     # Individual special programs

class ConflictType(Enum):
    """Types of enrollment conflicts"""
    SCHEDULE_CONFLICT = "SCHEDULE_CONFLICT"
    PREREQUISITE_MISSING = "PREREQUISITE_MISSING"
    GRADE_MISMATCH = "GRADE_MISMATCH"
    CAPACITY_EXCEEDED = "CAPACITY_EXCEEDED"
    DUPLICATE_ENROLLMENT = "DUPLICATE_ENROLLMENT"

class EnrollmentService:
    """Enhanced service for three-tier enrollment management"""
    
    def __init__(self, session: AsyncSession):
        self.session = session
        self.homeroom_service = HomeroomService(session)
    
    async def bulk_homeroom_enrollment(
        self,
        academic_year_id: uuid.UUID,
        grade_level: str,
        students: List[uuid.UUID],
        enrolled_by_user_id: uuid.UUID,
        auto_create_missing_assignments: bool = True
    ) -> Dict[str, Any]:
        """
        Tier 1: Bulk enrollment of students in homeroom CORE subjects.
        
        This leverages the existing homeroom intelligence system to automatically
        enroll students in all CORE subjects taught by their homeroom teachers.
        
        Args:
            academic_year_id: Academic year for enrollment
            grade_level: Grade level (K-5 for elementary homeroom model)
            students: List of student IDs to enroll
            enrolled_by_user_id: User performing the enrollment
            auto_create_missing_assignments: Create teacher assignments if missing
            
        Returns:
            Dict with enrollment results, statistics, and any conflicts
        """
        logger.info(f"Starting bulk homeroom enrollment for {len(students)} students in grade {grade_level}")
        
        try:
            # Validate academic year
            academic_year = await self.session.get(AcademicYear, academic_year_id)
            if not academic_year:
                raise ValueError(f"Academic year {academic_year_id} not found")
            
            # Get all CORE subject teacher assignments for this grade level
            core_assignments_query = (
                select(TeacherSubjectAssignment)
                .options(
                    joinedload(TeacherSubjectAssignment.subject),
                    joinedload(TeacherSubjectAssignment.teacher),
                    joinedload(TeacherSubjectAssignment.classroom)
                )
                .join(Subject, TeacherSubjectAssignment.subject_id == Subject.id)
                .join(Classroom, TeacherSubjectAssignment.classroom_id == Classroom.id)
                .where(
                    and_(
                        TeacherSubjectAssignment.academic_year_id == academic_year_id,
                        TeacherSubjectAssignment.assignment_type.in_(["AUTO_HOMEROOM", "HOMEROOM"]),
                        Subject.subject_type == "CORE",
                        Classroom.grade_level == grade_level,
                        TeacherSubjectAssignment.is_active == True,
                        Subject.applies_to_elementary == True
                    )
                )
            )
            
            result = await self.session.execute(core_assignments_query)
            core_assignments = result.scalars().all()
            
            if not core_assignments:
                if auto_create_missing_assignments:
                    logger.warning(f"No CORE assignments found for grade {grade_level}, attempting to create homeroom assignments")
                    # This would require knowing which teachers should be homeroom teachers
                    # For now, return empty result with guidance
                    return {
                        "enrollments_created": [],
                        "conflicts": [],
                        "warnings": [f"No homeroom CORE subject assignments found for grade {grade_level}. Create homeroom teachers first."],
                        "message": "No CORE assignments available for bulk enrollment"
                    }
                else:
                    raise ValueError(f"No CORE subject assignments found for grade {grade_level}")
            
            enrollments_created = []
            conflicts = []
            
            for student_id in students:
                # Validate student exists
                student = await self.session.get(Student, student_id)
                if not student:
                    conflicts.append({
                        "type": "STUDENT_NOT_FOUND",
                        "student_id": str(student_id),
                        "message": f"Student {student_id} not found"
                    })
                    continue
                
                # Enroll in each CORE subject
                for assignment in core_assignments:
                    # Check for existing enrollment
                    existing_query = (
                        select(StudentSubjectEnrollment)
                        .where(
                            and_(
                                StudentSubjectEnrollment.student_id == student_id,
                                StudentSubjectEnrollment.teacher_subject_assignment_id == assignment.id,
                                StudentSubjectEnrollment.academic_year_id == academic_year_id,
                                StudentSubjectEnrollment.enrollment_status == "ACTIVE"
                            )
                        )
                    )
                    existing_result = await self.session.execute(existing_query)
                    if existing_result.scalar_one_or_none():
                        conflicts.append({
                            "type": ConflictType.DUPLICATE_ENROLLMENT.value,
                            "student_id": str(student_id),
                            "subject_name": assignment.subject.name,
                            "teacher_name": assignment.teacher.full_name,
                            "message": f"Student already enrolled in {assignment.subject.name} with {assignment.teacher.full_name}"
                        })
                        continue
                    
                    # Create enrollment
                    enrollment = StudentSubjectEnrollment(
                        student_id=student_id,
                        subject_id=assignment.subject_id,
                        classroom_id=assignment.classroom_id,
                        teacher_subject_assignment_id=assignment.id,
                        academic_year_id=academic_year_id,
                        enrollment_type="AUTO_CORE",
                        enrollment_status="ACTIVE",
                        enrolled_date=datetime.utcnow().date(),
                        is_active=True,
                        enrolled_by_user_id=enrolled_by_user_id,
                        is_homeroom_core=True
                    )
                    
                    self.session.add(enrollment)
                    enrollments_created.append({
                        "student_id": str(student_id),
                        "student_name": student.full_name,
                        "subject_name": assignment.subject.name,
                        "teacher_name": assignment.teacher.full_name,
                        "classroom_name": assignment.classroom.name if assignment.classroom else "No Classroom",
                        "enrollment_tier": EnrollmentTier.TIER_1_CORE.value
                    })
            
            await self.session.commit()
            
            logger.info(f"Bulk homeroom enrollment completed: {len(enrollments_created)} enrollments, {len(conflicts)} conflicts")
            
            return {
                "enrollments_created": enrollments_created,
                "conflicts": conflicts,
                "summary": {
                    "total_students_processed": len(students),
                    "total_enrollments_created": len(enrollments_created),
                    "total_conflicts": len(conflicts),
                    "grade_level": grade_level,
                    "enrollment_tier": EnrollmentTier.TIER_1_CORE.value
                },
                "message": f"Successfully processed bulk homeroom enrollment for {len(students)} students"
            }
            
        except Exception as e:
            await self.session.rollback()
            logger.error(f"Error in bulk homeroom enrollment: {str(e)}")
            raise
    
    async def flexible_subject_enrollment(
        self,
        subject_id: uuid.UUID,
        academic_year_id: uuid.UUID,
        students: List[uuid.UUID],
        enrolled_by_user_id: uuid.UUID,
        teacher_preferences: Optional[Dict[str, List[uuid.UUID]]] = None,
        enrollment_options: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Tier 2: Flexible enrollment for non-CORE subjects with teacher options.
        
        This handles subjects like PE, Art, Music, etc. where students can be
        assigned to different teacher sections based on availability and preferences.
        
        Args:
            subject_id: Subject to enroll students in
            academic_year_id: Academic year
            students: List of student IDs
            teacher_preferences: Optional dict mapping teacher_id -> list of preferred students
            enrollment_options: Additional enrollment settings (capacity limits, etc.)
            enrolled_by_user_id: User performing enrollment
            
        Returns:
            Dict with enrollment results and teacher assignment distributions
        """
        logger.info(f"Starting flexible subject enrollment for subject {subject_id}")
        
        try:
            # Validate subject
            subject = await self.session.get(Subject, subject_id)
            if not subject:
                raise ValueError(f"Subject {subject_id} not found")
            
            if subject.subject_type == "CORE":
                raise ValueError(f"Subject {subject.name} is CORE - use bulk homeroom enrollment instead")
            
            # Get all teacher assignments for this subject
            teacher_assignments_query = (
                select(TeacherSubjectAssignment)
                .options(
                    joinedload(TeacherSubjectAssignment.teacher),
                    joinedload(TeacherSubjectAssignment.classroom)
                )
                .where(
                    and_(
                        TeacherSubjectAssignment.subject_id == subject_id,
                        TeacherSubjectAssignment.academic_year_id == academic_year_id,
                        TeacherSubjectAssignment.is_active == True
                    )
                )
            )
            
            result = await self.session.execute(teacher_assignments_query)
            teacher_assignments = result.scalars().all()
            
            if not teacher_assignments:
                raise ValueError(f"No teacher assignments found for subject {subject.name}")
            
            # Get capacity information for each teacher
            teacher_capacities = {}
            for assignment in teacher_assignments:
                # Get current enrollment count
                current_count_query = (
                    select(func.count(StudentSubjectEnrollment.id))
                    .where(
                        and_(
                            StudentSubjectEnrollment.teacher_subject_assignment_id == assignment.id,
                            StudentSubjectEnrollment.enrollment_status == "ACTIVE"
                        )
                    )
                )
                count_result = await self.session.execute(current_count_query)
                current_count = count_result.scalar() or 0
                
                max_capacity = assignment.classroom.max_students if assignment.classroom else 25  # Default capacity
                
                teacher_capacities[str(assignment.id)] = {
                    "assignment": assignment,
                    "current_count": current_count,
                    "max_capacity": max_capacity,
                    "available_spots": max_capacity - current_count
                }
            
            # Distribute students across teachers
            enrollments_created = []
            conflicts = []
            
            # Simple round-robin distribution if no preferences specified
            if not teacher_preferences:
                assignment_list = list(teacher_capacities.keys())
                assignment_index = 0
                
                for student_id in students:
                    student = await self.session.get(Student, student_id)
                    if not student:
                        conflicts.append({
                            "type": "STUDENT_NOT_FOUND",
                            "student_id": str(student_id),
                            "message": f"Student {student_id} not found"
                        })
                        continue
                    
                    # Find next available teacher assignment
                    attempts = 0
                    while attempts < len(assignment_list):
                        assignment_id = assignment_list[assignment_index]
                        capacity_info = teacher_capacities[assignment_id]
                        
                        if capacity_info["available_spots"] > 0:
                            # Check for duplicate enrollment
                            existing_query = (
                                select(StudentSubjectEnrollment)
                                .where(
                                    and_(
                                        StudentSubjectEnrollment.student_id == student_id,
                                        StudentSubjectEnrollment.teacher_subject_assignment_id == uuid.UUID(assignment_id),
                                        StudentSubjectEnrollment.academic_year_id == academic_year_id,
                                        StudentSubjectEnrollment.enrollment_status == "ACTIVE"
                                    )
                                )
                            )
                            existing_result = await self.session.execute(existing_query)
                            if existing_result.scalar_one_or_none():
                                conflicts.append({
                                    "type": ConflictType.DUPLICATE_ENROLLMENT.value,
                                    "student_id": str(student_id),
                                    "subject_name": subject.name,
                                    "message": f"Student already enrolled in {subject.name}"
                                })
                                break
                            
                            # Create enrollment
                            enrollment = StudentSubjectEnrollment(
                                student_id=student_id,
                                subject_id=subject.id,
                                classroom_id=assignment.classroom_id,
                                teacher_subject_assignment_id=uuid.UUID(assignment_id),
                                academic_year_id=academic_year_id,
                                enrollment_type="MANUAL",
                                enrollment_status="ACTIVE",
                                enrolled_date=datetime.utcnow().date(),
                                is_active=True,
                                enrolled_by_user_id=enrolled_by_user_id,
                                is_homeroom_core=False
                            )
                            
                            self.session.add(enrollment)
                            
                            # Update capacity tracking
                            capacity_info["available_spots"] -= 1
                            
                            enrollments_created.append({
                                "student_id": str(student_id),
                                "student_name": student.full_name,
                                "subject_name": subject.name,
                                "teacher_name": capacity_info["assignment"].teacher.full_name,
                                "classroom_name": capacity_info["assignment"].classroom.name if capacity_info["assignment"].classroom else "No Classroom",
                                "enrollment_tier": EnrollmentTier.TIER_2_FLEXIBLE.value
                            })
                            break
                        
                        assignment_index = (assignment_index + 1) % len(assignment_list)
                        attempts += 1
                    
                    if attempts >= len(assignment_list):
                        conflicts.append({
                            "type": ConflictType.CAPACITY_EXCEEDED.value,
                            "student_id": str(student_id),
                            "subject_name": subject.name,
                            "message": f"No available capacity in any {subject.name} section"
                        })
                    
                    assignment_index = (assignment_index + 1) % len(assignment_list)
            
            await self.session.commit()
            
            # Generate teacher distribution summary
            teacher_distribution = {}
            for assignment_id, capacity_info in teacher_capacities.items():
                assignment = capacity_info["assignment"]
                teacher_distribution[str(assignment.teacher.id)] = {
                    "teacher_name": assignment.teacher.full_name,
                    "classroom_name": assignment.classroom.name if assignment.classroom else "No Classroom",
                    "students_enrolled": capacity_info["max_capacity"] - capacity_info["available_spots"],
                    "capacity_remaining": capacity_info["available_spots"],
                    "max_capacity": capacity_info["max_capacity"]
                }
            
            logger.info(f"Flexible enrollment completed: {len(enrollments_created)} enrollments")
            
            return {
                "enrollments_created": enrollments_created,
                "conflicts": conflicts,
                "teacher_distribution": teacher_distribution,
                "summary": {
                    "total_students_processed": len(students),
                    "total_enrollments_created": len(enrollments_created),
                    "total_conflicts": len(conflicts),
                    "subject_name": subject.name,
                    "enrollment_tier": EnrollmentTier.TIER_2_FLEXIBLE.value
                },
                "message": f"Successfully processed flexible enrollment for {subject.name}"
            }
            
        except Exception as e:
            await self.session.rollback()
            logger.error(f"Error in flexible subject enrollment: {str(e)}")
            raise
    
    async def special_program_enrollment(
        self,
        student_id: uuid.UUID,
        teacher_subject_assignment_id: uuid.UUID,
        academic_year_id: uuid.UUID,
        enrollment_details: Dict[str, Any],
        enrolled_by_user_id: uuid.UUID
    ) -> Dict[str, Any]:
        """
        Tier 3: Individual enrollment for special programs, advanced classes, etc.
        
        This handles one-off enrollments that require individual consideration,
        such as gifted programs, special education, ESL, etc.
        
        Args:
            student_id: Student to enroll
            teacher_subject_assignment_id: Specific teacher-subject assignment
            academic_year_id: Academic year
            enrollment_details: Special program details and requirements
            enrolled_by_user_id: User performing enrollment
            
        Returns:
            Dict with enrollment result and any special considerations
        """
        logger.info(f"Starting special program enrollment for student {student_id}")
        
        try:
            # Validate student and assignment
            student = await self.session.get(Student, student_id)
            if not student:
                raise ValueError(f"Student {student_id} not found")
            
            assignment_query = (
                select(TeacherSubjectAssignment)
                .options(
                    joinedload(TeacherSubjectAssignment.subject),
                    joinedload(TeacherSubjectAssignment.teacher),
                    joinedload(TeacherSubjectAssignment.classroom)
                )
                .where(TeacherSubjectAssignment.id == teacher_subject_assignment_id)
            )
            assignment_result = await self.session.execute(assignment_query)
            assignment = assignment_result.scalar_one_or_none()
            
            if not assignment:
                raise ValueError(f"Teacher subject assignment {teacher_subject_assignment_id} not found")
            
            # Check for conflicts
            conflicts = await self._check_enrollment_conflicts(
                student_id, teacher_subject_assignment_id, academic_year_id
            )
            
            if conflicts and not enrollment_details.get("override_conflicts", False):
                return {
                    "enrollment_created": None,
                    "conflicts": conflicts,
                    "message": "Enrollment blocked due to conflicts. Use override_conflicts=True to force enrollment."
                }
            
            # Create special program enrollment
            enrollment = StudentSubjectEnrollment(
                student_id=student_id,
                subject_id=assignment.subject_id,
                classroom_id=assignment.classroom_id,
                teacher_subject_assignment_id=teacher_subject_assignment_id,
                academic_year_id=academic_year_id,
                enrollment_type="SPECIALIST",
                enrollment_status="ACTIVE",
                enrolled_date=datetime.utcnow().date(),
                is_active=True,
                enrolled_by_user_id=enrolled_by_user_id,
                is_homeroom_core=False
            )
            
            self.session.add(enrollment)
            await self.session.commit()
            
            logger.info(f"Special program enrollment created for {student.full_name} in {assignment.subject.name}")
            
            return {
                "enrollment_created": {
                    "id": str(enrollment.id),
                    "student_id": str(student_id),
                    "student_name": student.full_name,
                    "subject_name": assignment.subject.name,
                    "teacher_name": assignment.teacher.full_name,
                    "classroom_name": assignment.classroom.name if assignment.classroom else "No Classroom",
                    "enrollment_type": enrollment.enrollment_type,
                    "enrollment_tier": EnrollmentTier.TIER_3_SPECIAL.value,
                    "special_considerations": {
                        "has_iep": enrollment.has_iep,
                        "has_504": enrollment.has_504,
                        "accommodation_notes": enrollment.accommodation_notes
                    }
                },
                "conflicts": conflicts if enrollment_details.get("override_conflicts") else [],
                "message": f"Successfully enrolled {student.full_name} in special program {assignment.subject.name}"
            }
            
        except Exception as e:
            await self.session.rollback()
            logger.error(f"Error in special program enrollment: {str(e)}")
            raise
    
    async def detect_enrollment_conflicts(
        self,
        academic_year_id: uuid.UUID,
        grade_level: Optional[str] = None,
        student_id: Optional[uuid.UUID] = None
    ) -> Dict[str, Any]:
        """
        Detect and report enrollment conflicts across the system.
        
        Args:
            academic_year_id: Academic year to check
            grade_level: Optional grade level filter
            student_id: Optional specific student filter
            
        Returns:
            Dict with categorized conflicts and recommendations
        """
        logger.info(f"Detecting enrollment conflicts for academic year {academic_year_id}")
        
        conflicts = {
            "schedule_conflicts": [],
            "capacity_issues": [],
            "missing_core_subjects": [],
            "duplicate_enrollments": [],
            "grade_mismatches": []
        }
        
        try:
            # Check for duplicate enrollments
            duplicate_query = (
                select(
                    StudentSubjectEnrollment.student_id,
                    StudentSubjectEnrollment.teacher_subject_assignment_id,
                    func.count(StudentSubjectEnrollment.id).label('count')
                )
                .where(
                    and_(
                        StudentSubjectEnrollment.academic_year_id == academic_year_id,
                        StudentSubjectEnrollment.enrollment_status == "ACTIVE"
                    )
                )
                .group_by(
                    StudentSubjectEnrollment.student_id,
                    StudentSubjectEnrollment.teacher_subject_assignment_id
                )
                .having(func.count(StudentSubjectEnrollment.id) > 1)
            )
            
            if student_id:
                duplicate_query = duplicate_query.where(StudentSubjectEnrollment.student_id == student_id)
            
            duplicate_result = await self.session.execute(duplicate_query)
            duplicates = duplicate_result.fetchall()
            
            for dup in duplicates:
                conflicts["duplicate_enrollments"].append({
                    "type": ConflictType.DUPLICATE_ENROLLMENT.value,
                    "student_id": str(dup.student_id),
                    "assignment_id": str(dup.teacher_subject_assignment_id),
                    "duplicate_count": dup.count,
                    "message": f"Student has {dup.count} active enrollments in the same subject-teacher combination"
                })
            
            # Check capacity issues
            capacity_query = (
                select(TeacherSubjectAssignment)
                .options(
                    joinedload(TeacherSubjectAssignment.subject),
                    joinedload(TeacherSubjectAssignment.teacher),
                    joinedload(TeacherSubjectAssignment.classroom)
                )
                .where(
                    and_(
                        TeacherSubjectAssignment.academic_year_id == academic_year_id,
                        TeacherSubjectAssignment.is_active == True
                    )
                )
            )
            
            if grade_level:
                capacity_query = capacity_query.join(Classroom).where(Classroom.grade_level == grade_level)
            
            capacity_result = await self.session.execute(capacity_query)
            assignments = capacity_result.scalars().all()
            
            for assignment in assignments:
                if assignment.classroom and assignment.classroom.max_students:
                    enrollment_count_query = (
                        select(func.count(StudentSubjectEnrollment.id))
                        .where(
                            and_(
                                StudentSubjectEnrollment.teacher_subject_assignment_id == assignment.id,
                                StudentSubjectEnrollment.enrollment_status == "ACTIVE"
                            )
                        )
                    )
                    count_result = await self.session.execute(enrollment_count_query)
                    current_count = count_result.scalar() or 0
                    
                    if current_count > assignment.classroom.max_students:
                        conflicts["capacity_issues"].append({
                            "type": ConflictType.CAPACITY_EXCEEDED.value,
                            "teacher_name": assignment.teacher.full_name,
                            "subject_name": assignment.subject.name,
                            "classroom_name": assignment.classroom.name,
                            "current_enrollment": current_count,
                            "max_capacity": assignment.classroom.max_students,
                            "overage": current_count - assignment.classroom.max_students,
                            "message": f"Classroom over capacity by {current_count - assignment.classroom.max_students} students"
                        })
            
            return {
                "conflicts": conflicts,
                "summary": {
                    "total_conflicts": sum(len(conflicts[key]) for key in conflicts),
                    "duplicate_enrollments": len(conflicts["duplicate_enrollments"]),
                    "capacity_issues": len(conflicts["capacity_issues"]),
                    "academic_year_id": str(academic_year_id),
                    "grade_level": grade_level,
                    "student_id": str(student_id) if student_id else None
                },
                "recommendations": self._generate_conflict_recommendations(conflicts)
            }
            
        except Exception as e:
            logger.error(f"Error detecting enrollment conflicts: {str(e)}")
            raise
    
    async def get_student_enrollment_summary(
        self,
        student_id: uuid.UUID,
        academic_year_id: uuid.UUID
    ) -> Dict[str, Any]:
        """
        Get comprehensive enrollment summary for a student.
        
        Args:
            student_id: Student ID
            academic_year_id: Academic year
            
        Returns:
            Dict with student's complete enrollment information
        """
        logger.info(f"Getting enrollment summary for student {student_id}")
        
        try:
            # Get student info
            student = await self.session.get(Student, student_id)
            if not student:
                raise ValueError(f"Student {student_id} not found")
            
            # Get all subject enrollments
            enrollments_query = (
                select(StudentSubjectEnrollment)
                .options(
                    joinedload(StudentSubjectEnrollment.teacher_assignment).joinedload("subject"),
                    joinedload(StudentSubjectEnrollment.teacher_assignment).joinedload("teacher"),
                    joinedload(StudentSubjectEnrollment.teacher_assignment).joinedload("classroom")
                )
                .where(
                    and_(
                        StudentSubjectEnrollment.student_id == student_id,
                        StudentSubjectEnrollment.academic_year_id == academic_year_id
                    )
                )
                .order_by(StudentSubjectEnrollment.enrollment_date.desc())
            )
            
            enrollments_result = await self.session.execute(enrollments_query)
            enrollments = enrollments_result.scalars().all()
            
            # Categorize enrollments by tier and status
            enrollment_summary = {
                "active_enrollments": [],
                "inactive_enrollments": [],
                "core_subjects": [],
                "enrichment_subjects": [],
                "special_programs": []
            }
            
            for enrollment in enrollments:
                assignment = enrollment.teacher_assignment
                subject = assignment.subject
                teacher = assignment.teacher
                classroom = assignment.classroom
                
                enrollment_data = {
                    "id": str(enrollment.id),
                    "subject_name": subject.name,
                    "subject_code": subject.code,
                    "subject_type": subject.subject_type,
                    "teacher_name": teacher.full_name,
                    "classroom_name": classroom.name if classroom else "No Classroom",
                    "enrollment_type": enrollment.enrollment_type,
                    "enrollment_status": enrollment.enrollment_status,
                    "enrollment_date": enrollment.enrollment_date.isoformat() if enrollment.enrollment_date else None,
                    "current_grade": float(enrollment.current_grade) if enrollment.current_grade else None,
                    "grade_letter": enrollment.grade_letter,
                    "attendance_rate": enrollment.attendance_rate,
                    "is_auto_enrolled": enrollment.is_auto_enrolled,
                    "has_iep": enrollment.has_iep,
                    "has_504": enrollment.has_504
                }
                
                # Categorize by status
                if enrollment.enrollment_status == "ACTIVE":
                    enrollment_summary["active_enrollments"].append(enrollment_data)
                else:
                    enrollment_summary["inactive_enrollments"].append(enrollment_data)
                
                # Categorize by subject type
                if subject.subject_type == "CORE":
                    enrollment_summary["core_subjects"].append(enrollment_data)
                elif subject.subject_type == "ENRICHMENT":
                    enrollment_summary["enrichment_subjects"].append(enrollment_data)
                else:
                    enrollment_summary["special_programs"].append(enrollment_data)
            
            # Get potential conflicts
            conflicts = await self._check_enrollment_conflicts(student_id, None, academic_year_id)
            
            return {
                "student": {
                    "id": str(student.id),
                    "name": student.full_name,
                    "student_id": student.student_id,
                    "current_grade_level": student.current_grade_level
                },
                "academic_year_id": str(academic_year_id),
                "enrollment_summary": enrollment_summary,
                "statistics": {
                    "total_enrollments": len(enrollments),
                    "active_enrollments": len(enrollment_summary["active_enrollments"]),
                    "core_subjects": len(enrollment_summary["core_subjects"]),
                    "enrichment_subjects": len(enrollment_summary["enrichment_subjects"]),
                    "special_programs": len(enrollment_summary["special_programs"])
                },
                "conflicts": conflicts,
                "message": f"Enrollment summary for {student.full_name}"
            }
            
        except Exception as e:
            logger.error(f"Error getting student enrollment summary: {str(e)}")
            raise
    
    async def _check_enrollment_conflicts(
        self,
        student_id: uuid.UUID,
        teacher_subject_assignment_id: Optional[uuid.UUID],
        academic_year_id: uuid.UUID
    ) -> List[Dict[str, Any]]:
        """Check for enrollment conflicts for a specific student/assignment"""
        conflicts = []
        
        try:
            if teacher_subject_assignment_id:
                # Check for duplicate enrollment
                existing_query = (
                    select(StudentSubjectEnrollment)
                    .where(
                        and_(
                            StudentSubjectEnrollment.student_id == student_id,
                            StudentSubjectEnrollment.teacher_subject_assignment_id == teacher_subject_assignment_id,
                            StudentSubjectEnrollment.academic_year_id == academic_year_id,
                            StudentSubjectEnrollment.enrollment_status == "ACTIVE"
                        )
                    )
                )
                existing_result = await self.session.execute(existing_query)
                if existing_result.scalar_one_or_none():
                    conflicts.append({
                        "type": ConflictType.DUPLICATE_ENROLLMENT.value,
                        "message": "Student already enrolled in this subject-teacher combination"
                    })
            
            return conflicts
            
        except Exception as e:
            logger.error(f"Error checking enrollment conflicts: {str(e)}")
            return [{"type": "ERROR", "message": f"Error checking conflicts: {str(e)}"}]
    
    def _generate_conflict_recommendations(self, conflicts: Dict[str, List]) -> List[str]:
        """Generate recommendations based on detected conflicts"""
        recommendations = []
        
        if conflicts["duplicate_enrollments"]:
            recommendations.append("Remove duplicate enrollments to ensure data integrity")
        
        if conflicts["capacity_issues"]:
            recommendations.append("Consider adding new sections or redistributing students to resolve capacity issues")
        
        if conflicts["missing_core_subjects"]:
            recommendations.append("Ensure all students are enrolled in required CORE subjects")
        
        if not any(conflicts.values()):
            recommendations.append("No conflicts detected - enrollment system is operating normally")
        
        return recommendations