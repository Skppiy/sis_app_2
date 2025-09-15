# Database Schema Foundation

## Overview
This document defines the exact database schema required for Phase A completion, based on actual database investigation and enrollment system requirements. It addresses schema mismatches and provides migration paths.

## Schema Investigation Summary
**Current State**: 23 tables, 226 columns, 89 constraints
**Current Migration**: 20250911_fix_events_schema
**Critical Issue**: student_subject_enrollments table has only 9 columns but enrollment system requires 20+

## Core Foundation Tables

### 1. students (EXISTING - 15 columns ✅)
Current schema appears complete for Phase A needs.
```sql
students:
- id (UUID, PK)
- first_name (VARCHAR)
- last_name (VARCHAR)
- date_of_birth (DATE)
- current_grade_level (VARCHAR(5)) -- K,1,2,3,4,5,6,7,8
- student_id (VARCHAR, UNIQUE) -- External ID
- enrollment_status (ENUM)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
-- Additional fields present but not critical for enrollment
```

### 2. subjects (EXISTING - 14 columns ✅)
Includes homeroom intelligence fields - schema appears complete.
```sql
subjects:
- id (UUID, PK)
- name (VARCHAR)
- code (VARCHAR, UNIQUE)
- subject_type (ENUM: 'CORE', 'ENRICHMENT', 'SPECIAL')
- applies_to_elementary (BOOLEAN)
- applies_to_middle (BOOLEAN)
- is_homeroom_default (BOOLEAN) -- Critical for homeroom intelligence
- requires_specialist (BOOLEAN)
- allows_cross_grade (BOOLEAN)
- is_system_core (BOOLEAN)
- created_by_admin (BOOLEAN)
- is_archived (BOOLEAN)
- archived_at (TIMESTAMP)
- archived_reason (TEXT)
```

### 3. users (EXISTING - 12 columns ✅)
Teacher and staff accounts - appears functional.
```sql
users:
- id (UUID, PK)
- email (VARCHAR, UNIQUE)
- first_name (VARCHAR)
- last_name (VARCHAR)
- role (ENUM: 'admin', 'staff_admin', 'teacher', 'specialist')
- is_active (BOOLEAN)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
-- Additional authentication fields
```

### 4. classrooms (EXISTING - 10 columns ✅)
Physical classroom management - functional.
```sql
classrooms:
- id (UUID, PK)
- name (VARCHAR)
- room_number (VARCHAR)
- capacity (INTEGER)
- academic_year_id (UUID, FK)
- primary_teacher_id (UUID, FK -> users.id)
- grade_level (VARCHAR(5))
- is_homeroom (BOOLEAN)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### 5. academic_years (EXISTING ✅)
Academic year management - appears functional.

## CRITICAL: Schema Fixes Required

### student_subject_enrollments (REQUIRES IMMEDIATE FIX ❌)
**Current**: Only 9 columns
**Required**: 20+ columns for enrollment system

**Migration Required**:
```sql
-- Current schema (9 columns) - INSUFFICIENT
ALTER TABLE student_subject_enrollments
ADD COLUMN classroom_id UUID REFERENCES classrooms(id),
ADD COLUMN teacher_id UUID REFERENCES users(id),
ADD COLUMN enrollment_type VARCHAR(20) DEFAULT 'INDIVIDUAL'
  CHECK (enrollment_type IN ('HOMEROOM', 'INDIVIDUAL', 'GROUP')),
ADD COLUMN enrollment_status VARCHAR(20) DEFAULT 'ACTIVE'
  CHECK (enrollment_status IN ('ACTIVE', 'DROPPED', 'COMPLETED')),
ADD COLUMN enrolled_at TIMESTAMP DEFAULT NOW(),
ADD COLUMN enrolled_by UUID REFERENCES users(id),
ADD COLUMN dropped_at TIMESTAMP NULL,
ADD COLUMN dropped_reason TEXT NULL,
ADD COLUMN grade_level VARCHAR(5),
ADD COLUMN is_homeroom_core BOOLEAN DEFAULT FALSE,
ADD COLUMN notes TEXT NULL,
ADD COLUMN created_at TIMESTAMP DEFAULT NOW(),
ADD COLUMN updated_at TIMESTAMP DEFAULT NOW();

-- Add indexes for performance
CREATE INDEX idx_student_subject_enrollments_student ON student_subject_enrollments(student_id);
CREATE INDEX idx_student_subject_enrollments_subject ON student_subject_enrollments(subject_id);
CREATE INDEX idx_student_subject_enrollments_classroom ON student_subject_enrollments(classroom_id);
CREATE INDEX idx_student_subject_enrollments_teacher ON student_subject_enrollments(teacher_id);
CREATE INDEX idx_student_subject_enrollments_academic_year ON student_subject_enrollments(academic_year_id);
CREATE INDEX idx_student_subject_enrollments_enrollment_type ON student_subject_enrollments(enrollment_type);
CREATE INDEX idx_student_subject_enrollments_status ON student_subject_enrollments(enrollment_status);
```

### teacher_subject_assignments (EXISTING - 7 columns ✅)
Appears adequate for Phase A but may need enhancement for subject swaps.

## New Tables Required for Full Enrollment System

### homeroom_assignments (NEW TABLE REQUIRED)
Track homeroom teacher to student relationships.
```sql
CREATE TABLE homeroom_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  classroom_id UUID NOT NULL REFERENCES classrooms(id) ON DELETE RESTRICT,
  academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
  grade_level VARCHAR(5) NOT NULL,
  assigned_at TIMESTAMP NOT NULL DEFAULT NOW(),
  assigned_by UUID NOT NULL REFERENCES users(id),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- Constraints
  UNIQUE(student_id, academic_year_id), -- One homeroom per student per year
  CHECK (grade_level IN ('K','1','2','3','4','5','6','7','8'))
);

CREATE INDEX idx_homeroom_assignments_teacher ON homeroom_assignments(teacher_id);
CREATE INDEX idx_homeroom_assignments_student ON homeroom_assignments(student_id);
CREATE INDEX idx_homeroom_assignments_classroom ON homeroom_assignments(classroom_id);
CREATE INDEX idx_homeroom_assignments_academic_year ON homeroom_assignments(academic_year_id);
```

### enrollment_batches (NEW TABLE - OPTIONAL FOR v1)
Track bulk enrollment operations for audit and rollback.
```sql
CREATE TABLE enrollment_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_type VARCHAR(20) NOT NULL CHECK (batch_type IN ('HOMEROOM', 'GROUP', 'INDIVIDUAL')),
  academic_year_id UUID NOT NULL REFERENCES academic_years(id),
  initiated_by UUID NOT NULL REFERENCES users(id),
  status VARCHAR(20) DEFAULT 'IN_PROGRESS'
    CHECK (status IN ('IN_PROGRESS', 'COMPLETED', 'FAILED', 'ROLLED_BACK')),
  total_students INTEGER NOT NULL DEFAULT 0,
  successful_enrollments INTEGER NOT NULL DEFAULT 0,
  failed_enrollments INTEGER NOT NULL DEFAULT 0,
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP NULL,
  metadata JSONB NULL, -- Store batch-specific data
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_enrollment_batches_academic_year ON enrollment_batches(academic_year_id);
CREATE INDEX idx_enrollment_batches_initiated_by ON enrollment_batches(initiated_by);
CREATE INDEX idx_enrollment_batches_status ON enrollment_batches(status);
```

## Extension Points for Future Phases

### Role Hierarchy Foundation
Current users.role enum supports basic roles. For extensible permission framework:
```sql
-- Future enhancement (Phase B/C)
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) UNIQUE NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  hierarchy_level INTEGER NOT NULL, -- Higher = more permissions
  permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_system_role BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE user_role_assignments (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES users(id),
  assigned_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (user_id, role_id)
);
```

### Scheduling Foundation (Phase Az)
```sql
-- Future tables for scheduling system
CREATE TABLE time_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  academic_year_id UUID REFERENCES academic_years(id)
);

CREATE TABLE schedule_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  grade_levels VARCHAR(20)[], -- Array of applicable grades
  time_blocks UUID[] NOT NULL, -- Array of time_block IDs
  academic_year_id UUID REFERENCES academic_years(id)
);
```

## Migration Strategy

### Phase 1: Critical Fixes (IMMEDIATE)
1. **Fix student_subject_enrollments schema** - Add missing columns
2. **Create homeroom_assignments table** - Enable homeroom intelligence
3. **Update SQLAlchemy models** - Match database reality
4. **Test data integrity** - Ensure existing data preserved

### Phase 2: Enrollment Enhancement (Week 2)
1. **Add enrollment_batches table** - Audit trail for bulk operations
2. **Implement proper foreign keys** - Data integrity constraints
3. **Add performance indexes** - Query optimization
4. **Create database views** - Simplified enrollment queries

### Phase 3: Extension Preparation (Future)
1. **Role hierarchy tables** - Extensible permission system
2. **Scheduling foundation** - Time blocks and templates
3. **Audit logging** - Comprehensive change tracking
4. **Soft delete framework** - Data preservation

## Data Integrity Rules

### Enrollment Constraints
- One enrollment per student per subject per academic year
- Grade level must match subject applicability
- Teacher must be qualified for specialist subjects
- Classroom capacity cannot be exceeded

### Referential Integrity
- All foreign keys must be properly constrained
- Cascade deletes only for dependent data (enrollments when student deleted)
- Restrict deletes for referenced entities (teachers, subjects, classrooms)

### Audit Requirements
- Track who created/modified enrollment records
- Timestamp all operations
- Preserve historical data through soft deletes where possible

## Performance Considerations

### Critical Indexes
- student_subject_enrollments: Multiple composite indexes for common queries
- homeroom_assignments: Teacher, student, academic year lookups
- subjects: Type-based filtering for homeroom defaults

### Query Optimization
- Enrollment list queries should use joins not N+1 selects
- Grade level filtering should use indexes
- Academic year scoping essential for all enrollment queries

---
**Priority**: CRITICAL - Enables enrollment system
**Migration Risk**: MEDIUM - Requires careful schema updates
**Rollback Plan**: Full database backup before any schema changes