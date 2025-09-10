// Test to demonstrate the exact ID mismatch issue in teacher enrichment logic

// Mock data structure based on actual API responses
const mockClassrooms = [
  {
    id: "classroom-1",
    name: "Jennifer Taylor's Grade 4 Homeroom",
    grade_level: "4",
    classroom_type: "CORE",
    enrollment_count: 25,
    room: { name: "Room 204" },
    teacher_assignments: [
      {
        id: "assignment-1",
        teacher_user_id: "user-123",  // This is the problematic field
        role_name: "PRIMARY_TEACHER", 
        is_active: true,
        teacher: {  // This is the correct object to use
          id: "teacher-456",  // Different from teacher_user_id!
          first_name: "Jennifer",
          last_name: "Taylor",
          email: "jennifer.taylor@school.edu"
        }
      }
    ]
  },
  {
    id: "classroom-2", 
    name: "Sarah Davis's Grade 3 Homeroom",
    grade_level: "3",
    classroom_type: "CORE", 
    enrollment_count: 22,
    room: { name: "Room 301" },
    teacher_assignments: [
      {
        id: "assignment-2",
        teacher_user_id: "user-789",  // Another mismatch
        role_name: "PRIMARY_TEACHER",
        is_active: true,
        teacher: {
          id: "teacher-101", // Different from teacher_user_id!
          first_name: "Sarah", 
          last_name: "Davis",
          email: "sarah.davis@school.edu"
        }
      }
    ]
  }
];

const mockTeachers = [
  {
    id: "teacher-456", // Matches classroom assignment teacher.id
    first_name: "Jennifer",
    last_name: "Taylor",
    email: "jennifer.taylor@school.edu"
  },
  {
    id: "teacher-101", // Matches classroom assignment teacher.id  
    first_name: "Sarah",
    last_name: "Davis", 
    email: "sarah.davis@school.edu"
  },
  {
    id: "teacher-999", // No matching assignments
    first_name: "Lisa",
    last_name: "Anderson",
    email: "lisa.anderson@school.edu"
  }
];

// Current BROKEN enrichment logic (from teachers.ts line 38)
function brokenEnrichmentLogic(basicTeachers, classrooms) {
  console.log("🔴 TESTING BROKEN ENRICHMENT LOGIC");
  console.log("=====================================");
  
  const teacherToHomeroom = new Map();
  const teacherToStudentCount = new Map();
  
  // Process classroom data using BROKEN logic
  classrooms.forEach((classroom) => {
    classroom.teacher_assignments?.forEach(assignment => {
      if (assignment.teacher && assignment.is_active) {
        // THIS IS THE BROKEN LINE - using teacher_user_id instead of teacher.id
        const teacherId = assignment.teacher_user_id; 
        
        console.log(`\n📚 Processing ${classroom.name}:`);
        console.log(`   - assignment.teacher_user_id: ${assignment.teacher_user_id}`);
        console.log(`   - assignment.teacher.id: ${assignment.teacher.id}`);
        console.log(`   - Using teacherId: ${teacherId} (WRONG!)`);
        
        const roomName = classroom.room?.name || classroom.name;
        const studentCount = classroom.enrollment_count || 0;
        
        teacherToHomeroom.set(teacherId, roomName);
        teacherToStudentCount.set(teacherId, studentCount);
      }
    });
  });
  
  // Try to enrich teachers
  const enrichedTeachers = basicTeachers.map(teacher => {
    const homeroom = teacherToHomeroom.get(teacher.id);
    const studentCount = teacherToStudentCount.get(teacher.id) || 0;
    
    console.log(`\n👨‍🏫 Teacher ${teacher.first_name} ${teacher.last_name} (ID: ${teacher.id}):`);
    console.log(`   - Looking for homeroom with ID: ${teacher.id}`);
    console.log(`   - Found homeroom: ${homeroom || "NONE"}`);
    console.log(`   - Student count: ${studentCount}`);
    
    return {
      ...teacher,
      homeroom_name: homeroom,
      student_count: studentCount
    };
  });
  
  console.log("\n🔴 BROKEN ENRICHMENT RESULTS:");
  enrichedTeachers.forEach(teacher => {
    console.log(`   - ${teacher.first_name} ${teacher.last_name}: ${teacher.homeroom_name || "NO ROOM"} (${teacher.student_count} students)`);
  });
  
  return enrichedTeachers;
}

// FIXED enrichment logic (using assignment.teacher.id)
function fixedEnrichmentLogic(basicTeachers, classrooms) {
  console.log("\n\n🟢 TESTING FIXED ENRICHMENT LOGIC");
  console.log("===================================");
  
  const teacherToHomeroom = new Map();
  const teacherToStudentCount = new Map();
  
  // Process classroom data using CORRECT logic
  classrooms.forEach((classroom) => {
    classroom.teacher_assignments?.forEach(assignment => {
      if (assignment.teacher && assignment.is_active) {
        // THIS IS THE FIXED LINE - using assignment.teacher.id
        const teacherId = assignment.teacher.id;
        
        console.log(`\n📚 Processing ${classroom.name}:`);
        console.log(`   - assignment.teacher_user_id: ${assignment.teacher_user_id}`);
        console.log(`   - assignment.teacher.id: ${assignment.teacher.id}`);
        console.log(`   - Using teacherId: ${teacherId} (CORRECT!)`);
        
        const roomName = classroom.room?.name || classroom.name;
        const studentCount = classroom.enrollment_count || 0;
        
        teacherToHomeroom.set(teacherId, roomName);
        teacherToStudentCount.set(teacherId, studentCount);
      }
    });
  });
  
  // Try to enrich teachers
  const enrichedTeachers = basicTeachers.map(teacher => {
    const homeroom = teacherToHomeroom.get(teacher.id);
    const studentCount = teacherToStudentCount.get(teacher.id) || 0;
    
    console.log(`\n👨‍🏫 Teacher ${teacher.first_name} ${teacher.last_name} (ID: ${teacher.id}):`);
    console.log(`   - Looking for homeroom with ID: ${teacher.id}`);
    console.log(`   - Found homeroom: ${homeroom || "NONE"}`);
    console.log(`   - Student count: ${studentCount}`);
    
    return {
      ...teacher,
      homeroom_name: homeroom,
      student_count: studentCount
    };
  });
  
  console.log("\n🟢 FIXED ENRICHMENT RESULTS:");
  enrichedTeachers.forEach(teacher => {
    console.log(`   - ${teacher.first_name} ${teacher.last_name}: ${teacher.homeroom_name || "NO ROOM"} (${teacher.student_count} students)`);
  });
  
  return enrichedTeachers;
}

// Run the test
console.log("🧪 TEACHER ENRICHMENT LOGIC TEST");
console.log("================================");
console.log("This demonstrates the exact ID mismatch issue identified by the Architecture Agent.\n");

const brokenResults = brokenEnrichmentLogic(mockTeachers, mockClassrooms);
const fixedResults = fixedEnrichmentLogic(mockTeachers, mockClassrooms);

console.log("\n📊 COMPARISON SUMMARY:");
console.log("=====================");
console.log("Broken Logic Results:");
brokenResults.forEach((teacher, idx) => {
  const hasRoom = !!teacher.homeroom_name;
  console.log(`   ${idx + 1}. ${teacher.first_name} ${teacher.last_name}: ${hasRoom ? '✅' : '❌'} ${teacher.homeroom_name || 'No room assigned'}`);
});

console.log("\nFixed Logic Results:");
fixedResults.forEach((teacher, idx) => {
  const hasRoom = !!teacher.homeroom_name;
  console.log(`   ${idx + 1}. ${teacher.first_name} ${teacher.last_name}: ${hasRoom ? '✅' : '❌'} ${teacher.homeroom_name || 'No room assigned'}`);
});

console.log("\n🎯 VALIDATION COMPLETE!");
console.log("The fix is simple: change line 38 in teachers.ts from:");
console.log("   const teacherId = assignment.teacher_user_id;");
console.log("to:");
console.log("   const teacherId = assignment.teacher.id;");