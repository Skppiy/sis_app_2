-- SQL Queries to Verify Teacher ID Consistency
-- between classroom_teacher_assignments and users tables

-- Query 1: Check all teacher assignments with their user data
SELECT 
    cta.id as assignment_id,
    cta.teacher_user_id,
    cta.role_name,
    cta.is_active,
    u.id as user_id,
    u.first_name,
    u.last_name,
    u.email,
    u.is_active as user_is_active
FROM classroom_teacher_assignments cta
LEFT JOIN users u ON cta.teacher_user_id = u.id
ORDER BY cta.teacher_user_id;

-- Query 2: Find missing teacher records (teacher_user_id that don't exist in users table)
SELECT 
    cta.id as assignment_id,
    cta.teacher_user_id,
    cta.role_name,
    'MISSING_USER' as issue
FROM classroom_teacher_assignments cta
LEFT JOIN users u ON cta.teacher_user_id = u.id
WHERE u.id IS NULL;

-- Query 3: Verify teacher IDs from /admin/teachers API endpoint
-- (This should match the UUIDs in classroom_teacher_assignments.teacher_user_id)
SELECT DISTINCT
    u.id,
    u.first_name,
    u.last_name,
    u.email,
    ur.role,
    ur.is_active as role_is_active
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
WHERE ur.role ILIKE '%teacher%' 
    AND ur.is_active = true
ORDER BY u.last_name, u.first_name;

-- Query 4: Check classroom data with teacher assignments (matches backend API response)
SELECT 
    c.id as classroom_id,
    c.name as classroom_name,
    c.grade_level,
    c.classroom_type,
    cta.id as assignment_id,
    cta.teacher_user_id,
    cta.role_name,
    cta.is_active as assignment_active,
    u.first_name,
    u.last_name,
    u.email
FROM classrooms c
LEFT JOIN classroom_teacher_assignments cta ON c.id = cta.classroom_id
LEFT JOIN users u ON cta.teacher_user_id = u.id
WHERE cta.is_active = true
ORDER BY c.name, cta.role_name;

-- Query 5: Test the exact data structure that the backend API should return
-- This simulates the /classrooms API response structure
SELECT 
    json_build_object(
        'id', c.id,
        'name', c.name,
        'grade_level', c.grade_level,
        'classroom_type', c.classroom_type,
        'teacher_assignments', (
            SELECT json_agg(
                json_build_object(
                    'id', cta.id,
                    'teacher_user_id', cta.teacher_user_id,
                    'role_name', cta.role_name,
                    'is_active', cta.is_active,
                    'teacher', json_build_object(
                        'id', u.id,
                        'first_name', u.first_name,
                        'last_name', u.last_name,
                        'email', u.email
                    )
                )
            )
            FROM classroom_teacher_assignments cta
            JOIN users u ON cta.teacher_user_id = u.id
            WHERE cta.classroom_id = c.id AND cta.is_active = true
        )
    ) as api_response_structure
FROM classrooms c
WHERE EXISTS (
    SELECT 1 FROM classroom_teacher_assignments cta 
    WHERE cta.classroom_id = c.id AND cta.is_active = true
)
LIMIT 5;