# SIS Enrollment System - Current Status & Next Steps

## **Completed Work** ✅

### **Teacher Classification System**
- **Fixed**: James Thomas now correctly appears as Subject Teacher (PE) instead of Homeroom Teacher
- **Fixed**: Backend classification logic now prioritizes classroom type/subject over role names
- **Location**: `backend/app/routers/admin.py` lines 187-196
- **Note**: Automatic classification works - no manual checkboxes needed

### **Enrollment Workflow Research**
- **Identified**: Three critical bugs in multi-classroom enrollment workflow
- **Root Cause**: State management issues in `HomeroomBulkEnrollmentWorkflow.tsx`
- **SME Consultation**: Completed research on Audit Only, Accommodations, and PE grouping
- **Location**: Lines 223-228, 240-250, 204-221

### **System Simplification**
- **Hidden**: "Audit Only" checkbox for K-8 simplicity
- **Location**: `EnhancedEnrollmentManager.tsx` lines 515-528, 656
- **Note**: Backend functionality preserved, UI hidden with comments

### **Student Services Discovery**
- **Found**: Comprehensive accommodation system already exists
- **Tables**: `special_needs_tag_library` and `student_special_needs`
- **API**: Endpoints at `/special-needs` and `/student-services`
- **Note**: Rename "Special Needs" to "Student Services" in UI

---

## **Critical Bugs to Fix** 🔧

### **1. Class Selection Reset Bug**
- **Issue**: Selected classroom lost when navigating between enrollment steps
- **Impact**: Users must reselect classes, creating confusion
- **Priority**: HIGH - blocks enrollment workflow

### **2. Duplicate Enrollment Risk**
- **Issue**: Same class appears twice when reselected
- **Impact**: Potential double-enrollment of students
- **Priority**: HIGH - data integrity issue

### **3. Grade Filtering Missing**
- **Issue**: All grades mixed together in class selection
- **Impact**: Poor user experience, confusion about appropriate classes
- **Priority**: MEDIUM - usability issue

---

## **Next Implementation Steps** 📋

### **Phase 1: Core Stability** (Week 1-2)
1. **Fix enrollment workflow state management**
   - Add useEffect to clear selectedClassrooms on population change
   - Implement proper step navigation state handling
   - Add duplicate prevention validation

### **Phase 2: Student Services UI** (Week 3-4)
2. **Build admin interface for Student Services**
   - Create tag library management page
   - Build student assignment interface
   - Integrate with existing student profiles
   - **Rename**: Change "Special Needs" to "Student Services" throughout

### **Phase 3: Smart Accommodation Integration** (Week 5-6)
3. **Connect services to enrollment**
   - Auto-populate "Requires Accommodation" based on student services
   - Allow manual override for specific enrollments
   - Add visual indicators for students with services

### **Phase 4: Enhanced UX** (Week 7-8)
4. **Improve class selection experience**
   - Group classes by subject type visually
   - Add grade-appropriate filtering
   - Support both grade-specific and mixed-grade options

---

## **SME Research Findings** 📚

### **"Audit Only" Enrollment**
- **Decision**: Hidden for K-8 simplicity
- **Rationale**: Adds complexity without clear K-8 value
- **Implementation**: UI hidden, backend preserved

### **"Requires Accommodation" Scope**
- **Decision**: Student-level based on IEP/504 plans
- **Source**: Accommodations determined by IEP teams, not per-enrollment
- **Implementation**: Pull from existing student_special_needs table

### **PE Class Grouping**
- **Finding**: Mixed evidence - standards suggest grade-specific, practice varies
- **Decision**: Support both approaches
- **Implementation**: Allow schools to choose grade-specific or mixed-grade

---

## **Technical Architecture Notes** 🏗️

### **Database Schema**
- **Student Services**: `special_needs_tag_library` + `student_special_needs`
- **Severity Levels**: MILD, MODERATE, INTENSIVE
- **Date Ranges**: start_date, end_date, review_date
- **Audit Trail**: assigned_by, last_reviewed_by, last_reviewed_date

### **API Endpoints**
- **Tag Management**: `/special-needs/tags` (admin)
- **Student Assignment**: `/special-needs/assignments` (admin)
- **Frontend Compatible**: `/student-services/*` (all operations)

### **Frontend Components**
- **Enrollment Workflow**: `HomeroomBulkEnrollmentWorkflow.tsx` (needs fixes)
- **Enhanced Manager**: `EnhancedEnrollmentManager.tsx` (audit only hidden)
- **Missing**: Student Services management pages

---

## **Quality Metrics** 📊

### **Current System Status**
- ✅ Teacher classification working correctly
- ✅ Basic enrollment functionality stable
- ⚠️ Multi-classroom workflow has critical bugs
- ⚠️ Student Services backend ready, UI missing
- ❌ Accommodation integration not implemented

### **Success Criteria for Next Phase**
- [ ] All enrollment workflows complete without state loss
- [ ] No duplicate enrollment risk
- [ ] Admin can manage Student Services tags
- [ ] Students with services auto-flagged in enrollment
- [ ] Clear visual grouping of class options

---

## **Risk Assessment** ⚠️

### **High Risk**
- **Enrollment state bugs**: Could corrupt student assignments
- **Duplicate enrollments**: Data integrity concerns

### **Medium Risk**
- **User confusion**: Poor class selection UX affects adoption
- **Missing accommodation tracking**: Compliance concerns

### **Low Risk**
- **Terminology**: "Special Needs" vs "Student Services" naming
- **Grade filtering**: Usability issue, not functional blocker

---

*Last Updated: [Current Date]*
*Status: Ready for Phase 1 Implementation*