# SIS Requirements - All Phases

**Version:** 1.1
**Source:** SIS_Business_Requirements_All_Phases_Cohesive.pdf
**Last Updated:** 2025-10-17
**Status Legend:** ☐ Not Started | ☑ In Progress | ✅ Complete

---

## 📑 Table of Contents

1. [Executive Summary](#executive-summary)
2. [Project Objectives & Goals](#project-objectives--goals)
3. [Phase A: Core Setup & Academic Structure](#phase-a-core-setup--academic-structure)
4. [Phase B: Curriculum & Lesson Planning](#phase-b-curriculum--lesson-planning)
5. [Phase C: Advanced Grading & Assessment](#phase-c-advanced-grading--assessment)
6. [Phase D: Communication & Engagement](#phase-d-communication--engagement)
7. [Phase E: Reporting & Analytics](#phase-e-reporting--analytics)
8. [Phase F: Future & Integrations](#phase-f-future--integrations)
9. [Cross-Phase Dependencies](#cross-phase-dependencies)
10. [Role Permissions Matrix](#role-permissions-matrix)

---

## Executive Summary

### Background & Current Challenges

Current SIS solutions in K-8 private schools fail to provide seamless integration between administrative, instructional, and parental engagement functions. Key pain points:

- **Teachers:** Multiple disconnected tools, duplicated data entry, poor year-to-year continuity
- **Parents:** Fragmented information, delayed updates, unhelpful portals
- **Administrators:** Data silos, limited reporting, lack of analytics for decision-making

### Primary Objectives

Deliver a best-in-class SIS platform that:

✅ Enhances collaboration between teachers, parents, and administrators
✅ Centralizes key academic and operational data into one secure system
✅ Provides intuitive, role-based interfaces tailored for each user type
✅ Streamlines administrative tasks (scheduling, grading, reporting)
✅ Offers powerful analytics for tracking student performance year over year
✅ Integrates specialists into scheduling and reporting from the start
✅ Supports both structured (middle school) and flexible (grade school) scheduling models
✅ Lays groundwork for AI-assisted recommendations

---

## Project Objectives & Goals

### Core Goals

- ✅ **Integration:** Unify scheduling, attendance, grading, and communication
- ✅ **Usability:** Intuitive, role-based interfaces
- ✅ **Analytics:** Year-over-year student and teacher performance tracking
- ✅ **Flexibility:** Support K-5 flexible and 6-8 structured scheduling
- ☐ **Intelligence:** AI-assisted scheduling and workload balancing (Phase F)

### Key Stakeholders

| Stakeholder | Primary Needs | Access Level |
|-------------|---------------|--------------|
| **Administrators** | Configuration, oversight, analytics, compliance | Full |
| **Teachers** | Attendance, grading, scheduling tools | Own classes |
| **Specialists** | Schedule coordination, caseload management | Assigned students |
| **Parents/Guardians** | Real-time progress, easy communication | Own children |
| **Students** | Organized schedules, clear performance data | Own data |

---

## Phase A: Core Setup & Academic Structure

**Status:** ☑ In Progress (~75% complete)
**Target:** Phase A/1 completion pending 3 critical fixes

### 1. School Setup ✅

- ✅ School creation and configuration
- ✅ Academic year setup with terms
- ✅ Bell schedules and calendars
- ☐ District support (optional at MVP)

### 2. Student, Teacher, Specialist Onboarding ✅

- ✅ Student profiles with FERPA compliance
- ✅ Teacher profiles with assignment tracking
- ✅ Specialist profiles with caseload management
- ✅ Admin role hierarchy (Principal, VP, Dean, Staff Admin)

### 3. Core Subject and Special Creation ✅

- ✅ Subject library with type classification (CORE, ENRICHMENT, SPECIAL)
- ✅ Time allocation configuration
- ✅ Grade-level applicability (K-5 vs 6-8)
- ✅ Homeroom default flags

### 4. Classroom & Room Management ✅

- ✅ Classroom creation with grade levels
- ✅ Room assignment and capacity management
- ✅ Teacher assignment to classrooms
- ✅ Classroom type classification (Homeroom, Subject, Special)

---

### 5. Scheduling Framework ☑

**Status:** In Progress - Core working, enrollment workflows need fixes

#### 5.1 Core Scheduling

**Grade School (K-5):**
- ✅ Admin assigns specials (locked blocks with weekly minutes)
- ✅ Teachers arrange core subjects around specials
- ✅ Partner-teaching and student swaps allowed
- ✅ Weekly minute constraints enforced, not daily

**Middle School (6-8):**
- ✅ Admin builds master schedule (rotations, rooms, teachers)
- ☐ Teachers may adjust non-core enrichment with admin approval

#### 5.2 Calendar UI Requirements

- ☐ True calendar views (day/week/month)
- ☐ Time blocks with custom start/end
- ☐ Color coding by subject/teacher/grade
- ☐ Conflict detection for teacher, student, and room overlaps
- ☐ Views/filters: By Teacher, Grade, Student, Subject
- ☐ Click block → open attendance for that period
- ☐ Future: Lesson plans and attachments visible from calendar (Phase B)

---

### 6. Enrollment System ☑

**Status:** Core logic implemented, UI workflows broken

> **🔑 KEY DECISION** (2025-09-26)
> **Three-Tier Enrollment System**
> - **Tier 1 (Homeroom):** CORE subjects enrolled in bulk via homeroom teacher
> - **Tier 2 (Group):** Non-CORE subjects with flexible teacher distribution
> - **Tier 3 (Individual):** Special cases, accommodations, cross-grade
>
> **Rationale:** Balances efficiency (bulk homeroom) with flexibility (individual edge cases)

#### 6.1 Tier 1: Homeroom Bulk Enrollment

- ✅ Backend logic implemented (`EnrollmentService.bulk_homeroom_enrollment()`)
- ❌ **CRITICAL:** Frontend display broken - only shows room name, not full classroom
  - **Need:** "Lisa Anderson's Grade 1 Homeroom (Room 102, 5 students)"
  - **File:** `HomeroomBulkEnrollmentWorkflow.tsx`
- ❌ **CRITICAL:** Grade-level filtering missing

**Requirements:**
- ☑ Enroll multiple students in CORE subjects simultaneously
- ☑ Auto-assign homeroom teacher to all CORE classes
- ☑ Validate capacity and conflicts
- ☐ **FIX:** Display teacher name, grade, room, student count
- ☐ **FIX:** Filter classrooms by grade level

#### 6.2 Tier 2: Group/Flexible Enrollment

- ✅ Backend implemented (`EnrollmentService.flexible_subject_enrollment()`)
- ☐ Frontend workflow (disabled/not tested yet)

**Requirements:**
- ✅ Non-CORE subjects with teacher distribution
- ✅ Balance students across available teachers
- ☐ UI workflow completion

#### 6.3 Tier 3: Individual Enrollment

- ✅ Backend basic structure
- ❌ **HIGH PRIORITY:** Business rule enforcement missing
  - **Need:** Filter out CORE classes when multiple students selected
  - **Need:** Grade-level filtering by default
  - **File:** `IndividualEnrollmentWorkflow.tsx`

> **🔑 KEY BUSINESS RULE**
> **Core Classes in Individual Enrollment**
> - **Multiple Students:** CORE classes MUST NOT appear (use Homeroom workflow)
> - **Single Student:** CORE classes MAY appear (special circumstances only)
> - **Reason:** Prevents accidental enrollment of multiple students in core classes
>
> **Grade Filtering:**
> - Default: Only show classes matching student's grade
> - Allow "Show all grades" for special cases
> - Visual warning for cross-grade enrollment

**Requirements:**
- ✅ Enroll single student in specific subject/classroom
- ☑ Handle special circumstances and edge cases
- ☐ **FIX:** Implement CORE class filtering rule
- ☐ **FIX:** Implement grade-level filtering
- ☐ **FIX:** Add cross-grade enrollment warnings

---

### 7. Specialist Pull-Out Scheduling ☐

**Status:** Not Started (Phase A/2)
**Priority:** High - Critical workflow for K-8 schools

> **🔑 KEY DECISION**
> **Request/Approval Workflow for Specialist Pull-Outs**
> - Specialists can request ANY time slot
> - Requests route to student's primary teacher for approval
> - All pull-outs inherently overlap class time
> - Teacher can: Approve, Deny with reason, Propose alternative time
> - Admin can view/override all decisions
>
> **Rationale:** Balances specialist needs with teacher classroom management

#### Requirements

- ☐ **Request/Approval System:**
  - ☐ Specialists request time slots from available calendar
  - ☐ Requests route to primary teacher for approval
  - ☐ Teachers can approve, deny, or propose alternative
  - ☐ Notifications for all state changes

- ☐ **Capacity Management:**
  - ☐ Specialists set max capacity per slot
  - ☐ Can host multiple students simultaneously
  - ☐ Prevent overbooking

- ☐ **Admin Oversight:**
  - ☐ Principal/VP/Dean can view all pull-outs
  - ☐ Admin can override teacher decisions
  - ☐ Full history retained with timestamps and reasons

- ☐ **Impact Tracking:**
  - ☐ Track which subjects impacted by pull-outs
  - ☐ Teacher can see frequency of student absences
  - ☐ Reports on specialist utilization

---

### 8. Attendance Management ✅

**Status:** Complete

- ✅ Entry by teacher or admin/staff
- ✅ Default to "Present" if no status entered
- ✅ Statuses: Present, Absent-Excused, Absent-Unexcused, Tardy-Excused, Tardy-Unexcused
- ✅ Parents see status only (no internal notes)
- ✅ Attendance links to calendar blocks
- ✅ Admin reports by student/class/teacher/date/reason

**Acceptance:**
- ✅ Attendance completion time: p50 ≤ 2 minutes/class; p95 ≤ 4 minutes

---

### 9. Gradebook Management ✅

**Status:** Complete - Flexible category system implemented

#### 9.1 Category Groupings ✅

- ✅ Teachers/admin define grading groupings (Homework, Quizzes, Tests, Projects, etc.)
- ✅ Per-class configuration with options:
  - ✅ Weight per category (default = 1, supports >1 or <1)
  - ✅ Drop-lowest setting per category
  - ✅ Default category for new assignments
  - ✅ Reorder categories (display only)

#### 9.2 Assignment Creation ✅

**Two entry modes for flexibility:**

**A) Assignment-first:**
- ✅ New Assignment → Title, Description, Max Points, Due Date, Category, Weight
- ✅ Late Policy (inherit or override)
- ✅ Students auto-linked via roster

**B) Category-first (rapid entry):**
- ✅ Click Category chip → "Quick Add Assignment"
- ✅ Inline entry above grid
- ✅ Instantly opens grade grid for score entry
- ✅ Can create new category on-the-fly

#### 9.3 Grade Entry & Calculations ✅

- ✅ Spreadsheet-speed grid (keyboard navigation, paste from clipboard)
- ✅ Status badges: Missing, Late, Excused, In Progress
- ✅ Real-time calculations with toggles:
  - ✅ Include Missing as zero
  - ✅ Exclude Missing
- ✅ Late penalties auto-applied per rule
- ✅ Extra credit supported
- ✅ Per-student comments (shareable flag for parents)
- ✅ All grade changes logged (timestamp, user, reason) - retain ≥3 years

**Acceptance:**
- ✅ Grade entry throughput: 25 students in ≤ 5 minutes (p50)

#### 9.4 Visibility & Access ✅

- ✅ Teachers: only their classes
- ✅ Admin: all classes
- ✅ Parents/Students: only student's own results
- ✅ Parents see category weights and assignment detail
- ✅ Internal teacher notes hidden unless marked shareable

---

### 10. Admin Role Hierarchy & Permissions ✅

**Status:** Complete - Basic hierarchy implemented

- ✅ **Principal:** Full school access and settings
- ✅ **Vice Principal:** Full access except certain confidential HR/discipline (configurable)
- ✅ **Dean:** Focus on conduct/attendance/interventions; can approve pull-outs
- ✅ **Staff (Admin):** Nearly full access by default, easily restricted later
- ☐ **Future:** Custom granular permissions with role scopes (Phase F)

---

### 11. Reporting & Analytics (Phase A Scope) ☑

**Status:** Basic reporting implemented, Phase E will expand

#### Admin Reports ✅
- ✅ Grade distribution by class/subject/teacher
- ✅ Attendance trends by day/week/month
- ☐ Specialist pull-out frequency and impact
- ☐ Schedule coverage vs. weekly minute requirements

#### Teacher Reports ✅
- ✅ Missing work list
- ✅ Category averages
- ✅ Per-student progress over current term

#### Parent Reports ✅
- ✅ Report-card style view with category breakdown
- ✅ Assignment details
- ✅ Attendance summary

**Foundational Metrics (Phase A):**
- ✅ Attendance completion: p50 ≤ 2 min/class; p95 ≤ 4 min
- ✅ Grade entry: 25 students ≤ 5 min (p50)
- ☐ Specialist approval turnaround: median ≤ 24 hours
- ☐ Schedule conflicts: ≥ 99% resolved prior to publish
- ☐ Parent weekly engagement: ≥ 70% log-in at least once/week

---

## Phase B: Curriculum & Lesson Planning

**Status:** ☐ Not Started
**Dependencies:** Phase A (classes, schedules, rosters)

### Purpose & Goals

Deliver best-in-class curriculum and lesson planning tightly integrated with Phase A. Teachers never re-enter data. Outputs feed forward into Phase C (Assessments) and Phase D (Communication).

---

### 1. Planning Levels ☐

#### Curriculum Map (Year/Term) ☐
- ☐ Subject/grade pacing with units
- ☐ Standards targets and milestones
- ☐ Admin-managed templates per grade/subject

#### Unit Plan (Multi-week) ☐
- ☐ Objectives and standards alignment
- ☐ Assessments and resources
- ☐ Differentiation strategies
- ☐ Progress checkpoints

#### Lesson Plan (Daily/Block) ☐
- ☐ Title, objectives, standards
- ☐ Activities with estimated minutes
- ☐ Materials and resources
- ☐ Differentiation (groups, accommodations, extensions)
- ☐ Checks for understanding
- ☐ Homework and attachments
- ☐ Visibility controls (teacher-only, team, admin, parent-friendly)

---

### 2. Lesson Plan Structure ☐

Each lesson supports:
- ☐ Class/grade from Phase A roster
- ☐ Subject and date/date range
- ☐ Duration
- ☐ Standards alignment (multiple standards per lesson)
- ☐ Sequenced activities with time estimates
- ☐ Materials/resources list
- ☐ Differentiation notes
- ☐ Exit tickets and formative checks
- ☐ Attachments/links
- ☐ Parent-friendly summary toggle

---

### 3. Templates & Reuse ☐

- ☐ Built-in templates (K-5 and 6-8): Gradual Release, Workshop, Inquiry
- ☐ School-custom templates (admin-managed)
- ☐ Teacher personal templates
- ☐ Copy/clone lessons across dates, classes, years
- ☐ Bulk shift by calendar
- ☐ Version history with restore
- ☐ Draft/published states
- ☐ Lock after publish (admin can unlock)

---

### 4. Standards Alignment ☐

- ☐ Attach multiple standards per lesson/unit
- ☐ Support state/national/local frameworks
- ☐ Standards library with search, tags, aliases
- ☐ Admin can import standard sets
- ☐ Coverage tracking: % of targeted standards planned vs taught
- ☐ Link to associated assessments (Phase C)

---

### 5. Schedule Integration (Phase A Dependency) ☐

- ☐ Lessons auto-link to Phase A calendar blocks by class/teacher
- ☐ Drag lessons onto calendar blocks or auto-insert
- ☐ When time block moves, linked lessons can shift (single or batch)
- ☐ Calendar block shows lesson summary and attachments
- ☐ Attendance can be taken from block (Phase A integration)

---

### 6. Gradebook & Assessment Linkage ☐

- ☐ From lesson, create assignments (title, max points, category, weight, due date)
- ☐ Publish to Phase A gradebook
- ☐ Link to Phase C assessments
- ☐ Standards alignment flows through to item blueprints and mastery analytics

---

### 7. Collaboration & Sharing ☐

- ☐ Co-teacher editing
- ☐ Grade-level and subject team sharing
- ☐ School libraries for exemplary units
- ☐ Comments and @mentions
- ☐ Suggestion mode with accept/resolve
- ☐ Admin read-only oversight
- ☐ Selective parent-friendly summaries

---

### 8. Specialists & Differentiation ☐

- ☐ Specialists annotate lessons with intervention goals/activities
- ☐ Lesson view flags scheduled pull-outs from Phase A
- ☐ Teachers can plan catch-up tasks for students during pull-outs

---

### 9. Parent Visibility Controls ☐

- ☐ Toggle 'Parent-friendly summary' at lesson level
- ☐ Internal fields (accommodations, notes) hidden
- ☐ Weekly digest view aggregates lesson summaries per class
- ☐ Feeds Phase D communication channels

---

### 10. Search & Organization ☐

- ☐ Global search by title, objective, standard, tag, resource type
- ☐ Filters by grade, subject, author, date range
- ☐ Tagging system (SEL, STEM, Literacy, etc.)
- ☐ Favorites and pins for quick access

---

### Phase B Metrics & Acceptance

**Acceptance Criteria:**
- ☐ Teacher can create unit with ≥ 5 lessons, align standards, link to calendar in ≤ 30 minutes
- ☐ Creating assignment from lesson appears in Gradebook within 2 seconds
- ☐ Copying week of lessons across two classes and shifting by one week completes ≤ 10 seconds
- ☐ Parent-friendly summaries visible for ≥ 80% of published lessons by week 6 of pilot

**Success Metrics:**
- ☐ Teacher time to author daily lesson (median) ≤ 10 minutes using templates
- ☐ Reuse rate of lessons/templates ≥ 40% by end of term
- ☐ Standards coverage variance ≤ 10% from pacing targets by grade/subject
- ☐ Parent satisfaction (lesson clarity) ≥ 80% in monthly pulse survey

---

## Phase C: Advanced Grading & Assessment

**Status:** ☐ Not Started
**Dependencies:** Phase A (gradebook, attendance), Phase B (standards, lessons)

### Purpose & Goals

Transform basic gradebook into comprehensive, teacher-friendly, analytics-driven assessment system with:
- Simplified grading for teachers
- Online student assessment with auto-grading
- Actionable insights for all stakeholders
- Seamless integration with schedules and attendance

---

### 1. Assignment & Grade Management ☐

#### Teachers Can: ☐
- ☐ Create assignments directly in gradebook or link to scheduled lessons (Phase B)
- ☐ Define categories with custom weights
- ☐ Apply rubrics for qualitative grading
- ☐ Bulk-create assignments across multiple classes

#### Assignments Can: ☐
- ☐ Have due dates synced with class schedule
- ☐ Be reused year-to-year
- ☐ Include attached resources (PDFs, videos, slides)
- ☐ Allow late submissions with auto-applied penalties

---

### 2. Student Assessment Delivery ☐

#### Online Student Portal: ☐
- ☐ View assignments
- ☐ Submit work directly
- ☐ Take quizzes/tests online

#### Assessment Formats Supported: ☐
- ☐ Multiple choice, true/false (auto-graded)
- ☐ Short answer, fill-in-the-blank (auto-graded)
- ☐ Long-form written responses (manual grading)
- ☐ Projects (manual grading)

#### Auto-Grading: ☐
- ☐ Configurable correct answer keys
- ☐ Partial credit support
- ☐ Instant scoring for objective items
- ☐ Teacher override for any auto-graded score

---

### 3. Analytics & Early Intervention ☐

#### Real-Time Insights: ☐
- ☐ Grade trend graphs per student, per class, per school
- ☐ Identify students at risk:
  - ☐ Grade drop alerts
  - ☐ Missing assignments tracking
  - ☐ Performance dips tied to attendance patterns
- ☐ Compare class averages to historical performance

#### Aggregate Reporting: ☐
- ☐ Teachers: class-level trends
- ☐ Admin: school-level performance metrics
- ☐ Specialists: impact of pull-outs on academic progress

---

### 4. Parent & Student Views ☐

#### Parents: ☐
- ☐ See grades, missing work, attendance correlation
- ☐ Receive alerts for failing grades or missing work

#### Students: ☐
- ☐ See grades, teacher feedback, test results
- ☐ Access review materials linked to missed concepts

---

### 5. Permissions & Roles ☐

- ☐ Teacher: Full gradebook editing for own classes, feedback control
- ☐ Admin (Principal, VP, Dean): View all gradebooks, run performance reports
- ☐ Specialists: Limited view for students they serve, tied to schedule
- ☐ Parents/Students: Read-only with alerts

---

### 6. Workflow Integrations ☐

- ☐ Sync due dates with Phase B schedule to prevent conflicts
- ☐ Pull attendance from Phase A to overlay performance trends
- ☐ Tie missing work alerts to Phase D communication for auto-messaging

---

### Phase C Metrics & Acceptance

**Success Metrics:**
- ☐ 90%+ of teachers using online gradebook weekly
- ☐ Parent login rates above 75% by mid-year
- ☐ At least 50% of assessments using online delivery by year two

---

## Phase D: Communication & Engagement

**Status:** ☐ Not Started
**Dependencies:** Phases A (rosters, schedules), B (lesson summaries), C (grades, assessments)

### Purpose & Scope

Design and implement best-in-class communication connecting administrators, teachers, parents, and students through unified platform with timely, secure, effective channels integrated with core SIS data.

---

### 1. Communication Modes ☐

- ☐ **In-App Messaging:** Real-time secure messaging between roles
- ☐ **Email Integration:** Automated and manual sending with message logs
- ☐ **Push Notifications:** Mobile alerts for urgent updates or reminders
- ☐ **Calendar Reminders:** Automated event and deadline notifications
- ☐ **Bulletin Boards:** Public announcements visible to specified audiences

---

### 2. Permissions & Roles ☐

- ☐ **Administrators:** Broadcast to all users, initiate group messages, send alerts
- ☐ **Teachers:** Message students, parents, admins; share resources
- ☐ **Specialists:** Coordinate pull-outs, request changes, share progress updates
- ☐ **Parents:** Communicate with teachers, specialists, admins regarding their child
- ☐ **Students:** Communicate with teachers and specialists in academic context

---

### 3. Engagement Features ☐

- ☐ Automated progress summaries sent to parents weekly or monthly
- ☐ Multilingual support for all communications
- ☐ Accessibility compliance (screen reader, high-contrast)
- ☐ Interactive event invitations with RSVP tracking
- ☐ Resource sharing (documents, videos, images) within messages

---

### 4. Security & Privacy ☐

All communication must comply with FERPA and relevant data privacy laws:

- ☐ End-to-end encryption for in-app messages
- ☐ Audit logging of all messages and file shares
- ☐ Role-based access control to restrict sensitive information
- ☐ Consent tracking for parent/student communication preferences

---

### 5. Future-State Integrations ☐

In later phases, communication data will integrate with analytics to:
- ☐ Track engagement frequency and quality
- ☐ Identify communication gaps impacting student performance
- ☐ Correlate teacher-parent communication with grade and attendance trends

---

## Phase E: Reporting & Analytics

**Status:** ☐ Not Started
**Dependencies:** Phases A-D (all data sources)

### Purpose

Deliver best-in-class analytics that help leaders, teachers, specialists, parents, and students act early—without creating busywork or ambiguity. All insights must be explainable, auditable, and tied to concrete actions.

---

### 1. Executive & School Dashboards ☐

#### District/School Health: ☐
- ☐ Attendance rate (daily/weekly/term)
- ☐ Chronic absence %
- ☐ Grade distributions
- ☐ Assessment mastery
- ☐ Missing work counts
- ☐ Discipline incidents
- ☐ Specialist utilization
- ☐ Communication engagement (Phase D)

#### Navigation: ☐
- ☐ Drill-downs: district → school → grade → teacher → class → student
- ☐ Time Context: this week, MTD, term, year, prior year, multi-year trends
- ☐ Equity Slices: cohort/subgroup filters (ELL, IEP/504, grade band, program)

---

### 2. Teacher Analytics & Workload ☐

- ☐ Class Heatmaps: standards mastery, missing work, late penalties, attendance-achievement correlation
- ☐ Workload View: grading volume, time-to-grade, feedback coverage, communication follow-through
- ☐ Action Lists: prioritized students needing attention with reasons and suggested actions

---

### 3. Student 360 & Intervention Tracker ☐

- ☐ Student 360: unified view of grades, assessment history, attendance, schedule, pull-outs, accommodations, lesson links, communications
- ☐ Interventions: create/assign/track interventions (tutoring, check-ins, study plans)
- ☐ Outcomes: link interventions to subsequent grade/attendance changes; calculate impact deltas

---

### 4. Standards Mastery & Curriculum Analytics ☐

- ☐ Coverage vs Mastery: planned standards (Phase B) vs assessed mastery (Phase C)
- ☐ Pacing: schedule alignment vs delivery and mastery lag indicators
- ☐ Resource Effectiveness: correlate lesson resources/templates with mastery outcomes

---

### 5. Assessments & Gradebook Analytics ☐

- ☐ Item Analysis: difficulty, distractor performance, rubric criterion trends
- ☐ Gradebook Mix: category weight effects, extra credit impact, missing/late sensitivity
- ☐ Retake Policy Effects: compare highest/latest/average policy outcomes

---

### 6. Attendance & Engagement Analytics ☐

- ☐ Chronic Absence Insights: flag at-risk thresholds; correlate with grades and assessment dips
- ☐ Engagement Signals: read receipts, message reply latency, portal logins as early warning
- ☐ Specialist Pull-Out Impact: attendance during sessions, frequency, academic correlation

---

### 7. Alerts, Subscriptions, and Nudges ☐

- ☐ Threshold-Based Alerts: grade drop > X points, attendance < Y%, missing > N assignments
- ☐ Smart Subscriptions: principals auto-receive weekly summaries; teachers get class snapshots; parents get student digests
- ☐ Explainability: every alert shows contributing data and suggested next actions

---

### 8. Data Export & APIs ☐

- ☐ Self-Service Exports: CSV/Excel/PDF for any report with applied filters
- ☐ Programmatic Access: secure REST/GraphQL endpoints for dashboards and aggregates
- ☐ Scheduled Delivery: email/SFTP cadence for district reporting packs

---

### Phase E Metrics & Acceptance

**Success Metrics:**
- ☐ ≥ 30% reduction in time spent preparing weekly admin reports
- ☐ ≥ 25% faster teacher identification of at-risk students
- ☐ ≥ 15% reduction in chronic absence within two terms
- ☐ Parent portal engagement increases ≥ 20% after digest adoption

---

## Phase F: Future & Integrations

**Status:** ☐ Not Started
**Dependencies:** Phases A-E (complete SIS foundation)

### Purpose

Operationalize interoperability, platform scale, and long-term evolution. Connect SIS with external systems and prepare for advanced features.

---

### 1. Integration Domains ☐

#### Identity & Access: ☐
- ☐ SSO (SAML 2.0, OIDC)
- ☐ Provisioning (SCIM)
- ☐ Role claims, class/roster claims

#### Rostering & SIS Interop: ☐
- ☐ OneRoster v1.1+ (CSV & REST)
- ☐ Ed-Fi (v5.x) core
- ☐ Clever/ClassLink launch and data sync

#### LMS & Classroom Tools: ☐
- ☐ LTI 1.3/Advantage deep links (assignments, grade return)
- ☐ Google Classroom/Microsoft Teams summaries

#### State & District Reporting: ☐
- ☐ Standardized exports/APIs with schedule
- ☐ Schema mapping and validation
- ☐ Secure delivery (SFTP/API)

#### Assessment Vendors: ☐
- ☐ Secure import of benchmark/standardized scores
- ☐ Item-level data if provided
- ☐ Mapping to standards and students

#### Payment/Fees: ☐
- ☐ PCI-aware integration for fees, field trips, activities
- ☐ Ledger export to district finance

#### Messaging/Notifications: ☐
- ☐ Email (SMTP/API)
- ☐ SMS (opt-in)
- ☐ Push (APNs/FCM)
- ☐ Language translation pipeline

---

### 2. Platform Services ☐

- ☐ Public REST/GraphQL APIs with versioning and role-scoped tokens
- ☐ SDKs (TypeScript, Python)
- ☐ Eventing/Webhooks: subscription to domain events
- ☐ Import/Export Pipelines: guided mappers, preview/validate, idempotent upserts
- ☐ Plugin/Extension Model: safe UI extensions with permission scoping

---

### 3. Multi-Tenant & Scale ☐

- ☐ District-aware tenancy with school isolation
- ☐ Per-tenant encryption keys
- ☐ Configurable data residency
- ☐ Horizontal scale targets: 100k students/tenant, 1M+ events/day, 5k concurrent sessions
- ☐ Throttling/rate-limits per API key and per tenant

---

### 4. Mobile & Offline ☐

- ☐ Native apps (iOS/Android) for teachers/parents/students with push notifications
- ☐ Offline tolerant: attendance and grade entry queues with conflict resolution
- ☐ Kiosk/Shared device mode for secure classroom check-in (future)

---

### 5. AI-Assisted Features (Human-in-the-Loop) ☐

> **🔑 KEY DECISION**
> **AI Guardrails - Human-in-the-Loop Required**
> - All AI suggestions require human approval before publishing
> - Explainability notes and confidence scores shown
> - Audit prompts and outputs for compliance
> - Never auto-publish or auto-commit AI-generated content

- ☐ **Scheduling Assistant:** Propose conflict-free schedules and specialist pull-out windows (teacher approval required)
- ☐ **Insight Assistant:** Summarize student 360, draft intervention plans, recommend catch-up resources
- ☐ **Authoring Assistant:** Lesson templates, assessment items, rubric suggestions with standards hints

---

### Phase F Metrics & Acceptance

**Success Metrics:**
- ☐ 50% reduction in manual roster maintenance for pilot districts
- ☐ ≥ 90% of third-party tools connected via standards (LTI/OneRoster/Ed-Fi)
- ☐ ≤ 1% monthly integration failure rate with transparent incident reports
- ☐ Positive admin/teacher NPS (+30 or higher) regarding setup and reliability

---

## Cross-Phase Dependencies

### Dependency Flow

```
Phase A (Core SIS)
  ↓ Provides: Canonical IDs, rosters, calendars, attendance, gradebook baseline
  ↓
Phase B (Curriculum)
  ↓ Depends on: A (classes, schedules, roles)
  ↓ Feeds: C (assessment blueprints), D (weekly digests), E (coverage analytics)
  ↓
Phase C (Assessment)
  ↓ Depends on: A (gradebook, attendance), B (standards, lessons)
  ↓ Feeds: D (result notifications), E (mastery analytics), F (exports)
  ↓
Phase D (Communication)
  ↓ Depends on: A (rosters), B (lesson summaries), C (grades)
  ↓ Feeds: E (engagement metrics), F (notification connectors)
  ↓
Phase E (Analytics)
  ↓ Depends on: A-D (all events and aggregates)
  ↓ Feeds: A (intervention loops), D (nudges), F (warehouse/API contracts)
  ↓
Phase F (Integrations)
  ↓ Depends on: A-E (stable contracts)
  ↓ Feeds: External partners, district data platforms
```

---

## Role Permissions Matrix

### Glossary

- **V** = View
- **C** = Create
- **E** = Edit
- **A** = Approve
- **R** = Report/Export

| Module | Principal | VP | Dean | Staff Admin | Teacher | Specialist | Parent | Student |
|--------|-----------|----|----|-------------|---------|------------|--------|---------|
| Roster & Classes | VCEA R | VCEA R | VCEA R | VCE R | V (own) | V (assigned) | V (child) | V (self) |
| Scheduling | VCEA R | VCEA R | VCEA R | VCE R | VCE (own) | VCE (own slots) | V (child) | V (self) |
| Specialist Pull-outs | VCEA R | VCEA R | VCEA R | VCE R | A (approve/deny) | CE (request/edit) | V (child) | V (self) |
| Lessons | V R | V R | V R | V R | VCE (own/team) | V (student notes) | V (summary) | V (summary) |
| Assessments/Assignments | V R | V R | V R | V R | VCE (own) | V (assigned) | V (child) | V (self) |
| Gradebook | V R | V R | V R | V R | VCE (own) | V (assigned) | V (child) | V (self) |
| Attendance | VCEA R | VCEA R | VCEA R | VCE R | VCE (own) | V (sessions) | V (child) | V (self) |
| Messaging | VCEA R | VCEA R | VCEA R | VCE R | VCE (classes) | VCE (caseload) | VCE (child threads) | V (own) |
| Analytics | V R | V R | V R | V R | V (class) | V (caseload) | V (child summary) | V (self summary) |

**Note:** Staff Admin inherits Principal capabilities minus access to highly sensitive fields (discipline/IEP full text) unless explicitly granted.

---

## Document Maintenance

### How to Update This Document

1. **New Requirement Identified:**
   - Add to appropriate phase section
   - Mark as ☐ (not started)
   - Update dependencies if needed

2. **Requirement Started:**
   - Change ☐ to ☑ (in progress)
   - Add note about current status if needed

3. **Requirement Completed:**
   - Change ☑ to ✅ (complete)
   - Update metrics/acceptance if applicable

4. **Key Decision Made:**
   - Add inline using format below:

```markdown
> **🔑 KEY DECISION** (Date)
> **Decision Title**
> - Decision details
> - Rationale: Why this decision was made
> - Impact: What changes in implementation
```

### Last Updated Sections

- Executive Summary: 2025-10-17
- Phase A: 2025-10-17 (verified from testing)
- Phase B-F: 2025-10-17 (from business requirements PDF)

---

## Related Documentation

- **[STATUS.md](./STATUS.md)** - Current system status and immediate priorities
- **[API_REFERENCE.md](./API_REFERENCE.md)** - All API endpoints and implementation status
- **[DATABASE_SCHEMA_FOUNDATION.md](./DATABASE_SCHEMA_FOUNDATION.md)** - Schema reference
- **[SYSTEM_ARCHITECTURE_GUIDE.md](./SYSTEM_ARCHITECTURE_GUIDE.md)** - Technical overview

---

*This document is the single source of truth for all business requirements across all phases. It combines requirements from the business requirements PDF with inline key architectural decisions for easy reference.*
