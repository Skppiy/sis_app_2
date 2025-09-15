# Claude Agent Instructions for SIS Development

## CRITICAL: Read This Before Every Task

You are working on a K-8 School Information System (SIS) where **accuracy affects real children's education**. Follow these principles without exception:

### 🚨 **NEVER GUESS OR USE MOCK DATA**
- Always investigate actual database schema, API responses, and code behavior
- No sample/test data without explicit user request
- Verify every assumption against real evidence
- When in doubt, investigate deeper - don't assume

### 🔍 **SYSTEMATIC DEBUGGING PROTOCOL**
1. **Read foundation documents first** - COMPLETE_FOUNDATION_REVIEW.md is your starting point
2. **Check actual database schema** - Use `docker exec` commands to verify tables
3. **Verify API endpoints exist** - Test with curl or check FastAPI docs
4. **Follow the data trail** - Track what creates what files/outputs
5. **Test your hypothesis** - Prove the cause before explaining the fix

### 📚 **REQUIRED READING ORDER** (Before ANY development):
1. `COMPLETE_FOUNDATION_REVIEW.md` - System status overview
2. Component-specific document (e.g., `ENROLLMENT_REQUIREMENTS.md`)
3. `DATABASE_SCHEMA_FOUNDATION.md` - Actual table structures
4. `API_ROUTE_MAPPING.md` - Existing vs required endpoints
5. `CODE_REVIEW_FINDINGS.md` - Known issues and blockers

### 🏫 **UNDERSTAND YOUR SMEs** (Subject Matter Experts):
- **Front Office Staff** are the real heroes - they know the daily workflows
- **Principal(s)** understand policy and big picture
- **Teachers** know instructional needs by grade level
- **SIS Sales Reps** know industry standards and common pitfalls

### ⛔ **FORBIDDEN ACTIONS**:
- Creating mock data or sample responses
- Assuming schema structure without verification
- Implementing without understanding current state
- Skipping documentation review
- Making changes without testing against real data

### ✅ **REQUIRED VERIFICATION STEPS**:
1. **Database reality check**: `\d table_name` before assuming columns exist
2. **API endpoint test**: `curl` or browser test before assuming routes work
3. **Code trace**: Follow imports and dependencies to understand data flow
4. **Documentation sync**: Update docs when you discover reality differs

### 🎯 **YOUR SUCCESS CRITERIA**:
- Solutions work with actual data in the system
- Root causes identified and fixed (not symptoms)
- SME workflows supported efficiently
- No breaking changes to existing functionality
- Documentation reflects reality, not assumptions

## Current System Status (MEMORIZE THIS):

### ✅ **What's Actually Working**:
- Students: Advanced management with grade promotion (95% complete)
- Academic Years: Clean activation system (100% complete)
- Rooms: Sophisticated equipment tracking (100% complete)
- Classrooms: Homeroom intelligence functional (95% complete)

### ❌ **Critical Blocker**:
- Enrollments: `student_subject_enrollments` table has 9 columns, needs 20+
- This single schema mismatch blocks the entire enrollment system

### ⚠️ **Needs Enhancement**:
- Teachers/Users: Basic CRUD only (60% complete)
- Permissions: Role checks only, no granular system

## Investigation Commands (Use These First):

```bash
# Verify database schema
docker exec backend-db-1 psql -U postgres -d sis_db -c "\d student_subject_enrollments"

# Check API endpoints
curl http://localhost:8000/docs

# Test specific route
curl -X GET http://localhost:8000/api/students

# Check file structure
find backend/app -name "*.py" | grep -E "(student|enrollment)"
```

## 🛡️ **COMPLIANCE AWARENESS (CRITICAL)**

### **FERPA Requirements**
- **Student data privacy**: All student queries must log user/timestamp
- **Permission checks**: Required before ANY student data display
- **Audit trails**: Who accessed what student data when
- **Secure deletion**: Proper disposal when data no longer needed

### **Performance Standards**
- **Response times**: < 3 seconds page loads, < 1 second queries
- **Concurrent users**: 100+ teachers during grade entry periods
- **System availability**: 99.5% uptime during school hours
- **Error handling**: Graceful failures with user-friendly messages

### **Integration Readiness**
- **API design**: RESTful with versioning support
- **Data formats**: CSV, JSON, XML flexibility for future integrations
- **Authentication**: OAuth 2.0/SAML preparation
- **Standards compliance**: SIF (Schools Interoperability Framework)

## Remember:
**Every decision you make affects real students, teachers, and administrators. Accuracy, privacy, and reliability are not optional in educational software.**

---
**Last Updated**: September 13, 2024
**System Phase**: A (Foundation & Enrollment)
**Critical Priority**: Fix enrollment schema to unlock complete system
**Compliance**: FERPA, ADA, State Reporting standards must be maintained