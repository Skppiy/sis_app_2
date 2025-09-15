# Enrollment System Requirements

## Overview
The enrollment system is the **critical blocker** for Phase A completion. It implements a three-tier enrollment workflow designed specifically for K-8 private schools with distinct elementary (K-5) homeroom and middle school (6-8) individual class models.

## Current Database Reality
Based on schema investigation, these enrollment-related tables exist:

### Core Tables
- **students**: 15 columns - Basic student information with grade levels
- **subjects**: 14 columns - Subject definitions with homeroom intelligence flags
- **classrooms**: 10 columns - Physical classroom assignments with teacher relationships
- **users**: 12 columns - Teacher/staff user accounts
- **student_subject_enrollments**: 9 columns - Individual enrollment records (MISMATCH: Expected 20+)
- **teacher_subject_assignments**: 7 columns - Teacher-to-subject assignments

### Missing Tables for Full Enrollment
- **homeroom_assignments**: Not found - Critical for homeroom intelligence
- **enrollment_batches**: Not found - For bulk enrollment tracking
- **enrollment_workflows**: Not found - For tracking multi-step processes

## Three-Tier Enrollment System

### Tier 1: Homeroom Enrollment (CORE Subjects)
**Purpose**: Bulk enrollment of elementary students in CORE subjects through homeroom teacher assignment

**Process Flow**:
1. Select grade level students
2. Choose homeroom teacher
3. Auto-assign CORE subjects (Math, ELA, Science, Social Studies, Reading)
4. Create classroom relationships
5. Bulk create enrollment records

**Database Requirements**:
```sql
-- Enhanced student_subject_enrollments table
student_subject_enrollments:
- id (UUID, PK)
- student_id (UUID, FK -> students.id)
- subject_id (UUID, FK -> subjects.id)
- classroom_id (UUID, FK -> classrooms.id)
- teacher_id (UUID, FK -> users.id)
- academic_year_id (UUID, FK -> academic_years.id)
- enrollment_type (ENUM: 'HOMEROOM', 'INDIVIDUAL', 'GROUP')
- enrollment_status (ENUM: 'ACTIVE', 'DROPPED', 'COMPLETED')
- enrolled_at (TIMESTAMP)
- enrolled_by (UUID, FK -> users.id)
- dropped_at (TIMESTAMP, NULL)
- dropped_reason (TEXT, NULL)
- grade_level (VARCHAR(5)) -- K, 1, 2, 3, 4, 5, 6, 7, 8
- is_homeroom_core (BOOLEAN) -- True for homeroom-assigned CORE subjects
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

**API Endpoints Required**:
- `POST /api/enrollment/homeroom/bulk` - Bulk homeroom enrollment
- `GET /api/enrollment/homeroom/preview` - Preview enrollment results
- `GET /api/subjects/homeroom-defaults/{grade_level}` - Get CORE subjects for grade

### Tier 2: Group Enrollment (Non-CORE Subjects)
**Purpose**: Flexible enrollment for specials, electives, and enrichment programs

**Process Flow**:
1. Select subject (Art, Music, PE, etc.)
2. Choose enrollment strategy (by grade, by group, mixed)
3. Create balanced groups
4. Assign specialist teachers
5. Create enrollment records

**Status**: Temporarily disabled in UI - Implementation needed

### Tier 3: Individual Enrollment (Special Cases)
**Purpose**: Handle special circumstances, accommodations, schedule conflicts

**Process Flow**:
1. Find specific student
2. Review current schedule
3. Select available class/subject
4. Check prerequisites/requirements
5. Add accommodations if needed
6. Confirm individual enrollment

**Status**: Temporarily disabled in UI - Implementation needed

## Current Implementation Status

### Working Components
✅ **Subjects Management**: CORE subjects properly identified with `is_homeroom_default` flag
✅ **Students Management**: Grade level tracking functional
✅ **Teachers Management**: User accounts and assignments working
✅ **Classrooms Management**: Homeroom intelligence concept implemented

### Critical Gaps
❌ **Homeroom Workflow**: Component exists but needs backend integration
❌ **Bulk Enrollment API**: Missing endpoint for homeroom assignments
❌ **Schema Mismatch**: student_subject_enrollments table incomplete
❌ **Group/Individual Workflows**: Components disabled, no backend support

## Technical Requirements

### Database Schema Updates
1. **Fix student_subject_enrollments table** - Add missing columns per schema above
2. **Create homeroom_assignments table** - Track homeroom-to-student relationships
3. **Add enrollment audit trail** - Track who enrolled whom and when
4. **Implement soft deletes** - Allow enrollment corrections without data loss

### API Contracts
```typescript
// Homeroom Enrollment Request
interface HomeroomEnrollmentRequest {
  students: string[]; // UUIDs
  teacher_id: string; // UUID
  academic_year_id: string; // UUID
  grade_level: string;
  subjects: string[]; // CORE subject UUIDs
  classroom_id?: string; // Optional specific classroom
}

// Enrollment Response
interface EnrollmentResponse {
  success: boolean;
  enrollment_count: number;
  students_affected: number;
  created_enrollments: string[]; // UUIDs of created records
  warnings: string[];
  errors: string[];
}
```

### Frontend Components Status
- **ThreeTierEnrollmentManager**: Main dialog implemented ✅
- **HomeroomEnrollmentWorkflow**: Implemented but needs backend connection ❌
- **GroupEnrollmentWorkflow**: Disabled pending implementation ❌
- **IndividualEnrollmentWorkflow**: Disabled pending implementation ❌

## Business Rules

### CORE Subjects (Homeroom Intelligence)
- Only CORE subjects can be assigned via homeroom enrollment
- CORE subjects: Math, ELA, Science, Social Studies, Reading
- Elementary (K-5): All CORE subjects taught by homeroom teacher
- Middle School (6-8): CORE subjects may have specialist teachers

### Enrollment Constraints
- Students can only be enrolled in one section per subject per academic year
- Grade-level restrictions enforced (subjects.applies_to_elementary/middle)
- Teacher qualifications checked for specialist subjects
- Classroom capacity limits respected

### Permission Requirements
- **Homeroom Enrollment**: Requires Staff Admin or higher
- **Group Enrollment**: Requires Staff Admin or higher
- **Individual Enrollment**: Requires Dean or higher
- **Enrollment Modifications**: Requires same or higher level than creator

## Success Criteria
1. **Homeroom Workflow Complete**: Elementary teachers can be assigned with all students getting CORE subjects automatically
2. **Data Integrity**: No enrollment conflicts, proper audit trail
3. **Performance**: Bulk enrollment of 100+ students completes in <5 seconds
4. **User Experience**: Intuitive three-tier selection with clear process steps
5. **Extensibility**: Framework supports Group and Individual workflows when implemented

## Immediate Next Steps
1. Fix student_subject_enrollments schema mismatch
2. Implement bulk homeroom enrollment API endpoint
3. Connect HomeroomEnrollmentWorkflow to real backend
4. Add proper error handling and validation
5. Test with real data in development environment

---
**Priority**: CRITICAL - Blocking Phase A completion
**Estimated Effort**: 2-3 weeks full implementation
**Dependencies**: Database schema fix, API development, frontend integration