#!/usr/bin/env python3
"""
Validate homeroom structure in database
"""
import os
import asyncio
import asyncpg
from urllib.parse import urlparse

# Database connection
DATABASE_URL = "postgresql://postgres:postgres@localhost:5433/sis_db"

async def validate_homeroom_structure():
    conn = await asyncpg.connect(DATABASE_URL)

    print("=== CLASSROOM STRUCTURE ANALYSIS ===\n")

    # 1. Check all classrooms by grade level
    classrooms_query = """
    SELECT
        c.id,
        c.name,
        c.grade_level,
        c.classroom_type,
        s.name as subject_name,
        s.requires_specialist,
        r.name as room_name
    FROM classrooms c
    LEFT JOIN subjects s ON c.subject_id = s.id
    LEFT JOIN rooms r ON c.room_id = r.id
    ORDER BY c.grade_level, c.name
    """

    classrooms = await conn.fetch(classrooms_query)
    print("ALL CLASSROOMS:")
    print("-" * 100)
    print(f"{'Name':<30} {'Grade':<10} {'Type':<12} {'Subject':<20} {'Specialist':<10} {'Room':<15}")
    print("-" * 100)

    grade_counts = {}
    for classroom in classrooms:
        grade = classroom['grade_level'] or 'None'
        if grade not in grade_counts:
            grade_counts[grade] = []
        grade_counts[grade].append(classroom)

        print(f"{classroom['name']:<30} {grade:<10} {classroom['classroom_type']:<12} {classroom['subject_name']:<20} {str(classroom['requires_specialist']):<10} {classroom['room_name'] or 'None':<15}")

    print("\n=== GRADE LEVEL SUMMARY ===")
    for grade, classrooms_list in grade_counts.items():
        print(f"{grade}: {len(classrooms_list)} classrooms")
        homeroom_count = len([c for c in classrooms_list if c['classroom_type'] == 'HOMEROOM'])
        core_count = len([c for c in classrooms_list if c['classroom_type'] == 'CORE'])
        specialist_count = len([c for c in classrooms_list if c['classroom_type'] == 'SPECIALIST'])
        print(f"  - HOMEROOM: {homeroom_count}")
        print(f"  - CORE: {core_count}")
        print(f"  - SPECIALIST: {specialist_count}")

    # 2. Check teacher assignments per grade
    print("\n=== TEACHER ASSIGNMENTS ===")
    teacher_query = """
    SELECT
        c.grade_level,
        c.name as classroom_name,
        u.first_name,
        u.last_name,
        cta.role_name
    FROM classroom_teacher_assignments cta
    JOIN classrooms c ON cta.classroom_id = c.id
    JOIN users u ON cta.teacher_user_id = u.id
    WHERE cta.is_active = true
    ORDER BY c.grade_level, u.last_name
    """

    assignments = await conn.fetch(teacher_query)
    for assignment in assignments:
        print(f"{assignment['grade_level']}: {assignment['first_name']} {assignment['last_name']} -> {assignment['classroom_name']} ({assignment['role_name']})")

    # 3. Check enrollments per grade
    print("\n=== ENROLLMENT SUMMARY ===")
    enrollment_query = """
    SELECT
        c.grade_level,
        c.name as classroom_name,
        COUNT(e.id) as student_count
    FROM classrooms c
    LEFT JOIN enrollments e ON c.id = e.classroom_id AND e.is_active = true
    GROUP BY c.id, c.grade_level, c.name
    HAVING COUNT(e.id) > 0
    ORDER BY c.grade_level, c.name
    """

    enrollments = await conn.fetch(enrollment_query)
    for enrollment in enrollments:
        print(f"{enrollment['grade_level']}: {enrollment['classroom_name']} -> {enrollment['student_count']} students")

    await conn.close()

if __name__ == "__main__":
    asyncio.run(validate_homeroom_structure())