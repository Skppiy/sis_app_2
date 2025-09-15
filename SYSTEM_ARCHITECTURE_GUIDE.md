# K-8 School Information System (SIS) - Architecture Guide

## System Overview
This is a comprehensive K-8 School Information System built with:
- **Backend**: FastAPI + SQLAlchemy + PostgreSQL
- **Frontend**: React + TypeScript + Material-UI + Vite
- **Database**: PostgreSQL with Alembic migrations
- **Authentication**: JWT-based with role-based access control

## Key System Concepts

### Three-Tier Enrollment System
The system supports three educational models:
1. **Elementary/Homeroom**: One teacher teaches all core subjects to same group of students
2. **Departmentalized**: Students move between specialized teachers for different subjects
3. **Specialist/Mixed**: Combination with special programs and accommodations

### Core Data Models

#### Students & Users
- **Student**: Core student information (name, grade, demographics)
- **User**: Authentication and role management (admin, teacher, parent)
- **Parent**: Parent/guardian information with student relationships

#### Academic Structure
- **AcademicYear**: School year management (2024-2025, etc.)
- **Subject**: Curriculum subjects (Math, English, Science, etc.)
- **Room**: Physical classroom spaces
- **Classroom**: Teaching sessions (combination of subject + teacher + room + year)

#### Enrollment System (Robust Model)
- **StudentSubjectEnrollment**: The main enrollment model supporting all scenarios
  - Handles homeroom, departmentalized, and specialist enrollments
  - Tracks enrollment_type, enrollment_status, accommodation needs
  - Supports flexible scheduling and special programs

#### Teacher Management
- **ClassroomTeacherAssignment**: Teachers assigned to classrooms with specific roles and permissions
- **TeacherSubjectSwap**: System for requesting and managing teacher reassignments

## Directory Structure

### Backend (`/backend`)
```
app/
├── main.py                 # FastAPI application entry point
├── deps.py                 # Dependency injection (auth, db sessions)
├── models/                 # SQLAlchemy ORM models
│   ├── __init__.py
│   ├── user.py            # User authentication model
│   ├── student.py         # Student information model
│   ├── classroom.py       # Classroom model
│   ├── subject.py         # Academic subjects
│   ├── academic_year.py   # School year management
│   ├── room.py           # Physical rooms
│   ├── student_subject_enrollment.py  # MAIN ENROLLMENT MODEL
│   ├── classroom_teacher_assignment.py
│   ├── teacher_subject_assignment.py
│   └── teacher_subject_swap.py
├── routers/               # API endpoint controllers
│   ├── auth.py           # Authentication endpoints
│   ├── students.py       # Student management
│   ├── classrooms.py     # Classroom operations
│   ├── subjects.py       # Subject management
│   ├── enrollments.py    # Enrollment operations
│   ├── admin.py          # Administrative functions
│   └── homeroom.py       # Homeroom intelligence system
├── schemas/               # Pydantic models for API
│   ├── student.py        # Student API schemas
│   ├── classroom.py      # Classroom API schemas
│   ├── subject.py        # Subject API schemas
│   ├── enhanced_enrollment.py  # Enrollment API schemas
│   └── threeTierEnrollment.ts  # TypeScript enrollment schemas
├── services/              # Business logic layer
│   ├── enrollment_service.py    # Enrollment business logic
│   ├── homeroom_service.py     # Homeroom intelligence
│   └── grade_data_service.py   # Academic data processing
alembic/                   # Database migrations
├── versions/             # Migration files
└── alembic.ini          # Migration configuration
```

### Frontend (`/frontend`)
```
src/
├── main.tsx              # React application entry point
├── router.tsx            # React Router configuration
├── api/                  # API communication layer
│   ├── client.ts         # HTTP client setup
│   └── queryKeys.ts      # React Query cache keys
├── components/           # Reusable UI components
│   └── students/         # Student-specific components
│       ├── StudentGrid.tsx        # Main student display
│       └── EnhancedStudentCard.tsx # Detailed student cards
├── features/             # Feature-based organization
│   ├── academics/        # Academic management features
│   │   ├── components/   # Academic-specific components
│   │   ├── hooks/        # React hooks for academic data
│   │   ├── pages/        # Academic page components
│   │   └── services/     # Academic API services
│   └── enrollment/       # Enrollment management
│       ├── hooks/        # Enrollment data hooks
│       ├── pages/        # Enrollment pages
│       └── services/     # Enrollment API calls
├── layouts/              # Page layout components
├── schemas/              # TypeScript type definitions
│   ├── academics.ts      # Academic data types
│   ├── students.ts       # Student data types
│   └── threeTierEnrollment.ts  # Enrollment types
└── pages/               # Top-level page components
```

## Key Files Explained

### Critical Backend Files

#### `models/student_subject_enrollment.py`
**THE MOST IMPORTANT MODEL** - This is the robust enrollment system that handles:
- Homeroom core subject enrollments
- Specialized subject enrollments
- Accommodation tracking
- Flexible scheduling
- Three-tier system support

#### `routers/classrooms.py`
- Classroom CRUD operations
- **Recently fixed**: Now calculates actual enrollment counts from StudentSubjectEnrollment
- Supports homeroom creation with teacher assignments

#### `routers/enrollments.py`
- Bulk homeroom enrollment operations
- Individual enrollment management
- Conflict detection and resolution

#### `services/enrollment_service.py`
- Business logic for enrollment operations
- Handles bulk operations
- Grade-level enrollment logic

#### `services/homeroom_service.py`
- "Homeroom Intelligence System" - automatically assigns teachers to subjects
- Handles elementary homeroom model where one teacher teaches multiple subjects

### Critical Frontend Files

#### `components/students/StudentGrid.tsx`
- Main student display interface
- **Recently fixed**: Now properly displays enrollment counts
- Supports both regular and enhanced student cards

#### `features/enrollment/services/studentSubjectEnrollments.ts`
- **Recently fixed**: API calls to correct endpoints
- Fetches enrollment data for student cards

#### `features/academics/pages/ClassroomsPage.tsx`
- Main classroom management interface
- Displays enrollment counts (currently being debugged)

## Database Schema Key Points

### StudentSubjectEnrollment Table
The core of the enrollment system with fields:
- `student_id`, `classroom_id` - Primary relationships
- `enrollment_type` - "HOMEROOM_CORE", "DEPARTMENTALIZED", "SPECIALIST"
- `enrollment_status` - "ACTIVE", "INACTIVE", "WITHDRAWN"
- `is_active` - Boolean flag for active enrollments
- `requires_accommodation` - Special needs tracking
- `is_homeroom_core` - Identifies core homeroom subjects

### Classroom Table
- Links Subject + Teacher + Room + Academic Year
- `enrollment_count` - Calculated field (not stored, computed dynamically)
- Supports different `classroom_type` - "CORE", "ENRICHMENT", "SPECIAL", "HOMEROOM"

## Configuration Files

### `alembic.ini` & Migration Files
- Database schema versioning
- Migration history in `alembic/versions/`
- Recent migrations include homeroom intelligence system

### `package.json` (Frontend)
- React + TypeScript + Vite setup
- Material-UI component library
- React Query for state management

### `.env` Files
- Database connection strings
- API configuration
- Authentication secrets

## System Workflows

### Student Enrollment Process
1. Create student record
2. Assign to academic year
3. Use bulk homeroom enrollment for elementary students
4. Creates StudentSubjectEnrollment records for each core subject
5. Optional: Add specialized subjects or accommodations

### Classroom Management
1. Create subjects for the academic year
2. Create rooms if needed
3. Create classrooms (subject + year combination)
4. Assign teachers to classrooms via ClassroomTeacherAssignment
5. Enroll students via StudentSubjectEnrollment

### Homeroom Intelligence
1. Automatically creates all core subject classrooms for a homeroom teacher
2. Assigns teacher to all created classrooms
3. Enables bulk enrollment of grade-level students to all subjects at once

## API Endpoints Structure

### Authentication: `/auth`
- Login, token refresh, user context

### Students: `/students`
- CRUD operations, enrollment fetching, academic records

### Classrooms: `/classrooms`
- Classroom management, teacher assignments, enrollment counts

### Enrollments: `/enrollments`
- Individual and bulk enrollment operations

### Subjects: `/subjects`
- Subject management, archival, grade-level filtering

### Admin: `/admin`
- User management, teacher operations, system administration

### Homeroom: `/homeroom`
- Homeroom intelligence operations, teacher-subject assignments

## Recent Bug Fixes Applied

1. **Student Card Enrollment Display**: Fixed import paths and API endpoints
2. **Enhanced Student Cards**: Created proper data-fetching wrappers
3. **Schema Override Issue**: Fixed Pydantic schema that was overriding calculated enrollment counts
4. **Classroom Enrollment Calculation**: Added dynamic calculation from StudentSubjectEnrollment table

## Current Architecture Strengths

1. **Flexible Enrollment System**: Handles all K-8 scenarios from elementary homeroom to departmentalized
2. **Role-Based Access**: Teachers, admins, parents have appropriate permissions
3. **Audit Trail**: Database tracks enrollment history and changes
4. **Scalable Frontend**: Component-based architecture with proper state management
5. **Type Safety**: Full TypeScript implementation with schema validation

## Areas for Future Enhancement

1. **Student Detail Page**: Individual student academic records and history
2. **Advanced Reporting**: Academic progress tracking and analytics
3. **Parent Portal**: Parent access to student information
4. **Scheduling System**: Advanced timetable and schedule management
5. **Gradebook Integration**: Assessment and grading functionality

---
*This document serves as the architectural foundation for understanding and extending the SIS system.*