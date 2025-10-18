# API Reference - SIS Application

**Version:** 1.0
**Last Updated:** 2025-10-17
**Backend Framework:** FastAPI with Pydantic schemas
**Authentication:** JWT-based with role permissions

---

## 📑 Table of Contents

1. [Implementation Status Overview](#implementation-status-overview)
2. [Enrollment System APIs](#enrollment-system-apis)
3. [Student & Teacher Management APIs](#student--teacher-management-apis)
4. [Homeroom Intelligence APIs](#homeroom-intelligence-apis)
5. [Teacher Subject Swap APIs](#teacher-subject-swap-apis)
6. [Validation & Error Handling](#validation--error-handling)
7. [Authentication & Permissions](#authentication--permissions)

---

## Implementation Status Overview

### Overall API Implementation: ~70%

**Legend:**
- ✅ Implemented and functional
- 🔶 Implemented but needs updates/fixes
- ❌ Missing - needs implementation
- 📋 Planned for future phase

| Category | Status | Notes |
|----------|--------|-------|
| Basic CRUD (Students, Teachers, Classrooms) | ✅ | Functional |
| Three-Tier Enrollment System | ✅ | Core logic implemented |
| Homeroom Intelligence | ✅ | Auto-assignment working |
| Teacher Subject Swaps | ✅ | Request/approval workflow complete |
| Enrollment Preview APIs | ❌ | **MISSING** - needed by frontend |
| Individual Enrollment Workflow | 🔶 | Exists but wrong schema |
| Homeroom Defaults API | ❌ | **MISSING** - needed for grade-specific subjects |
| Enrollment Transfer APIs | ❌ | **MISSING** - needed for modifications |

---

## Enrollment System APIs

### Three-Tier Enrollment System (Implemented ✅)

#### Tier 1: Bulk Homeroom Enrollment

**POST** `/enrollments/homeroom/bulk`

Enroll multiple students in CORE subjects via homeroom teacher assignment.

**Permissions:** `admin`, `staff_admin`

**Request:**
```typescript
interface HomeroomBulkEnrollmentRequest {
  academic_year_id: string;  // UUID
  teacher_id: string;         // UUID - homeroom teacher
  classroom_id?: string;      // UUID - optional specific classroom
  grade_level: string;        // K,1,2,3,4,5,6,7,8
  students: string[];         // UUID array - student IDs
  subjects: string[];         // UUID array - CORE subject IDs
  notes?: string;             // Optional enrollment notes
}
```

**Response:**
```typescript
interface HomeroomBulkEnrollmentResponse {
  success: boolean;
  enrollment_batch_id: string;
  results: {
    total_students: number;
    successful_enrollments: number;
    failed_enrollments: number;
    created_enrollments: string[];  // UUID array
  };
  homeroom_assignment: {
    id: string;
    teacher_name: string;
    classroom_name: string;
    students_assigned: number;
  };
  warnings: string[];
  errors: {
    student_id: string;
    error_message: string;
  }[];
}
```

**Pydantic Models:**
```python
from pydantic import BaseModel
from typing import List, Optional
from uuid import UUID

class HomeroomBulkEnrollmentRequest(BaseModel):
    academic_year_id: UUID
    teacher_id: UUID
    classroom_id: Optional[UUID] = None
    grade_level: str
    students: List[UUID]
    subjects: List[UUID]
    notes: Optional[str] = None

class EnrollmentError(BaseModel):
    student_id: UUID
    error_message: str

class HomeroomAssignmentResult(BaseModel):
    id: UUID
    teacher_name: str
    classroom_name: str
    students_assigned: int

class EnrollmentResults(BaseModel):
    total_students: int
    successful_enrollments: int
    failed_enrollments: int
    created_enrollments: List[UUID]

class HomeroomBulkEnrollmentResponse(BaseModel):
    success: bool
    enrollment_batch_id: UUID
    results: EnrollmentResults
    homeroom_assignment: HomeroomAssignmentResult
    warnings: List[str]
    errors: List[EnrollmentError]
```

---

#### Tier 2: Flexible Subject Enrollment

**POST** `/enrollments/flexible/{subject_id}`

Enroll students in non-CORE subjects with flexible teacher distribution.

**Permissions:** `admin`, `dean`, `staff_admin`

**Features:**
- Tier 2: Non-CORE subjects with teacher distribution
- Uses `EnrollmentService.flexible_subject_enrollment()`
- Auto-balances students across available teachers

---

#### Tier 3: Special Program Enrollment

**POST** `/enrollments/special-program`

Individual special program enrollment for unique cases.

**Permissions:** `admin`, `dean`

**Features:**
- Tier 3: Individual special program enrollment
- Uses `EnrollmentService.special_program_enrollment()`
- Handles edge cases and special circumstances

---

### Missing Enrollment APIs ❌

#### Preview Homeroom Enrollment (NEEDED)

**POST** `/api/enrollment/homeroom/preview` ❌

Preview enrollment results before committing.

**Purpose:** Allow users to see what will happen before actual enrollment
**Priority:** HIGH - Frontend components expect this
**Status:** MISSING - needs implementation

**Expected Request:** Same as `HomeroomBulkEnrollmentRequest`

**Expected Response:**
```typescript
interface HomeroomPreviewResponse {
  valid: boolean;
  preview: {
    teacher: {
      id: string;
      name: string;
      current_homeroom_count: number;
      max_homeroom_capacity: number;
    };
    classroom: {
      id: string;
      name: string;
      current_capacity: number;
      max_capacity: number;
    };
    subjects: {
      id: string;
      name: string;
      code: string;
      is_core: boolean;
    }[];
    students: {
      id: string;
      name: string;
      current_grade: string;
      existing_enrollments: number;
      conflicts: string[];
    }[];
  };
  warnings: string[];
  blocking_errors: string[];
}
```

---

#### Get Homeroom Defaults (NEEDED)

**GET** `/api/subjects/homeroom-defaults/{grade_level}` ❌

Get CORE subjects applicable to specific grade level.

**Purpose:** UI needs grade-specific subjects for enrollment
**Priority:** HIGH - Needed for enrollment workflows
**Status:** MISSING - needs implementation

**Expected Response:**
```typescript
interface HomeroomDefaultsResponse {
  grade_level: string;
  subjects: {
    id: string;
    name: string;
    code: string;
    subject_type: 'CORE';
    is_homeroom_default: true;
    requires_specialist: boolean;
  }[];
  total_subjects: number;
}
```

**Implementation Example:**
```python
@router.get("/subjects/homeroom-defaults/{grade_level}")
async def get_homeroom_defaults(
    grade_level: str,
    db: Session = Depends(get_db)
) -> HomeroomDefaultsResponse:
    # Query subjects where:
    # - is_homeroom_default = True
    # - applies_to_elementary = True (for K-5) OR applies_to_middle = True (for 6-8)
    # - is_archived = False
    pass
```

---

### Enrollment Management APIs

#### Get Student Enrollments (Implemented ✅)

**GET** `/enrollments/students/{student_id}/enrollments`

Get all enrollments for a specific student.

**Permissions:** `staff_admin` or higher

**Query Parameters:**
```typescript
interface StudentEnrollmentParams {
  academic_year_id?: string;      // UUID - filter by year
  include_dropped?: boolean;       // Include dropped enrollments
  subject_type?: 'CORE' | 'ENRICHMENT' | 'SPECIAL';
}
```

**Response:**
```typescript
interface StudentEnrollmentsResponse {
  student: {
    id: string;
    name: string;
    grade_level: string;
  };
  academic_year: {
    id: string;
    name: string;
  };
  enrollments: {
    id: string;
    subject: {
      id: string;
      name: string;
      code: string;
      subject_type: string;
      is_core: boolean;
    };
    teacher: {
      id: string;
      name: string;
    };
    classroom: {
      id: string;
      name: string;
    };
    enrollment_type: 'HOMEROOM' | 'INDIVIDUAL' | 'GROUP';
    enrollment_status: 'ACTIVE' | 'DROPPED' | 'COMPLETED';
    enrolled_at: string;
    is_homeroom_core: boolean;
  }[];
  summary: {
    total_enrollments: number;
    core_subjects: number;
    enrichment_subjects: number;
    active_enrollments: number;
    dropped_enrollments: number;
  };
}
```

---

#### Get Classroom Enrollments (Implemented ✅)

**GET** `/enrollments/classrooms/{classroom_id}/students`

Get all enrollments for a specific classroom.

**Permissions:** Teacher (own classroom) / Staff Admin (all classrooms)

---

#### Conflict Detection (Implemented ✅)

**GET** `/enrollments/conflicts/{academic_year_id}`

Detect duplicate enrollments, capacity violations.

**Features:**
- Uses `EnrollmentService.detect_enrollment_conflicts()`
- Returns list of conflicts with details
- Helps prevent data integrity issues

---

### Missing Enrollment Modification APIs ❌

#### Drop Student Enrollment (Needs Schema Fix 🔶)

**DELETE** `/api/enrollment/{enrollment_id}` 🔶

Drop student from specific enrollment (soft delete).

**Current Status:** EXISTS but wrong schema (no required reason)
**Needs:** Update to require drop reason and return impact analysis

**Expected Request:**
```typescript
interface DropEnrollmentRequest {
  drop_reason: string;              // REQUIRED reason for dropping
  effective_date?: string;          // ISO date - default to today
}
```

**Expected Response:**
```typescript
interface DropEnrollmentResponse {
  success: boolean;
  enrollment: {
    id: string;
    student_name: string;
    subject_name: string;
    dropped_at: string;
    dropped_reason: string;
  };
  impact_analysis: {
    affects_graduation_requirements: boolean;
    affects_homeroom_assignment: boolean;
    replacement_suggestions: string[];
  };
}
```

---

#### Transfer Student Enrollment (MISSING ❌)

**PUT** `/api/enrollment/{enrollment_id}/transfer` ❌

Transfer student to different classroom/teacher for same subject.

**Priority:** MEDIUM - Enhancement
**Status:** MISSING - needs implementation

**Expected Request:**
```typescript
interface TransferEnrollmentRequest {
  new_classroom_id: string;         // UUID
  new_teacher_id: string;           // UUID
  transfer_reason: string;
  effective_date?: string;          // ISO date
}
```

**Expected Response:**
```typescript
interface TransferEnrollmentResponse {
  success: boolean;
  transfer: {
    enrollment_id: string;
    student_name: string;
    subject_name: string;
    from_classroom: string;
    to_classroom: string;
    from_teacher: string;
    to_teacher: string;
    transferred_at: string;
  };
  warnings: string[];
  errors: string[];
}
```

---

## Homeroom Intelligence APIs

### Create Homeroom with Auto-Assignment (Implemented ✅)

**POST** `/homeroom/create`

Create homeroom with automatic CORE subject assignment for elementary teachers.

**Features:**
- Uses `HomeroomService.create_homeroom_with_auto_assignment()`
- Auto-assigns CORE subjects to elementary teachers
- Follows homeroom intelligence rules

---

### Get Teacher Subject Assignments (Implemented ✅)

**GET** `/homeroom/teachers/{teacher_id}/subjects`

Get all subject assignments for a specific teacher.

**Features:**
- Uses `HomeroomService.get_teacher_assigned_subjects()`
- Shows CORE and enrichment assignments
- Includes classroom context

---

### Auto-Assign New CORE Subject (Implemented ✅)

**POST** `/homeroom/subjects/auto-assign-existing`

When new CORE subject is added, auto-assign to existing homeroom teachers.

**Features:**
- Uses `HomeroomService.auto_assign_new_core_subject()`
- Maintains homeroom intelligence consistency
- Batch operations for all eligible teachers

---

### Preview Homeroom Assignment (Implemented ✅)

**GET** `/homeroom/preview-assignment/{grade_level}/{teacher_id}`

Preview what subjects would be assigned before creating homeroom.

**Features:**
- Uses `HomeroomService.preview_homeroom_assignment()`
- Shows proposed CORE subject assignments
- Helps validate before committing

---

### Auto-Enroll Students in CORE Subjects (Implemented ✅)

**POST** `/homeroom/students/auto-enroll`

Auto-enroll students in CORE subjects based on homeroom assignment.

**Features:**
- Uses `HomeroomService.auto_enroll_students_in_core_subjects()`
- Batch enrollment for efficiency
- Validates capacity and conflicts

---

## Teacher Subject Swap APIs

### Request Subject Swap (Implemented ✅)

**POST** `/homeroom/teacher-assignments/swap`

Teacher requests to swap a subject assignment with another teacher.

**Features:**
- Teacher-initiated workflow
- Routes to other teacher for approval
- Tracks swap request history

---

### Get Pending Swaps (Implemented ✅)

**GET** `/homeroom/teacher-assignments/swaps/pending`

Get all pending swap requests for current teacher.

**Features:**
- Filtered by teacher
- Shows incoming and outgoing requests
- Status tracking

---

### Respond to Swap Request (Implemented ✅)

**PUT** `/homeroom/teacher-assignments/swaps/{swap_id}/respond`

Teacher responds to incoming swap request (approve/deny).

**Features:**
- Accept or reject swap
- Provide reason for decision
- Notification to requester

---

### Admin Review Swaps (Implemented ✅)

**GET** `/homeroom/admin/swaps/pending-approval`

Admin views all swaps pending administrative approval.

**Permissions:** `admin`, `dean`

---

**PUT** `/homeroom/admin/swaps/{swap_id}/review`

Admin approves or denies swap request.

**Permissions:** `admin`, `dean`

**Features:**
- Final approval/denial authority
- Override teacher decisions if needed
- Full audit trail

---

### View Assignment History (Implemented ✅)

**GET** `/homeroom/teachers/{teacher_id}/assignment-history`

View complete audit trail of teacher subject assignments.

**Features:**
- Historical record of all swaps
- Who initiated, who approved
- Effective dates and reasons

---

## Student & Teacher Management APIs

### Basic CRUD Operations (All Implemented ✅)

**Students:**
- `GET /students` - List all students with filtering
- `POST /students` - Create new student
- `GET /students/{student_id}` - Get student details
- `PUT /students/{student_id}` - Update student
- `DELETE /students/{student_id}` - Soft delete student

**Teachers:**
- `GET /teachers` - List all teachers with filtering
- `POST /teachers` - Create new teacher
- `GET /teachers/{teacher_id}` - Get teacher details
- `PUT /teachers/{teacher_id}` - Update teacher
- `DELETE /teachers/{teacher_id}` - Soft delete teacher

**Classrooms:**
- `GET /classrooms` - List all classrooms with filtering
- `POST /classrooms` - Create new classroom
- `GET /classrooms/{classroom_id}` - Get classroom details
- `PUT /classrooms/{classroom_id}` - Update classroom
- `DELETE /classrooms/{classroom_id}` - Soft delete classroom

**Subjects:**
- `GET /subjects` - List all subjects with filtering
- `POST /subjects` - Create new subject
- `GET /subjects/{subject_id}` - Get subject details
- `PUT /subjects/{subject_id}` - Update subject
- `DELETE /subjects/{subject_id}` - Archive subject

---

## Validation & Error Handling

### Common Validation Rules

```python
# Grade Level Validation
def validate_grade_level(grade: str) -> bool:
    return grade in ['K', '1', '2', '3', '4', '5', '6', '7', '8']

# Subject Applicability
def validate_subject_for_grade(subject: Subject, grade: str) -> bool:
    if grade in ['K', '1', '2', '3', '4', '5']:
        return subject.applies_to_elementary
    elif grade in ['6', '7', '8']:
        return subject.applies_to_middle
    return False

# Enrollment Conflicts
def check_enrollment_conflicts(
    student_id: UUID,
    subject_id: UUID,
    academic_year_id: UUID
) -> List[str]:
    # Check for existing enrollment in same subject
    # Check for schedule conflicts
    # Check for prerequisite requirements
    # Check for capacity limits
    pass
```

### Standard Error Responses

```typescript
interface APIError {
  error_type: 'VALIDATION_ERROR' | 'PERMISSION_ERROR' |
              'CONFLICT_ERROR' | 'NOT_FOUND' | 'SERVER_ERROR';
  message: string;
  details?: Record<string, any>;
  field_errors?: {
    field: string;
    message: string;
  }[];
}

interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: APIError;
  warnings?: string[];
}
```

---

## Authentication & Permissions

### Required Headers

All enrollment endpoints require authentication:

```typescript
headers: {
  'Authorization': 'Bearer <jwt_token>',
  'Content-Type': 'application/json'
}
```

### Permission Matrix

```typescript
interface PermissionMatrix {
  'homeroom_bulk_enrollment': ['admin', 'staff_admin'];
  'individual_enrollment': ['admin', 'dean', 'staff_admin'];
  'view_all_enrollments': ['admin', 'staff_admin'];
  'view_own_classroom_enrollments': ['teacher', 'specialist'];
  'modify_enrollments': ['admin', 'dean', 'staff_admin'];
  'drop_enrollments': ['admin', 'staff_admin'];
  'transfer_enrollments': ['admin', 'dean'];
}
```

### Current Permission Implementation

```python
# EXISTING: Basic role-based auth
@Depends(require_admin)  # Used for bulk enrollment ✅
@Depends(get_current_user)  # Used for viewing ✅

# MISSING: Granular permission system ❌
@require_permission(Permission.ENROLLMENT_HOMEROOM_BULK)  # NOT IMPLEMENTED
@require_hierarchy_level(70)  # NOT IMPLEMENTED
```

**Future Enhancement:** Implement granular permission system with:
1. Permission enum definitions
2. Role-to-permission mapping
3. Permission decorator implementation
4. Context-aware permission checking

---

## Implementation Priority Matrix

### HIGH PRIORITY - Critical for Phase A/1

1. ✅ **Three-tier enrollment system** - COMPLETE
2. ❌ **Preview endpoints** - MISSING, frontend expects these
3. ❌ **Homeroom defaults endpoint** - MISSING, UI needs grade-specific subjects
4. 🔶 **Drop enrollment with required reason** - EXISTS but needs schema fix

### MEDIUM PRIORITY - Enhancement

1. ❌ **Individual enrollment workflow API** - Needs distinct schema from basic enrollment
2. ❌ **Transfer/drop with analysis** - Better enrollment management
3. ❌ **Enhanced error schemas** - Better user experience
4. ❌ **Permission framework** - Security requirement

### LOW PRIORITY - Future Phases

1. ❌ **Advanced conflict detection** - Scheduling integration (Phase B)
2. ❌ **Bulk modification APIs** - Administrative efficiency
3. ❌ **Audit trail enhancements** - Compliance features (Phase E)

---

## Service Layer Status

### Implemented Services ✅

```python
# EnrollmentService - 5+ methods
✅ bulk_homeroom_enrollment()
✅ flexible_subject_enrollment()
✅ special_program_enrollment()
✅ detect_enrollment_conflicts()
✅ get_student_enrollment_summary()

# HomeroomService - 6+ methods
✅ create_homeroom_with_auto_assignment()
✅ get_teacher_assigned_subjects()
✅ auto_assign_new_core_subject()
✅ preview_homeroom_assignment()
✅ auto_enroll_students_in_core_subjects()
✅ (teacher swap methods)
```

### Missing Services ❌

```python
# Need to implement:
❌ preview_homeroom_enrollment()
❌ get_homeroom_defaults_for_grade()
❌ create_individual_enrollment()  # Different from basic
❌ transfer_enrollment()
❌ drop_enrollment_with_analysis()
```

---

## Database Schema Status

### Current Model State

**StudentSubjectEnrollment** (Needs Enhancement 🔶)

Current: Has 9 columns - INSUFFICIENT
Required: Needs 20+ columns including:
- `enrollment_type` (HOMEROOM/INDIVIDUAL/GROUP) ❌
- `enrollment_status` (ACTIVE/DROPPED/COMPLETED) ❌
- `enrolled_by` UUID ❌
- `is_homeroom_core` boolean ❌
- `dropped_reason` text ❌

**See:** [DATABASE_SCHEMA_FOUNDATION.md](./DATABASE_SCHEMA_FOUNDATION.md) for complete schema requirements

---

## API Versioning & Backward Compatibility

**Current Version:** 1.0
**Deprecation Policy:** Not yet defined

**Future Requirements:**
- Semantic versioning for all APIs
- 12-month deprecation notice for breaking changes
- API version in URL or header
- Migration guides for major version changes

---

## Testing & Validation

### API Testing Checklist

- [ ] Unit tests for all validation rules
- [ ] Integration tests for enrollment workflows
- [ ] Permission/authorization tests for all endpoints
- [ ] Load testing for bulk operations
- [ ] Error handling verification
- [ ] Schema validation tests

### Known Test Gaps

1. No comprehensive enrollment workflow end-to-end tests
2. Permission framework testing incomplete
3. Load testing not yet performed
4. Error message standardization incomplete

---

## Related Documentation

- [STATUS.md](./STATUS.md) - Current system status and priorities
- [REQUIREMENTS.md](./REQUIREMENTS.md) - Business requirements all phases
- [DATABASE_SCHEMA_FOUNDATION.md](./DATABASE_SCHEMA_FOUNDATION.md) - Schema reference

---

*This API reference consolidates information from API_CONTRACTS.md and API_ROUTE_MAPPING.md. For questions about specific endpoints, refer to the FastAPI auto-generated docs at `/docs` when the server is running.*
