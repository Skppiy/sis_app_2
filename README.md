# SIS Application - K-8 School Information System

*Last Updated: 2025-10-17*
*Documentation Consolidated: 2025-10-17*

## 🚨 **OPERATING PROCEDURES - READ FIRST**

### **When Starting a New Session**

#### **📋 MANDATORY SESSION START CHECKLIST**
Complete these steps in order **before any development work**:

1. **[ ] Read [STATUS.md](./STATUS.md)** ⭐ Single source of truth for current system state
2. **[ ] Check immediate priorities** - Review "Phase A/1 Completion Priorities" section
3. **[ ] Verify against actual system** - Test functionality, don't assume docs are 100% current
4. **[ ] Review [AGENT_CONFIGURATION.md](./AGENT_CONFIGURATION.md)** - Development standards
5. **[ ] Check [REQUIREMENTS.md](./REQUIREMENTS.md)** - If clarification needed on requirements

#### **📋 MANDATORY SESSION END CHECKLIST**
Complete these steps **before ending any session**:

1. **[ ] Update [STATUS.md](./STATUS.md)** - Add session log entry (append-only section at bottom)
2. **[ ] Update task statuses** - Mark completed items with ✅
3. **[ ] Document discoveries** - Add any new issues or findings to STATUS.md
4. **[ ] State next actions** - Clear next steps in session log
5. **[ ] Mark blockers** - Document anything preventing progress

### **📖 Document Reading Priority Order**

**Always follow this order when starting:**
1. **[STATUS.md](./STATUS.md)** ⭐ Current system status and immediate priorities
2. **[AGENT_CONFIGURATION.md](./AGENT_CONFIGURATION.md)** ⭐ Development standards
3. **[README.md](./README.md)** (this file) - Project overview and operating procedures
4. **[REQUIREMENTS.md](./REQUIREMENTS.md)** - When you need business requirement clarification
5. **[API_REFERENCE.md](./API_REFERENCE.md)** - When implementing or troubleshooting APIs
6. **[DATABASE_SCHEMA_FOUNDATION.md](./DATABASE_SCHEMA_FOUNDATION.md)** - When working with database

### **🔍 Investigation Standards**

- **NO MOCK DATA, NO GUESSING** - Always find root cause with evidence
- **Verify database schema first** - Check actual table structure vs code expectations
- **Test against real data** - Never assume documents are current
- **Follow systematic debugging** - Use protocols in AGENT_CONFIGURATION.md
- **Document discoveries** - Update relevant documents when reality differs

---

## 📊 **Current Project Status**

### **Phase:** A/1 (Core Foundation) - ~75% Complete
### **Current Branch:** BulkEnrollment
### **Priority:** Fix 3 critical enrollment workflow issues to complete Phase A/1

**See [STATUS.md](./STATUS.md) for detailed current status and priorities.**

## 🏫 **System Overview**

This is a comprehensive K-8 School Information System designed for private schools, supporting both elementary homeroom (K-5) and middle school departmentalized (6-8) models.

### **Core Architecture**
- **Backend**: FastAPI + SQLAlchemy + PostgreSQL (sis.db)
- **Frontend**: React + TypeScript + Material-UI + Vite
- **Database**: SQLite for development (PostgreSQL for production)
- **Authentication**: JWT-based with role-based access control

### **Key Features Implemented**
- ✅ Three-tier enrollment system (backend logic complete, frontend needs fixes)
- ✅ Advanced gradebook with flexible categories and auto-calculations
- ✅ Homeroom intelligence for elementary teachers
- ✅ Teacher subject swap workflows
- ✅ Comprehensive role-based permission system
- ☐ Specialist pull-out scheduling (Phase A/2 - not started)

## 🎯 **Verified Current Status** (As of 2025-10-17 Testing)

**Component Health Matrix - See [STATUS.md](./STATUS.md) for details**

| Component | Status | Notes |
|-----------|--------|-------|
| ✅ Dashboard | Working | All widgets functional |
| ✅ Classrooms | Working | Well consolidated, good summary |
| ✅ Rooms | Working | All functions operational |
| ⚠️ Teachers & Staff | Working | Data correct, display needs polish |
| ✅ Students | Working | Student pages fully functional |
| ✅ Gradebook | Working | Advanced features complete |
| ✅ Attendance | Working | Tracking and reporting functional |
| ❌ Bulk Homeroom Enrollment | **BROKEN** | Display incomplete - CRITICAL FIX needed |
| ❌ Individual Enrollment | **BROKEN** | Missing business rule enforcement - HIGH priority |

### **🚨 Critical Issues Blocking Phase A/1**
1. **Bulk Homeroom Enrollment Display** - Only shows room name instead of full classroom details
2. **Individual Enrollment Filtering** - Core classes appearing when they shouldn't for multiple students
3. **Teachers Page Display** - Formatting needs polish (lower priority)

## 🔧 **Technical Details**

### **🔐 Test Credentials**
- **Admin Login**: admin@springfield.edu / admin123
- **Access Level**: Full system access for testing enrollment workflows

### **📁 Project Structure**
```
sis_app/
├── backend/                 # FastAPI application
│   ├── app/routers/        # API endpoints
│   ├── app/models/         # SQLAlchemy ORM models
│   ├── app/schemas/        # Pydantic schemas
│   └── alembic/            # Database migrations
├── frontend/               # React application
│   ├── src/components/     # Reusable UI components
│   ├── src/features/       # Feature-based organization
│   └── src/schemas/        # TypeScript types
└── requirements/           # Business requirements PDFs
```

### **🗂️ Core Documentation (Consolidated 2025-10-17)**

**Main Documents** (Always current):
- **[STATUS.md](./STATUS.md)** ⭐ Single source of truth for current system state
- **[REQUIREMENTS.md](./REQUIREMENTS.md)** ⭐ All phases business requirements with inline KEY DECISIONS
- **[API_REFERENCE.md](./API_REFERENCE.md)** - Complete API documentation with implementation status
- **[AGENT_CONFIGURATION.md](./AGENT_CONFIGURATION.md)** - Development standards and protocols
- **[DATABASE_SCHEMA_FOUNDATION.md](./DATABASE_SCHEMA_FOUNDATION.md)** - Schema reference
- **[SYSTEM_ARCHITECTURE_GUIDE.md](./SYSTEM_ARCHITECTURE_GUIDE.md)** - Technical architecture

**Supporting Documents:**
- **[DOCUMENT_STATUS_TRACKER.md](./DOCUMENT_STATUS_TRACKER.md)** - Document maintenance tracking
- **[SUPPORT_STAFF_ROADMAP.md](./SUPPORT_STAFF_ROADMAP.md)** - Future Phase planning (Student Services extension)

**Archived Documents:** (See `/docs/archive/` for historical documents)
- Consolidated duplicate status documents into STATUS.md
- Historical session reports preserved for reference

## 🎯 **Immediate Priorities**

### **This Session: Documentation Consolidation** ✅
1. ✅ Created STATUS.md with verified system state
2. ✅ Created REQUIREMENTS.md from comprehensive business requirements
3. ✅ Created API_REFERENCE.md consolidating API documentation
4. ☑ Updated README.md with new documentation structure

### **Next Session: Fix Critical Enrollment Issues**
1. **🔴 CRITICAL**: Fix Bulk Homeroom Enrollment Display (4-6 hours)
2. **🔴 HIGH**: Fix Individual Enrollment Core Class Filtering (3-4 hours)
3. **🟡 MEDIUM**: Polish Teachers Page Display (1-2 hours)

**Timeline:** Phase A/1 completion estimated 8-12 hours development + 2-3 hours testing

## 📋 **Development Standards Reminder**

- **Evidence-based development** - Verify before implementing
- **Systematic debugging** - Follow investigation protocols
- **FERPA compliance** - All student data requires proper access controls
- **No mock data** - Work with real data only
- **Document discoveries** - Update docs when reality differs from documentation

---

## 🚀 **Getting Started**

### **For New Developers**
1. Read this README completely
2. Follow the Session Start Checklist above
3. Review AGENT_CONFIGURATION.md for development standards
4. Test login with provided credentials
5. Verify system functionality before making changes

### **For Returning Developers**
1. Follow Session Start Checklist
2. Check CURRENT_DEBUGGING_STATUS.md for latest work
3. Verify any assumptions against actual system
4. Update documentation as you discover changes

---

**Remember**: This is an educational system affecting real students. Accuracy and reliability are critical. Always verify functionality before documenting status.