# backend/app/models/__init__.py - Updated imports

from .base import Base  # noqa
from .user import User  # noqa
from .school import School  # noqa
from .user_role import UserRole
from .user_role_preference import UserRolePreference
from .academic_year import AcademicYear
from .subject import Subject
from .room import Room
from .classroom import Classroom
from .classroom_teacher_assignment import ClassroomTeacherAssignment
from .teacher_role_template import TeacherRoleTemplate
from .student import Student
from .student_academic_record import StudentAcademicRecord
from .special_needs_tag_library import SpecialNeedsTagLibrary
from .student_special_need import StudentSpecialNeed
from .parent import Parent
from .parent_student_relationship import ParentStudentRelationship
from .enrollment import Enrollment

