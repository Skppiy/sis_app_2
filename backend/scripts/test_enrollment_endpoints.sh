#!/bin/bash
# backend/scripts/test_enrollment_endpoints.sh
# Test script to verify enrollment functionality

echo "🧪 Testing SIS Enrollment System"
echo "================================="

BASE_URL="http://localhost:8000"

# Test 1: Health check
echo "1. Testing health endpoint..."
curl -s "$BASE_URL/health" | grep -q "ok" && echo "✅ Health check passed" || echo "❌ Health check failed"

# Test 2: Get students (to find student IDs)
echo -e "\n2. Getting students..."
STUDENTS_RESPONSE=$(curl -s -H "Authorization: Bearer YOUR_TOKEN" "$BASE_URL/students")
echo "Students response length: $(echo $STUDENTS_RESPONSE | wc -c)"

# Test 3: Get classrooms (to find classroom IDs)  
echo -e "\n3. Getting classrooms..."
CLASSROOMS_RESPONSE=$(curl -s -H "Authorization: Bearer YOUR_TOKEN" "$BASE_URL/classrooms")
echo "Classrooms response length: $(echo $CLASSROOMS_RESPONSE | wc -c)"

# Test 4: Test enrollment creation
echo -e "\n4. Testing enrollment creation..."
curl -X POST "$BASE_URL/enrollments" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "student_id": "STUDENT_UUID_HERE",
    "classroom_id": "CLASSROOM_UUID_HERE",
    "enrollment_status": "ACTIVE"
  }' \
  && echo "✅ Enrollment creation test completed" || echo "❌ Enrollment creation failed"

# Test 5: Get enrollments
echo -e "\n5. Testing get enrollments..."
curl -s -H "Authorization: Bearer YOUR_TOKEN" "$BASE_URL/enrollments" \
  && echo "✅ Get enrollments test completed" || echo "❌ Get enrollments failed"

# Test 6: Get student enrollments
echo -e "\n6. Testing student enrollments endpoint..."
curl -s -H "Authorization: Bearer YOUR_TOKEN" "$BASE_URL/enrollments/students/STUDENT_UUID_HERE/enrollments" \
  && echo "✅ Student enrollments test completed" || echo "❌ Student enrollments failed"

# Test 7: Get classroom roster
echo -e "\n7. Testing classroom roster endpoint..."
curl -s -H "Authorization: Bearer YOUR_TOKEN" "$BASE_URL/enrollments/classrooms/CLASSROOM_UUID_HERE/students" \
  && echo "✅ Classroom roster test completed" || echo "❌ Classroom roster failed"

echo -e "\n🎯 Test Summary"
echo "==============="
echo "Replace YOUR_TOKEN, STUDENT_UUID_HERE, and CLASSROOM_UUID_HERE with actual values"
echo "Check server logs for detailed error information"