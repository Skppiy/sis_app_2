# API Contracts - Enrollment System

## Overview
This document defines the exact API endpoints, request/response schemas, and contracts required for the enrollment system. Based on existing backend structure and frontend component requirements.

## Current API Analysis
**Backend Framework**: FastAPI with Pydantic schemas
**Existing Enrollment Routes**: Limited - needs expansion
**Authentication**: JWT-based with role permissions

## Homeroom Enrollment API

### Bulk Homeroom Enrollment
**Endpoint**: `POST /api/enrollment/homeroom/bulk`
**Purpose**: Enroll multiple students in CORE subjects via homeroom teacher assignment
**Permissions**: Staff Admin or higher

```typescript
// Request Schema
interface HomeroomBulkEnrollmentRequest {
  academic_year_id: string; // UUID
  teacher_id: string; // UUID - homeroom teacher
  classroom_id?: string; // UUID - optional specific classroom
  grade_level: string; // K,1,2,3,4,5,6,7,8
  students: string[]; // UUID array - student IDs
  subjects: string[]; // UUID array - CORE subject IDs
  notes?: string; // Optional enrollment notes
}

// Response Schema
interface HomeroomBulkEnrollmentResponse {
  success: boolean;
  enrollment_batch_id: string; // UUID for tracking
  results: {
    total_students: number;
    successful_enrollments: number;
    failed_enrollments: number;
    created_enrollments: string[]; // UUID array of created records
  };
  homeroom_assignment: {
    id: string; // UUID
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

// FastAPI Pydantic Models
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

### Preview Homeroom Enrollment
**Endpoint**: `POST /api/enrollment/homeroom/preview`
**Purpose**: Preview enrollment results before committing
**Permissions**: Staff Admin or higher

```typescript
// Request Schema (same as bulk enrollment)
interface HomeroomPreviewRequest extends HomeroomBulkEnrollmentRequest {}

// Response Schema
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

### Get Homeroom Defaults
**Endpoint**: `GET /api/subjects/homeroom-defaults/{grade_level}`
**Purpose**: Get CORE subjects applicable to specific grade level
**Permissions**: Teacher or higher

```typescript
// Response Schema
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

// FastAPI Implementation
@router.get("/subjects/homeroom-defaults/{grade_level}")
async def get_homeroom_defaults(
    grade_level: str,
    db: Session = Depends(get_db)
) -> HomeroomDefaultsResponse:
    # Query subjects where:
    # - is_homeroom_default = True
    # - applies_to_elementary = True (for K-5) OR applies_to_middle = True (for 6-8)
    # - is_archived = False
```

## Individual Enrollment API

### Create Individual Enrollment
**Endpoint**: `POST /api/enrollment/individual`
**Purpose**: Enroll single student in specific subject/classroom
**Permissions**: Dean or higher

```typescript
// Request Schema
interface IndividualEnrollmentRequest {
  student_id: string; // UUID
  subject_id: string; // UUID
  classroom_id: string; // UUID
  teacher_id: string; // UUID
  academic_year_id: string; // UUID
  enrollment_reason?: string; // Special circumstances
  accommodations?: string; // Special needs notes
}

// Response Schema
interface IndividualEnrollmentResponse {
  success: boolean;
  enrollment: {
    id: string; // UUID
    student_name: string;
    subject_name: string;
    teacher_name: string;
    classroom_name: string;
    enrolled_at: string; // ISO timestamp
  };
  warnings: string[];
  errors: string[];
}
```

## Enrollment Management API

### Get Student Enrollments
**Endpoint**: `GET /api/enrollment/students/{student_id}`
**Purpose**: Get all enrollments for a specific student
**Permissions**: Staff Admin or higher

```typescript
// Query Parameters
interface StudentEnrollmentParams {
  academic_year_id?: string; // UUID - filter by year
  include_dropped?: boolean; // Include dropped enrollments
  subject_type?: 'CORE' | 'ENRICHMENT' | 'SPECIAL'; // Filter by type
}

// Response Schema
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
    enrolled_at: string; // ISO timestamp
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

### Get Classroom Enrollments
**Endpoint**: `GET /api/enrollment/classrooms/{classroom_id}`
**Purpose**: Get all enrollments for a specific classroom
**Permissions**: Teacher or higher (own classroom) / Staff Admin (all classrooms)

```typescript
// Response Schema
interface ClassroomEnrollmentsResponse {
  classroom: {
    id: string;
    name: string;
    capacity: number;
    grade_level: string;
    primary_teacher: {
      id: string;
      name: string;
    };
  };
  academic_year: {
    id: string;
    name: string;
  };
  enrollments_by_subject: {
    subject: {
      id: string;
      name: string;
      code: string;
      subject_type: string;
    };
    teacher: {
      id: string;
      name: string;
    };
    students: {
      id: string;
      name: string;
      enrollment_type: string;
      enrolled_at: string;
    }[];
    total_students: number;
  }[];
  summary: {
    total_students: number;
    total_subjects: number;
    homeroom_students: number;
    individual_enrollments: number;
  };
}
```

## Enrollment Modification API

### Drop Student Enrollment
**Endpoint**: `DELETE /api/enrollment/{enrollment_id}`
**Purpose**: Drop student from specific enrollment (soft delete)
**Permissions**: Staff Admin or higher

```typescript
// Request Schema
interface DropEnrollmentRequest {
  drop_reason: string; // Required reason for dropping
  effective_date?: string; // ISO date - default to today
}

// Response Schema
interface DropEnrollmentResponse {
  success: boolean;
  enrollment: {
    id: string;
    student_name: string;
    subject_name: string;
    dropped_at: string; // ISO timestamp
    dropped_reason: string;
  };
  impact_analysis: {
    affects_graduation_requirements: boolean;
    affects_homeroom_assignment: boolean;
    replacement_suggestions: string[];
  };
}
```

### Transfer Student Enrollment
**Endpoint**: `PUT /api/enrollment/{enrollment_id}/transfer`
**Purpose**: Transfer student to different classroom/teacher for same subject
**Permissions**: Dean or higher

```typescript
// Request Schema
interface TransferEnrollmentRequest {
  new_classroom_id: string; // UUID
  new_teacher_id: string; // UUID
  transfer_reason: string;
  effective_date?: string; // ISO date
}

// Response Schema
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
    transferred_at: string; // ISO timestamp
  };
  warnings: string[];
  errors: string[];
}
```

## Validation and Error Handling

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
```

### Standard Error Responses
```typescript
interface APIError {
  error_type: 'VALIDATION_ERROR' | 'PERMISSION_ERROR' | 'CONFLICT_ERROR' | 'NOT_FOUND' | 'SERVER_ERROR';
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

## Authentication and Permissions

### Required Headers
```typescript
// All enrollment endpoints require authentication
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

## Implementation Status

### Existing Endpoints (To Verify)
✅ Basic student/subject/classroom CRUD operations
✅ Authentication and role-based access
❌ Bulk homeroom enrollment - **MISSING**
❌ Enrollment preview - **MISSING**
❌ Individual enrollment workflow - **MISSING**
❌ Enrollment modification APIs - **MISSING**

### Required Backend Implementation
1. **Homeroom enrollment service** - Core business logic
2. **Enrollment validation service** - Conflict checking
3. **Bulk operation handling** - Transaction management
4. **Audit trail service** - Track all enrollment changes
5. **Permission middleware** - Role-based endpoint access

---
**Priority**: CRITICAL - Enables enrollment system frontend
**Dependencies**: Database schema fixes, FastAPI endpoint implementation
**Testing Requirements**: Integration tests with real enrollment scenarios