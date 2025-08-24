# backend/scripts/seed_phase_a_data.py

"""
Phase A Data Seeding Script
Seeds the database with realistic test data for Phase A development and testing
"""

import asyncio
import uuid
from datetime import date, datetime, timezone
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import select

# Import all models
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.models.school import School
from app.models.user import User
from app.models.user_role import UserRole
from app.models.academic_year import AcademicYear
from app.models.subject import Subject
from app.models.room import Room
from app.models.classroom import Classroom
from app.models.classroom_teacher_assignment import ClassroomTeacherAssignment
from app.models.teacher_role_template import TeacherRoleTemplate
from app.models.student import Student
from app.models.student_academic_record import StudentAcademicRecord
from app.models.special_needs_tag_library import SpecialNeedsTagLibrary
from app.models.student_special_need import StudentSpecialNeed
from app.models.parent import Parent
from app.models.parent_student_relationship import ParentStudentRelationship
from app.models.enrollment import Enrollment
from app.security import get_password_hash

DATABASE_URL = "postgresql+asyncpg://postgres:postgres@localhost:5433/sis_db"

async def seed_data():
    engine = create_async_engine(DATABASE_URL, future=True)
    SessionLocal = async_sessionmaker(bind=engine, expire_on_commit=False, class_=AsyncSession)
    
    async with SessionLocal() as session:
        print("🌱 Starting Phase A data seeding...")
        
        # 1. Create test school
        print("📚 Creating Springfield Elementary...")
        school = School(
            id=uuid.uuid4(),
            name="Springfield Elementary",
            address="123 Main Street",
            city="Springfield",
            state="IL",
            zip_code="62701",
            tz="America/Chicago"
        )
        session.add(school)
        await session.flush()
        
        # 2. Create academic year
        print("📅 Creating 2024-2025 academic year...")
        academic_year = AcademicYear(
            id=uuid.uuid4(),
            name="2024-2025",
            short_name="24-25",
            start_date=date(2024, 8, 15),
            end_date=date(2025, 6, 15),
            is_active=True
        )
        session.add(academic_year)
        await session.flush()
        
        # 3. Create admin user
        print("👥 Creating admin user...")
        admin_user = User(
            id=uuid.uuid4(),
            email="admin@springfield.edu",
            hashed_password=get_password_hash("admin123"),
            first_name="Jane",
            last_name="Smith",
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc)
        )
        session.add(admin_user)
        await session.flush()
        
        admin_role = UserRole(
            user_id=admin_user.id,
            role="admin_principal",
            school_id=school.id,
            is_active=True
        )
        session.add(admin_role)
        
        # 4. Create teachers
        print("👨‍🏫 Creating teachers...")
        teachers_data = [
            {"first_name": "Emily", "last_name": "Johnson", "email": "e.johnson@springfield.edu", "grades": ["K"]},
            {"first_name": "Michael", "last_name": "Brown", "email": "m.brown@springfield.edu", "grades": ["1"]},
            {"first_name": "Sarah", "last_name": "Davis", "email": "s.davis@springfield.edu", "grades": ["2"]},
            {"first_name": "Robert", "last_name": "Wilson", "email": "r.wilson@springfield.edu", "grades": ["3"]},
            {"first_name": "Lisa", "last_name": "Anderson", "email": "l.anderson@springfield.edu", "grades": ["4"]},
            {"first_name": "David", "last_name": "Martinez", "email": "d.martinez@springfield.edu", "grades": ["5"]},
            {"first_name": "Jennifer", "last_name": "Taylor", "email": "j.taylor@springfield.edu", "grades": ["6"]},
            {"first_name": "James", "last_name": "Thomas", "email": "j.thomas@springfield.edu", "grades": ["7", "8"]},
            # Specialists
            {"first_name": "Maria", "last_name": "Garcia", "email": "m.garcia@springfield.edu", "role": "specialist", "subject": "Art"},
            {"first_name": "Kevin", "last_name": "Lee", "email": "k.lee@springfield.edu", "role": "specialist", "subject": "PE"},
            {"first_name": "Susan", "last_name": "White", "email": "s.white@springfield.edu", "role": "specialist", "subject": "Music"},
            {"first_name": "Nancy", "last_name": "Miller", "email": "n.miller@springfield.edu", "role": "specialist", "subject": "Speech"},
        ]
        
        teachers = []
        for teacher_data in teachers_data:
            teacher = User(
                id=uuid.uuid4(),
                email=teacher_data["email"],
                hashed_password=get_password_hash("teacher123"),
                first_name=teacher_data["first_name"],
                last_name=teacher_data["last_name"],
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc)
            )
            session.add(teacher)
            await session.flush()
            
            role_name = teacher_data.get("role", "teacher")
            teacher_role = UserRole(
                user_id=teacher.id,
                role=role_name,
                school_id=school.id,
                is_active=True
            )
            session.add(teacher_role)
            teachers.append((teacher, teacher_data))
        
        # 5. Get subjects (should be seeded from migration)
        print("📖 Getting subjects...")
        result = await session.execute(select(Subject))
        subjects = {s.code: s for s in result.scalars().all()}
        
        # 6. Create rooms
        print("🏫 Creating rooms...")
        rooms_data = [
            {"name": "Room 101", "code": "101", "type": "CLASSROOM", "capacity": 25},
            {"name": "Room 102", "code": "102", "type": "CLASSROOM", "capacity": 25},
            {"name": "Room 103", "code": "103", "type": "CLASSROOM", "capacity": 25},
            {"name": "Room 201", "code": "201", "type": "CLASSROOM", "capacity": 30},
            {"name": "Room 202", "code": "202", "type": "CLASSROOM", "capacity": 30},
            {"name": "Art Room", "code": "ART", "type": "SPECIAL", "capacity": 20, "has_sink": True},
            {"name": "Gymnasium", "code": "GYM", "type": "SPECIAL", "capacity": 100, "is_bookable": True},
            {"name": "Music Room", "code": "MUS", "type": "SPECIAL", "capacity": 30},
            {"name": "Library", "code": "LIB", "type": "SPECIAL", "capacity": 50, "has_computers": True},
        ]
        
        rooms = []
        for room_data in rooms_data:
            room = Room(
                id=uuid.uuid4(),
                name=room_data["name"],
                room_code=room_data["code"],
                room_type=room_data["type"],
                capacity=room_data["capacity"],
                has_projector=room_data.get("has_projector", False),
                has_computers=room_data.get("has_computers", False),
                has_sink=room_data.get("has_sink", False),
                is_bookable=room_data.get("is_bookable", True),
                school_id=school.id
            )
            session.add(room)
            rooms.append(room)
        
        await session.flush()
        
        # 7. Create classrooms
        print("🎓 Creating classrooms...")
        classrooms = []
        
        # Core classrooms for each grade
        for teacher, teacher_data in teachers:
            if teacher_data.get("role") != "specialist":
                grades = teacher_data.get("grades", [])
                for grade in grades:
                    # Create homeroom classroom with all core subjects
                    for subject_code in ["MATH", "ELA", "SCI", "SS"]:
                        if subject_code in subjects:
                            classroom = Classroom(
                                id=uuid.uuid4(),
                                name=f"Grade {grade} {subjects[subject_code].name} - {teacher.last_name}",
                                subject_id=subjects[subject_code].id,
                                grade_level=grade,
                                classroom_type="CORE",
                                academic_year_id=academic_year.id,
                                max_students=25
                            )
                            session.add(classroom)
                            await session.flush()
                            
                            # Assign primary teacher
                            assignment = ClassroomTeacherAssignment(
                                id=uuid.uuid4(),
                                classroom_id=classroom.id,
                                teacher_user_id=teacher.id,
                                role_name="Primary Teacher",
                                can_view_grades=True,
                                can_modify_grades=True,
                                can_take_attendance=True,
                                can_view_parent_contact=True,
                                can_create_assignments=True,
                                start_date=academic_year.start_date
                            )
                            session.add(assignment)
                            classrooms.append(classroom)
        
        # Specialist classrooms
        specialist_subjects = {"Art": "ART", "PE": "PE", "Music": "MUS"}
        for teacher, teacher_data in teachers:
            if teacher_data.get("role") == "specialist":
                subject_name = teacher_data.get("subject")
                if subject_name in specialist_subjects:
                    subject_code = specialist_subjects[subject_name]
                    if subject_code in subjects:
                        # Create multi-grade specialist classroom
                        classroom = Classroom(
                            id=uuid.uuid4(),
                            name=f"{subject_name} - {teacher.last_name}",
                            subject_id=subjects[subject_code].id,
                            grade_level="MULTI",
                            classroom_type="ENRICHMENT",
                            academic_year_id=academic_year.id,
                            max_students=30
                        )
                        session.add(classroom)
                        await session.flush()
                        
                        # Assign specialist teacher
                        assignment = ClassroomTeacherAssignment(
                            id=uuid.uuid4(),
                            classroom_id=classroom.id,
                            teacher_user_id=teacher.id,
                            role_name="Primary Teacher",
                            can_view_grades=True,
                            can_modify_grades=True,
                            can_take_attendance=True,
                            can_view_parent_contact=False,
                            can_create_assignments=True,
                            start_date=academic_year.start_date
                        )
                        session.add(assignment)
                        classrooms.append(classroom)
        
        # 8. Create students
        print("👨‍🎓 Creating students...")
        students_data = [
            # Kindergarten
            {"first_name": "Emma", "last_name": "Thompson", "grade": "K", "dob": "2019-03-15"},
            {"first_name": "Liam", "last_name": "Roberts", "grade": "K", "dob": "2019-07-22"},
            {"first_name": "Olivia", "last_name": "Clark", "grade": "K", "dob": "2019-05-10"},
            # 1st Grade
            {"first_name": "Noah", "last_name": "Lewis", "grade": "1", "dob": "2018-09-12"},
            {"first_name": "Ava", "last_name": "Walker", "grade": "1", "dob": "2018-11-05"},
            {"first_name": "Sophia", "last_name": "Hall", "grade": "1", "dob": "2018-02-28"},
            # 2nd Grade
            {"first_name": "Mason", "last_name": "Allen", "grade": "2", "dob": "2017-12-18"},
            {"first_name": "Isabella", "last_name": "Young", "grade": "2", "dob": "2017-04-20"},
            {"first_name": "William", "last_name": "King", "grade": "2", "dob": "2017-08-14"},
            # 3rd Grade
            {"first_name": "James", "last_name": "Wright", "grade": "3", "dob": "2016-06-30"},
            {"first_name": "Charlotte", "last_name": "Lopez", "grade": "3", "dob": "2016-10-25"},
            {"first_name": "Benjamin", "last_name": "Hill", "grade": "3", "dob": "2016-01-08"},
            # 4th Grade
            {"first_name": "Elijah", "last_name": "Scott", "grade": "4", "dob": "2015-03-17"},
            {"first_name": "Amelia", "last_name": "Green", "grade": "4", "dob": "2015-09-03", "special_needs": ["SPEECH"]},
            {"first_name": "Lucas", "last_name": "Adams", "grade": "4", "dob": "2015-12-11"},
            # 5th Grade
            {"first_name": "Harper", "last_name": "Baker", "grade": "5", "dob": "2014-05-22"},
            {"first_name": "Alexander", "last_name": "Gonzalez", "grade": "5", "dob": "2014-11-15"},
            {"first_name": "Evelyn", "last_name": "Nelson", "grade": "5", "dob": "2014-07-08", "special_needs": ["READ_SUPP"]},
        ]
        
        students = []
        for student_data in students_data:
            student = Student(
                id=uuid.uuid4(),
                first_name=student_data["first_name"],
                last_name=student_data["last_name"],
                email=f"{student_data['first_name'].lower()}.{student_data['last_name'].lower()}@student.springfield.edu",
                date_of_birth=datetime.strptime(student_data["dob"], "%Y-%m-%d").date(),
                student_id=f"SPR{len(students) + 1001}",
                entry_date=academic_year.start_date,
                entry_grade_level=student_data["grade"]
            )
            session.add(student)
            await session.flush()
            
            # Create academic record
            academic_record = StudentAcademicRecord(
                id=uuid.uuid4(),
                student_id=student.id,
                academic_year_id=academic_year.id,
                school_id=school.id,
                grade_level=student_data["grade"],
                program_type="GENERAL",
                promotion_status="enrolled",
                enrollment_date=academic_year.start_date
            )
            session.add(academic_record)
            
            # Assign special needs if specified
            if "special_needs" in student_data:
                special_needs_result = await session.execute(
                    select(SpecialNeedsTagLibrary).where(
                        SpecialNeedsTagLibrary.tag_code.in_(student_data["special_needs"])
                    )
                )
                special_needs_tags = special_needs_result.scalars().all()
                
                for tag in special_needs_tags:
                    special_need = StudentSpecialNeed(
                        id=uuid.uuid4(),
                        student_id=student.id,
                        tag_library_id=tag.id,
                        severity_level="MODERATE",
                        start_date=academic_year.start_date,
                        assigned_by=admin_user.id
                    )
                    session.add(special_need)
            
            students.append((student, student_data))
        
        await session.flush()
        
        # 9. Enroll students in classrooms
        print("📋 Creating student enrollments...")
        for student, student_data in students:
            grade = student_data["grade"]
            
            # Find classrooms for this grade
            grade_classrooms = [c for c in classrooms 
                             if c.grade_level == grade and c.classroom_type == "CORE"]
            
            # Enroll in all core subjects for their grade
            for classroom in grade_classrooms:
                enrollment = Enrollment(
                    id=uuid.uuid4(),
                    student_id=student.id,
                    classroom_id=classroom.id,
                    enrollment_date=academic_year.start_date,
                    enrollment_status="ACTIVE",
                    enrolled_by=admin_user.id
                )
                session.add(enrollment)
            
            # Enroll in enrichment subjects (Art, PE, Music)
            enrichment_classrooms = [c for c in classrooms 
                                   if c.classroom_type == "ENRICHMENT"]
            
            for classroom in enrichment_classrooms:
                enrollment = Enrollment(
                    id=uuid.uuid4(),
                    student_id=student.id,
                    classroom_id=classroom.id,
                    enrollment_date=academic_year.start_date,
                    enrollment_status="ACTIVE",
                    enrolled_by=admin_user.id
                )
                session.add(enrollment)
        
        # 10. Create parent accounts and relationships
        print("👨‍👩‍👧‍👦 Creating parent accounts...")
        
        # Create some sample parents
        parents_data = [
            {"first_name": "John", "last_name": "Thompson", "email": "john.thompson@email.com", "children": ["Emma Thompson"], "relationship": "FATHER"},
            {"first_name": "Mary", "last_name": "Thompson", "email": "mary.thompson@email.com", "children": ["Emma Thompson"], "relationship": "MOTHER"},
            {"first_name": "Robert", "last_name": "Roberts", "email": "robert.roberts@email.com", "children": ["Liam Roberts"], "relationship": "FATHER"},
            {"first_name": "Jennifer", "last_name": "Clark", "email": "jennifer.clark@email.com", "children": ["Olivia Clark"], "relationship": "MOTHER"},
            {"first_name": "Michael", "last_name": "Lewis", "email": "michael.lewis@email.com", "children": ["Noah Lewis"], "relationship": "FATHER"},
            {"first_name": "Sarah", "last_name": "Walker", "email": "sarah.walker@email.com", "children": ["Ava Walker"], "relationship": "MOTHER"},
        ]
        
        for parent_data in parents_data:
            # Create user account for parent
            parent_user = User(
                id=uuid.uuid4(),
                email=parent_data["email"],
                hashed_password=get_password_hash("parent123"),
                first_name=parent_data["first_name"],
                last_name=parent_data["last_name"],
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc)
            )
            session.add(parent_user)
            await session.flush()
            
            # Create parent role
            parent_role = UserRole(
                user_id=parent_user.id,
                role="parent",
                school_id=school.id,
                is_active=True
            )
            session.add(parent_role)
            
            # Create parent profile
            parent = Parent(
                id=uuid.uuid4(),
                user_id=parent_user.id,
                relationship_type=parent_data["relationship"],
                emergency_contact=True,
                pickup_authorized=True,
                preferred_contact_method="EMAIL"
            )
            session.add(parent)
            await session.flush()
            
            # Create parent-student relationships
            for child_name in parent_data["children"]:
                # Find the student
                student_result = await session.execute(
                    select(Student).where(
                        Student.first_name + ' ' + Student.last_name == child_name
                    )
                )
                child_student = student_result.scalar_one_or_none()
                
                if child_student:
                    relationship = ParentStudentRelationship(
                        id=uuid.uuid4(),
                        parent_id=parent.id,
                        student_id=child_student.id,
                        relationship_type=parent_data["relationship"],
                        custody_status="FULL",
                        can_view_grades=True,
                        can_view_attendance=True,
                        can_view_discipline=True,
                        can_pickup_student=True,
                        can_authorize_medical=True,
                        is_emergency_contact=True,
                        emergency_priority=1 if parent_data["relationship"] == "MOTHER" else 2
                    )
                    session.add(relationship)
        
        await session.commit()
        print("✅ Phase A data seeding completed successfully!")
        
        # Print summary
        print("\n📊 Seeding Summary:")
        print(f"   🏫 Schools: 1 (Springfield Elementary)")
        print(f"   📅 Academic Years: 1 (2024-2025)")
        print(f"   👥 Users: {len(teachers_data) + len(parents_data) + 1}")
        print(f"   📖 Subjects: {len(subjects)} (from migration)")
        print(f"   🏫 Rooms: {len(rooms_data)}")
        print(f"   🎓 Classrooms: {len(classrooms)}")
        print(f"   👨‍🎓 Students: {len(students_data)}")
        print(f"   👨‍👩‍👧‍👦 Parents: {len(parents_data)}")
        
        print("\n🔐 Test Accounts:")
        print("   Admin: admin@springfield.edu / admin123")
        print("   Teacher: e.johnson@springfield.edu / teacher123")
        print("   Parent: john.thompson@email.com / parent123")
        print("   (All teacher and parent accounts use same password pattern)")

if __name__ == "__main__":
    asyncio.run(seed_data())