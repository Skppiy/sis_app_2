# backend/app/models/student_subject_enrollment.py

from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Boolean, Date, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime, date
import uuid
from .base import Base

class StudentSubjectEnrollment(Base):
    """
    Simple working enrollment model that matches our current database schema.
    Focus on core functionality to get enrollment system working.
    """
    __tablename__ = "student_subject_enrollments"

    # Primary key
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Foreign Keys - Core relationships
    student_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("students.id"), nullable=False)
    subject_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("subjects.id"), nullable=False)
    classroom_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("classrooms.id"), nullable=False)
    teacher_subject_assignment_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("teacher_subject_assignments.id"), nullable=True)
    academic_year_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("academic_years.id"), nullable=False)

    # Enrollment tracking
    enrollment_type: Mapped[str] = mapped_column(String(20), nullable=False)  # AUTO_CORE, MANUAL, SPECIALIST
    enrollment_status: Mapped[str] = mapped_column(String(20), nullable=False, default="ACTIVE")  # ACTIVE, DROPPED, COMPLETED

    # Date tracking
    enrolled_date: Mapped[date] = mapped_column(Date, nullable=False)
    withdrawn_date: Mapped[date] = mapped_column(Date, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    # New columns from our migration
    enrolled_by_user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    is_homeroom_core: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    # Relationships
    student = relationship("Student", back_populates="subject_enrollments")
    subject = relationship("Subject")
    classroom = relationship("Classroom")
    teacher_assignment = relationship("TeacherSubjectAssignment", back_populates="student_enrollments")
    academic_year = relationship("AcademicYear")
    enrolled_by = relationship("User", foreign_keys=[enrolled_by_user_id])

    def __repr__(self):
        return f"<StudentSubjectEnrollment {self.student.first_name if self.student else 'Unknown'} in {self.subject.name if self.subject else 'Unknown'}>"

    @classmethod
    async def get_student_enrollments(cls, session, student_id: uuid.UUID, academic_year_id: uuid.UUID = None):
        """Get all enrollments for a student in a specific academic year"""
        from sqlalchemy import select, and_
        from sqlalchemy.orm import joinedload

        query = (
            select(cls)
            .options(
                joinedload(cls.subject),
                joinedload(cls.classroom),
                joinedload(cls.teacher_assignment)
            )
            .where(
                and_(
                    cls.student_id == student_id,
                    cls.enrollment_status == "ACTIVE"
                )
            )
        )

        if academic_year_id:
            query = query.where(cls.academic_year_id == academic_year_id)

        result = await session.execute(query)
        return result.scalars().all()