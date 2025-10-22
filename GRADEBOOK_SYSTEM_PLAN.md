# Gradebook System - Best-in-Class Implementation Plan

## Executive Summary

After comprehensive research of leading gradebook systems (PowerSchool, Canvas, Infinite Campus) and modern grading practices, this plan outlines a **best-in-class gradebook** that addresses the most common pain points while incorporating cutting-edge features for K-8 education.

**Key Differentiators:**
- **Dual-mode flexibility**: Seamlessly supports both traditional AND standards-based grading
- **Teacher autonomy**: Never forces calculated grades on teachers - provides suggestions with override capability
- **Zero-friction retakes**: Built-in mastery-based reassessment without administrative burden
- **Complete audit trail**: FERPA-compliant grade change tracking with context
- **Elementary-first design**: Optimized UX for K-5 narrative/skills-based reporting
- **Performance-first**: Sub-second load times for classes of 30+ students

---

## Research Findings

### What Teachers HATE About Current Gradebook Systems

Based on 2024 educator feedback and reviews:

1. **Loss of Professional Control**
   - "Grading programs calculate final grades and teachers feel no choice but to submit them, even if they don't match their assessment"
   - Systems don't allow retakes (multiple grades for same test)
   - Can't use 1-4 grading scales with proportional weighting
   - Can't weight categories at 0% (for feedback-only assignments)

2. **Rigid, Unintuitive Interfaces**
   - Slow performance with 30+ students
   - Too many clicks to enter/update grades
   - Mobile experience is terrible
   - Can't customize columns/views for different devices

3. **Poor Transparency**
   - "When parents question grades, teachers say 'That's how the program calculated it'"
   - Black-box grade calculations
   - No clear audit trail for grade changes

4. **One-Size-Fits-All Approach**
   - Elementary teachers forced into percentage-based systems when they use skills/standards
   - Middle school teachers need weighted categories but can't configure properly
   - Special education accommodations are afterthoughts

### What Makes PowerSchool & Canvas Successful

**PowerSchool Strengths:**
- Standards-based grading support with unlimited grade scales
- Robust gradebook with customizable columns/views for different devices
- Weighting categories is simple (click of mouse)
- Grade override capability with calculation transparency
- Serving 45+ million students globally

**Canvas LMS Strengths:**
- Learning Mastery Gradebook for standards tracking
- Multiple gradebook views (traditional, learning mastery, grading history)
- Customizable grading policies per course
- Automatic grade posting with teacher control
- Cloud-based with excellent API

**Common Weakness:**
Both still struggle with the elementary vs middle school divide - trying to force percentage-based thinking onto K-5 teachers who work with developmental standards.

### Modern Grading Research (2024)

**Standards-Based Grading Momentum:**
- Students in SBG schools are **2x more likely** to score proficient on state assessments
- Teachers report better understanding of student needs to customize instruction
- Students become more comfortable making mistakes (growth mindset)
- Reduces competitive grade comparison among students

**Reassessment Best Practices:**
- "Reassessment is the heartbeat of effective mastery-based grading" (Townsley & Wilcox 2024)
- Most successful: **Token systems** (students get 3-5 retake tokens per semester)
- Alternative: **Earned reassessment** (must complete formative work/tutoring first)
- Some schools cap reassessments at 90% to preserve academic rigor

**Weight Distribution Trends:**
- Elementary (K-5): Moving away from percentages entirely → Skills/Standards ratings
- Middle School (6-8): 60-70% summative, 30-40% formative (homework/classwork)
- Some districts: 65% summative, 35% formative
- Fairfax County: 70% summative, 30% formative

---

## Proposed Gradebook Architecture

### Phase 1: Foundation & Data Model (Week 1-2)

#### Database Schema

```sql
-- Assignment Categories (weighted buckets)
CREATE TABLE assignment_categories (
    id UUID PRIMARY KEY,
    classroom_id UUID REFERENCES classrooms(id),
    name VARCHAR(100) NOT NULL,  -- "Tests", "Homework", "Projects", "Formative", "Summative"
    category_type VARCHAR(20),   -- "FORMATIVE", "SUMMATIVE", "PRACTICE", "FEEDBACK_ONLY"
    weight_percentage DECIMAL(5,2),  -- NULL for unweighted, 0.00 for feedback-only
    drop_lowest_n INTEGER DEFAULT 0,  -- Drop lowest N scores
    color_code VARCHAR(7),  -- For UI organization
    sort_order INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- Assignments
CREATE TABLE assignments (
    id UUID PRIMARY KEY,
    classroom_id UUID REFERENCES classrooms(id),
    category_id UUID REFERENCES assignment_categories(id),
    academic_year_id UUID REFERENCES academic_years(id),

    -- Assignment Details
    name VARCHAR(200) NOT NULL,
    description TEXT,
    assignment_type VARCHAR(50),  -- "test", "quiz", "homework", "project", "essay", etc.

    -- Scoring Configuration
    grading_mode VARCHAR(20) NOT NULL,  -- "POINTS", "PERCENTAGE", "STANDARDS", "RUBRIC", "NARRATIVE"
    max_points DECIMAL(10,2),  -- For points-based
    rubric_id UUID,  -- For rubric-based

    -- Standards-Based Options
    standards_ids JSONB,  -- Array of standard IDs this assignment assesses
    proficiency_scale VARCHAR(20),  -- "1-4", "1-5", "EMERGING_DEVELOPING_PROFICIENT_ADVANCED"

    -- Retake Configuration
    allow_retakes BOOLEAN DEFAULT FALSE,
    max_retakes INTEGER,
    retake_score_policy VARCHAR(20),  -- "HIGHEST", "MOST_RECENT", "AVERAGE", "CAPPED_90"
    retake_deadline DATE,

    -- Due Dates
    assigned_date DATE,
    due_date DATE,
    late_submission_policy VARCHAR(20),  -- "NO_PENALTY", "10_PERCENT_PER_DAY", "ZERO_AFTER_DUE", "CUSTOM"
    late_penalty_percentage DECIMAL(5,2),

    -- Visibility
    is_published BOOLEAN DEFAULT FALSE,
    visible_to_students BOOLEAN DEFAULT TRUE,
    include_in_grade_calculation BOOLEAN DEFAULT TRUE,

    -- Tracking
    created_by_user_id UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Student Grades (includes full retake history)
CREATE TABLE student_grades (
    id UUID PRIMARY KEY,
    assignment_id UUID REFERENCES assignments(id),
    student_id UUID REFERENCES students(id),
    classroom_id UUID REFERENCES classrooms(id),

    -- Score Information
    attempt_number INTEGER DEFAULT 1,  -- 1 = original, 2+ = retakes
    score_earned DECIMAL(10,2),
    max_possible DECIMAL(10,2),
    percentage DECIMAL(5,2),

    -- Standards-Based Scoring
    proficiency_level VARCHAR(50),  -- "1", "2", "3", "4" or "EMERGING", "DEVELOPING", etc.
    standards_scores JSONB,  -- For multi-standard assignments: {"CCSS.MATH.3.OA.A.1": 3, "CCSS.MATH.3.OA.A.2": 4}

    -- Narrative Feedback
    teacher_feedback TEXT,
    teacher_comments TEXT,

    -- Submission Tracking
    submitted_at TIMESTAMP,
    is_late BOOLEAN DEFAULT FALSE,
    is_missing BOOLEAN DEFAULT FALSE,
    is_excused BOOLEAN DEFAULT FALSE,
    late_penalty_applied DECIMAL(5,2),

    -- Flags
    is_active_score BOOLEAN DEFAULT TRUE,  -- FALSE for retakes that are superseded
    is_manually_overridden BOOLEAN DEFAULT FALSE,
    override_reason TEXT,

    -- Audit Trail
    graded_by_user_id UUID REFERENCES users(id),
    graded_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Grade Change Audit Log (FERPA Compliance)
CREATE TABLE grade_change_log (
    id UUID PRIMARY KEY,
    student_grade_id UUID REFERENCES student_grades(id),
    student_id UUID REFERENCES students(id),
    assignment_id UUID REFERENCES assignments(id),

    -- Change Details
    changed_by_user_id UUID REFERENCES users(id),
    change_type VARCHAR(50),  -- "GRADE_ENTERED", "GRADE_UPDATED", "GRADE_DELETED", "RETAKE_SUBMITTED", "MANUAL_OVERRIDE"

    -- Before/After Values
    old_score DECIMAL(10,2),
    new_score DECIMAL(10,2),
    old_proficiency VARCHAR(50),
    new_proficiency VARCHAR(50),

    -- Context
    change_reason TEXT,  -- Required for manual overrides
    ip_address VARCHAR(45),
    user_agent TEXT,

    -- Timestamp
    changed_at TIMESTAMP DEFAULT NOW()
);

-- Grading Scales (School-wide or Classroom-specific)
CREATE TABLE grading_scales (
    id UUID PRIMARY KEY,
    school_id UUID REFERENCES schools(id),
    name VARCHAR(100) NOT NULL,  -- "Traditional A-F", "Standards 1-4", "IB 1-7"
    scale_type VARCHAR(20),  -- "LETTER", "NUMERIC", "STANDARDS", "NARRATIVE"
    grade_level_range VARCHAR(20),  -- "K-5", "6-8", "9-12", "ALL"

    -- Scale Definition (JSONB for flexibility)
    scale_definition JSONB,
    /* Example traditional:
    {
        "A": {"min": 90, "max": 100, "gpa": 4.0},
        "B": {"min": 80, "max": 89.99, "gpa": 3.0},
        "C": {"min": 70, "max": 79.99, "gpa": 2.0},
        "D": {"min": 60, "max": 69.99, "gpa": 1.0},
        "F": {"min": 0, "max": 59.99, "gpa": 0.0}
    }

    Example standards-based:
    {
        "4": {"label": "Advanced", "description": "Exceeds grade-level standards"},
        "3": {"label": "Proficient", "description": "Meets grade-level standards"},
        "2": {"label": "Developing", "description": "Approaching standards"},
        "1": {"label": "Emerging", "description": "Beginning to develop skills"}
    }
    */

    is_default BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- Classroom Grading Configuration (per teacher, per classroom)
CREATE TABLE classroom_grading_config (
    id UUID PRIMARY KEY,
    classroom_id UUID REFERENCES classrooms(id),
    academic_year_id UUID REFERENCES academic_years(id),

    -- Grading Philosophy
    grading_mode VARCHAR(20) NOT NULL,  -- "TRADITIONAL", "STANDARDS_BASED", "HYBRID", "NARRATIVE"
    grading_scale_id UUID REFERENCES grading_scales(id),

    -- Calculation Method
    calculation_method VARCHAR(30),  -- "WEIGHTED_CATEGORIES", "POINTS_BASED", "STANDARDS_AVERAGE", "TEACHER_DETERMINED"

    -- Late Work Policy
    accept_late_work BOOLEAN DEFAULT TRUE,
    late_penalty_policy VARCHAR(50),
    max_days_late INTEGER,

    -- Retake Policy
    allow_reassessments BOOLEAN DEFAULT FALSE,
    reassessment_policy VARCHAR(50),  -- "UNLIMITED", "TOKEN_BASED", "EARNED", "TEACHER_APPROVAL"
    reassessment_tokens_per_semester INTEGER,  -- For token-based

    -- Display Options
    show_calculated_grade BOOLEAN DEFAULT TRUE,
    allow_teacher_override BOOLEAN DEFAULT TRUE,  -- KEY FEATURE: Teachers always have final say
    round_to_nearest VARCHAR(10),  -- "WHOLE", "TENTH", "HUNDREDTH"

    -- Parent/Student Visibility
    parent_access_enabled BOOLEAN DEFAULT TRUE,
    show_scores_to_students BOOLEAN DEFAULT TRUE,
    show_class_average BOOLEAN DEFAULT FALSE,

    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Student Final Grades (calculated + teacher override)
CREATE TABLE student_final_grades (
    id UUID PRIMARY KEY,
    student_id UUID REFERENCES students(id),
    classroom_id UUID REFERENCES classrooms(id),
    academic_year_id UUID REFERENCES academic_years(id),
    marking_period VARCHAR(20),  -- "Q1", "Q2", "Q3", "Q4", "S1", "S2", "FINAL"

    -- Calculated Grade
    calculated_percentage DECIMAL(5,2),
    calculated_letter_grade VARCHAR(5),
    calculated_gpa DECIMAL(3,2),

    -- Teacher Override
    is_overridden BOOLEAN DEFAULT FALSE,
    override_letter_grade VARCHAR(5),
    override_percentage DECIMAL(5,2),
    override_reason TEXT,
    override_date TIMESTAMP,

    -- Final Grade (what goes on report card)
    final_letter_grade VARCHAR(5) NOT NULL,
    final_percentage DECIMAL(5,2),
    final_gpa DECIMAL(3,2),

    -- Standards-Based Alternative
    standards_summary JSONB,  -- For standards-based reporting
    narrative_comment TEXT,

    -- Metadata
    finalized_by_user_id UUID REFERENCES users(id),
    finalized_at TIMESTAMP,
    is_locked BOOLEAN DEFAULT FALSE,  -- Locked after report cards published
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

---

### Phase 2: Core API & Business Logic (Week 2-3)

#### Key Endpoints

**Assignment Management:**
- `POST /gradebook/classrooms/{classroom_id}/assignments` - Create assignment
- `GET /gradebook/classrooms/{classroom_id}/assignments` - List assignments
- `PUT /gradebook/assignments/{assignment_id}` - Update assignment
- `DELETE /gradebook/assignments/{assignment_id}` - Soft delete
- `POST /gradebook/assignments/{assignment_id}/duplicate` - Duplicate for new marking period

**Grade Entry:**
- `POST /gradebook/assignments/{assignment_id}/grades/bulk` - Bulk grade entry (entire class at once)
- `PUT /gradebook/grades/{grade_id}` - Update individual grade
- `POST /gradebook/grades/{grade_id}/retake` - Submit retake attempt
- `PUT /gradebook/grades/{grade_id}/override` - Manual override (requires reason)

**Gradebook Views:**
- `GET /gradebook/classrooms/{classroom_id}/grid` - Full gradebook grid (students × assignments)
- `GET /gradebook/students/{student_id}/grades` - Individual student view
- `GET /gradebook/classrooms/{classroom_id}/summary` - Class statistics
- `GET /gradebook/assignments/{assignment_id}/statistics` - Assignment analytics

**Final Grades:**
- `GET /gradebook/classrooms/{classroom_id}/calculated-grades` - Get calculated grades with suggestions
- `POST /gradebook/classrooms/{classroom_id}/final-grades` - Submit final grades (with optional overrides)
- `PUT /gradebook/final-grades/{grade_id}/override` - Override calculated grade

**Audit & Compliance:**
- `GET /gradebook/audit-log` - Grade change history (admin/compliance)
- `GET /gradebook/grades/{grade_id}/history` - Full history for one grade

---

### Phase 3: Teacher UI - Gradebook Grid (Week 3-4)

#### Desktop Experience

**Layout: Spreadsheet-Style Grid**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Grade 3 - Homeroom (Mrs. Brown)                    [+ New Assignment] [⚙️]  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ Student        │ Test 1  │ Quiz 1  │ HW 1   │ Project │ ... │ Current Grade│
│                │ (100pts)│ (25pts) │ (10pts)│ (50pts) │     │              │
│ ───────────────┼─────────┼─────────┼────────┼─────────┼─────┼──────────────│
│ Allen, Mason   │   92    │   24    │   10   │   45    │ ... │   A  (92%)  │
│ Chen, Sophie   │   88    │   22    │    8   │   48    │ ... │   B+ (89%)  │
│ Garcia, Luis   │   ⚠️ M   │   20    │    9   │   42    │ ... │   C  (75%)  │
│ ...            │         │         │        │         │     │              │
└─────────────────────────────────────────────────────────────────────────────┘

Features:
✓ Frozen left column (student names)
✓ Horizontal scroll for many assignments
✓ Color coding: Green (A), Yellow (B-C), Red (D-F), Gray (Missing)
✓ Click any cell to quick-edit
✓ Keyboard navigation (Tab, Arrow keys, Enter to save)
✓ Bulk actions: Select column → Enter same grade for all
✓ Visual indicators: ⚠️ Missing, 🔄 Retake available, 🔒 Locked
```

**Quick Actions:**
- **Right-click cell**: Grade, Mark missing, Mark excused, Add comment, View history
- **Column header menu**: Sort, Statistics, Curve grades, Export column
- **Row menu**: View student details, Send message, View all grades

#### Mobile Experience

**Optimized for Quick Entry on iPad/Tablet:**
- List view (not grid) - one student at a time
- Large tap targets for scores
- Swipe gestures: Swipe right for next student, swipe left for previous
- Voice input for comments
- Offline mode with sync

---

### Phase 4: Advanced Features - What Makes Us Best-in-Class (Week 4-5)

#### 1. **Intelligent Grade Calculation with Teacher Override**

**The Problem:**
Current systems force calculated grades on teachers, removing professional judgment.

**Our Solution:**
```
┌────────────────────────────────────────────────────────────────────┐
│ Final Grades for Grade 3 Homeroom - Quarter 1                     │
├────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ Student: Mason Allen                                               │
│                                                                     │
│ 📊 Calculated Grade:  92.3%  (A)                                  │
│                                                                     │
│ Category Breakdown:                                                │
│   Tests (60%):        94% ━━━━━━━━━━━━━━━━━━━ 94/100 avg         │
│   Homework (20%):     88% ━━━━━━━━━━━━━━━━━━  88/100 avg         │
│   Projects (20%):     95% ━━━━━━━━━━━━━━━━━━━ 95/100 avg         │
│                                                                     │
│ ✏️ Teacher Override:  [Use Calculated] ▼                          │
│                        ○ Use calculated grade (92% - A)            │
│                        ○ Override to: [__] (Reason required)       │
│                                                                     │
│ 💭 Teacher Note: (Optional)                                        │
│    Mason has shown exceptional growth this quarter...              │
│                                                                     │
│                              [Save Final Grade]                     │
└────────────────────────────────────────────────────────────────────┘
```

**Key Principle:** System SUGGESTS but never FORCES grades.

#### 2. **Zero-Friction Retakes/Reassessments**

**Token-Based System (Default for Middle School):**
```
Student View:
┌─────────────────────────────────────────────────────────┐
│ Your Reassessment Tokens: 🎟️ 🎟️ 🎟️ (3 remaining)     │
│                                                          │
│ Recent Grades:                                          │
│   Chapter 5 Test:  72% (C)  [Request Retake] 🎟️        │
│   Lab Report:      85% (B)                              │
│   Quiz 8:          68% (D)  [Request Retake] 🎟️        │
└─────────────────────────────────────────────────────────┘

Teacher View:
┌─────────────────────────────────────────────────────────┐
│ Retake Requests (2 pending)                             │
│                                                          │
│ ✓ Allen, Mason - Chapter 5 Test (72% → Retake)         │
│   Token used: 1 of 5 | Requested: Oct 20               │
│   [✓ Approve] [✗ Deny] [💬 Message]                    │
│                                                          │
│ ✓ Chen, Sophie - Quiz 8 (68% → Retake)                 │
│   Token used: 2 of 5 | Requested: Oct 21               │
│   [✓ Approve] [✗ Deny] [💬 Message]                    │
└─────────────────────────────────────────────────────────┘
```

**Automatic Score Handling:**
- Teacher configures policy: Highest score, Most recent, Average, or Capped at 90%
- All attempts stored in database
- Clear visual history for students/parents

#### 3. **Dual-Mode: Traditional + Standards-Based**

**Elementary Mode (K-5): Standards-Based Focus**
```
Grade 2 Math - Quarter 1 Report

Standard: 2.NBT.B.5 - Add/subtract within 100
Progress: ████████░░ 3 (Proficient)

Evidence:
  ✓ Quiz 10/15: Level 3
  ✓ Worksheet Set: Level 3
  ✓ Exit Tickets (avg): Level 3
  ✓ Unit Test: Level 4

Teacher Note: Mason demonstrates consistent proficiency in two-digit
addition and subtraction. He can explain his thinking clearly.
```

**Middle School Mode (6-8): Weighted Categories**
```
Grade 7 Math - Quarter 1

Summative (70%):          89% ━━━━━━━━━━━━━━━━━━
  Tests (3):               92, 88, 87
  Projects (1):            90

Formative (30%):          84% ━━━━━━━━━━━━━━
  Quizzes (6):             Drop lowest (78), Avg: 86
  Homework (12):           Drop lowest 2, Avg: 82

Current Grade: 87.5% (B+)
```

**Hybrid Mode:** Allow both in same classroom (some assignments standards-based, others traditional)

#### 4. **Real-Time Parent Portal**

**Parent Dashboard:**
- See all children's grades in one view
- Email/SMS notifications: New grade posted, Assignment missing, Grade drops below threshold
- Trends graph: "Sophie's math grade over time"
- Download progress reports anytime (no waiting for report card day)

**Student Dashboard:**
- Gamification: "🎯 You're 2 points from an A in Science!"
- Missing assignments prominently displayed
- GPA calculator: "If I get 90% on the final, my grade will be..."

#### 5. **AI-Assisted Grading (Phase 2 - Future)**

**Smart Rubric Application:**
- For essay/writing assignments: AI suggests rubric scores based on writing quality
- Teacher always reviews and can override
- Saves hours on grading extended responses

**Pattern Detection:**
- "15 students missed question #3 on the test - consider reteaching this concept"
- "Mason's homework grades are 95% but test grades are 70% - possible test anxiety?"

#### 6. **Complete Audit Trail & FERPA Compliance**

**Every Grade Change Logged:**
```
Grade History: Mason Allen - Chapter 5 Test

Oct 15, 2025 10:23 AM - Mrs. Brown entered grade: 72%
Oct 18, 2025 2:15 PM - Mason requested retake (token #1)
Oct 19, 2025 9:00 AM - Mrs. Brown approved retake
Oct 21, 2025 10:30 AM - Mrs. Brown entered retake grade: 88%
Oct 21, 2025 10:30 AM - System updated active score: 88% (policy: highest)

IP: 192.168.1.42 | Device: Chrome on Windows
```

**Admin Compliance Reports:**
- All grade changes in date range
- All manual overrides with reasons
- All parent data access
- Export for district audits

---

### Phase 5: Analytics & Insights (Week 5-6)

#### Teacher Analytics Dashboard

**Class Performance Overview:**
```
┌─────────────────────────────────────────────────────────┐
│ Grade 7 Math - Mrs. Brown                              │
│                                                          │
│ Class Average: 84.2% (B)  📊 ↑ 2.3% from Q1            │
│                                                          │
│ Grade Distribution:                                     │
│   A  (90-100):  ████████ 8 students (32%)              │
│   B  (80-89):   ███████████ 11 students (44%)          │
│   C  (70-79):   ████ 4 students (16%)                  │
│   D  (60-69):   ██ 2 students (8%)                     │
│   F  (0-59):    0 students (0%)                        │
│                                                          │
│ 🎯 At-Risk Students (2):                                │
│   • Garcia, Luis - Current: 68% (needs 75% on final)   │
│   • Johnson, Emma - Current: 62% (needs 85% on final)  │
│                                                          │
│ ⚠️ Missing Assignments: 12 across 5 students            │
│                                                          │
│ 📈 Trending Up: Chen, Sophie (+15% from Q1)            │
└─────────────────────────────────────────────────────────┘
```

**Assignment Analysis:**
```
Chapter 5 Test - Detailed Results

Average Score: 78.3%
Median: 82%
Standard Deviation: 12.4

Question-Level Analysis:
  Q1 (Vocabulary):     94% correct ✓
  Q2 (Word Problems):  88% correct ✓
  Q3 (Fractions):      45% correct ⚠️ RETEACH
  Q4 (Long Division):  82% correct ✓
  Q5 (Application):    71% correct ~

Recommendation: Review fraction concepts before moving to decimals
```

#### Admin/Principal Reports

- Teacher gradebook completion rates
- Grade distribution by teacher/subject (identify grade inflation/deflation)
- Students failing 2+ classes (intervention needed)
- Retake/reassessment usage patterns
- Parent portal engagement metrics

---

## Implementation Comparison

### How We Stack Up Against Competition

| Feature | PowerSchool | Canvas | Our System |
|---------|-------------|--------|------------|
| **Standards-Based Grading** | ✓ Good | ✓ Good | ✓✓ Excellent - Dual mode |
| **Traditional Grading** | ✓✓ Excellent | ✓ Good | ✓✓ Excellent |
| **Teacher Grade Override** | ✓ Limited | ✓ Limited | ✓✓✓ Full control |
| **Retake Management** | ✗ Manual | ✗ Manual | ✓✓ Built-in tokens |
| **Mobile Experience** | ~ Mediocre | ✓ Good | ✓✓ Optimized |
| **Audit Trail** | ✓ Basic | ✓ Basic | ✓✓ Complete FERPA |
| **Parent Real-Time Access** | ✓ Good | ✓ Good | ✓✓ Enhanced |
| **K-5 Narrative Reports** | ~ Limited | ~ Limited | ✓✓ First-class |
| **Offline Capability** | ✗ No | ✗ No | ✓ Yes (mobile) |
| **Custom Grading Scales** | ✓✓ Excellent | ✓ Good | ✓✓ Excellent |
| **Weighted Categories** | ✓✓ Excellent | ✓✓ Excellent | ✓✓ Excellent |
| **Analytics/Insights** | ✓ Basic | ✓ Good | ✓✓✓ Advanced |
| **Ease of Use (Teachers)** | ~ Mediocre | ✓ Good | ✓✓✓ Exceptional |

---

## Development Roadmap

### Phase 1: MVP (4-5 weeks)
**Goal:** Basic gradebook with traditional percentage grading

- ✅ Week 1: Database schema + migrations
- ✅ Week 2: Core API endpoints (CRUD assignments/grades)
- ✅ Week 3: Teacher gradebook grid UI (desktop)
- ✅ Week 4: Grade calculation engine + category weighting
- ✅ Week 5: Parent/student view (read-only)

**Deliverable:** Teachers can create assignments, enter grades, calculate final grades

### Phase 2: Standards-Based + Retakes (3 weeks)
- ✅ Week 6: Standards-based grading mode
- ✅ Week 7: Retake/reassessment system (token-based)
- ✅ Week 8: Teacher override + audit trail

**Deliverable:** Full dual-mode support with mastery-based learning

### Phase 3: Mobile + Analytics (2-3 weeks)
- ✅ Week 9-10: Mobile-optimized UI (iOS/Android)
- ✅ Week 11: Teacher analytics dashboard
- ✅ Week 12: Admin reports

**Deliverable:** Complete mobile experience + data insights

### Phase 4: Advanced Features (3-4 weeks)
- ✅ Week 13: Rubric-based grading
- ✅ Week 14: Bulk import/export (Excel, CSV)
- ✅ Week 15: Report card generation
- ✅ Week 16: Integration with state reporting systems

**Deliverable:** Enterprise-grade feature set

### Phase 5: AI & Innovation (Ongoing)
- AI-assisted rubric scoring
- Predictive analytics (at-risk identification)
- Natural language grade entry ("Give everyone who scored above 90 an A")
- Voice grading for mobile

---

## Key Design Principles

### 1. **Teacher Autonomy First**
Never force calculated grades. Always allow professional override with context.

### 2. **Elementary ≠ Middle School**
K-5 teachers need narrative/standards. 6-8 teachers need weighted categories. Support both excellently.

### 3. **Performance is Non-Negotiable**
Gradebook must load in <1 second for 30 students × 50 assignments.

### 4. **Mobile is Equal, Not Secondary**
Teachers grade during lunch, at home, on iPad. Mobile UX must be excellent.

### 5. **Transparency Builds Trust**
Parents should understand exactly how grades are calculated. No black boxes.

### 6. **Mastery Over Averages**
Support reassessments natively. Learning happens over time.

### 7. **FERPA Compliance is Table Stakes**
Complete audit trail. Role-based access. Encryption at rest and in transit.

---

## Technical Stack Recommendations

### Backend
- **Framework:** FastAPI (already using)
- **Database:** PostgreSQL (already using) with JSONB for flexible schema
- **Caching:** Redis for grade calculations (cache calculated grades, invalidate on change)
- **Background Jobs:** Celery for report generation, bulk imports

### Frontend
- **Web:** React + TypeScript (already using)
- **Grid Component:** AG-Grid or TanStack Table (high-performance spreadsheet)
- **Mobile:** React Native or Progressive Web App (PWA)
- **State Management:** React Query for server state

### Performance Optimizations
- Lazy load assignments (only visible columns)
- Virtual scrolling for large class sizes
- Debounce grade entry (don't save on every keystroke)
- Optimistic UI updates (instant feedback, sync in background)

---

## Next Steps - Your Decision

I recommend we start with **Phase 1 MVP** focused on traditional grading (weeks 1-5), as:

1. Most middle school teachers (your primary users right now) need this first
2. It builds the foundation for standards-based grading
3. We can gather real teacher feedback before building advanced features
4. Gets something useful in teachers' hands quickly

**Alternative:** If your school heavily uses standards-based grading for K-5, we could start with dual-mode from day 1 (adds 1-2 weeks but better for elementary teachers).

**Your input needed:**
- What grading approach does your school currently use?
- What are the biggest pain points for your teachers right now?
- Do you want to start with traditional or standards-based focus?
- Timeline: Need this for Q2 (January)? Q3 (March)? Or later?

Let me know which direction you want to go and I'll create detailed implementation tasks!