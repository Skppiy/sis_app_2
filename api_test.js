// API Testing Script for SIS
// Run this in browser console on localhost:5175 when authenticated

async function testAPI(endpoint, description) {
  console.log(`\n=== Testing ${description} ===`);
  try {
    const response = await fetch(`http://localhost:8000${endpoint}`, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`✅ ${description} Response:`, JSON.stringify(data, null, 2));
    return data;
  } catch (error) {
    console.error(`❌ ${description} Failed:`, error);
    return null;
  }
}

async function runAllTests() {
  console.log('🚀 Starting API Validation Tests...\n');
  
  // Test 1: Classrooms endpoint structure
  const classroomsData = await testAPI('/classrooms', 'Classrooms Endpoint');
  
  // Test 2: Admin teachers endpoint
  const teachersData = await testAPI('/admin/teachers', 'Admin Teachers Endpoint');
  
  // Analysis of teacher_assignments structure
  if (classroomsData && classroomsData.length > 0) {
    console.log('\n=== Teacher Assignments Analysis ===');
    const firstClassroom = classroomsData[0];
    if (firstClassroom.teacher_assignments) {
      console.log('First teacher assignment structure:', JSON.stringify(firstClassroom.teacher_assignments[0], null, 2));
      
      // Check for ID fields
      const assignment = firstClassroom.teacher_assignments[0];
      console.log('\n🔍 ID Field Analysis:');
      console.log('- assignment.teacher_user_id:', assignment.teacher_user_id);
      console.log('- assignment.teacher?.id:', assignment.teacher?.id);
      console.log('- assignment.teacher:', assignment.teacher);
    }
  }
  
  // Analysis of teachers data
  if (teachersData && teachersData.length > 0) {
    console.log('\n=== Teachers Data Analysis ===');
    console.log('First teacher structure:', JSON.stringify(teachersData[0], null, 2));
  }
  
  console.log('\n✅ API Validation Tests Complete!');
}

// Auto-run when script is loaded
runAllTests();