# Extensible Permission Framework

## Overview
This document defines the extensible role hierarchy and permission system for the SIS application. It provides immediate Phase A functionality while architecting for future phase expansion without over-engineering the current system.

## Current Permission Reality
**Current Implementation**: Simple enum-based roles in users.role
**Existing Roles**: admin, staff_admin, teacher, specialist
**Current Enforcement**: Basic role checks in route decorators

## Hierarchical Role System

### Phase A Role Hierarchy
```
Principal (Level 100)
├── Vice Principal (Level 90)
├── Dean (Level 80)
├── Staff Admin (Level 70)
├── Teacher (Level 50)
├── Specialist (Level 45)
├── Parent (Level 20) [Future]
└── Student (Level 10) [Future]
```

### Role Definitions

#### Administrative Roles

**Principal (Level 100)**
- Complete system access
- User management and role assignment
- School-wide policy configuration
- Cross-year data access
- Emergency override capabilities

**Vice Principal (Level 90)**
- All operational access except user management
- Academic year management
- Teacher assignment oversight
- Discipline and special program access

**Dean (Level 80)**
- Enrollment management (all tiers)
- Schedule modifications
- Teacher subject assignments
- Student academic oversight

**Staff Admin (Level 70)**
- Daily enrollment operations
- Classroom management
- Basic reporting and data entry
- Limited teacher assignment support

#### Educational Roles

**Teacher (Level 50)**
- Own classroom/homeroom management
- Student enrollment viewing (own classes)
- Grade and attendance entry
- Parent communication

**Specialist (Level 45)**
- Subject-specific access
- Cross-classroom visibility for assigned subjects
- Specialized program management
- Limited enrollment modifications

#### Future Roles (Phase B+)

**Parent (Level 20)**
- Own student data viewing
- Communication with teachers
- Schedule and grade viewing

**Student (Level 10)**
- Own schedule and grade viewing
- Limited profile management

## Permission Categories

### Core Permissions (Phase A)
```typescript
interface CorePermissions {
  // User Management
  'users.create': string[];
  'users.edit': string[];
  'users.delete': string[];
  'users.view_all': string[];
  'users.assign_roles': string[];

  // Academic Structure
  'subjects.create': string[];
  'subjects.edit': string[];
  'subjects.archive': string[];
  'classrooms.create': string[];
  'classrooms.assign_teacher': string[];

  // Enrollment Operations
  'enrollment.homeroom_bulk': string[];
  'enrollment.individual': string[];
  'enrollment.group': string[];
  'enrollment.modify': string[];
  'enrollment.drop': string[];
  'enrollment.transfer': string[];
  'enrollment.view_all': string[];
  'enrollment.view_own_classroom': string[];

  // Student Management
  'students.create': string[];
  'students.edit': string[];
  'students.view_all': string[];
  'students.view_own_classroom': string[];

  // Reporting
  'reports.enrollment': string[];
  'reports.academic_year': string[];
  'reports.teacher_assignments': string[];
}
```

### Permission Mapping (Phase A Implementation)
```python
# Simple role-to-permissions mapping for Phase A
ROLE_PERMISSIONS = {
    'admin': [
        'users.*',  # All user permissions
        'subjects.*',  # All subject permissions
        'classrooms.*',  # All classroom permissions
        'enrollment.*',  # All enrollment permissions
        'students.*',  # All student permissions
        'reports.*',  # All reporting permissions
    ],
    'staff_admin': [
        'subjects.view',
        'classrooms.create', 'classrooms.edit',
        'enrollment.homeroom_bulk', 'enrollment.individual',
        'enrollment.view_all', 'enrollment.modify',
        'students.create', 'students.edit', 'students.view_all',
        'reports.enrollment', 'reports.academic_year',
    ],
    'teacher': [
        'subjects.view',
        'classrooms.view_own',
        'enrollment.view_own_classroom',
        'students.view_own_classroom',
        'students.edit_own_classroom',  # Basic info only
    ],
    'specialist': [
        'subjects.view',
        'classrooms.view_assigned_subjects',
        'enrollment.view_own_subjects',
        'students.view_assigned_subjects',
        'enrollment.individual',  # Limited to own subjects
    ]
}
```

## Database Schema (Extensible Design)

### Phase A: Enhanced users table
```sql
-- Add to existing users table
ALTER TABLE users
ADD COLUMN hierarchy_level INTEGER DEFAULT 50,
ADD COLUMN permissions JSONB DEFAULT '[]'::jsonb,
ADD COLUMN permission_overrides JSONB DEFAULT '{}'::jsonb;

-- Update existing roles with hierarchy levels
UPDATE users SET hierarchy_level = 100 WHERE role = 'admin';
UPDATE users SET hierarchy_level = 70 WHERE role = 'staff_admin';
UPDATE users SET hierarchy_level = 50 WHERE role = 'teacher';
UPDATE users SET hierarchy_level = 45 WHERE role = 'specialist';

-- Index for performance
CREATE INDEX idx_users_hierarchy_level ON users(hierarchy_level);
CREATE INDEX idx_users_role ON users(role);
```

### Phase B+: Full Role System (Future)
```sql
-- Future enhancement - when needed for complex role management
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) UNIQUE NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  hierarchy_level INTEGER NOT NULL,
  base_permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_system_role BOOLEAN DEFAULT FALSE,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE user_role_assignments (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES users(id),
  assigned_at TIMESTAMP DEFAULT NOW(),
  effective_from DATE DEFAULT CURRENT_DATE,
  effective_to DATE NULL,
  is_primary_role BOOLEAN DEFAULT TRUE,
  PRIMARY KEY (user_id, role_id)
);

CREATE TABLE permission_overrides (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  permission_name VARCHAR(100) NOT NULL,
  permission_value BOOLEAN NOT NULL, -- grant or deny
  granted_by UUID REFERENCES users(id),
  granted_at TIMESTAMP DEFAULT NOW(),
  reason TEXT,
  expires_at TIMESTAMP NULL,
  PRIMARY KEY (user_id, permission_name)
);
```

## Implementation Strategy

### Phase A: Simple Enhancement (Current Priority)
```python
# app/auth/permissions.py
from enum import Enum
from functools import wraps
from typing import List, Set

class Permission(str, Enum):
    # Enrollment permissions
    ENROLLMENT_HOMEROOM_BULK = "enrollment.homeroom_bulk"
    ENROLLMENT_INDIVIDUAL = "enrollment.individual"
    ENROLLMENT_VIEW_ALL = "enrollment.view_all"
    ENROLLMENT_MODIFY = "enrollment.modify"

    # Student permissions
    STUDENTS_CREATE = "students.create"
    STUDENTS_EDIT = "students.edit"
    STUDENTS_VIEW_ALL = "students.view_all"

    # Subject permissions
    SUBJECTS_CREATE = "subjects.create"
    SUBJECTS_EDIT = "subjects.edit"
    SUBJECTS_ARCHIVE = "subjects.archive"

def get_user_permissions(user_role: str) -> Set[Permission]:
    """Get permissions for a user role - Phase A implementation"""
    role_permissions = {
        'admin': {
            Permission.ENROLLMENT_HOMEROOM_BULK,
            Permission.ENROLLMENT_INDIVIDUAL,
            Permission.ENROLLMENT_VIEW_ALL,
            Permission.ENROLLMENT_MODIFY,
            Permission.STUDENTS_CREATE,
            Permission.STUDENTS_EDIT,
            Permission.STUDENTS_VIEW_ALL,
            Permission.SUBJECTS_CREATE,
            Permission.SUBJECTS_EDIT,
            Permission.SUBJECTS_ARCHIVE,
        },
        'staff_admin': {
            Permission.ENROLLMENT_HOMEROOM_BULK,
            Permission.ENROLLMENT_INDIVIDUAL,
            Permission.ENROLLMENT_VIEW_ALL,
            Permission.ENROLLMENT_MODIFY,
            Permission.STUDENTS_CREATE,
            Permission.STUDENTS_EDIT,
            Permission.STUDENTS_VIEW_ALL,
        },
        'teacher': {
            # Limited permissions for teachers
        },
        'specialist': {
            Permission.ENROLLMENT_INDIVIDUAL,  # Limited scope
        }
    }
    return role_permissions.get(user_role, set())

def require_permission(permission: Permission):
    """Decorator to require specific permission for endpoint access"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Get current user from JWT token
            current_user = get_current_user()
            user_permissions = get_user_permissions(current_user.role)

            if permission not in user_permissions:
                raise HTTPException(
                    status_code=403,
                    detail=f"Insufficient permissions. Required: {permission}"
                )

            return await func(*args, **kwargs)
        return wrapper
    return decorator

def require_hierarchy_level(min_level: int):
    """Decorator to require minimum hierarchy level"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            current_user = get_current_user()
            if current_user.hierarchy_level < min_level:
                raise HTTPException(
                    status_code=403,
                    detail=f"Insufficient authority level. Required: {min_level}"
                )
            return await func(*args, **kwargs)
        return wrapper
    return decorator
```

### Usage in API Endpoints
```python
# app/routers/enrollment.py
from app.auth.permissions import require_permission, Permission

@router.post("/enrollment/homeroom/bulk")
@require_permission(Permission.ENROLLMENT_HOMEROOM_BULK)
async def create_homeroom_bulk_enrollment(
    request: HomeroomBulkEnrollmentRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Implementation
    pass

@router.get("/enrollment/students/{student_id}")
async def get_student_enrollments(
    student_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Check if user can view this specific student
    if not can_view_student(current_user, student_id, db):
        raise HTTPException(status_code=403, detail="Cannot view this student")
    # Implementation
    pass

def can_view_student(user: User, student_id: UUID, db: Session) -> bool:
    """Context-aware permission checking"""
    user_permissions = get_user_permissions(user.role)

    if Permission.STUDENTS_VIEW_ALL in user_permissions:
        return True

    # Teachers can view students in their classrooms
    if user.role == 'teacher':
        return is_student_in_user_classrooms(user.id, student_id, db)

    # Specialists can view students in their subjects
    if user.role == 'specialist':
        return is_student_in_user_subjects(user.id, student_id, db)

    return False
```

## Frontend Permission Integration

### Permission Context
```typescript
// src/auth/permissions.ts
export interface UserPermissions {
  enrollmentHomroomBulk: boolean;
  enrollmentIndividual: boolean;
  enrollmentViewAll: boolean;
  enrollmentModify: boolean;
  studentsCreate: boolean;
  studentsEdit: boolean;
  studentsViewAll: boolean;
  subjectsCreate: boolean;
  subjectsEdit: boolean;
}

export const usePermissions = (): UserPermissions => {
  const { user } = useAuth();

  return useMemo(() => {
    if (!user) return getGuestPermissions();

    return calculatePermissions(user.role, user.hierarchyLevel);
  }, [user]);
};

const calculatePermissions = (role: string, level: number): UserPermissions => {
  const permissions: UserPermissions = {
    enrollmentHomroomBulk: false,
    enrollmentIndividual: false,
    enrollmentViewAll: false,
    enrollmentModify: false,
    studentsCreate: false,
    studentsEdit: false,
    studentsViewAll: false,
    subjectsCreate: false,
    subjectsEdit: false,
  };

  // Apply role-based permissions
  if (role === 'admin') {
    Object.keys(permissions).forEach(key => {
      (permissions as any)[key] = true;
    });
  } else if (role === 'staff_admin') {
    permissions.enrollmentHomroomBulk = true;
    permissions.enrollmentIndividual = true;
    permissions.enrollmentViewAll = true;
    permissions.enrollmentModify = true;
    permissions.studentsCreate = true;
    permissions.studentsEdit = true;
    permissions.studentsViewAll = true;
  } else if (role === 'specialist') {
    permissions.enrollmentIndividual = true; // Limited scope
  }

  return permissions;
};
```

### Component-Level Permission Guards
```typescript
// src/components/PermissionGuard.tsx
interface PermissionGuardProps {
  permission: keyof UserPermissions;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  permission,
  fallback = null,
  children
}) => {
  const permissions = usePermissions();

  if (!permissions[permission]) {
    return fallback;
  }

  return <>{children}</>;
};

// Usage in enrollment components
<PermissionGuard
  permission="enrollmentHomroomBulk"
  fallback={<Alert severity="info">You don't have permission to create homeroom enrollments.</Alert>}
>
  <HomeroomBulkEnrollmentForm />
</PermissionGuard>
```

## Extension Strategy for Future Phases

### Phase B: Advanced Role Management
- Custom role creation by administrators
- Permission inheritance and overrides
- Temporary role assignments (substitutes, interim positions)
- Department-specific roles (Math Department Head, etc.)

### Phase C: Context-Aware Permissions
- Time-based permissions (during enrollment periods)
- Grade-level restricted permissions
- Subject-specific access controls
- Parent access to own children only

### Phase D: Advanced Features
- Permission delegation (teachers granting TA access)
- Approval workflows for sensitive operations
- Audit trails for all permission changes
- Compliance reporting for access controls

## Security Considerations

### Current Phase A Security
- JWT token validation on all protected endpoints
- Role hierarchy enforcement prevents privilege escalation
- Database-level constraints prevent unauthorized data modification
- Audit logging for all enrollment operations

### Future Security Enhancements
- Multi-factor authentication for administrative roles
- Session management and concurrent login controls
- IP whitelisting for administrative access
- Regular permission audits and cleanup

## Migration Path

### Immediate (Week 1)
1. Add hierarchy_level column to users table
2. Implement permission decorators in FastAPI
3. Create frontend permission context
4. Update enrollment endpoints with permission checks

### Phase A Completion (Week 2-3)
1. Complete all enrollment endpoint permission integration
2. Add context-aware permission checking
3. Implement audit logging for permission decisions
4. Create admin interface for basic role management

### Future Phases
1. Implement full role table structure when needed
2. Add permission override capabilities
3. Create advanced role management UI
4. Implement compliance and audit reporting

---
**Priority**: HIGH - Required for secure enrollment system
**Implementation Time**: 1 week for Phase A basics
**Dependencies**: Database schema updates, API endpoint modifications
**Extension Ready**: Architected for future enhancement without breaking changes