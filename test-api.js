// Test script to validate API responses against database evidence
const API_BASE_URL = 'http://localhost:8000';

// Database evidence from the user
const databaseTeacherIds = [
  '2a054e50-5920-4cf2-8660-6c748eded404',
  '0825414b-e74c-433b-b379-4460d710a9f7',
  '04e492ce-345f-40b2-abfb-5e680a067296',
  '65d7ca31-8a0d-46d0-ae3b-2ac010f01e5f'
];

async function testAPIs() {
  try {
    console.log('='.repeat(80));
    console.log('🔬 TESTING SIS TEACHER ASSIGNMENT APIS');
    console.log('='.repeat(80));
    
    // Get token from command line argument or prompt
    const args = process.argv.slice(2);
    let token = args[0];
    
    if (!token) {
      console.log('❌ Please provide a token as argument:');
      console.log('   node test-api.js "your_jwt_token_here"');
      console.log('\n💡 You can get a token by:');
      console.log('   1. Opening browser dev tools on the SIS app');
      console.log('   2. Going to Application > Local Storage');
      console.log('   3. Finding the "token" key');
      return;
    }
    
    console.log(`🔑 Using token: ${token.substring(0, 20)}...`);
    
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
    
    console.log('\n📡 Testing /admin/teachers API...');
    const teachersResponse = await fetch(`${API_BASE_URL}/admin/teachers`, { headers });
    
    if (!teachersResponse.ok) {
      throw new Error(`Teachers API failed: ${teachersResponse.status} ${teachersResponse.statusText}`);
    }
    
    const teachers = await teachersResponse.json();
    console.log(`✅ Teachers API returned ${teachers.length} teachers`);
    
    const apiTeacherIds = teachers.map(t => t.id);
    console.log('🆔 Teacher IDs from API:', apiTeacherIds);
    
    console.log('\n📡 Testing /classrooms API...');
    const classroomsResponse = await fetch(`${API_BASE_URL}/classrooms`, { headers });
    
    if (!classroomsResponse.ok) {
      throw new Error(`Classrooms API failed: ${classroomsResponse.status} ${classroomsResponse.statusText}`);
    }
    
    const classrooms = await classroomsResponse.json();
    console.log(`✅ Classrooms API returned ${classrooms.length} classrooms`);
    
    // Extract teacher_user_ids from classroom assignments
    const assignmentTeacherIds = [];
    classrooms.forEach(classroom => {
      if (classroom.teacher_assignments) {
        classroom.teacher_assignments.forEach(assignment => {
          if (assignment.teacher_user_id) {
            assignmentTeacherIds.push(assignment.teacher_user_id);
          }
        });
      }
    });
    
    console.log('🆔 Teacher User IDs from classroom assignments:', assignmentTeacherIds);
    
    console.log('\n🔍 ANALYSIS:');
    console.log('='.repeat(50));
    
    // Check matches with database evidence
    const dbVsApi = databaseTeacherIds.filter(id => apiTeacherIds.includes(id));
    const dbVsAssignments = databaseTeacherIds.filter(id => assignmentTeacherIds.includes(id));
    const apiVsAssignments = apiTeacherIds.filter(id => assignmentTeacherIds.includes(id));
    
    console.log(`📊 Database IDs (${databaseTeacherIds.length}):`, databaseTeacherIds);
    console.log(`📊 API Teacher IDs (${apiTeacherIds.length}):`, apiTeacherIds);
    console.log(`📊 Assignment Teacher IDs (${assignmentTeacherIds.length}):`, assignmentTeacherIds);
    
    console.log(`\n🎯 MATCH RESULTS:`);
    console.log(`   Database ∩ API Teachers: ${dbVsApi.length}/${databaseTeacherIds.length} matches`);
    console.log(`   Database ∩ Assignments: ${dbVsAssignments.length}/${databaseTeacherIds.length} matches`);
    console.log(`   API Teachers ∩ Assignments: ${apiVsAssignments.length} matches`);
    
    if (dbVsApi.length === 0) {
      console.log('\n❌ CRITICAL: No database teacher IDs match API teacher IDs!');
      console.log('   This means /admin/teachers returns different IDs than database.');
    }
    
    if (dbVsAssignments.length === 0) {
      console.log('\n❌ CRITICAL: No database teacher IDs match assignment teacher_user_ids!');
      console.log('   This means classroom assignments have different IDs than database evidence.');
    }
    
    if (apiVsAssignments.length === 0) {
      console.log('\n❌ CRITICAL: No API teacher IDs match assignment teacher_user_ids!');
      console.log('   This is why teacher enrichment fails!');
    }
    
    // Show detailed assignment analysis
    console.log('\n📋 DETAILED CLASSROOM ASSIGNMENT ANALYSIS:');
    console.log('='.repeat(60));
    
    classrooms.forEach((classroom, index) => {
      console.log(`\n🏫 Classroom ${index + 1}: ${classroom.name}`);
      if (classroom.teacher_assignments && classroom.teacher_assignments.length > 0) {
        classroom.teacher_assignments.forEach((assignment, assignIndex) => {
          console.log(`   📝 Assignment ${assignIndex + 1}:`);
          console.log(`      teacher_user_id: ${assignment.teacher_user_id}`);
          console.log(`      teacher object: ${assignment.teacher ? 'Present' : 'NULL'}`);
          console.log(`      teacher.id: ${assignment.teacher?.id || 'N/A'}`);
          console.log(`      role_name: ${assignment.role_name}`);
          console.log(`      is_active: ${assignment.is_active}`);
          console.log(`      in_database_evidence: ${databaseTeacherIds.includes(assignment.teacher_user_id) ? 'YES' : 'NO'}`);
          console.log(`      in_api_teachers: ${apiTeacherIds.includes(assignment.teacher_user_id) ? 'YES' : 'NO'}`);
        });
      } else {
        console.log('   ❌ No teacher assignments');
      }
    });
    
    console.log('\n' + '='.repeat(80));
    console.log('🎯 VALIDATION COMPLETE');
    console.log('='.repeat(80));
    
  } catch (error) {
    console.error('❌ API Test Error:', error.message);
  }
}

testAPIs();