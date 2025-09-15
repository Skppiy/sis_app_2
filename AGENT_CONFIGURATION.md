# Agent Configuration - SIS Development Standards

## Core Development Principles

### 🔍 **NO MOCK DATA, NO GUESSING - SYSTEMATIC DEBUGGING**

#### Evidence-Based Development
- **Always find root cause** - Don't treat symptoms, identify the underlying issue
- **Debug systematically** - Follow logical investigation steps, not random attempts
- **Check configuration files first** - Build/compilation issues start with configs (package.json, tsconfig.json, alembic.ini, etc.)
- **Test your hypothesis** - Verify theories with actual evidence before explaining
- **Don't assume - verify** - Even "obvious" issues need concrete proof
- **Follow the data trail** - Track what commands/processes create what files/outputs

#### Investigation Protocol
1. **Read current documentation** - Always review foundation documents first
2. **Verify database schema** - Check actual table structure vs code expectations
3. **Trace API routes** - Map endpoints to actual implementation
4. **Examine configuration files** - Settings, permissions, environment variables
5. **Check error logs** - Full stack traces, not just error messages
6. **Test incrementally** - One change at a time with verification

#### Forbidden Practices
- ❌ Creating mock/sample data without user request
- ❌ Guessing at schema structure or API responses
- ❌ Making assumptions about existing functionality
- ❌ Implementing without understanding current state
- ❌ Copy/paste solutions without verification
- ❌ Skipping documentation review

## 📚 **Required Documentation Review Order**

### Before ANY development work:
1. **COMPLETE_FOUNDATION_REVIEW.md** - System status overview
2. **Relevant component document** (e.g., ENROLLMENT_REQUIREMENTS.md)
3. **DATABASE_SCHEMA_FOUNDATION.md** - Actual table structures
4. **API_ROUTE_MAPPING.md** - Existing vs required endpoints
5. **CODE_REVIEW_FINDINGS.md** - Known issues and blockers

### During development:
- Reference **API_CONTRACTS.md** for endpoint specifications
- Check **PERMISSION_FRAMEWORK.md** for authorization requirements
- Verify against **current database reality** (not assumed schema)

## 🏫 **Subject Matter Expert (SME) Categories**

### **Primary Educational SMEs**
1. **Principal(s)**
   - Overall school operations and policies
   - Academic program oversight
   - Staff management and evaluation
   - Parent and community relations
   - Budget and resource allocation

2. **Assistant/Vice Principal(s)**
   - Daily operational management
   - Student discipline and behavior
   - Schedule coordination
   - Teacher support and professional development

3. **Front Office Staff** ⭐ **THE REAL HEROES**
   - **Secretary/Administrative Assistant**
   - **Registrar** - enrollment, transcripts, student records
   - **Attendance Clerk** - daily attendance, truancy tracking
   - **Health Office Staff** - medical records, medication management
   - **Receptionist** - first point of contact, visitor management

### **Academic SMEs**
4. **Teachers (by category)**
   - **Elementary Homeroom Teachers** - K-5 multi-subject instruction
   - **Middle School Subject Teachers** - 6-8 specialized instruction
   - **Special Education Teachers** - IEP/504 plan management
   - **ESL Teachers** - English Language Learner support
   - **Specialist Teachers** - Art, Music, PE, Library, Technology

5. **Academic Support Staff**
   - **Counselor(s)** - student social-emotional support, crisis intervention
   - **Librarian** - resource management, research instruction
   - **Technology Coordinator** - IT support, educational technology

### **Operational SMEs**
6. **Business/Financial Staff**
   - **Business Manager** - budget, purchasing, financial reporting
   - **Bookkeeper** - daily financial transactions, payroll support

7. **Support Services**
   - **Custodial Staff** - facility maintenance, safety protocols
   - **Food Service Manager** - meal programs, nutrition compliance
   - **Transportation Coordinator** - bus routes, safety protocols

### **External SMEs**
8. **SIS Sales Representatives**
   - Industry best practices and standards
   - Competitive feature analysis
   - Implementation patterns across schools
   - Compliance requirements and updates
   - Technical architecture recommendations

9. **Parent Representatives**
   - Parent portal usage and needs
   - Communication preferences
   - Report format requirements
   - Mobile app functionality needs

10. **District/Board Representatives**
    - Reporting requirements
    - Data privacy and compliance (FERPA, etc.)
    - Integration needs with district systems
    - Board reporting formats

## 🔧 **Technical Investigation Standards**

### **Database Investigation Protocol**
```bash
# Always verify actual schema first
docker exec backend-db-1 psql -U postgres -d sis_db -c "\d table_name"

# Check relationships and constraints
docker exec backend-db-1 psql -U postgres -d sis_db -c "SELECT conname, conrelid::regclass, confrelid::regclass FROM pg_constraint WHERE contype = 'f';"

# Verify data exists before writing queries
docker exec backend-db-1 psql -U postgres -d sis_db -c "SELECT COUNT(*) FROM table_name;"
```

### **API Investigation Protocol**
```bash
# Test endpoints exist and respond
curl -X GET http://localhost:8000/api/endpoint_name

# Check FastAPI auto-generated docs
# Visit: http://localhost:8000/docs

# Verify route registration in backend
grep -r "endpoint_name" backend/app/routers/
```

### **Frontend Investigation Protocol**
```bash
# Check component imports and dependencies
grep -r "ComponentName" frontend/src/

# Verify API integration points
grep -r "api.*endpoint" frontend/src/

# Check for TypeScript errors
cd frontend && npm run type-check
```

## 🏗️ **Development Workflow Standards**

### **Pre-Development Checklist**
- [ ] Read relevant foundation documents
- [ ] Verify current database schema
- [ ] Check existing API endpoints
- [ ] Review known issues in CODE_REVIEW_FINDINGS.md
- [ ] Identify SME input requirements

### **During Development**
- [ ] Work incrementally with verification at each step
- [ ] Test against actual data/schema, not assumptions
- [ ] Document any discoveries that contradict existing documentation
- [ ] Update foundation documents if new information discovered

### **Post-Development**
- [ ] Test end-to-end functionality
- [ ] Verify no regressions in existing features
- [ ] Update documentation with any changes
- [ ] Identify any SME validation needs

## 🚨 **Critical SIS-Specific Considerations**

### **Data Integrity Requirements**
- **Student records**: FERPA compliance, audit trails
- **Grade data**: Immutable once posted, administrative overrides tracked
- **Attendance**: Legal requirements, state reporting
- **Enrollment**: Capacity limits, prerequisite enforcement

### **Academic Calendar Dependencies**
- **Enrollment periods**: Time-based business rules
- **Grading periods**: Lock-down schedules
- **Academic year transitions**: Data migration and archival

### **Multi-User Environment**
- **Concurrent access**: Teachers entering grades simultaneously
- **Permission hierarchies**: Principal > Vice Principal > Dean > Staff Admin > Teacher
- **Context-sensitive access**: Teachers see only their students/classes

## 🛡️ **Compliance Requirements (CRITICAL)**

### **FERPA (Family Educational Rights and Privacy Act)**
- **Student record privacy**: No unauthorized access to educational records
- **Audit trails required**: Who accessed what student data when
- **Parent consent**: For disclosure of directory information
- **Right to inspect/amend**: Parents can review and request changes to records
- **Data retention**: Specific timeframes for maintaining student records
- **Secure deletion**: Proper disposal of student data when no longer needed

**Development Impact**:
- All student data queries must log user/timestamp
- Permission checks required before any student data display
- Export functions need consent verification
- Deletion operations need audit trail preservation

### **State Reporting Compliance**
- **Attendance reporting**: Daily/monthly state submissions
- **Enrollment counts**: Student demographics by grade level
- **Assessment data**: Test scores and academic progress
- **Special education**: IEP/504 plan compliance tracking
- **Discipline records**: Incident reporting requirements

**Development Impact**:
- Export formats must match state specifications exactly
- Data validation required before submission
- Historical data preservation for multi-year reporting
- Error handling for failed submissions with retry mechanisms

### **ADA (Americans with Disabilities Act) Compliance**
- **Web accessibility**: WCAG 2.1 AA standards minimum
- **Screen reader compatibility**: All UI elements properly labeled
- **Keyboard navigation**: Full functionality without mouse
- **Color contrast**: Sufficient contrast ratios for text readability
- **Alternative text**: Images and graphics described for screen readers

**Development Impact**:
- All form inputs need proper labels and ARIA attributes
- Color-only indicators forbidden (must have text/icon backup)
- Font sizes and UI elements must be scalable
- Testing required with actual screen reader software

### **Data Security and Privacy**
- **Encryption at rest**: Database and file storage encrypted
- **Encryption in transit**: HTTPS/TLS for all communications
- **Password requirements**: Strong password policies enforced
- **Session management**: Automatic timeout, secure session handling
- **Backup security**: Encrypted backups with access controls

**Development Impact**:
- No plain text storage of sensitive data
- SSL certificates required for all environments
- Authentication tokens must expire appropriately
- Database connections encrypted
- File uploads scanned for malware

## ⚡ **Performance Standards (CRITICAL)**

### **Response Time Requirements**
- **Page loads**: < 3 seconds for 95% of requests
- **Database queries**: < 1 second for standard operations
- **Report generation**: < 30 seconds for complex reports
- **Bulk operations**: Progress indicators for operations > 5 seconds
- **API endpoints**: < 500ms for CRUD operations

**Development Impact**:
- Database query optimization mandatory
- Proper indexing on frequently accessed columns
- Pagination required for large data sets
- Caching strategies for repeated queries
- Performance testing during development

### **Concurrent User Capacity**
- **Simultaneous users**: 100+ teachers during grade entry periods
- **Peak load handling**: Start of semester enrollment periods
- **Database connections**: Pool management to prevent exhaustion
- **Session management**: Efficient memory usage per user
- **Resource allocation**: CPU and memory monitoring

**Development Impact**:
- Connection pooling configured appropriately
- Database transaction isolation levels optimized
- Load testing with realistic user scenarios
- Memory leak prevention and monitoring
- Graceful degradation under high load

### **System Availability Requirements**
- **Uptime target**: 99.5% availability during school hours
- **Maintenance windows**: Scheduled outside school operations
- **Disaster recovery**: Data backup and restoration procedures
- **Error handling**: Graceful failures with user-friendly messages
- **Monitoring**: Real-time system health tracking

**Development Impact**:
- Comprehensive error handling throughout application
- Database backup automation and testing
- Health check endpoints for monitoring
- Logging strategies for troubleshooting
- Failover mechanisms for critical components

## 🔗 **Integration Protocol Framework**

### **Future Integration Readiness**
- **API design**: RESTful standards with versioning support
- **Data export formats**: CSV, JSON, XML flexibility
- **Authentication protocols**: OAuth 2.0, SAML preparation
- **Webhook capabilities**: Event-driven integration support
- **Data synchronization**: Conflict resolution strategies

**Development Impact**:
- API endpoints designed for external consumption
- Consistent data formats across all exports
- Authentication abstraction layer
- Event system architecture for real-time updates
- Data validation for incoming integrations

### **Common Integration Categories**
- **Learning Management Systems**: Canvas, Google Classroom, Schoology
- **Assessment Platforms**: Khan Academy, IXL, Renaissance Learning
- **Communication Systems**: ParentSquare, Remind, ClassDojo
- **Financial Systems**: School accounting, lunch programs
- **Transportation**: Bus routing and tracking systems
- **State Reporting**: Automated submission systems

**Development Impact**:
- Flexible data mapping configurations
- Standard integration patterns and templates
- Error handling for external system failures
- Rate limiting for API consumers
- Documentation for integration partners

### **Data Exchange Standards**
- **Student Information**: SIF (Schools Interoperability Framework) compliance
- **Gradebook data**: Common formats for grade import/export
- **Roster management**: Standard student/teacher data formats
- **Attendance tracking**: Time-based data synchronization
- **Assessment results**: Standardized score reporting formats

**Development Impact**:
- Industry-standard data models
- Transformation layers for format conversion
- Validation rules for data integrity
- Audit trails for all data exchanges
- Version control for data structure changes

## 📋 **SME Consultation Templates**

### **For Front Office Staff**
"When a new student enrolls mid-semester, what steps do you currently take? What information do you need immediately vs. what can wait?"

### **For Teachers**
"Walk me through how you currently assign grades/take attendance. What would make this process faster or more accurate?"

### **For Principals**
"What reports do you need weekly/monthly/annually? What decisions do these reports help you make?"

### **For SIS Sales Reps**
"What are the most common implementation pitfalls? Which features do schools think they need but rarely use?"

## 🎯 **Quality Assurance Standards**

### **Before Any Code Commit**
1. **Functionality verified** with actual data
2. **No breaking changes** to existing features
3. **Documentation updated** to reflect reality
4. **SME requirements** captured and addressed
5. **Error handling** comprehensive and user-friendly

### **Before User Testing**
1. **End-to-end workflows** tested by developer
2. **Permission boundaries** verified
3. **Data validation** prevents corruption
4. **Performance** acceptable under realistic load
5. **SME approval** for user experience changes

---

## 🔑 **Key Success Metrics**

1. **Accuracy**: Solutions work with real data, not test scenarios
2. **Reliability**: Root causes addressed, not symptoms treated
3. **Usability**: SME workflows supported efficiently
4. **Maintainability**: Code and documentation aligned with reality
5. **Compliance**: Educational and legal requirements met

**Remember: Schools depend on SIS accuracy for student success. Every bug affects real children's education.**