# API Route Mapping - Existing vs Required

## Overview
This document maps existing backend API routes against the enrollment system requirements, identifying what exists, what's missing, and what needs modification.

## Route Discovery Summary
**Backend Structure**: FastAPI with 15 router modules
**Main Enrollment Router**: `/enrollments` - 598 lines with enhanced three-tier system
**Homeroom Router**: `/homeroom` - 542 lines with homeroom intelligence
**Total Estimated Endpoints**: 60+ across all modules

## Enrollment System Routes Analysis

### ✅ Existing and Functional Routes

#### Basic Enrollment Management
```python
# /enrollments router - EXISTING
GET /enrollments - List enrollments with filtering ✅
GET /enrollments/{enrollment_id} - Get specific enrollment ✅
POST /enrollments - Create individual enrollment ✅
PATCH /enrollments/{enrollment_id} - Update enrollment ✅
DELETE /enrollments/{enrollment_id} - Soft delete enrollment ✅
GET /enrollments/students/{student_id}/enrollments - Get student enrollments ✅
GET /enrollments/classrooms/{classroom_id}/students - Get classroom roster ✅
```

#### Three-Tier Enrollment System - IMPLEMENTED ✅
```python
# Enhanced enrollment endpoints - EXISTING AND FUNCTIONAL
POST /enrollments/homeroom/bulk - Bulk homeroom enrollment ✅
  → Uses EnrollmentService.bulk_homeroom_enrollment()
  → Requires admin privileges
  → Returns BulkHomeroomEnrollmentResponse

POST /enrollments/flexible/{subject_id} - Flexible subject enrollment ✅
  → Tier 2: Non-CORE subjects with teacher distribution
  → Uses EnrollmentService.flexible_subject_enrollment()

POST /enrollments/special-program - Special program enrollment ✅
  → Tier 3: Individual special program enrollment
  → Uses EnrollmentService.special_program_enrollment()

GET /enrollments/conflicts/{academic_year_id} - Conflict detection ✅
  → Detects duplicate enrollments, capacity violations
  → Uses EnrollmentService.detect_enrollment_conflicts()

GET /enrollments/student/{student_id}/summary - Student enrollment summary ✅
  → Comprehensive enrollment overview
  → Uses EnrollmentService.get_student_enrollment_summary()

GET /enrollments/tiers/info - Get tier system information ✅
  → Documentation endpoint for three-tier system
```

#### Homeroom Intelligence System - IMPLEMENTED ✅
```python
# /homeroom router - EXISTING AND FUNCTIONAL
POST /homeroom/create - Create homeroom with auto-assignment ✅
  → Uses HomeroomService.create_homeroom_with_auto_assignment()
  → Auto-assigns CORE subjects to elementary teachers

GET /homeroom/teachers/{teacher_id}/subjects - Get teacher assignments ✅
  → Uses HomeroomService.get_teacher_assigned_subjects()

POST /homeroom/subjects/auto-assign-existing - Auto-assign new CORE subject ✅
  → Uses HomeroomService.auto_assign_new_core_subject()

GET /homeroom/preview-assignment/{grade_level}/{teacher_id} - Preview assignment ✅
  → Uses HomeroomService.preview_homeroom_assignment()

POST /homeroom/students/auto-enroll - Auto-enroll students in CORE subjects ✅
  → Uses HomeroomService.auto_enroll_students_in_core_subjects()
```

#### Teacher Subject Swap System - IMPLEMENTED ✅
```python
# Teacher swap management - EXISTING
POST /homeroom/teacher-assignments/swap - Request subject swap ✅
GET /homeroom/teacher-assignments/swaps/pending - Get pending swaps ✅
PUT /homeroom/teacher-assignments/swaps/{swap_id}/respond - Respond to swap ✅
GET /homeroom/admin/swaps/pending-approval - Admin pending swaps ✅
PUT /homeroom/admin/swaps/{swap_id}/review - Admin review swap ✅
GET /homeroom/teachers/{teacher_id}/assignment-history - Assignment audit trail ✅
```

### ❌ Missing Routes (Based on API_CONTRACTS.md Requirements)

#### Homeroom Enrollment Specific
```python
# Required but not found in existing code
POST /api/enrollment/homeroom/preview - Preview homeroom enrollment ❌
  → Should show preview before committing bulk enrollment
  → Return: HomeroomPreviewResponse
  → Status: MISSING - needs implementation

GET /api/subjects/homeroom-defaults/{grade_level} - Get CORE subjects for grade ❌
  → Should return grade-specific CORE subjects
  → Return: HomeroomDefaultsResponse
  → Status: MISSING - needs implementation
```

#### Individual Enrollment API
```python
# Required for individual workflow
POST /api/enrollment/individual - Create individual enrollment ❌
  → Distinct from basic POST /enrollments (different schema)
  → Should use IndividualEnrollmentRequest schema
  → Return: IndividualEnrollmentResponse
  → Status: MISSING - basic enrollment exists but not individual workflow version
```

#### Enrollment Modification API
```python
# Enrollment management endpoints
DELETE /api/enrollment/{enrollment_id} - Drop enrollment with reason ❌
  → Should use DropEnrollmentRequest schema with required reason
  → Return: DropEnrollmentResponse with impact analysis
  → Status: EXISTS but wrong schema (no required reason)

PUT /api/enrollment/{enrollment_id}/transfer - Transfer student ❌
  → Transfer to different classroom/teacher for same subject
  → Use: TransferEnrollmentRequest schema
  → Status: MISSING - needs implementation
```

## Schema Misalignment Issues

### Existing Schemas vs Required
```python
# EXISTING: Basic enrollment creation
class EnrollmentCreate(BaseModel):
    student_id: str
    classroom_id: str
    grade_level: Optional[str]
    enrollment_date: Optional[date]
    # ... basic fields

# REQUIRED: Homeroom-specific bulk enrollment
class HomeroomBulkEnrollmentRequest(BaseModel):
    academic_year_id: UUID
    teacher_id: UUID
    classroom_id: Optional[UUID]
    grade_level: str
    students: List[UUID]
    subjects: List[UUID]
    notes: Optional[str]
```

### Service Layer Mapping
```python
# EXISTING: EnrollmentService methods
✅ bulk_homeroom_enrollment() - IMPLEMENTED
✅ flexible_subject_enrollment() - IMPLEMENTED
✅ special_program_enrollment() - IMPLEMENTED
✅ detect_enrollment_conflicts() - IMPLEMENTED
✅ get_student_enrollment_summary() - IMPLEMENTED

# REQUIRED: Additional service methods
❌ preview_homeroom_enrollment() - MISSING
❌ get_homeroom_defaults_for_grade() - MISSING
❌ create_individual_enrollment() - MISSING (different from basic)
❌ transfer_enrollment() - MISSING
❌ drop_enrollment_with_analysis() - MISSING
```

## Permission Implementation Status

### Current Permission System
```python
# EXISTING: Basic role-based auth
@Depends(require_admin) - Used for bulk enrollment ✅
@Depends(get_current_user) - Used for viewing ✅

# MISSING: Granular permission system
@require_permission(Permission.ENROLLMENT_HOMEROOM_BULK) - NOT IMPLEMENTED ❌
@require_hierarchy_level(70) - NOT IMPLEMENTED ❌
```

### Required Permission Updates
```python
# Need to implement from PERMISSION_FRAMEWORK.md
1. Permission enum definitions ❌
2. Role-to-permission mapping ❌
3. Permission decorator implementation ❌
4. Context-aware permission checking ❌
```

## Database Schema Alignment

### Current Models vs Required
```python
# EXISTING: Basic student_subject_enrollments model
class StudentSubjectEnrollment(Base):
    # Has 9 columns - INSUFFICIENT

# REQUIRED: Enhanced enrollment model (from DATABASE_SCHEMA_FOUNDATION.md)
class StudentSubjectEnrollment(Base):
    # Needs 20+ columns including:
    - enrollment_type (HOMEROOM/INDIVIDUAL/GROUP) ❌
    - enrollment_status (ACTIVE/DROPPED/COMPLETED) ❌
    - enrolled_by UUID ❌
    - is_homeroom_core boolean ❌
    - dropped_reason text ❌
    # ... additional fields
```

## Frontend Integration Points

### Component-to-API Mapping
```typescript
// EXISTING: Components expect these APIs
ThreeTierEnrollmentManager → POST /enrollments/homeroom/bulk ✅
HomeroomEnrollmentWorkflow → POST /enrollments/homeroom/preview ❌ MISSING
AdminSwapReview → GET /homeroom/admin/swaps/pending-approval ✅

// DISABLED: Components need these APIs
GroupEnrollmentWorkflow → POST /enrollments/flexible/{subject_id} ✅ EXISTS
IndividualEnrollmentWorkflow → POST /api/enrollment/individual ❌ MISSING
```

## Implementation Priority Matrix

### HIGH PRIORITY - Critical for Phase A
1. **Fix student_subject_enrollments schema** - Database migration required
2. **Implement preview endpoints** - Frontend components expect these
3. **Add permission framework** - Security requirement
4. **Create homeroom defaults endpoint** - UI needs grade-specific subjects

### MEDIUM PRIORITY - Enhancement
1. **Individual enrollment workflow API** - Complete three-tier system
2. **Transfer/drop with analysis** - Better enrollment management
3. **Enhanced error schemas** - Better user experience

### LOW PRIORITY - Future phases
1. **Advanced conflict detection** - Scheduling integration
2. **Bulk modification APIs** - Administrative efficiency
3. **Audit trail enhancements** - Compliance features

## Service Dependencies Status

### External Service Dependencies
```python
# EXISTING: Service layer implementations
✅ HomeroomService - Fully implemented with 6 methods
✅ EnrollmentService - Implemented with 5+ three-tier methods
❌ GradeDataService - Referenced but implementation unknown
❌ PermissionService - Not implemented, needed for authorization
```

### Database Service Status
```python
# EXISTING: Database models
✅ User, Student, Subject, Classroom models - Functional
✅ TeacherSubjectAssignment model - Functional
✅ TeacherSubjectSwap model - Functional
❌ StudentSubjectEnrollment model - NEEDS SCHEMA FIX
❌ HomeoomAssignment model - MISSING
❌ EnrollmentBatch model - MISSING (optional for v1)
```

## Next Steps for Route Completion

### Week 1: Critical Fixes
1. **Database schema migration** - Fix student_subject_enrollments table
2. **Add preview endpoints** - POST /api/enrollment/homeroom/preview
3. **Add homeroom defaults** - GET /api/subjects/homeroom-defaults/{grade_level}
4. **Implement basic permission framework** - @require_permission decorators

### Week 2: Complete Three-Tier System
1. **Individual enrollment API** - POST /api/enrollment/individual
2. **Transfer/drop APIs** - PUT/DELETE with proper schemas
3. **Frontend integration testing** - Connect components to real APIs
4. **Error handling standardization** - Consistent error responses

### Week 3: Polish and Testing
1. **Permission integration** - Context-aware authorization
2. **API documentation** - OpenAPI/Swagger updates
3. **Integration testing** - End-to-end enrollment workflows
4. **Performance optimization** - Query optimization and indexing

---
**Status**: 70% implemented - Core functionality exists, missing critical pieces
**Risk**: MEDIUM - Schema mismatch could break existing functionality
**Timeline**: 2-3 weeks to complete all missing routes and fixes