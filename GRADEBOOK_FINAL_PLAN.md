# Gradebook System - Final Implementation Plan

## System Requirements (Confirmed)

### Grading Modes by Grade Level (Admin Configured)
- **K-3**: Standards-Based Grading (1-4 scale)
  - Example: "Emerging, Developing, Proficient, Advanced"
  - No percentages, focus on skill mastery

- **4-8**: Percentage-Based Grading (0-100%)
  - Traditional letter grades (A, B, C, D, F)
  - Weighted categories: Homework 10%, Class Assignment 40%, Tests 50%

### Categories (Admin Controlled)
- **Default for 4-8**:
  - Homework: 10%
  - Class Assignment: 40%
  - Tests: 50%
- Admin can create multiple templates
- Admin can modify percentages (must total 100%)
- Teachers use admin templates, cannot change weights

### Retake Policy (Teacher Decision per Assignment)
- **Teacher chooses** when creating assignment:
  1. **Newest** - Most recent score only
  2. **Average** - Average all attempts
  3. **Highest** - Best score wins
  4. **Weighted** - Custom blend (e.g., 70% original + 30% retake)

- Teacher can configure weighted ratio (70/30, 60/40, 80/20, etc.)

---

## Updated Database Schema

```sql
-- ============================================================================
-- 1. GRADING SCALES (K-3 vs 4-8)
-- ============================================================================

CREATE TABLE grading_scales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID REFERENCES schools(id),
    name VARCHAR(100) NOT NULL,
    scale_type VARCHAR(20) NOT NULL,  -- "STANDARDS", "PERCENTAGE"
    grade_level_start VARCHAR(5),     -- "K", "1", "2", etc.
    grade_level_end VARCHAR(5),       -- "3", "8", etc.

    -- For STANDARDS-based (K-3)
    standards_definition JSONB,
    /* Example for K-3:
    {
        "scale": "1-4",
        "levels": {
            "4": {"label": "Advanced", "description": "Exceeds grade-level standards", "color": "#10B981"},
            "3": {"label": "Proficient", "description": "Meets grade-level standards", "color": "#3B82F6"},
            "2": {"label": "Developing", "description": "Approaching standards", "color": "#F59E0B"},
            "1": {"label": "Emerging", "description": "Beginning to develop", "color": "#EF4444"}
        }
    }
    */

    -- For PERCENTAGE-based (4-8)
    percentage_definition JSONB,
    /* Example for 4-8:
    {
        "A": {"min": 90, "max": 100, "gpa": 4.0, "color": "#10B981"},
        "B": {"min": 80, "max": 89.99, "gpa": 3.0, "color": "#3B82F6"},
        "C": {"min": 70, "max": 79.99, "gpa": 2.0, "color": "#F59E0B"},
        "D": {"min": 60, "max": 69.99, "gpa": 1.0, "color": "#F97316"},
        "F": {"min": 0, "max": 59.99, "gpa": 0.0, "color": "#EF4444"}
    }
    */

    is_default BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Default scales for initial setup
INSERT INTO grading_scales (school_id, name, scale_type, grade_level_start, grade_level_end, standards_definition, is_default) VALUES
(
    'school-uuid-here',
    'Elementary Standards (K-3)',
    'STANDARDS',
    'K',
    '3',
    '{
        "scale": "1-4",
        "levels": {
            "4": {"label": "Advanced", "description": "Exceeds grade-level standards", "color": "#10B981"},
            "3": {"label": "Proficient", "description": "Meets grade-level standards", "color": "#3B82F6"},
            "2": {"label": "Developing", "description": "Approaching standards", "color": "#F59E0B"},
            "1": {"label": "Emerging", "description": "Beginning to develop", "color": "#EF4444"}
        }
    }'::jsonb,
    TRUE
);

-- ============================================================================
-- 2. GRADING CATEGORY TEMPLATES (Admin Controlled)
-- ============================================================================

CREATE TABLE grading_category_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID REFERENCES schools(id),
    template_name VARCHAR(100) NOT NULL,
    grade_level_start VARCHAR(5),     -- "4", "6", etc.
    grade_level_end VARCHAR(5),       -- "8", "12", etc.
    description TEXT,

    -- Categories with weights (must total 100%)
    categories JSONB NOT NULL,
    /* Example for 4-8:
    [
        {
            "id": "homework",
            "name": "Homework",
            "weight": 10,
            "category_type": "FORMATIVE",
            "color": "#3B82F6",
            "drop_lowest": 0
        },
        {
            "id": "class_assignment",
            "name": "Class Assignment",
            "weight": 40,
            "category_type": "FORMATIVE",
            "color": "#8B5CF6",
            "drop_lowest": 0
        },
        {
            "id": "tests",
            "name": "Tests",
            "weight": 50,
            "category_type": "SUMMATIVE",
            "color": "#EF4444",
            "drop_lowest": 0
        }
    ]
    */

    is_default BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Default template for 4-8 (percentage-based grades)
INSERT INTO grading_category_templates (school_id, template_name, grade_level_start, grade_level_end, categories, is_default) VALUES
(
    'school-uuid-here',
    'Middle School Standard (4-8)',
    '4',
    '8',
    '[
        {"id": "homework", "name": "Homework", "weight": 10, "category_type": "FORMATIVE", "color": "#3B82F6", "drop_lowest": 0},
        {"id": "class_assignment", "name": "Class Assignment", "weight": 40, "category_type": "FORMATIVE", "color": "#8B5CF6", "drop_lowest": 0},
        {"id": "tests", "name": "Tests", "weight": 50, "category_type": "SUMMATIVE", "color": "#EF4444", "drop_lowest": 0}
    ]'::jsonb,
    TRUE
);

-- ============================================================================
-- 3. CLASSROOM GRADING CATEGORIES (Copied from Template)
-- ============================================================================

CREATE TABLE classroom_grading_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    classroom_id UUID REFERENCES classrooms(id) ON DELETE CASCADE,
    template_id UUID REFERENCES grading_category_templates(id),

    category_id VARCHAR(50) NOT NULL,  -- "homework", "tests", etc.
    category_name VARCHAR(100) NOT NULL,
    category_type VARCHAR(20),
    weight_percentage DECIMAL(5,2) NOT NULL CHECK (weight_percentage >= 0 AND weight_percentage <= 100),
    color_code VARCHAR(7),
    drop_lowest_n INTEGER DEFAULT 0,
    sort_order INTEGER,

    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    UNIQUE (classroom_id, category_id)
);

-- Trigger to validate category weights total 100%
CREATE OR REPLACE FUNCTION validate_category_weights()
RETURNS TRIGGER AS $$
DECLARE
    total_weight DECIMAL(5,2);
BEGIN
    SELECT COALESCE(SUM(weight_percentage), 0) INTO total_weight
    FROM classroom_grading_categories
    WHERE classroom_id = NEW.classroom_id
    AND is_active = TRUE
    AND id != NEW.id;  -- Exclude current record if updating

    total_weight := total_weight + NEW.weight_percentage;

    IF total_weight > 100.01 OR total_weight < 99.99 THEN
        RAISE EXCEPTION 'Category weights must total 100%%. Current total: %%', total_weight;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_category_weights_insert
BEFORE INSERT ON classroom_grading_categories
FOR EACH ROW
EXECUTE FUNCTION validate_category_weights();

CREATE TRIGGER check_category_weights_update
BEFORE UPDATE ON classroom_grading_categories
FOR EACH ROW
WHEN (OLD.weight_percentage IS DISTINCT FROM NEW.weight_percentage OR OLD.is_active IS DISTINCT FROM NEW.is_active)
EXECUTE FUNCTION validate_category_weights();

-- ============================================================================
-- 4. ASSIGNMENTS
-- ============================================================================

CREATE TABLE assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    classroom_id UUID REFERENCES classrooms(id) ON DELETE CASCADE,
    category_id UUID REFERENCES classroom_grading_categories(id),
    academic_year_id UUID REFERENCES academic_years(id),

    -- Basic Info
    name VARCHAR(200) NOT NULL,
    description TEXT,

    -- Grading Mode (inherits from classroom's grade level)
    grading_mode VARCHAR(20) NOT NULL,  -- "PERCENTAGE" or "STANDARDS"
    max_points DECIMAL(10,2),  -- For percentage-based

    -- Standards-based options (K-3)
    standard_ids JSONB,  -- Array of learning standard codes
    /* Example: ["CCSS.MATH.K.CC.A.1", "CCSS.MATH.K.CC.A.2"] */

    -- Dates
    assigned_date DATE,
    due_date DATE,

    -- Late Policy
    accept_late BOOLEAN DEFAULT TRUE,
    late_penalty_type VARCHAR(20),  -- "NONE", "PERCENTAGE_PER_DAY", "FLAT_DEDUCTION", "ZERO_AFTER_DUE"
    late_penalty_amount DECIMAL(5,2),

    -- Retake Configuration (TEACHER DECISION)
    allow_retakes BOOLEAN DEFAULT FALSE,
    max_retakes INTEGER DEFAULT 1,
    retake_score_policy VARCHAR(30) NOT NULL DEFAULT 'HIGHEST',
    /* Options:
       - "NEWEST" - Most recent score
       - "HIGHEST" - Best score
       - "AVERAGE" - Average all attempts
       - "WEIGHTED" - Custom weighted blend
    */

    -- For WEIGHTED retake policy
    retake_weight_config JSONB,
    /* Example for 70% original + 30% retake:
    {
        "original_weight": 70,
        "retake_weight": 30,
        "description": "70% original + 30% retake"
    }
    */

    retake_deadline DATE,
    require_teacher_approval BOOLEAN DEFAULT TRUE,

    -- Visibility
    is_published BOOLEAN DEFAULT FALSE,
    include_in_grade_calculation BOOLEAN DEFAULT TRUE,

    -- Metadata
    created_by_user_id UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- 5. STUDENT GRADES (Multi-Attempt Support)
-- ============================================================================

CREATE TABLE student_grades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    classroom_id UUID REFERENCES classrooms(id) ON DELETE CASCADE,

    -- Attempt Tracking
    attempt_number INTEGER DEFAULT 1,

    -- Percentage-Based Scoring (4-8)
    score_earned DECIMAL(10,2),
    max_possible DECIMAL(10,2),
    percentage DECIMAL(5,2),

    -- Standards-Based Scoring (K-3)
    proficiency_level VARCHAR(5),  -- "1", "2", "3", "4"
    standards_scores JSONB,
    /* Example for multi-standard assignments:
    {
        "CCSS.MATH.K.CC.A.1": {"level": 3, "evidence": "Counted to 100 accurately"},
        "CCSS.MATH.K.CC.A.2": {"level": 4, "evidence": "Exceeded expectations"}
    }
    */

    -- Feedback
    teacher_feedback TEXT,
    teacher_comments TEXT,

    -- Submission
    submitted_at TIMESTAMP,
    is_late BOOLEAN DEFAULT FALSE,
    is_missing BOOLEAN DEFAULT FALSE,
    is_excused BOOLEAN DEFAULT FALSE,
    late_penalty_applied DECIMAL(5,2),

    -- Calculated Final Score (for weighted retakes)
    calculated_score DECIMAL(5,2),  -- Result after applying retake policy

    -- Active Score Flag
    is_active_score BOOLEAN DEFAULT TRUE,  -- Only one active score per student per assignment

    -- Manual Override
    is_manually_overridden BOOLEAN DEFAULT FALSE,
    override_reason TEXT,

    -- Audit
    graded_by_user_id UUID REFERENCES users(id),
    graded_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    UNIQUE (assignment_id, student_id, attempt_number)
);

-- Index for performance
CREATE INDEX idx_student_grades_active ON student_grades(assignment_id, student_id) WHERE is_active_score = TRUE;

-- ============================================================================
-- 6. RETAKE REQUESTS (Teacher Approval Workflow)
-- ============================================================================

CREATE TABLE retake_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    original_grade_id UUID REFERENCES student_grades(id),  -- Link to original attempt

    -- Request Details
    attempt_number INTEGER NOT NULL,  -- Which retake (1st retake = 2, 2nd retake = 3)
    reason TEXT,
    requested_at TIMESTAMP DEFAULT NOW(),

    -- Approval
    status VARCHAR(20) DEFAULT 'PENDING',  -- "PENDING", "APPROVED", "DENIED", "COMPLETED"
    reviewed_by_user_id UUID REFERENCES users(id),
    reviewed_at TIMESTAMP,
    approval_notes TEXT,

    -- Scheduling
    scheduled_date DATE,

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- 7. GRADE CHANGE AUDIT LOG (FERPA Compliance)
-- ============================================================================

CREATE TABLE grade_change_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_grade_id UUID REFERENCES student_grades(id),
    student_id UUID REFERENCES students(id),
    assignment_id UUID REFERENCES assignments(id),

    -- Change Details
    changed_by_user_id UUID REFERENCES users(id),
    change_type VARCHAR(50) NOT NULL,
    /* Types:
       - "GRADE_ENTERED"
       - "GRADE_UPDATED"
       - "GRADE_DELETED"
       - "RETAKE_SUBMITTED"
       - "RETAKE_APPROVED"
       - "RETAKE_DENIED"
       - "MANUAL_OVERRIDE"
       - "SCORE_RECALCULATED"
    */

    -- Before/After
    old_score DECIMAL(10,2),
    new_score DECIMAL(10,2),
    old_proficiency VARCHAR(5),
    new_proficiency VARCHAR(5),
    old_percentage DECIMAL(5,2),
    new_percentage DECIMAL(5,2),

    -- Context
    change_reason TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,

    changed_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- 8. STUDENT FINAL GRADES (Per Marking Period)
-- ============================================================================

CREATE TABLE student_final_grades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    classroom_id UUID REFERENCES classrooms(id) ON DELETE CASCADE,
    academic_year_id UUID REFERENCES academic_years(id),
    marking_period VARCHAR(20) NOT NULL,  -- "Q1", "Q2", "Q3", "Q4", "S1", "S2", "FINAL"

    -- Calculated Grade (percentage-based)
    calculated_percentage DECIMAL(5,2),
    calculated_letter_grade VARCHAR(5),
    calculated_gpa DECIMAL(3,2),

    -- Category Breakdown
    category_scores JSONB,
    /* Example:
    {
        "homework": {"average": 85.5, "weight": 10, "contribution": 8.55},
        "class_assignment": {"average": 88.2, "weight": 40, "contribution": 35.28},
        "tests": {"average": 90.0, "weight": 50, "contribution": 45.0}
    }
    */

    -- Standards-based (K-3)
    standards_summary JSONB,
    /* Example:
    {
        "CCSS.MATH.K.CC.A.1": {"level": 3, "trend": "improving"},
        "CCSS.MATH.K.CC.A.2": {"level": 4, "trend": "consistent"}
    }
    */

    -- Teacher Override
    is_overridden BOOLEAN DEFAULT FALSE,
    override_letter_grade VARCHAR(5),
    override_percentage DECIMAL(5,2),
    override_reason TEXT,
    override_date TIMESTAMP,

    -- Final Grade (what appears on report card)
    final_letter_grade VARCHAR(5),
    final_percentage DECIMAL(5,2),
    final_gpa DECIMAL(3,2),
    narrative_comment TEXT,

    -- Metadata
    finalized_by_user_id UUID REFERENCES users(id),
    finalized_at TIMESTAMP,
    is_locked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    UNIQUE (student_id, classroom_id, academic_year_id, marking_period)
);
```

---

## Retake Policy Calculation Examples

### Example 1: Weighted Retake (70% Original + 30% Retake)

**Setup:**
```
Assignment: Chapter 5 Test
Teacher sets: Weighted retake - 70% original, 30% retake
```

**Scenario:**
```
Attempt 1 (Original): 72%
Attempt 2 (Retake):   92%

Calculation:
  Final Score = (72 × 0.70) + (92 × 0.30)
              = 50.4 + 27.6
              = 78%

Student sees: 78% (C+)
```

### Example 2: Newest Score

**Setup:**
```
Assignment: Math Quiz
Teacher sets: Newest score
```

**Scenario:**
```
Attempt 1: 85%
Attempt 2: 78%  ← Even though it's lower!

Final Score = 78% (most recent)
```

### Example 3: Average

**Setup:**
```
Assignment: Science Lab
Teacher sets: Average all attempts
```

**Scenario:**
```
Attempt 1: 70%
Attempt 2: 88%
Attempt 3: 92%

Final Score = (70 + 88 + 92) / 3 = 83.3%
```

### Example 4: Highest (Default)

**Setup:**
```
Assignment: Reading Test
Teacher sets: Highest score
```

**Scenario:**
```
Attempt 1: 72%
Attempt 2: 92%
Attempt 3: 85%

Final Score = 92% (highest)
```

---

## Teacher UI - Creating Assignment with Retake Options

```
┌──────────────────────────────────────────────────────────────────┐
│ Create Assignment                                                │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│ Assignment Name: [Chapter 5 Test_________________]               │
│                                                                   │
│ Category: [Tests (50%)] ▼                                        │
│                                                                   │
│ Due Date: [10/25/2025]                                           │
│                                                                   │
│ Points Possible: [100]                                           │
│                                                                   │
│ ─────────────────────────────────────────────────────────────    │
│ Retake Policy                                                     │
│ ─────────────────────────────────────────────────────────────    │
│                                                                   │
│ [✓] Allow retakes for this assignment                           │
│                                                                   │
│     Max number of retakes: [2] ▼                                 │
│                                                                   │
│     Retake deadline: [11/15/2025]                                │
│                                                                   │
│     Score calculation:                                            │
│     (○) Newest score (most recent attempt)                       │
│     (○) Average all attempts                                      │
│     (●) Highest score                                             │
│     (○) Weighted blend:                                           │
│         [70]% original + [30]% retake = 100%                     │
│                                                                   │
│         Preview: If student gets 70% then 90% on retake:         │
│         Final score: 76% (70×0.7 + 90×0.3)                       │
│                                                                   │
│     [✓] Require my approval for retake requests                  │
│                                                                   │
│ [Create Assignment]                                               │
└──────────────────────────────────────────────────────────────────┘
```

---

## K-3 Standards-Based Grading Example

### Teacher View (Kindergarten Math)

```
┌──────────────────────────────────────────────────────────────────┐
│ Kindergarten Math - Mrs. Johnson                                │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│ Standard: CCSS.MATH.K.CC.A.1                                     │
│ "Count to 100 by ones and tens"                                 │
│                                                                   │
│ Students       │ Assessment 1 │ Assessment 2 │ Current Level     │
│ ───────────────┼──────────────┼──────────────┼──────────────     │
│ Allen, Mason   │      2       │      3       │   3 (Proficient) │
│ Chen, Sophie   │      3       │      4       │   4 (Advanced)   │
│ Garcia, Luis   │      1       │      2       │   2 (Developing) │
│                                                                   │
│ Scale: 1=Emerging, 2=Developing, 3=Proficient, 4=Advanced       │
│                                                                   │
│ ✏️ Click student to add evidence/comments                        │
└──────────────────────────────────────────────────────────────────┘
```

### Parent View (Standards Report)

```
┌──────────────────────────────────────────────────────────────────┐
│ Mason Allen - Kindergarten Math - Quarter 1                     │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│ Counting & Cardinality                                           │
│                                                                   │
│ ✓ Count to 100 by ones and tens                                 │
│   Current Level: 3 (Proficient) ↗️ Improving                    │
│   Evidence: Counted to 100 accurately in class, demonstrated     │
│   understanding in exit tickets                                  │
│                                                                   │
│ ⚠ Count forward from any number                                 │
│   Current Level: 2 (Developing)                                  │
│   Evidence: Can count from 10, needs practice from other numbers │
│                                                                   │
│ Operations & Algebraic Thinking                                  │
│                                                                   │
│ ✓ Solve addition word problems                                  │
│   Current Level: 3 (Proficient)                                  │
│   Evidence: Correctly solved 8/10 problems independently         │
│                                                                   │
│ Teacher Comments:                                                │
│ Mason is making excellent progress in math. He shows strong      │
│ counting skills and is developing problem-solving strategies.    │
│ Continue practicing counting from different starting numbers     │
│ at home.                                                          │
└──────────────────────────────────────────────────────────────────┘
```

---

## Implementation Phases

### Phase 1: Core Foundation (Week 1-2)
✅ **Database schema** - All tables created
✅ **Admin category templates** - CRUD for templates
✅ **Classroom setup** - Auto-apply templates by grade level
✅ **Basic assignment creation** - With category selection

### Phase 2: Grade Entry (Week 2-3)
✅ **Teacher gradebook grid** - Spreadsheet view
✅ **Quick grade entry** - Click cell, type score
✅ **K-3 standards mode** - Toggle based on grade level
✅ **4-8 percentage mode** - Points and percentages

### Phase 3: Retake System (Week 3-4)
✅ **Retake configuration** - Teacher sets policy per assignment
✅ **Student retake requests** - Request workflow
✅ **Teacher approval** - Approve/deny interface
✅ **Score calculation** - Weighted, newest, average, highest
✅ **Audit logging** - Track all changes

### Phase 4: Parent/Student Portal (Week 4-5)
✅ **Student view** - See grades, request retakes
✅ **Parent view** - Monitor progress
✅ **K-3 standards reports** - Narrative format
✅ **4-8 percentage reports** - Traditional format

### Phase 5: Final Grades & Reports (Week 5-6)
✅ **Calculate final grades** - Weighted category averages
✅ **Teacher override** - Manual adjustment with reason
✅ **Report cards** - PDF generation
✅ **Admin reports** - Grade distribution, analytics

---

## API Endpoints Summary

### Admin
```
POST   /admin/grading-templates                    # Create category template
GET    /admin/grading-templates                    # List templates
PUT    /admin/grading-templates/{id}               # Update template
DELETE /admin/grading-templates/{id}               # Delete template

POST   /admin/grading-scales                       # Create grading scale
GET    /admin/grading-scales                       # List scales
```

### Teacher - Assignments
```
POST   /gradebook/classrooms/{id}/assignments      # Create assignment
GET    /gradebook/classrooms/{id}/assignments      # List assignments
PUT    /gradebook/assignments/{id}                 # Update assignment
DELETE /gradebook/assignments/{id}                 # Delete assignment
```

### Teacher - Grades
```
POST   /gradebook/assignments/{id}/grades/bulk     # Enter grades for whole class
PUT    /gradebook/grades/{id}                      # Update single grade
GET    /gradebook/classrooms/{id}/gradebook        # Full gradebook grid
GET    /gradebook/students/{id}/grades             # Student's all grades
```

### Teacher - Retakes
```
GET    /gradebook/retake-requests                  # Pending retake requests
PUT    /gradebook/retake-requests/{id}/approve     # Approve retake
PUT    /gradebook/retake-requests/{id}/deny        # Deny retake
POST   /gradebook/grades/{id}/retake               # Submit retake grade
```

### Student
```
GET    /gradebook/my-grades                        # My grades
POST   /gradebook/assignments/{id}/request-retake  # Request retake
GET    /gradebook/my-retake-requests               # My pending requests
```

### Parent
```
GET    /gradebook/students/{id}/grades             # Child's grades
GET    /gradebook/students/{id}/report/{period}    # Progress report
```

---

## Next Steps

Should I start implementing Phase 1?

**Phase 1 Deliverables (Week 1-2):**
- Database migrations for all tables
- Admin UI to create/edit category templates
- Automatic template assignment when classroom is created
- Basic assignment CRUD (no grading yet)

**Estimated time:** 1-2 weeks for solid foundation

Ready to begin?
