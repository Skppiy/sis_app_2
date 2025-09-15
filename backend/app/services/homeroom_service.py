# backend/app/services/homeroom_service.py

"""
Homeroom Intelligence System Service Layer

This service handles the core business logic for the homeroom intelligence system,
including auto-assignment of CORE subjects to elementary teachers and management
of student enrollments in homeroom subjects.

Key Business Rules:
1. Elementary grades (K-5): Homeroom model with auto CORE subject assignment
2. CORE subjects: Mathematics, English Language Arts, Science, Social Studies, Reading  
3. When creating homeroom: auto-assign ALL active CORE subjects to teacher
4. When creating new CORE subject: auto-assign to ALL existing elementary homeroom teachers
5. Track all assignments with audit trail in subject_assignment_events
"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func, text
from sqlalchemy.orm import joinedload, selectinload
from typing import List, Optional, Dict, Tuple
from datetime import datetime, date
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

logger = logging.getLogger(__name__)

# Elementary grade levels that use homeroom model
ELEMENTARY_GRADES = ['K', '1', '2', '3', '4', '5']

# Core subjects that should be auto-assigned to homeroom teachers
CORE_SUBJECTS = [
    'Mathematics', 'English Language Arts', 'Science', 
    'Social Studies', 'Reading'
]

class HomeroomService:
    """Service class for homeroom intelligence operations"""
    
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def create_homeroom_with_auto_assignment(
        self, 
        teacher_id: uuid.UUID,
        grade_level: str,
        academic_year_id: uuid.UUID,
        created_by_user_id: uuid.UUID,
        room_id: Optional[uuid.UUID] = None
    ) -> Dict[str, any]:
        """
        Create a homeroom setup with automatic CORE subject assignments.
        
        This creates:
        1. Teacher subject assignments for all active CORE subjects
        2. Audit log entries for each assignment
        3. Classrooms for each subject (if needed)
        
        Args:
            teacher_id: ID of the teacher
            grade_level: Grade level (must be K-5 for homeroom model)
            academic_year_id: Academic year ID
            created_by_user_id: ID of user creating the homeroom
            room_id: Optional room ID for physical classroom
            
        Returns:
            Dict with created assignments, classrooms, and statistics
        """
        logger.info(f"Creating homeroom with auto-assignment for teacher {teacher_id}, grade {grade_level}")
        
        # Validate grade level
        if grade_level not in ELEMENTARY_GRADES:
            raise ValueError(f"Grade level {grade_level} is not eligible for homeroom model")
        
        # Validate teacher exists and is active
        teacher = await self.session.get(User, teacher_id)
        if not teacher or not teacher.is_active:
            raise ValueError(f"Teacher {teacher_id} not found or inactive")
        
        # Validate academic year exists and is active
        academic_year = await self.session.get(AcademicYear, academic_year_id)
        if not academic_year:
            raise ValueError(f"Academic year {academic_year_id} not found")
        
        try:
            # Get all active CORE subjects applicable to elementary
            core_subjects_query = (
                select(Subject)
                .where(
                    and_(
                        Subject.subject_type == "CORE",
                        Subject.applies_to_elementary == True,
                        # Could add more filters here for active subjects
                    )
                )
            )
            result = await self.session.execute(core_subjects_query)
            core_subjects = result.scalars().all()
            
            if not core_subjects:
                logger.warning("No CORE subjects found for auto-assignment")
                return {
                    "assignments_created": [],
                    "classrooms_created": [],
                    "message": "No CORE subjects available for assignment"
                }
            
            assignments_created = []
            classrooms_created = []
            events_created = []
            
            for subject in core_subjects:
                # Check if teacher already has this subject assignment
                existing_assignment = await self.session.execute(
                    select(TeacherSubjectAssignment)
                    .where(
                        and_(
                            TeacherSubjectAssignment.teacher_id == teacher_id,
                            TeacherSubjectAssignment.subject_id == subject.id,
                            TeacherSubjectAssignment.academic_year_id == academic_year_id,
                            TeacherSubjectAssignment.is_active == True
                        )
                    )
                )
                
                if existing_assignment.scalar_one_or_none():
                    logger.info(f"Teacher {teacher_id} already has assignment for {subject.name}")
                    continue
                
                # Create classroom for this subject first (needed for TeacherSubjectAssignment)
                classroom = Classroom(
                    name=f"{teacher.first_name} {teacher.last_name}'s Grade {grade_level} - {subject.name}",
                    subject_id=subject.id,
                    academic_year_id=academic_year_id,
                    grade_level=grade_level,
                    classroom_type="HOMEROOM",
                    max_students=25,  # Default capacity
                    room_id=room_id
                )
                
                self.session.add(classroom)
                await self.session.flush()  # Get classroom ID
                classrooms_created.append(classroom)
                
                # Create teacher assignment to classroom
                teacher_assignment = ClassroomTeacherAssignment(
                    classroom_id=classroom.id,
                    teacher_user_id=teacher_id,
                    role_name="Homeroom Teacher",
                    can_view_grades=True,
                    can_modify_grades=True,
                    can_take_attendance=True,
                    can_view_parent_contact=True,
                    can_create_assignments=True,
                    start_date=academic_year.start_date,
                    is_active=True
                )
                
                self.session.add(teacher_assignment)
                
                # Create teacher subject assignment linked to the classroom
                assignment = TeacherSubjectAssignment(
                    teacher_id=teacher_id,
                    subject_id=subject.id,
                    classroom_id=classroom.id,  # Link to classroom for grade level tracking
                    academic_year_id=academic_year_id,
                    assignment_type="AUTO_HOMEROOM",
                    is_active=True,
                    assigned_date=datetime.utcnow(),
                    assigned_by=created_by_user_id
                )
                
                self.session.add(assignment)
                await self.session.flush()  # Get assignment ID
                assignments_created.append(assignment)
                
                # Create audit log entry
                event = await SubjectAssignmentEvent.log_assignment_created(
                    self.session,
                    assignment,
                    performed_by_user_id=created_by_user_id,
                    description=f"Auto-assigned {subject.name} to Grade {grade_level} homeroom teacher {teacher.full_name}"
                )
                events_created.append(event)
            
            await self.session.commit()
            
            logger.info(f"Created homeroom with {len(assignments_created)} subject assignments and {len(classrooms_created)} classrooms")
            
            return {
                "assignments_created": [
                    {
                        "id": str(a.id),
                        "subject_name": next((s.name for s in core_subjects if s.id == a.subject_id), "Unknown Subject"),
                        "subject_code": next((s.code for s in core_subjects if s.id == a.subject_id), "UNK"),
                        "assignment_type": a.assignment_type,
                        "grade_level": grade_level,
                        "classroom_id": str(a.classroom_id) if a.classroom_id else None
                    } for a in assignments_created
                ],
                "classrooms_created": [
                    {
                        "id": str(c.id),
                        "name": c.name,
                        "subject_name": next((s.name for s in core_subjects if s.id == c.subject_id), "Unknown Subject"),
                        "grade_level": c.grade_level
                    } for c in classrooms_created
                ],
                "teacher": {
                    "id": str(teacher.id),
                    "name": teacher.full_name
                },
                "grade_level": grade_level,
                "academic_year_id": str(academic_year_id),
                "total_assignments": len(assignments_created),
                "message": f"Successfully created homeroom with {len(assignments_created)} CORE subject assignments"
            }
            
        except Exception as e:
            await self.session.rollback()
            logger.error(f"Error creating homeroom with auto-assignment: {str(e)}")
            raise
    
    async def auto_assign_new_core_subject(
        self,
        subject_id: uuid.UUID,
        academic_year_id: uuid.UUID,
        created_by_user_id: uuid.UUID
    ) -> Dict[str, any]:
        """
        Auto-assign a new CORE subject to all existing elementary homeroom teachers.
        
        This is called when a new CORE subject is created and needs to be propagated
        to all existing elementary teachers.
        
        Args:
            subject_id: ID of the new CORE subject
            academic_year_id: Academic year ID
            created_by_user_id: ID of user who created the subject
            
        Returns:
            Dict with assignment results and statistics
        """
        logger.info(f"Auto-assigning new CORE subject {subject_id} to existing homeroom teachers")
        
        # Validate subject
        subject = await self.session.get(Subject, subject_id)
        if not subject:
            raise ValueError(f"Subject {subject_id} not found")
        
        if subject.subject_type != "CORE" or not subject.applies_to_elementary:
            raise ValueError(f"Subject {subject.name} is not a CORE elementary subject")
        
        # Get all elementary homeroom teachers through TeacherSubjectAssignment -> Classroom relationship
        homeroom_teachers_query = (
            select(TeacherSubjectAssignment.teacher_id, Classroom.grade_level)
            .join(Classroom, TeacherSubjectAssignment.classroom_id == Classroom.id)
            .where(
                and_(
                    TeacherSubjectAssignment.academic_year_id == academic_year_id,
                    TeacherSubjectAssignment.assignment_type == "AUTO_HOMEROOM",
                    Classroom.grade_level.in_(ELEMENTARY_GRADES),
                    TeacherSubjectAssignment.is_active == True
                )
            )
            .distinct()
        )
        
        result = await self.session.execute(homeroom_teachers_query)
        homeroom_teachers = result.all()
        
        if not homeroom_teachers:
            return {
                "assignments_created": [],
                "message": "No elementary homeroom teachers found for auto-assignment"
            }
        
        assignments_created = []
        events_created = []
        
        try:
            for teacher_id, grade_level in homeroom_teachers:
                # Check if assignment already exists
                existing_assignment = await self.session.execute(
                    select(TeacherSubjectAssignment)
                    .where(
                        and_(
                            TeacherSubjectAssignment.teacher_id == teacher_id,
                            TeacherSubjectAssignment.subject_id == subject_id,
                            TeacherSubjectAssignment.academic_year_id == academic_year_id,
                            TeacherSubjectAssignment.is_active == True
                        )
                    )
                )
                
                if existing_assignment.scalar_one_or_none():
                    continue
                
                # Get teacher info
                teacher = await self.session.get(User, teacher_id)
                if not teacher or not teacher.is_active:
                    continue
                
                # Create assignment
                assignment = TeacherSubjectAssignment(
                    teacher_id=teacher_id,
                    subject_id=subject_id,
                    academic_year_id=academic_year_id,
                    assignment_type="AUTO_NEW_CORE",
                    is_active=True,
                    assigned_date=datetime.utcnow(),
                    assigned_by=created_by_user_id
                )
                
                self.session.add(assignment)
                await self.session.flush()
                assignments_created.append((assignment, teacher))
                
                # Create audit log
                event = await SubjectAssignmentEvent.log_assignment_created(
                    self.session,
                    assignment,
                    performed_by_user_id=created_by_user_id,
                    description=f"Auto-assigned new CORE subject {subject.name} to existing Grade {grade_level} homeroom teacher {teacher.full_name}"
                )
                events_created.append(event)
            
            await self.session.commit()
            
            logger.info(f"Auto-assigned {subject.name} to {len(assignments_created)} homeroom teachers")
            
            return {
                "assignments_created": [
                    {
                        "id": str(assignment.id),
                        "teacher_id": str(assignment.teacher_id),
                        "teacher_name": teacher.full_name,
                        "grade_level": grade_level,
                        "subject_name": subject.name
                    } for assignment, teacher in assignments_created
                ],
                "subject": {
                    "id": str(subject.id),
                    "name": subject.name,
                    "code": subject.code
                },
                "total_assignments": len(assignments_created),
                "message": f"Successfully auto-assigned {subject.name} to {len(assignments_created)} homeroom teachers"
            }
            
        except Exception as e:
            await self.session.rollback()
            logger.error(f"Error auto-assigning new CORE subject: {str(e)}")
            raise
    
    async def get_teacher_assigned_subjects(
        self,
        teacher_id: uuid.UUID,
        academic_year_id: uuid.UUID,
        grade_level: Optional[str] = None
    ) -> Dict[str, any]:
        """
        Get all subjects assigned to a teacher for a specific academic year.
        
        Args:
            teacher_id: ID of the teacher
            academic_year_id: Academic year ID
            grade_level: Optional grade level filter
            
        Returns:
            Dict with teacher info and subject assignments
        """
        # Validate teacher
        teacher = await self.session.get(User, teacher_id)
        if not teacher:
            raise ValueError(f"Teacher {teacher_id} not found")
        
        # Build query for assignments with subject loaded
        query = (
            select(TeacherSubjectAssignment)
            .options(joinedload(TeacherSubjectAssignment.subject))
            .where(
                and_(
                    TeacherSubjectAssignment.teacher_id == teacher_id,
                    TeacherSubjectAssignment.academic_year_id == academic_year_id,
                    TeacherSubjectAssignment.is_active == True
                )
            )
        )
        
        # Note: Grade level filtering removed since it's not in the model
        # Grade level should be determined from associated classroom
        
        result = await self.session.execute(query)
        assignments = result.scalars().all()
        
        # Group by assignment type with grade level from classroom relationships
        grouped_assignments = {}
        
        for assignment in assignments:
            assignment_grade = "unassigned"
            classroom_id = None
            
            if assignment.classroom_id:
                # Get grade level from associated classroom
                classroom_result = await self.session.execute(
                    select(Classroom.grade_level).where(Classroom.id == assignment.classroom_id)
                )
                assignment_grade = classroom_result.scalar_one_or_none() or "unassigned"
                classroom_id = str(assignment.classroom_id)
            
            # Filter by grade level if requested and this assignment doesn't match
            if grade_level and assignment_grade != grade_level:
                continue
                
            if assignment_grade not in grouped_assignments:
                grouped_assignments[assignment_grade] = {
                    "homeroom": [],
                    "specialist": []
                }
            
            assignment_data = {
                "id": str(assignment.id),
                "subject": {
                    "id": str(assignment.subject.id),
                    "name": assignment.subject.name,
                    "code": assignment.subject.code,
                    "subject_type": assignment.subject.subject_type
                },
                "assignment_type": assignment.assignment_type,
                "assigned_date": assignment.assigned_date.isoformat() if assignment.assigned_date else None,
                "grade_level": assignment_grade,
                "classroom_id": classroom_id
            }
            
            if assignment.assignment_type in ["AUTO_HOMEROOM", "HOMEROOM"]:
                grouped_assignments[assignment_grade]["homeroom"].append(assignment_data)
            else:
                grouped_assignments[assignment_grade]["specialist"].append(assignment_data)
        
        return {
            "teacher": {
                "id": str(teacher.id),
                "name": teacher.full_name,
                "email": teacher.email
            },
            "academic_year_id": str(academic_year_id),
            "assignments_by_grade": grouped_assignments,
            "total_assignments": len(assignments),
            "total_grades": len(grouped_assignments)
        }
    
    async def auto_enroll_students_in_core_subjects(
        self,
        teacher_id: uuid.UUID,
        grade_level: str,
        academic_year_id: uuid.UUID,
        enrolled_by_user_id: uuid.UUID
    ) -> Dict[str, any]:
        """
        Auto-enroll all students in a homeroom teacher's CORE subjects.
        
        This finds students enrolled in the teacher's homeroom (via classroom enrollment)
        and creates subject enrollments for each of the teacher's assigned CORE subjects.
        
        Args:
            teacher_id: ID of the homeroom teacher
            grade_level: Grade level
            academic_year_id: Academic year ID
            enrolled_by_user_id: ID of user initiating enrollment
            
        Returns:
            Dict with enrollment results and statistics
        """
        logger.info(f"Auto-enrolling students in CORE subjects for teacher {teacher_id}, grade {grade_level}")
        
        # Get teacher's CORE subject assignments
        assignments = await self.get_teacher_assigned_subjects(
            teacher_id, academic_year_id, grade_level
        )
        
        homeroom_subjects = []
        if grade_level in assignments["assignments_by_grade"]:
            homeroom_subjects = assignments["assignments_by_grade"][grade_level]["homeroom"]
        
        if not homeroom_subjects:
            return {
                "enrollments_created": [],
                "message": "No homeroom CORE subjects found for teacher"
            }
        
        # Get students enrolled in teacher's classrooms for this grade
        students_query = (
            select(Student.id)
            .join(Enrollment)
            .join(Classroom)
            .join(ClassroomTeacherAssignment)
            .where(
                and_(
                    ClassroomTeacherAssignment.teacher_user_id == teacher_id,
                    Classroom.grade_level == grade_level,
                    Classroom.academic_year_id == academic_year_id,
                    Enrollment.is_active == True,
                    ClassroomTeacherAssignment.is_active == True
                )
            )
            .distinct()
        )
        
        result = await self.session.execute(students_query)
        student_ids = [row[0] for row in result.fetchall()]
        
        if not student_ids:
            return {
                "enrollments_created": [],
                "message": "No students found in teacher's classrooms"
            }
        
        enrollments_created = []
        
        try:
            for subject_assignment in homeroom_subjects:
                # Get the TeacherSubjectAssignment record
                assignment_query = (
                    select(TeacherSubjectAssignment)
                    .where(TeacherSubjectAssignment.id == uuid.UUID(subject_assignment["id"]))
                )
                assignment_result = await self.session.execute(assignment_query)
                assignment = assignment_result.scalar_one_or_none()
                
                if not assignment:
                    continue
                
                for student_id in student_ids:
                    # Check if enrollment already exists
                    existing_enrollment = await self.session.execute(
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
                    
                    if existing_enrollment.scalar_one_or_none():
                        continue
                    
                    # Create enrollment
                    enrollment = StudentSubjectEnrollment(
                        student_id=student_id,
                        teacher_subject_assignment_id=assignment.id,
                        academic_year_id=academic_year_id,
                        enrollment_type="STANDARD",
                        enrollment_status="ACTIVE",
                        effective_start_date=datetime.utcnow(),
                        is_auto_enrolled=True,
                        enrollment_reason=f"Auto-enrolled in homeroom CORE subject {subject_assignment['subject']['name']}",
                        enrolled_by_user_id=enrolled_by_user_id
                    )
                    
                    self.session.add(enrollment)
                    enrollments_created.append((enrollment, subject_assignment["subject"]["name"]))
            
            await self.session.commit()
            
            logger.info(f"Created {len(enrollments_created)} subject enrollments")
            
            return {
                "enrollments_created": [
                    {
                        "id": str(enrollment.id),
                        "student_id": str(enrollment.student_id),
                        "subject_name": subject_name,
                        "enrollment_type": enrollment.enrollment_type,
                        "enrollment_status": enrollment.enrollment_status
                    } for enrollment, subject_name in enrollments_created
                ],
                "teacher_id": str(teacher_id),
                "grade_level": grade_level,
                "total_enrollments": len(enrollments_created),
                "total_students": len(student_ids),
                "total_subjects": len(homeroom_subjects),
                "message": f"Successfully created {len(enrollments_created)} subject enrollments for {len(student_ids)} students"
            }
            
        except Exception as e:
            await self.session.rollback()
            logger.error(f"Error auto-enrolling students in CORE subjects: {str(e)}")
            raise
    
    async def preview_homeroom_assignment(
        self,
        grade_level: str,
        teacher_id: uuid.UUID,
        academic_year_id: uuid.UUID
    ) -> Dict[str, any]:
        """
        Preview what would be created for a homeroom assignment without actually creating it.
        
        Args:
            grade_level: Grade level for the homeroom
            teacher_id: ID of the teacher
            academic_year_id: Academic year ID
            
        Returns:
            Dict with preview information
        """
        # Validate inputs
        if grade_level not in ELEMENTARY_GRADES:
            raise ValueError(f"Grade level {grade_level} is not eligible for homeroom model")
        
        teacher = await self.session.get(User, teacher_id)
        if not teacher:
            raise ValueError(f"Teacher {teacher_id} not found")
        
        # Get CORE subjects that would be assigned
        core_subjects_query = (
            select(Subject)
            .where(
                and_(
                    Subject.subject_type == "CORE",
                    Subject.applies_to_elementary == True
                )
            )
            .order_by(Subject.name)
        )
        result = await self.session.execute(core_subjects_query)
        core_subjects = result.scalars().all()
        
        # Check which assignments already exist for this grade level
        existing_assignments = []
        if core_subjects:
            existing_query = (
                select(TeacherSubjectAssignment)
                .options(joinedload(TeacherSubjectAssignment.subject))
                .join(Classroom, TeacherSubjectAssignment.classroom_id == Classroom.id)
                .where(
                    and_(
                        TeacherSubjectAssignment.teacher_id == teacher_id,
                        TeacherSubjectAssignment.subject_id.in_([s.id for s in core_subjects]),
                        TeacherSubjectAssignment.academic_year_id == academic_year_id,
                        Classroom.grade_level == grade_level,  # Filter by grade level through classroom
                        TeacherSubjectAssignment.is_active == True
                    )
                )
            )
            result = await self.session.execute(existing_query)
            existing_assignments = result.scalars().all()
        
        existing_subject_ids = {a.subject_id for a in existing_assignments}
        new_subjects = [s for s in core_subjects if s.id not in existing_subject_ids]
        
        return {
            "teacher": {
                "id": str(teacher.id),
                "name": teacher.full_name,
                "email": teacher.email
            },
            "grade_level": grade_level,
            "academic_year_id": str(academic_year_id),
            "subjects_to_assign": [
                {
                    "id": str(s.id),
                    "name": s.name,
                    "code": s.code,
                    "subject_type": s.subject_type
                } for s in new_subjects
            ],
            "existing_assignments": [
                {
                    "id": str(a.id),
                    "subject_name": a.subject.name,
                    "subject_code": a.subject.code,
                    "assigned_date": a.assigned_date.isoformat() if a.assigned_date else None
                } for a in existing_assignments
            ],
            "total_new_assignments": len(new_subjects),
            "total_existing_assignments": len(existing_assignments),
            "will_create_classrooms": len(new_subjects),  # Assume one classroom per subject
            "ready_for_creation": len(new_subjects) > 0
        }