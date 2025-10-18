#!/usr/bin/env python3
"""
Fix homeroom classroom types that were incorrectly changed by the agent's migration.
Restore grades 1-3 homeroom classrooms from 'CORE' back to 'HOMEROOM' type.
"""
import asyncio
import asyncpg

# Database connection
DATABASE_URL = "postgresql://postgres:postgres@localhost:5433/sis_db"

async def fix_homeroom_types():
    conn = await asyncpg.connect(DATABASE_URL)

    print("=== FIXING HOMEROOM CLASSROOM TYPES ===\n")

    # 1. Show current broken state
    print("BEFORE FIX:")
    current_query = """
    SELECT c.name, c.grade_level, c.classroom_type, s.name as subject_name
    FROM classrooms c
    JOIN subjects s ON c.subject_id = s.id
    WHERE c.grade_level IN ('1', '2', '3')
    AND s.requires_specialist = false
    ORDER BY c.grade_level, s.name
    """

    current_results = await conn.fetch(current_query)
    for row in current_results:
        print(f"  {row['grade_level']}: {row['name']} -> {row['classroom_type']} ({row['subject_name']})")

    # 2. Apply the fix - restore HOMEROOM type for grades 1-3 core subject classrooms
    print(f"\nFixing {len(current_results)} classrooms...")

    fix_query = """
    UPDATE classrooms
    SET classroom_type = 'HOMEROOM'
    FROM subjects
    WHERE classrooms.subject_id = subjects.id
    AND classrooms.grade_level IN ('1', '2', '3')
    AND subjects.requires_specialist = false
    AND classrooms.classroom_type = 'CORE'
    """

    result = await conn.execute(fix_query)
    print(f"Updated {result.split()[-1]} classroom records")

    # 3. Verify the fix
    print("\nAFTER FIX:")
    after_results = await conn.fetch(current_query)
    for row in after_results:
        print(f"  {row['grade_level']}: {row['name']} -> {row['classroom_type']} ({row['subject_name']})")

    # 4. Summary of what should now work
    print("\n=== EXPECTED RESULTS ===")
    print("✅ Grades 1-3: Should now display as grouped homerooms (like Grade 4)")
    print("✅ Grade 4: Should continue working as before")
    print("✅ Specialists (PE/Library): Should remain as SPECIALIST type")
    print("✅ All enrollments and teacher assignments: Preserved")

    await conn.close()
    print("\n🎉 Fix completed successfully!")

if __name__ == "__main__":
    asyncio.run(fix_homeroom_types())