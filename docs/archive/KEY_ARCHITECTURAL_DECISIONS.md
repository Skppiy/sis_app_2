# Key Architectural Decisions - Student Services System

**Purpose:** Capture critical design decisions from SMEs and stakeholders
**Created:** 2025-09-26

---

## 🎯 **Student Services & Accommodations Scope**

### **Decision: Student-Level Management Only**
**Decision Date:** 2025-09-26
**Stakeholder:** User/SME
**Context:** Where to display and manage accommodation information

**DECISION:**
- Student Services and accommodations are managed **at the student level only**
- **NO accommodation indicators needed in enrollment workflows**
- **NO enrollment-level accommodation tracking**

**Rationale:**
- Accommodations are a property of the student, not the enrollment
- Simplifies UI and reduces complexity during enrollment process
- Keeps accommodation management centralized on student profile

**Implementation Impact:**
- Student detail page needs Student Services assignment section
- Enrollment workflows should NOT show accommodation status
- Previously implemented enrollment accommodation indicators should be removed

---

## 🏗️ **System Architecture Decisions**

### **Decision: Database Schema - Special Needs vs Student Services**
**Context:** Naming and table structure for accommodation system

**CURRENT STATE:**
- Database tables: `special_needs_tag_library`, `student_special_needs`
- API endpoints: Mix of `/student-services/*` and `/special-needs/*`
- Frontend: "Student Services" terminology

**DECISION NEEDED:**
- [ ] Standardize on consistent terminology throughout system
- [ ] Clarify if "Special Needs" or "Student Services" is preferred term

---

## 📋 **Enrollment Workflow Decisions**

### **Decision: Enrollment Scope and Features**
**Context:** What should be included in enrollment processes

**CONFIRMED FEATURES:**
- Bulk enrollment by homeroom population
- Individual student enrollment in specific classes
- Grade-level filtering for classroom selection
- Teacher assignment validation

**EXCLUDED FEATURES:**
- Accommodation status indicators during enrollment
- Service assignment during enrollment process
- Accommodation-based enrollment routing

---

## 🎮 **User Experience Decisions**

### **Decision: Student Detail Page Layout**
**Context:** What information should appear on student profile

**REQUIRED SECTIONS:**
- [ ] Personal Information
- [ ] Current Enrollments
- [ ] Student Services/Accommodations (TO BE ADDED)
- [ ] Additional Information

**Student Services Section Should Include:**
- [ ] Current active service assignments
- [ ] Ability to add new service assignments
- [ ] Service assignment history
- [ ] Severity levels and dates

---

## 🔄 **Integration Decisions**

### **Decision: Cross-System Data Flow**
**Context:** How accommodation data flows between system components

**CLARIFICATION NEEDED:**
- [ ] Should enrollment records include `requires_accommodation` flag?
- [ ] If yes, should it be auto-populated from student services?
- [ ] If no, should the field be removed entirely?

---

## 📝 **Pending Decisions**

### **High Priority:**
1. **Accommodation Display in Enrollment**: Confirm if `requires_accommodation` field should exist in enrollment records
2. **Terminology Standardization**: "Special Needs" vs "Student Services" throughout system
3. **Student Detail Page Design**: Layout and functionality for Student Services section

### **Medium Priority:**
1. **Bulk Operations**: Should there be bulk assignment of services to multiple students?
2. **Reporting Requirements**: What reports are needed for compliance?
3. **Parent Portal**: Should parents see student service assignments?

### **Low Priority:**
1. **Mobile Interface**: Mobile-specific considerations
2. **Integration APIs**: Third-party system integration needs
3. **Data Migration**: Historical data handling

---

## 📋 **Decision Log Template**

For future decisions, use this format:

```markdown
### **Decision: [Title]**
**Decision Date:** YYYY-MM-DD
**Stakeholder:** [Who made the decision]
**Context:** [Why this decision was needed]

**DECISION:**
[What was decided]

**Rationale:**
[Why this decision was made]

**Implementation Impact:**
[What needs to change in the code/system]

**Status:** [Implemented/Pending/Blocked]
```

---

*This document should be updated whenever architectural decisions are made during development. All major design choices should be captured here for future reference and to prevent misalignment.*