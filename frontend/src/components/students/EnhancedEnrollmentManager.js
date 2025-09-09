import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Box, Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Stack, Chip, Divider, FormControl, InputLabel, Select, MenuItem, TextField, Checkbox, FormControlLabel, Alert, Paper, List, ListItem, ListItemIcon, ListItemText, IconButton, Badge, Stepper, Step, StepLabel, StepContent, alpha, useTheme, } from '@mui/material';
import { PersonAdd as PersonAddIcon, Class as ClassIcon, Groups as GroupsIcon, Warning as WarningIcon, CheckCircle as CheckCircleIcon, Error as ErrorIcon, Close as CloseIcon, } from '@mui/icons-material';
import { format } from 'date-fns';
import { GRADE_LEVELS } from '@/schemas/students';
export const EnhancedEnrollmentManager = ({ open, onClose, students, classrooms, academicYearName, onEnroll, onMultiClassroomEnroll, }) => {
    const theme = useTheme();
    const [activeStep, setActiveStep] = useState(0);
    const [enrollmentSelections, setEnrollmentSelections] = useState([]);
    const [selectedClassrooms, setSelectedClassrooms] = useState(new Set());
    const [enrollmentDate, setEnrollmentDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [defaultGradeLevel, setDefaultGradeLevel] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [errors, setErrors] = useState([]);
    const [warnings, setWarnings] = useState([]);
    const steps = [
        'Select Classrooms',
        'Configure Enrollments',
        'Review & Confirm',
    ];
    // Validation functions
    const validateClassroomCapacity = (classroom, studentCount) => {
        if (classroom.capacity && classroom.enrolled_count) {
            const available = classroom.capacity - classroom.enrolled_count;
            return available >= studentCount;
        }
        return true; // Assume valid if no capacity info
    };
    const validateGradeLevel = (classroom, gradeLevel) => {
        if (classroom.grade_levels && classroom.grade_levels.length > 0) {
            return classroom.grade_levels.includes(gradeLevel);
        }
        return true; // Assume valid if no grade restrictions
    };
    // Step 1: Classroom Selection
    const handleClassroomToggle = (classroomId) => {
        setSelectedClassrooms(prev => {
            const newSet = new Set(prev);
            if (newSet.has(classroomId)) {
                newSet.delete(classroomId);
                // Remove from enrollments
                setEnrollmentSelections(prevEnrollments => prevEnrollments.filter(e => e.classroom_id !== classroomId));
            }
            else {
                newSet.add(classroomId);
                // Add to enrollments
                setEnrollmentSelections(prevEnrollments => [
                    ...prevEnrollments,
                    {
                        classroom_id: classroomId,
                        students: [...students],
                        grade_level: defaultGradeLevel,
                        enrollment_date: enrollmentDate,
                        is_audit_only: false,
                        requires_accommodation: false,
                    },
                ]);
            }
            return newSet;
        });
    };
    // Step 2: Configure enrollments
    const updateEnrollmentSelection = (classroomId, updates) => {
        setEnrollmentSelections(prev => prev.map(enrollment => enrollment.classroom_id === classroomId
            ? { ...enrollment, ...updates }
            : enrollment));
    };
    const toggleStudentForClassroom = (classroomId, student) => {
        setEnrollmentSelections(prev => prev.map(enrollment => {
            if (enrollment.classroom_id === classroomId) {
                const isCurrentlySelected = enrollment.students.some(s => s.id === student.id);
                const newStudents = isCurrentlySelected
                    ? enrollment.students.filter(s => s.id !== student.id)
                    : [...enrollment.students, student];
                return { ...enrollment, students: newStudents };
            }
            return enrollment;
        }));
    };
    // Step 3: Validation and submission
    const validateEnrollments = () => {
        const newErrors = [];
        const newWarnings = [];
        enrollmentSelections.forEach(enrollment => {
            const classroom = classrooms.find(c => c.id === enrollment.classroom_id);
            if (!classroom)
                return;
            // Check capacity
            if (!validateClassroomCapacity(classroom, enrollment.students.length)) {
                newErrors.push(`${classroom.name}: Exceeds capacity`);
            }
            // Check grade levels
            enrollment.students.forEach(student => {
                if (!validateGradeLevel(classroom, enrollment.grade_level)) {
                    newWarnings.push(`${student.first_name} ${student.last_name}: Grade ${enrollment.grade_level} may not be appropriate for ${classroom.name}`);
                }
            });
            // Check empty enrollments
            if (enrollment.students.length === 0) {
                newWarnings.push(`${classroom.name}: No students selected`);
            }
        });
        setErrors(newErrors);
        setWarnings(newWarnings);
        return newErrors.length === 0;
    };
    const handleNext = () => {
        if (activeStep === steps.length - 1) {
            handleSubmit();
        }
        else if (activeStep === 1) {
            if (validateEnrollments()) {
                setActiveStep(prev => prev + 1);
            }
        }
        else {
            setActiveStep(prev => prev + 1);
        }
    };
    const handleSubmit = async () => {
        setIsProcessing(true);
        try {
            // Filter out empty enrollments
            const validEnrollments = enrollmentSelections.filter(e => e.students.length > 0);
            await onEnroll(validEnrollments);
            onClose();
            // Reset state
            setActiveStep(0);
            setEnrollmentSelections([]);
            setSelectedClassrooms(new Set());
        }
        catch (error) {
            console.error('Failed to enroll students:', error);
            setErrors(['Failed to process enrollments. Please try again.']);
        }
        finally {
            setIsProcessing(false);
        }
    };
    const handleReset = () => {
        setActiveStep(0);
        setEnrollmentSelections([]);
        setSelectedClassrooms(new Set());
        setErrors([]);
        setWarnings([]);
    };
    return (_jsxs(Dialog, { open: open, onClose: onClose, maxWidth: "lg", fullWidth: true, PaperProps: {
            sx: { minHeight: '80vh' },
        }, children: [_jsx(DialogTitle, { children: _jsxs(Stack, { direction: "row", justifyContent: "space-between", alignItems: "center", children: [_jsxs(Box, { children: [_jsx(Typography, { variant: "h5", fontWeight: 600, children: "Multi-Classroom Enrollment" }), _jsxs(Typography, { variant: "subtitle2", color: "text.secondary", children: ["Enroll ", students.length, " student", students.length > 1 ? 's' : '', " into multiple classrooms", academicYearName && ` • ${academicYearName}`] })] }), _jsx(IconButton, { onClick: onClose, size: "small", children: _jsx(CloseIcon, {}) })] }) }), _jsxs(DialogContent, { sx: { px: 3 }, children: [_jsx(Paper, { sx: { p: 2, mb: 3, bgcolor: alpha(theme.palette.primary.main, 0.05) }, children: _jsxs(Stack, { direction: "row", alignItems: "center", spacing: 2, children: [_jsx(GroupsIcon, { sx: { color: theme.palette.primary.main } }), _jsxs(Box, { children: [_jsx(Typography, { variant: "subtitle1", fontWeight: 600, children: "Selected Students" }), _jsxs(Stack, { direction: "row", spacing: 0.5, flexWrap: "wrap", useFlexGap: true, sx: { mt: 1 }, children: [students.slice(0, 8).map(student => (_jsx(Chip, { label: `${student.first_name} ${student.last_name} (${student.current_grade_level})`, size: "small", color: "primary", variant: "outlined" }, student.id))), students.length > 8 && (_jsx(Chip, { label: `+${students.length - 8} more`, size: "small", color: "primary" }))] })] })] }) }), _jsxs(Stepper, { activeStep: activeStep, orientation: "vertical", children: [_jsxs(Step, { children: [_jsx(StepLabel, { children: _jsx(Typography, { variant: "h6", children: "Select Classrooms" }) }), _jsxs(StepContent, { children: [_jsx(Typography, { variant: "body2", color: "text.secondary", sx: { mb: 2 }, children: "Choose the classrooms where you want to enroll the selected students." }), _jsxs(Stack, { spacing: 2, children: [_jsxs(Paper, { sx: { p: 2, bgcolor: alpha(theme.palette.background.default, 0.5) }, children: [_jsx(Typography, { variant: "subtitle2", sx: { mb: 2 }, children: "Quick Settings" }), _jsxs(Stack, { direction: "row", spacing: 2, children: [_jsx(TextField, { label: "Default Enrollment Date", type: "date", value: enrollmentDate, onChange: (e) => setEnrollmentDate(e.target.value), InputLabelProps: { shrink: true }, size: "small", sx: { minWidth: 180 } }), _jsxs(FormControl, { size: "small", sx: { minWidth: 150 }, children: [_jsx(InputLabel, { children: "Default Grade" }), _jsx(Select, { value: defaultGradeLevel, onChange: (e) => setDefaultGradeLevel(e.target.value), label: "Default Grade", children: GRADE_LEVELS.map(grade => (_jsx(MenuItem, { value: grade.value, children: grade.label }, grade.value))) })] })] })] }), _jsx(Stack, { spacing: 1, sx: { maxHeight: 400, overflowY: 'auto' }, children: classrooms.map(classroom => {
                                                            const isSelected = selectedClassrooms.has(classroom.id);
                                                            const capacityIssue = !validateClassroomCapacity(classroom, students.length);
                                                            return (_jsx(Paper, { sx: {
                                                                    p: 2,
                                                                    border: isSelected
                                                                        ? `2px solid ${theme.palette.primary.main}`
                                                                        : `1px solid ${alpha(theme.palette.divider, 0.12)}`,
                                                                    cursor: 'pointer',
                                                                    transition: 'all 0.2s ease',
                                                                    bgcolor: isSelected
                                                                        ? alpha(theme.palette.primary.main, 0.05)
                                                                        : 'transparent',
                                                                    '&:hover': {
                                                                        bgcolor: alpha(theme.palette.primary.main, 0.08),
                                                                        transform: 'translateY(-1px)',
                                                                    },
                                                                }, onClick: () => handleClassroomToggle(classroom.id), children: _jsxs(Stack, { direction: "row", alignItems: "center", spacing: 2, children: [_jsx(Checkbox, { checked: isSelected, onChange: () => { }, color: "primary" }), _jsx(ClassIcon, { sx: { color: theme.palette.primary.main } }), _jsxs(Box, { sx: { flex: 1 }, children: [_jsx(Typography, { variant: "subtitle1", fontWeight: 600, children: classroom.name }), _jsxs(Stack, { direction: "row", spacing: 1, alignItems: "center", children: [classroom.subject && (_jsx(Typography, { variant: "body2", color: "text.secondary", children: classroom.subject.name })), classroom.room && (_jsxs(Typography, { variant: "body2", color: "text.secondary", children: ["\u2022 ", classroom.room.name] })), classroom.teacher && (_jsxs(Typography, { variant: "body2", color: "text.secondary", children: ["\u2022 ", classroom.teacher.first_name, " ", classroom.teacher.last_name] }))] })] }), _jsxs(Stack, { alignItems: "center", spacing: 0.5, children: [classroom.capacity && (_jsx(Badge, { badgeContent: `${classroom.enrolled_count || 0}/${classroom.capacity}`, color: capacityIssue ? 'error' : 'primary', sx: {
                                                                                        '& .MuiBadge-badge': {
                                                                                            fontSize: '0.7rem',
                                                                                        },
                                                                                    }, children: _jsx(GroupsIcon, {}) })), capacityIssue && (_jsx(WarningIcon, { color: "error", sx: { fontSize: 18 } }))] })] }) }, classroom.id));
                                                        }) })] })] })] }), _jsxs(Step, { children: [_jsx(StepLabel, { children: _jsx(Typography, { variant: "h6", children: "Configure Enrollments" }) }), _jsxs(StepContent, { children: [_jsx(Typography, { variant: "body2", color: "text.secondary", sx: { mb: 2 }, children: "Customize enrollment settings for each classroom and select which students to enroll." }), _jsx(Stack, { spacing: 3, children: enrollmentSelections.map(enrollment => {
                                                    const classroom = classrooms.find(c => c.id === enrollment.classroom_id);
                                                    if (!classroom)
                                                        return null;
                                                    return (_jsx(Paper, { sx: { p: 3 }, children: _jsxs(Stack, { spacing: 2, children: [_jsxs(Stack, { direction: "row", alignItems: "center", spacing: 2, children: [_jsx(ClassIcon, { sx: { color: theme.palette.primary.main } }), _jsxs(Box, { children: [_jsx(Typography, { variant: "subtitle1", fontWeight: 600, children: classroom.name }), classroom.subject && (_jsx(Typography, { variant: "body2", color: "text.secondary", children: classroom.subject.name }))] }), _jsx(Box, { sx: { flex: 1 } }), _jsxs(Typography, { variant: "body2", color: "primary.main", fontWeight: 500, children: [enrollment.students.length, " of ", students.length, " students"] })] }), _jsx(Divider, {}), _jsxs(Stack, { direction: "row", spacing: 2, children: [_jsx(TextField, { label: "Enrollment Date", type: "date", value: enrollment.enrollment_date, onChange: (e) => updateEnrollmentSelection(enrollment.classroom_id, { enrollment_date: e.target.value }), InputLabelProps: { shrink: true }, size: "small", sx: { minWidth: 180 } }), _jsxs(FormControl, { size: "small", sx: { minWidth: 150 }, children: [_jsx(InputLabel, { children: "Grade Level" }), _jsx(Select, { value: enrollment.grade_level, onChange: (e) => updateEnrollmentSelection(enrollment.classroom_id, { grade_level: e.target.value }), label: "Grade Level", children: GRADE_LEVELS.map(grade => (_jsx(MenuItem, { value: grade.value, children: grade.label }, grade.value))) })] }), _jsx(FormControlLabel, { control: _jsx(Checkbox, { checked: enrollment.is_audit_only, onChange: (e) => updateEnrollmentSelection(enrollment.classroom_id, { is_audit_only: e.target.checked }) }), label: "Audit Only" }), _jsx(FormControlLabel, { control: _jsx(Checkbox, { checked: enrollment.requires_accommodation, onChange: (e) => updateEnrollmentSelection(enrollment.classroom_id, { requires_accommodation: e.target.checked }) }), label: "Requires Accommodation" })] }), _jsxs(Box, { children: [_jsxs(Stack, { direction: "row", justifyContent: "space-between", alignItems: "center", sx: { mb: 1 }, children: [_jsx(Typography, { variant: "subtitle2", children: "Select Students" }), _jsxs(Stack, { direction: "row", spacing: 1, children: [_jsx(Button, { size: "small", onClick: () => updateEnrollmentSelection(enrollment.classroom_id, { students: [...students] }), children: "All" }), _jsx(Button, { size: "small", onClick: () => updateEnrollmentSelection(enrollment.classroom_id, { students: [] }), children: "None" })] })] }), _jsx(Stack, { direction: "row", spacing: 0.5, flexWrap: "wrap", useFlexGap: true, children: students.map(student => {
                                                                                const isSelected = enrollment.students.some(s => s.id === student.id);
                                                                                return (_jsx(Chip, { label: `${student.first_name} ${student.last_name}`, color: isSelected ? 'primary' : 'default', variant: isSelected ? 'filled' : 'outlined', onClick: () => toggleStudentForClassroom(enrollment.classroom_id, student), clickable: true, size: "small" }, student.id));
                                                                            }) })] })] }) }, enrollment.classroom_id));
                                                }) })] })] }), _jsxs(Step, { children: [_jsx(StepLabel, { children: _jsx(Typography, { variant: "h6", children: "Review & Confirm" }) }), _jsxs(StepContent, { children: [_jsx(Typography, { variant: "body2", color: "text.secondary", sx: { mb: 2 }, children: "Review all enrollment details before confirming." }), errors.length > 0 && (_jsxs(Alert, { severity: "error", sx: { mb: 2 }, children: [_jsx(Typography, { variant: "subtitle2", sx: { mb: 1 }, children: "Errors found:" }), _jsx(List, { dense: true, children: errors.map((error, index) => (_jsxs(ListItem, { children: [_jsx(ListItemIcon, { children: _jsx(ErrorIcon, { color: "error", sx: { fontSize: 16 } }) }), _jsx(ListItemText, { primary: error })] }, index))) })] })), warnings.length > 0 && (_jsxs(Alert, { severity: "warning", sx: { mb: 2 }, children: [_jsx(Typography, { variant: "subtitle2", sx: { mb: 1 }, children: "Warnings:" }), _jsx(List, { dense: true, children: warnings.map((warning, index) => (_jsxs(ListItem, { children: [_jsx(ListItemIcon, { children: _jsx(WarningIcon, { color: "warning", sx: { fontSize: 16 } }) }), _jsx(ListItemText, { primary: warning })] }, index))) })] })), _jsx(Stack, { spacing: 2, children: enrollmentSelections.filter(e => e.students.length > 0).map(enrollment => {
                                                    const classroom = classrooms.find(c => c.id === enrollment.classroom_id);
                                                    if (!classroom)
                                                        return null;
                                                    return (_jsx(Paper, { sx: { p: 2 }, children: _jsxs(Stack, { direction: "row", alignItems: "center", spacing: 2, children: [_jsx(CheckCircleIcon, { sx: { color: theme.palette.success.main } }), _jsxs(Box, { sx: { flex: 1 }, children: [_jsx(Typography, { variant: "subtitle1", fontWeight: 600, children: classroom.name }), _jsxs(Typography, { variant: "body2", color: "text.secondary", children: [enrollment.students.length, " student", enrollment.students.length > 1 ? 's' : '', " \u2022 Grade ", enrollment.grade_level, " \u2022", format(new Date(enrollment.enrollment_date), 'MMM dd, yyyy'), enrollment.is_audit_only && ' • Audit Only', enrollment.requires_accommodation && ' • Requires Accommodation'] })] })] }) }, enrollment.classroom_id));
                                                }) })] })] })] })] }), _jsxs(DialogActions, { sx: { p: 3, gap: 1 }, children: [_jsx(Button, { onClick: handleReset, disabled: isProcessing, children: "Reset" }), _jsx(Button, { onClick: onClose, disabled: isProcessing, children: "Cancel" }), _jsx(Box, { sx: { flex: 1 } }), activeStep > 0 && (_jsx(Button, { onClick: () => setActiveStep(prev => prev - 1), disabled: isProcessing, children: "Back" })), _jsx(Button, { onClick: handleNext, variant: "contained", disabled: isProcessing ||
                            (activeStep === 0 && selectedClassrooms.size === 0) ||
                            (activeStep === steps.length - 1 && errors.length > 0), startIcon: isProcessing ? null :
                            activeStep === steps.length - 1 ? _jsx(PersonAddIcon, {}) : null, children: isProcessing
                            ? 'Processing...'
                            : activeStep === steps.length - 1
                                ? 'Confirm Enrollments'
                                : 'Next' })] })] }));
};
export default EnhancedEnrollmentManager;
