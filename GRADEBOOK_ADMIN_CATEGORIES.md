# Admin-Controlled Grading Categories

## Schema Update: School-Wide Categories

Instead of letting each teacher create their own categories, **admin sets categories at the school or grade-level**.

### Database Schema

```sql
-- School-wide or Grade-level Category Templates (Admin controlled)
CREATE TABLE grading_category_templates (
    id UUID PRIMARY KEY,
    school_id UUID REFERENCES schools(id),
    template_name VARCHAR(100) NOT NULL,  -- "Elementary Standard", "Middle School Traditional"
    grade_level_range VARCHAR(20),  -- "K-5", "6-8", "9-12", or "ALL"
    description TEXT,

    -- Categories defined as JSONB array for flexibility
    categories JSONB NOT NULL,
    /* Example:
    [
        {
            "name": "Homework",
            "weight": 10,
            "category_type": "FORMATIVE",
            "color": "#3B82F6",
            "drop_lowest": 0
        },
        {
            "name": "Class Assignment",
            "weight": 40,
            "category_type": "FORMATIVE",
            "color": "#8B5CF6",
            "drop_lowest": 0
        },
        {
            "name": "Tests",
            "weight": 50,
            "category_type": "SUMMATIVE",
            "color": "#EF4444",
            "drop_lowest": 0
        }
    ]
    */

    is_active BOOLEAN DEFAULT TRUE,
    is_default BOOLEAN DEFAULT FALSE,  -- Default template for new classrooms
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Classroom inherits from template but admin can still customize per classroom if needed
CREATE TABLE classroom_grading_categories (
    id UUID PRIMARY KEY,
    classroom_id UUID REFERENCES classrooms(id),
    template_id UUID REFERENCES grading_category_templates(id),  -- Link to admin template

    -- Category details (copied from template, but can be customized)
    category_name VARCHAR(100) NOT NULL,
    category_type VARCHAR(20),  -- "FORMATIVE", "SUMMATIVE"
    weight_percentage DECIMAL(5,2) NOT NULL CHECK (weight_percentage >= 0 AND weight_percentage <= 100),
    color_code VARCHAR(7),
    drop_lowest_n INTEGER DEFAULT 0,

    sort_order INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    -- Ensure weights add up to 100% per classroom
    CONSTRAINT unique_classroom_category UNIQUE (classroom_id, category_name)
);

-- Validation function to ensure weights = 100%
CREATE OR REPLACE FUNCTION validate_category_weights()
RETURNS TRIGGER AS $$
BEGIN
    IF (
        SELECT SUM(weight_percentage)
        FROM classroom_grading_categories
        WHERE classroom_id = NEW.classroom_id
        AND is_active = TRUE
    ) != 100 THEN
        RAISE EXCEPTION 'Category weights must total 100%%';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_category_weights
AFTER INSERT OR UPDATE ON classroom_grading_categories
FOR EACH ROW
EXECUTE FUNCTION validate_category_weights();
```

---

## Admin UI Flow

### Step 1: Admin Creates Template

```
┌─────────────────────────────────────────────────────────────────┐
│ Create Grading Category Template                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ Template Name: [Middle School Traditional_____]                 │
│                                                                  │
│ Grade Levels: [✓] 6  [✓] 7  [✓] 8                             │
│                                                                  │
│ Categories:                                                      │
│                                                                  │
│ ┌────────────────────────────────────────────────────┐         │
│ │ 1. Homework                              10% [🗑️]  │         │
│ │    Type: Formative  |  Drop Lowest: [0]            │         │
│ ├────────────────────────────────────────────────────┤         │
│ │ 2. Class Assignment                      40% [🗑️]  │         │
│ │    Type: Formative  |  Drop Lowest: [0]            │         │
│ ├────────────────────────────────────────────────────┤         │
│ │ 3. Tests                                 50% [🗑️]  │         │
│ │    Type: Summative  |  Drop Lowest: [0]            │         │
│ └────────────────────────────────────────────────────┘         │
│                                                                  │
│ Total Weight: 100% ✓                                            │
│                                                                  │
│ [+ Add Category]                   [Save Template] [Cancel]     │
└─────────────────────────────────────────────────────────────────┘
```

### Step 2: Admin Assigns Template to Classrooms

**Option A: Automatic Assignment**
- When teacher creates classroom for Grade 6-8, automatically use "Middle School Traditional" template
- Categories are pre-populated

**Option B: Manual Override**
- Admin can assign different template to specific classroom
- Example: "Mrs. Brown's Math class uses project-based template instead"

### Step 3: Admin Can Modify Anytime

```
┌─────────────────────────────────────────────────────────────────┐
│ Edit Template: Middle School Traditional                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ ⚠️ Warning: This will affect 45 classrooms currently using     │
│    this template. Changes will apply to all.                    │
│                                                                  │
│ Categories:                                                      │
│                                                                  │
│ 1. Homework                    [10%] ← Change to [15%]         │
│ 2. Class Assignment            [40%] ← Change to [35%]         │
│ 3. Tests                       [50%]                            │
│                                                                  │
│ [ ] Apply changes to existing classrooms immediately            │
│ [✓] Apply only to new classrooms created after this change     │
│                                                                  │
│ [Update Template]                                               │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Percentage-Based vs Standards-Based Grading

### A. Percentage-Based (Traditional) - What You're Using

This is what most people know:
- **Assignments scored as points or percentages**: "Quiz 1: 18/20 = 90%"
- **Categories weighted**: Homework 10%, Class Work 40%, Tests 50%
- **Final grade calculated**: Weighted average = letter grade

**Example:**
```
Student: Mason Allen
─────────────────────────────────────────────────────
HOMEWORK (10% of final grade)
  HW 1: 10/10 = 100%
  HW 2:  9/10 = 90%
  HW 3:  8/10 = 80%
  Category Average: 90%  →  Contributes: 9% to final

CLASS ASSIGNMENT (40% of final grade)
  Essay 1: 85/100 = 85%
  Project: 92/100 = 92%
  Lab Report: 88/100 = 88%
  Category Average: 88.3%  →  Contributes: 35.3% to final

TESTS (50% of final grade)
  Test 1: 90/100 = 90%
  Test 2: 85/100 = 85%
  Midterm: 92/100 = 92%
  Category Average: 89%  →  Contributes: 44.5% to final

FINAL GRADE: 9% + 35.3% + 44.5% = 88.8% (B+)
```

### B. Standards-Based Grading (Alternative) - Elementary Focus

Instead of percentages, students are rated on **mastery of specific learning standards**.

**Example (Grade 2 Reading):**
```
Student: Mason Allen - Grade 2 Reading - Quarter 1
─────────────────────────────────────────────────────
Standard: RF.2.3 - Decode words with common prefixes/suffixes
Current Level: 3 (Proficient)

Evidence:
  9/15: Prefix Quiz → Level 2 (Developing)
  9/22: Worksheet Set → Level 3 (Proficient)
  9/29: Exit Tickets → Level 3 (Proficient)
  10/6: Unit Test → Level 4 (Advanced)

Trend: Improving ↗️
Most Recent: Level 4 (uses most recent evidence, not average)

Standard: RF.2.4 - Read with fluency and comprehension
Current Level: 3 (Proficient)

Evidence:
  9/20: Fluency Check → Level 3
  10/1: Reading Response → Level 3
  10/8: Partner Reading → Level 3

─────────────────────────────────────────────────────
Overall Reading Grade: Proficient (3/4)

Grading Scale:
  4 = Advanced - Exceeds grade-level expectations
  3 = Proficient - Meets grade-level expectations
  2 = Developing - Approaching grade-level expectations
  1 = Emerging - Beginning to develop skills
```

**Key Differences:**

| Traditional (Percentage) | Standards-Based |
|-------------------------|-----------------|
| Focus on **points earned** | Focus on **skill mastery** |
| Average all attempts | Use most recent or highest |
| One grade per subject | Multiple standards per subject |
| 0-100 scale | 1-4 or 1-5 scale |
| Homework counts toward grade | Homework is practice (may not count) |
| Good for 6-12 | Better for K-5 |

**For your system**: Since you're focused on middle school (6-8), **percentage-based is the right choice**. Standards-based is more for elementary.

---

## 3. How Retakes Work - Detailed Explanation

### The Problem with Traditional Grading

**Scenario:**
- Mason takes Chapter 5 Test on Monday: Gets 72% (C)
- Goes home, studies more, truly learns the material
- Takes same test on Friday: Gets 92% (A)
- **Question:** What grade should go in the gradebook?

**Traditional approach (most schools):**
- Average: (72 + 92) / 2 = 82% (B)
- **Problem:** This punishes learning! Mason NOW knows the material but still gets penalized for not knowing it the first time.

**Mastery-based approach (better):**
- Use highest score: 92% (A)
- **Rationale:** Grades should reflect CURRENT knowledge, not the learning journey

### How Our Retake System Works

#### Step 1: Teacher Enables Retakes for Assignment

```
┌─────────────────────────────────────────────────────────────────┐
│ Create Assignment: Chapter 5 Test                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ Assignment Name: [Chapter 5 Test___________]                    │
│ Category: [Tests (50%)] ▼                                       │
│ Due Date: [10/20/2025]                                          │
│ Points Possible: [100]                                          │
│                                                                  │
│ ── Retake Policy ────────────────────────────────────           │
│                                                                  │
│ [✓] Allow students to retake this assignment                   │
│                                                                  │
│     Max Retakes: [2] (students can retake up to 2 times)       │
│                                                                  │
│     Score Policy: [○] Average all attempts                      │
│                   [○] Most recent score                         │
│                   [●] Highest score                             │
│                   [○] Cap at 90% (even if higher)              │
│                                                                  │
│     Retake Deadline: [11/15/2025] (last day to retake)         │
│                                                                  │
│     [○] Automatic approval (students can retake anytime)        │
│     [●] Require teacher approval (request-based)                │
│                                                                  │
│ [Create Assignment]                                             │
└─────────────────────────────────────────────────────────────────┘
```

#### Step 2: Student Takes Original Test

```
Database Record Created:

student_grades table:
┌──────────────────────────────────────────────────────────────┐
│ id: uuid-1234                                                │
│ assignment_id: chapter-5-test                                │
│ student_id: mason-allen                                      │
│ attempt_number: 1         ← FIRST ATTEMPT                   │
│ score_earned: 72                                             │
│ max_possible: 100                                            │
│ percentage: 72.00                                            │
│ is_active_score: TRUE     ← THIS IS THE CURRENT GRADE       │
│ submitted_at: 2025-10-20 10:30 AM                           │
│ graded_by_user_id: mrs-brown                                 │
└──────────────────────────────────────────────────────────────┘

Mason sees in his grade portal: Chapter 5 Test: 72% (C)
```

#### Step 3: Student Requests Retake

```
Student Portal:
┌─────────────────────────────────────────────────────────────────┐
│ Your Recent Grades                                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ Chapter 5 Test                                                  │
│ Score: 72% (C)                    Due: Oct 20  |  Graded: Oct 21│
│                                                                  │
│ 🔄 Retake Available                                             │
│ You can retake this test up to 2 more times.                   │
│ Deadline: Nov 15                                                │
│                                                                  │
│ [Request Retake]                                                │
└─────────────────────────────────────────────────────────────────┘

When clicked:
┌─────────────────────────────────────────────────────────────────┐
│ Request Retake: Chapter 5 Test                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ Current Score: 72%                                              │
│                                                                  │
│ Why do you want to retake this test?                           │
│ [I studied more and understand the material better now_______] │
│                                                                  │
│ Preferred Retake Date: [10/25/2025] ▼                          │
│                                                                  │
│ Note: Your highest score will be used for your final grade.    │
│                                                                  │
│ [Submit Request]                                                │
└─────────────────────────────────────────────────────────────────┘
```

#### Step 4: Teacher Approves Retake

```
Teacher Dashboard:
┌─────────────────────────────────────────────────────────────────┐
│ Retake Requests (3 pending)                                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ 1. Mason Allen - Chapter 5 Test                                │
│    Current Score: 72%  |  Requested: Oct 21, 2025              │
│    Reason: "I studied more and understand the material better"  │
│    Preferred Date: Oct 25                                       │
│                                                                  │
│    [✓ Approve]  [✗ Deny]  [💬 Message Student]                │
│                                                                  │
│ 2. Sophie Chen - Quiz 8                                        │
│    Current Score: 68%  |  Requested: Oct 21, 2025              │
│    [✓ Approve]  [✗ Deny]  [💬 Message Student]                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

Database Update:
┌──────────────────────────────────────────────────────────────┐
│ retake_requests table:                                       │
│                                                              │
│ id: retake-req-5678                                          │
│ student_grade_id: uuid-1234                                  │
│ student_id: mason-allen                                      │
│ requested_at: 2025-10-21 3:00 PM                            │
│ status: APPROVED        ← Teacher approved                  │
│ approved_by: mrs-brown                                       │
│ approved_at: 2025-10-21 4:30 PM                             │
│ scheduled_date: 2025-10-25                                   │
└──────────────────────────────────────────────────────────────┘
```

#### Step 5: Student Takes Retake

```
Database Record Created (SECOND ATTEMPT):

student_grades table:
┌──────────────────────────────────────────────────────────────┐
│ id: uuid-5678                    ← NEW RECORD               │
│ assignment_id: chapter-5-test                                │
│ student_id: mason-allen                                      │
│ attempt_number: 2         ← SECOND ATTEMPT                  │
│ score_earned: 92                                             │
│ max_possible: 100                                            │
│ percentage: 92.00                                            │
│ is_active_score: TRUE     ← NOW THIS IS THE CURRENT GRADE   │
│ submitted_at: 2025-10-25 10:30 AM                           │
│ graded_by_user_id: mrs-brown                                 │
└──────────────────────────────────────────────────────────────┘

ORIGINAL ATTEMPT UPDATED:
┌──────────────────────────────────────────────────────────────┐
│ id: uuid-1234                                                │
│ attempt_number: 1                                            │
│ score_earned: 72                                             │
│ is_active_score: FALSE    ← NO LONGER ACTIVE               │
│                           (but kept for history)             │
└──────────────────────────────────────────────────────────────┘
```

#### Step 6: Grade Calculation

```
When calculating final grade for Mason:

Query: Get active score for each assignment
SELECT * FROM student_grades
WHERE student_id = 'mason-allen'
AND assignment_id = 'chapter-5-test'
AND is_active_score = TRUE

Result: 92% (not 72%)

Final grade calculation:
  Tests category:
    Test 1: 85%
    Test 2: 90%
    Chapter 5 Test: 92%  ← Uses highest score!
    Average: 89%

  Tests (50% weight): 89% × 0.50 = 44.5%
  + Homework (10%): 85% × 0.10 = 8.5%
  + Class Assignments (40%): 88% × 0.40 = 35.2%

  FINAL: 88.2% (B+)
```

#### Step 7: Audit Trail

```
Complete history visible to teacher/admin:

Grade History: Mason Allen - Chapter 5 Test
─────────────────────────────────────────────────────

Oct 20, 2025 10:30 AM - Student submitted test
Oct 21, 2025 2:00 PM  - Mrs. Brown graded: 72%
Oct 21, 2025 3:00 PM  - Student requested retake
                        Reason: "Studied more, understand better"
Oct 21, 2025 4:30 PM  - Mrs. Brown approved retake
                        Scheduled for: Oct 25
Oct 25, 2025 10:30 AM - Student submitted retake (Attempt 2)
Oct 25, 2025 3:00 PM  - Mrs. Brown graded retake: 92%
Oct 25, 2025 3:00 PM  - System updated active score: 92%
                        Policy: Highest score
                        Previous: 72% → New: 92%

All changes logged to grade_change_log table for FERPA compliance
```

### Retake Policy Options

**1. Highest Score (Recommended for Mastery)**
- Student gets: max(72%, 92%) = 92%
- Philosophy: "Grades reflect current knowledge"

**2. Most Recent Score**
- Student gets: 92% (the latest attempt)
- Philosophy: "Most recent demonstrates current ability"

**3. Average All Attempts**
- Student gets: (72% + 92%) / 2 = 82%
- Philosophy: "All attempts matter" (less mastery-focused)

**4. Capped at 90%**
- Student gets: min(92%, 90%) = 90%
- Philosophy: "Original attempt matters, but allow improvement with limit"

---

## Updated Admin Workflow

### Initial Setup (Admin)

1. **Create Category Template**
   - Go to Admin → Grading → Category Templates
   - Create "Middle School Standard"
   - Add 3 categories:
     - Homework: 10%
     - Class Assignment: 40%
     - Tests: 50%
   - Set as default for grades 6-8

2. **Configure Retake Policy (School-wide or per template)**
   - Allow retakes: Yes
   - Default policy: Highest score
   - Require teacher approval: Yes

### Teacher Workflow

1. **Create Classroom**
   - System automatically applies "Middle School Standard" template
   - Categories pre-populated (Homework 10%, Class Assignment 40%, Tests 50%)
   - Teacher cannot change weights (admin controlled)

2. **Create Assignment**
   - Choose category from dropdown (only admin categories available)
   - Optionally enable retakes for this assignment
   - Set due date, points

3. **Grade Assignments**
   - Enter scores as normal
   - If student requests retake and it's approved, grade the retake
   - System automatically uses highest score

### Database Flow

```
Admin creates template
  ↓
grading_category_templates table

Teacher creates classroom
  ↓
System copies template to classroom_grading_categories

Teacher creates assignment
  ↓
Assignment links to category_id from classroom_grading_categories

Student submits work
  ↓
Grade entered in student_grades (attempt_number = 1)

Student requests retake
  ↓
retake_requests table (status: PENDING)

Teacher approves
  ↓
retake_requests updated (status: APPROVED)

Student takes retake
  ↓
New record in student_grades (attempt_number = 2)
Original attempt: is_active_score = FALSE
Retake: is_active_score = TRUE (based on policy)

Grade calculation
  ↓
Query only records where is_active_score = TRUE
Calculate weighted average
```

---

## API Endpoints for Admin

```python
# Admin Category Template Management
POST   /admin/grading-templates                    # Create new template
GET    /admin/grading-templates                    # List all templates
PUT    /admin/grading-templates/{template_id}      # Update template
DELETE /admin/grading-templates/{template_id}      # Delete template

# Apply template to classrooms
POST   /admin/grading-templates/{template_id}/apply
Body: {
    "classroom_ids": ["uuid1", "uuid2"],
    "apply_to_existing_assignments": false
}

# Validate category weights
POST   /admin/grading-templates/validate
Body: {
    "categories": [
        {"name": "Homework", "weight": 15},
        {"name": "Tests", "weight": 85}
    ]
}
Response: {"valid": true, "total": 100}
```

Does this clarify everything? Should I start implementing Phase 1 with admin-controlled categories?
