import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// src/features/enrollment/pages/StudentsPage.tsx
import { useState, useMemo } from 'react';
import { Paper, Box, Button, IconButton, Typography, Stack, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Select, MenuItem, FormControl, InputLabel, Alert, FormHelperText, List, ListItem, ListItemText, ListItemAvatar, ListItemSecondaryAction, Avatar, Chip, Tooltip, InputAdornment, alpha, useTheme, } from '@mui/material';
import { Add as AddIcon, School as SchoolIcon, PersonAdd as PersonAddIcon, Close as CloseIcon, ViewModule as CardViewIcon, ViewList as ListViewIcon, Person as PersonIcon, Edit as EditIcon, Delete as DeleteIcon, Email as EmailIcon, Cake as CakeIcon, School as EnrollmentIcon, Search as SearchIcon, } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { z } from 'zod';
import { useAuth } from '@/auth/AuthContext';
import { useStudents, useCreateStudent, useUpdateStudent, useDeleteStudent, useEnrollStudent, useWithdrawEnrollment, } from '@/features/enrollment/hooks/useStudents';
import { useClassrooms } from '@/features/academics/hooks/useClassrooms';
import { useYears } from '@/features/academics/hooks/useYears';
import { StudentCreateSchema, StudentUpdateSchema, GRADE_LEVELS, } from '@/schemas/students';
import { StudentGrid, EnhancedEnrollmentManager } from '@/components/students';
// Enrollment form schema
const EnrollmentFormSchema = z.object({
    classroom_id: z.string().min(1, "Classroom is required"),
    grade_level: z.string().min(1, "Grade level is required"),
    enrollment_date: z.string().min(1, "Enrollment date is required"),
});
export default function StudentsPage() {
    const { user, activeSchool } = useAuth();
    const theme = useTheme();
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [enrollDialogOpen, setEnrollDialogOpen] = useState(false);
    const [bulkEnrollDialogOpen, setBulkEnrollDialogOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [selectedStudentsForBulk, setSelectedStudentsForBulk] = useState([]);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [viewMode, setViewMode] = useState('cards');
    const [useEnhancedView, setUseEnhancedView] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const schoolId = activeSchool?.id;
    // Queries
    const { data: students = [], isLoading, error } = useStudents({
        school_id: schoolId
    });
    const { data: academicYears = [] } = useYears();
    // Get active academic year - handle both boolean and string formats
    const activeYear = academicYears.find(y => {
        const isActive = y.is_active;
        return isActive === true || String(isActive).toLowerCase() === 'true' || String(isActive).toLowerCase() === 't';
    });
    // Filter classrooms by active academic year for enrollment
    const classroomsQuery = useClassrooms(activeYear?.id ? { academic_year_id: activeYear.id } : {});
    const { data: classrooms = [] } = classroomsQuery;
    // Mutations
    const createMutation = useCreateStudent();
    const updateMutation = useUpdateStudent(selectedStudent?.id || '');
    const deleteMutation = useDeleteStudent();
    const enrollMutation = useEnrollStudent();
    // DEBUG: Log to see what's happening
    console.log('Students Page DEBUG:', {
        academicYears,
        activeYear,
        studentsCount: students.length,
        classroomsCount: classrooms.length
    });
    // Classrooms are already filtered by active academic year in the query above
    const availableClassrooms = classrooms;
    // Form for create/edit - Use proper types
    const { control, handleSubmit, reset, formState: { errors }, } = useForm({
        resolver: zodResolver(StudentCreateSchema),
        defaultValues: {
            first_name: '',
            last_name: '',
            date_of_birth: '',
            entry_date: format(new Date(), 'yyyy-MM-dd'),
            entry_grade_level: '',
        },
    });
    // Separate form for edit with proper types
    const { control: editControl, handleSubmit: handleEditSubmit, reset: resetEdit, formState: { errors: editErrors }, } = useForm({
        resolver: zodResolver(StudentUpdateSchema),
        defaultValues: {
            first_name: '',
            last_name: '',
            current_grade_level: '',
        },
    });
    // Enrollment form
    const enrollForm = useForm({
        resolver: zodResolver(EnrollmentFormSchema),
        defaultValues: {
            classroom_id: '',
            grade_level: '',
            enrollment_date: format(new Date(), 'yyyy-MM-dd'),
        },
    });
    // Handle create
    const handleCreate = async (data) => {
        try {
            // Auto-generate email using firstname.lastname@domain from logged-in user
            let autoEmail = '';
            if (user?.email && data.first_name && data.last_name) {
                const userDomain = user.email.split('@')[1];
                const firstName = data.first_name.toLowerCase().replace(/\s+/g, '');
                const lastName = data.last_name.toLowerCase().replace(/\s+/g, '');
                autoEmail = `${firstName}.${lastName}@${userDomain}`;
            }
            const studentData = {
                ...data,
                email: autoEmail || undefined, // Let backend handle if empty
                // student_id will be auto-generated by backend
            };
            console.log('Creating student with auto-generated data:', studentData);
            await createMutation.mutateAsync(studentData);
            setCreateDialogOpen(false);
            reset();
        }
        catch (error) {
            console.error('Failed to create student:', error);
            // Show error to user - you can add a toast/alert here
        }
    };
    // Handle update
    const handleUpdate = async (data) => {
        if (!selectedStudent)
            return;
        try {
            await updateMutation.mutateAsync(data);
            setEditDialogOpen(false);
            setSelectedStudent(null);
            reset();
        }
        catch (error) {
            console.error('Failed to update student:', error);
        }
    };
    // Handle delete
    const handleDelete = async () => {
        if (!selectedStudent)
            return;
        try {
            await deleteMutation.mutateAsync(selectedStudent.id);
            setDeleteConfirmOpen(false);
            setSelectedStudent(null);
        }
        catch (error) {
            console.error('Failed to delete student:', error);
        }
    };
    // Handle enroll
    const handleEnroll = async (data) => {
        if (!selectedStudent)
            return;
        try {
            await enrollMutation.mutateAsync({
                student_id: selectedStudent.id,
                classroom_id: data.classroom_id,
                grade_level: data.grade_level,
                enrollment_date: data.enrollment_date,
            });
            setEnrollDialogOpen(false);
            enrollForm.reset();
        }
        catch (error) {
            console.error('Failed to enroll student:', error);
        }
    };
    // Handle withdraw enrollment
    const handleWithdrawEnrollment = async (studentId, enrollmentId) => {
        try {
            const withdrawMutation = useWithdrawEnrollment(studentId);
            await withdrawMutation.mutateAsync(enrollmentId);
        }
        catch (error) {
            console.error('Failed to withdraw enrollment:', error);
        }
    };
    // Bulk operations handlers
    const handleBulkEnroll = (students) => {
        setSelectedStudentsForBulk(students);
        setBulkEnrollDialogOpen(true);
    };
    const handleProcessBulkEnrollments = async (enrollmentSelections) => {
        try {
            // Process each enrollment selection
            for (const selection of enrollmentSelections) {
                for (const student of selection.students) {
                    await enrollMutation.mutateAsync({
                        student_id: student.id,
                        classroom_id: selection.classroom_id,
                        grade_level: selection.grade_level,
                        enrollment_date: selection.enrollment_date,
                        is_audit_only: selection.is_audit_only,
                        requires_accommodation: selection.requires_accommodation,
                    });
                }
            }
            console.log('Bulk enrollments completed successfully');
        }
        catch (error) {
            console.error('Failed to process bulk enrollments:', error);
            throw error;
        }
    };
    const handleBulkActivate = async (studentIds) => {
        try {
            // Implementation would depend on your backend API
            console.log('Bulk activating students:', studentIds);
        }
        catch (error) {
            console.error('Failed to bulk activate students:', error);
        }
    };
    const handleBulkInactivate = async (studentIds) => {
        try {
            // Implementation would depend on your backend API
            console.log('Bulk inactivating students:', studentIds);
        }
        catch (error) {
            console.error('Failed to bulk inactivate students:', error);
        }
    };
    const handleBulkDelete = async (studentIds) => {
        try {
            for (const id of studentIds) {
                await deleteMutation.mutateAsync(id);
            }
            console.log('Bulk delete completed');
        }
        catch (error) {
            console.error('Failed to bulk delete students:', error);
        }
    };
    const handleBulkExport = async (studentIds, format) => {
        try {
            // Implementation would depend on your export functionality
            console.log(`Exporting ${studentIds.length} students as ${format}`);
        }
        catch (error) {
            console.error('Failed to export students:', error);
        }
    };
    const handleBulkEmail = async (studentIds) => {
        try {
            // Implementation would depend on your email functionality
            console.log('Sending bulk email to students:', studentIds);
        }
        catch (error) {
            console.error('Failed to send bulk email:', error);
        }
    };
    const handleBulkSms = async (studentIds) => {
        try {
            // Implementation would depend on your SMS functionality
            console.log('Sending bulk SMS to students:', studentIds);
        }
        catch (error) {
            console.error('Failed to send bulk SMS:', error);
        }
    };
    const handleBulkReport = async (studentIds, reportType) => {
        try {
            // Implementation would depend on your reporting functionality
            console.log(`Generating ${reportType} report for students:`, studentIds);
        }
        catch (error) {
            console.error('Failed to generate bulk report:', error);
        }
    };
    // Helper functions for list view
    const getInitials = (firstName, lastName) => {
        return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    };
    const getGradeLabel = (gradeValue) => {
        const grade = GRADE_LEVELS.find(g => g.value === gradeValue);
        return grade ? grade.label : gradeValue;
    };
    const formatDate = (dateString) => {
        if (!dateString)
            return 'N/A';
        try {
            return format(new Date(dateString), 'MMM dd, yyyy');
        }
        catch {
            return 'Invalid Date';
        }
    };
    // Filter and search students
    const filteredStudents = useMemo(() => {
        return students.filter(student => {
            const searchLower = searchQuery.toLowerCase();
            return (student.first_name.toLowerCase().includes(searchLower) ||
                student.last_name.toLowerCase().includes(searchLower) ||
                student.email?.toLowerCase().includes(searchLower) ||
                student.student_id?.toLowerCase().includes(searchLower));
        });
    }, [students, searchQuery]);
    if (error) {
        return (_jsx(Paper, { sx: { p: 3 }, children: _jsx(Alert, { severity: "error", children: "Failed to load students" }) }));
    }
    return (_jsxs(Box, { children: [_jsxs(Paper, { sx: {
                    p: 3,
                    mb: 3,
                    background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.02)} 0%, ${alpha(theme.palette.primary.light, 0.05)} 100%)`,
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
                }, children: [_jsxs(Stack, { direction: "row", justifyContent: "space-between", alignItems: "center", sx: { mb: 3 }, children: [_jsxs(Box, { children: [_jsx(Typography, { variant: "h4", component: "h1", sx: { fontWeight: 600, mb: 1 }, children: "Student Management" }), _jsx(Typography, { variant: "body1", color: "text.secondary", children: activeYear ? (`Academic Year: ${activeYear.name} • ${filteredStudents.length} students`) : (`${filteredStudents.length} students • No active academic year`) })] }), _jsxs(Stack, { direction: "row", spacing: 2, children: [_jsxs(Stack, { direction: "row", spacing: 1, sx: {
                                            bgcolor: alpha(theme.palette.primary.main, 0.04),
                                            borderRadius: 2,
                                            p: 0.5,
                                        }, children: [_jsx(Button, { variant: viewMode === 'cards' ? "contained" : "text", startIcon: _jsx(CardViewIcon, {}), onClick: () => setViewMode('cards'), size: "small", sx: { minWidth: 'auto' }, children: "Cards" }), _jsx(Button, { variant: viewMode === 'list' ? "contained" : "text", startIcon: _jsx(ListViewIcon, {}), onClick: () => setViewMode('list'), size: "small", sx: { minWidth: 'auto' }, children: "List" })] }), viewMode === 'cards' && (_jsx(Button, { variant: useEnhancedView ? "contained" : "outlined", onClick: () => setUseEnhancedView(!useEnhancedView), size: "small", children: useEnhancedView ? 'Enhanced' : 'Standard' })), _jsx(Button, { variant: "contained", startIcon: _jsx(AddIcon, {}), onClick: () => setCreateDialogOpen(true), size: "large", sx: {
                                            borderRadius: 2,
                                            px: 3,
                                        }, children: "Add Student" })] })] }), _jsx(TextField, { fullWidth: true, placeholder: "Search students by name, email, or ID...", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), InputProps: {
                            startAdornment: (_jsx(InputAdornment, { position: "start", children: _jsx(SearchIcon, { sx: { color: theme.palette.text.secondary } }) })),
                        }, sx: {
                            '& .MuiOutlinedInput-root': {
                                borderRadius: 2,
                            },
                        } })] }), viewMode === 'cards' ? (_jsx(StudentGrid, { students: filteredStudents, loading: isLoading, onEdit: (student) => {
                    setSelectedStudent(student);
                    resetEdit(student);
                    setEditDialogOpen(true);
                }, onDelete: (student) => {
                    setSelectedStudent(student);
                    setDeleteConfirmOpen(true);
                }, onEnroll: (student) => {
                    setSelectedStudent(student);
                    setEnrollDialogOpen(true);
                }, onWithdrawEnrollment: handleWithdrawEnrollment, academicYearName: activeYear?.name, academicYearId: activeYear?.id, itemsPerPage: 12, useEnhancedCards: useEnhancedView, showBulkOperations: useEnhancedView, availableClassrooms: availableClassrooms.map(c => ({
                    id: c.id,
                    name: c.name,
                    subject: c.subject
                })), onBulkEnroll: (studentIds, classroomId) => {
                    const studentsForBulk = filteredStudents.filter(s => studentIds.includes(s.id));
                    handleBulkEnroll(studentsForBulk);
                }, onBulkActivate: handleBulkActivate, onBulkInactivate: handleBulkInactivate, onBulkDelete: handleBulkDelete, onBulkExport: handleBulkExport, onBulkEmail: handleBulkEmail, onBulkSms: handleBulkSms, onBulkReport: handleBulkReport })) : (
            /* Professional List View */
            _jsx(Paper, { sx: { mb: 3 }, children: isLoading ? (_jsx(Box, { sx: { p: 2 }, children: _jsx(Typography, { children: "Loading students..." }) })) : (_jsxs(List, { sx: { p: 0 }, children: [filteredStudents.map((student, index) => (_jsxs(ListItem, { sx: {
                                borderBottom: index < filteredStudents.length - 1 ? 1 : 0,
                                borderColor: 'divider',
                                py: 2,
                                px: 3,
                                '&:hover': {
                                    backgroundColor: alpha(theme.palette.primary.main, 0.04),
                                },
                            }, children: [_jsx(ListItemAvatar, { children: _jsx(Avatar, { sx: {
                                            bgcolor: student.is_active
                                                ? theme.palette.primary.main
                                                : theme.palette.grey[500],
                                            width: 48,
                                            height: 48,
                                            fontSize: '1.1rem',
                                            fontWeight: 600,
                                        }, children: getInitials(student.first_name, student.last_name) }) }), _jsx(ListItemText, { primary: _jsxs(Stack, { direction: "row", alignItems: "center", spacing: 2, children: [_jsxs(Typography, { variant: "h6", sx: { fontWeight: 600 }, children: [student.first_name, " ", student.last_name] }), _jsxs(Typography, { variant: "body2", color: "text.secondary", children: ["ID: ", student.student_id || 'N/A'] }), _jsx(Chip, { label: getGradeLabel(student.current_grade_level), size: "small", sx: {
                                                    background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
                                                    color: 'white',
                                                    fontWeight: 500,
                                                    fontSize: '0.75rem',
                                                } }), _jsx(Chip, { label: student.is_active ? 'Active' : 'Inactive', size: "small", color: student.is_active ? 'success' : 'default', variant: student.is_active ? 'filled' : 'outlined' })] }), secondary: _jsxs(Stack, { direction: "row", spacing: 3, sx: { mt: 1 }, children: [student.email && (_jsxs(Box, { sx: { display: 'flex', alignItems: 'center' }, children: [_jsx(EmailIcon, { sx: { fontSize: 16, mr: 1, color: theme.palette.text.secondary } }), _jsx(Typography, { variant: "body2", color: "text.secondary", children: student.email })] })), student.date_of_birth && (_jsxs(Box, { sx: { display: 'flex', alignItems: 'center' }, children: [_jsx(CakeIcon, { sx: { fontSize: 16, mr: 1, color: theme.palette.text.secondary } }), _jsxs(Typography, { variant: "body2", color: "text.secondary", children: ["Born: ", formatDate(student.date_of_birth)] })] })), student.entry_date && (_jsxs(Box, { sx: { display: 'flex', alignItems: 'center' }, children: [_jsx(EnrollmentIcon, { sx: { fontSize: 16, mr: 1, color: theme.palette.text.secondary } }), _jsxs(Typography, { variant: "body2", color: "text.secondary", children: ["Enrolled: ", formatDate(student.entry_date)] })] }))] }) }), _jsx(ListItemSecondaryAction, { children: _jsxs(Stack, { direction: "row", spacing: 1, children: [_jsx(Tooltip, { title: "Enroll in Class", children: _jsx(IconButton, { onClick: () => {
                                                        setSelectedStudent(student);
                                                        setEnrollDialogOpen(true);
                                                    }, size: "small", sx: {
                                                        color: theme.palette.primary.main,
                                                        '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.1) }
                                                    }, children: _jsx(PersonAddIcon, { fontSize: "small" }) }) }), _jsx(Tooltip, { title: "Edit Student", children: _jsx(IconButton, { onClick: () => {
                                                        setSelectedStudent(student);
                                                        resetEdit(student);
                                                        setEditDialogOpen(true);
                                                    }, size: "small", sx: {
                                                        color: theme.palette.info.main,
                                                        '&:hover': { bgcolor: alpha(theme.palette.info.main, 0.1) }
                                                    }, children: _jsx(EditIcon, { fontSize: "small" }) }) }), _jsx(Tooltip, { title: "Delete Student", children: _jsx(IconButton, { onClick: () => {
                                                        setSelectedStudent(student);
                                                        setDeleteConfirmOpen(true);
                                                    }, size: "small", sx: {
                                                        color: theme.palette.error.main,
                                                        '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.1) }
                                                    }, children: _jsx(DeleteIcon, { fontSize: "small" }) }) })] }) })] }, student.id))), filteredStudents.length === 0 && (_jsxs(Box, { sx: { p: 6, textAlign: 'center' }, children: [_jsx(PersonIcon, { sx: { fontSize: 64, color: theme.palette.text.disabled, mb: 2 } }), _jsx(Typography, { variant: "h6", color: "text.secondary", gutterBottom: true, children: "No students found" }), _jsx(Typography, { variant: "body2", color: "text.secondary", children: searchQuery
                                        ? `No students match "${searchQuery}"`
                                        : 'No students enrolled yet' })] }))] })) })), _jsx(Dialog, { open: createDialogOpen, onClose: () => setCreateDialogOpen(false), maxWidth: "sm", fullWidth: true, children: _jsxs("form", { onSubmit: handleSubmit(handleCreate), children: [_jsx(DialogTitle, { children: "Add New Student" }), _jsxs(DialogContent, { children: [createMutation.error && (_jsxs(Alert, { severity: "error", sx: { mb: 2 }, children: ["Failed to create student: ", String(createMutation.error)] })), _jsxs(Box, { sx: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2, mt: 1 }, children: [_jsx(Box, { children: _jsx(Controller, { name: "first_name", control: control, defaultValue: "", render: ({ field }) => (_jsx(TextField, { ...field, label: "First Name", fullWidth: true, required: true, error: !!errors.first_name, helperText: errors.first_name?.message })) }) }), _jsx(Box, { children: _jsx(Controller, { name: "last_name", control: control, defaultValue: "", render: ({ field }) => (_jsx(TextField, { ...field, label: "Last Name", fullWidth: true, required: true, error: !!errors.last_name, helperText: errors.last_name?.message })) }) }), _jsx(Box, { children: _jsx(Controller, { name: "entry_grade_level", control: control, defaultValue: "", render: ({ field }) => (_jsxs(FormControl, { fullWidth: true, required: true, error: !!errors.entry_grade_level, children: [_jsx(InputLabel, { children: "Grade Level" }), _jsx(Select, { ...field, label: "Grade Level", children: GRADE_LEVELS.map((grade) => (_jsx(MenuItem, { value: grade.value, children: grade.label }, grade.value))) }), errors.entry_grade_level && (_jsx(FormHelperText, { children: errors.entry_grade_level?.message }))] })) }) }), _jsx(Box, { children: _jsx(Controller, { name: "date_of_birth", control: control, defaultValue: "", render: ({ field }) => (_jsx(TextField, { ...field, label: "Date of Birth", type: "date", fullWidth: true, InputLabelProps: { shrink: true }, error: !!errors.date_of_birth, helperText: errors.date_of_birth?.message })) }) }), _jsx(Box, { children: _jsx(Controller, { name: "entry_date", control: control, defaultValue: format(new Date(), 'yyyy-MM-dd'), render: ({ field }) => (_jsx(TextField, { ...field, label: "Entry Date", type: "date", fullWidth: true, InputLabelProps: { shrink: true }, error: !!errors.entry_date, helperText: errors.entry_date?.message })) }) })] })] }), _jsxs(DialogActions, { children: [_jsx(Button, { onClick: () => setCreateDialogOpen(false), children: "Cancel" }), _jsx(Button, { type: "submit", variant: "contained", disabled: createMutation.isPending, children: createMutation.isPending ? 'Creating...' : 'Create Student' })] })] }) }), _jsx(Dialog, { open: editDialogOpen, onClose: () => setEditDialogOpen(false), maxWidth: "sm", fullWidth: true, children: _jsxs("form", { onSubmit: handleEditSubmit(handleUpdate), children: [_jsx(DialogTitle, { children: "Edit Student" }), _jsxs(DialogContent, { children: [updateMutation.error && (_jsxs(Alert, { severity: "error", sx: { mb: 2 }, children: ["Failed to update student: ", String(updateMutation.error)] })), _jsxs(Box, { sx: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2, mt: 1 }, children: [_jsx(Box, { children: _jsx(Controller, { name: "first_name", control: editControl, render: ({ field }) => (_jsx(TextField, { ...field, label: "First Name", fullWidth: true, required: true, error: !!errors.first_name, helperText: errors.first_name?.message })) }) }), _jsx(Box, { children: _jsx(Controller, { name: "last_name", control: editControl, render: ({ field }) => (_jsx(TextField, { ...field, label: "Last Name", fullWidth: true, required: true, error: !!errors.last_name, helperText: errors.last_name?.message })) }) }), _jsx(Box, { children: _jsx(Controller, { name: "current_grade_level", control: editControl, render: ({ field }) => (_jsxs(FormControl, { fullWidth: true, children: [_jsx(InputLabel, { children: "Current Grade Level" }), _jsx(Select, { ...field, label: "Current Grade Level", children: GRADE_LEVELS.map((grade) => (_jsx(MenuItem, { value: grade.value, children: grade.label }, grade.value))) })] })) }) }), _jsx(Box, { children: _jsx(Controller, { name: "student_id", control: editControl, render: ({ field }) => (_jsx(TextField, { ...field, label: "Student ID", fullWidth: true, error: !!errors.student_id, helperText: errors.student_id?.message })) }) }), _jsx(Box, { children: _jsx(Controller, { name: "email", control: editControl, render: ({ field }) => (_jsx(TextField, { ...field, label: "Email", type: "email", fullWidth: true, error: !!errors.email, helperText: errors.email?.message })) }) }), _jsx(Box, { children: _jsx(Controller, { name: "date_of_birth", control: editControl, render: ({ field }) => (_jsx(TextField, { ...field, label: "Date of Birth", type: "date", fullWidth: true, InputLabelProps: { shrink: true }, error: !!errors.date_of_birth, helperText: errors.date_of_birth?.message })) }) })] })] }), _jsxs(DialogActions, { children: [_jsx(Button, { onClick: () => setEditDialogOpen(false), children: "Cancel" }), _jsx(Button, { type: "submit", variant: "contained", disabled: updateMutation.isPending, children: updateMutation.isPending ? 'Updating...' : 'Update Student' })] })] }) }), _jsx(Dialog, { open: enrollDialogOpen, onClose: () => setEnrollDialogOpen(false), maxWidth: "md", fullWidth: true, children: _jsxs("form", { onSubmit: enrollForm.handleSubmit(handleEnroll), children: [_jsx(DialogTitle, { children: _jsxs(Stack, { direction: "row", justifyContent: "space-between", alignItems: "center", children: [_jsxs(Box, { children: [_jsx(Typography, { variant: "h6", children: "Enroll Student" }), _jsxs(Typography, { variant: "subtitle2", color: "text.secondary", children: [selectedStudent?.first_name, " ", selectedStudent?.last_name, " (Grade ", selectedStudent?.current_grade_level, ")"] })] }), _jsx(IconButton, { onClick: () => setEnrollDialogOpen(false), size: "small", children: _jsx(CloseIcon, {}) })] }) }), _jsxs(DialogContent, { sx: { pt: 2 }, children: [enrollMutation.error && (_jsxs(Alert, { severity: "error", sx: { mb: 2 }, children: ["Failed to enroll student: ", String(enrollMutation.error)] })), !activeYear && (_jsx(Alert, { severity: "warning", sx: { mb: 2 }, children: _jsxs(Stack, { direction: "row", alignItems: "center", spacing: 1, children: [_jsx(SchoolIcon, {}), _jsxs(Box, { children: [_jsx(Typography, { variant: "subtitle2", children: "No Active Academic Year" }), _jsx(Typography, { variant: "body2", children: "Please set an active year first to enable enrollments." })] })] }) })), _jsxs(Box, { sx: { display: 'flex', flexDirection: 'column', gap: 3 }, children: [_jsxs(Box, { children: [_jsxs(Typography, { variant: "subtitle1", gutterBottom: true, sx: { display: 'flex', alignItems: 'center', gap: 1 }, children: [_jsx(SchoolIcon, { color: "primary" }), "Select Classroom"] }), _jsx(Controller, { name: "classroom_id", control: enrollForm.control, rules: { required: 'Please select a classroom' }, render: ({ field, fieldState }) => (_jsxs(FormControl, { fullWidth: true, error: !!fieldState.error, children: [_jsx(InputLabel, { children: "Classroom" }), _jsxs(Select, { ...field, label: "Classroom", size: "medium", children: [availableClassrooms.length === 0 && (_jsx(MenuItem, { disabled: true, children: _jsx(Typography, { variant: "body2", color: "text.secondary", children: "No classrooms available for the active academic year" }) })), availableClassrooms.map((classroom) => (_jsx(MenuItem, { value: classroom.id, children: _jsxs(Stack, { direction: "column", spacing: 0, children: [_jsx(Typography, { variant: "body1", fontWeight: "medium", children: classroom.name }), _jsxs(Typography, { variant: "body2", color: "text.secondary", children: [classroom.subject?.name || 'No Subject', classroom.room && ` • ${classroom.room.name}`] })] }) }, classroom.id)))] }), availableClassrooms.length === 0 && (_jsxs(FormHelperText, { children: ["Found ", classrooms.length, " total classrooms \u2022 Active Year: ", activeYear?.name || 'None'] })), fieldState.error && (_jsx(FormHelperText, { error: true, children: fieldState.error.message }))] })) })] }), _jsxs(Box, { children: [_jsx(Typography, { variant: "subtitle1", gutterBottom: true, children: "Enrollment Date" }), _jsx(Controller, { name: "enrollment_date", control: enrollForm.control, render: ({ field }) => (_jsx(TextField, { ...field, label: "Enrollment Date", type: "date", fullWidth: true, InputLabelProps: { shrink: true }, size: "medium" })) })] }), _jsxs(Box, { children: [_jsx(Typography, { variant: "subtitle1", gutterBottom: true, children: "Grade Level" }), _jsx(TextField, { value: selectedStudent?.current_grade_level || '', label: "Student's Current Grade", fullWidth: true, disabled: true, size: "medium", helperText: "Based on student's current grade level" })] })] })] }), _jsxs(DialogActions, { sx: { px: 3, py: 2, gap: 1 }, children: [_jsx(Button, { onClick: () => setEnrollDialogOpen(false), variant: "outlined", size: "large", children: "Cancel" }), _jsx(Button, { type: "submit", variant: "contained", disabled: enrollMutation.isPending || !activeYear || availableClassrooms.length === 0, startIcon: enrollMutation.isPending ? null : _jsx(PersonAddIcon, {}), size: "large", children: enrollMutation.isPending ? 'Enrolling...' : 'Enroll Student' })] })] }) }), _jsxs(Dialog, { open: deleteConfirmOpen, onClose: () => setDeleteConfirmOpen(false), children: [_jsx(DialogTitle, { children: "Confirm Delete" }), _jsx(DialogContent, { children: _jsxs(Typography, { children: ["Are you sure you want to delete student \"", selectedStudent?.first_name, " ", selectedStudent?.last_name, "\"? This will also remove all their enrollments."] }) }), _jsxs(DialogActions, { children: [_jsx(Button, { onClick: () => setDeleteConfirmOpen(false), children: "Cancel" }), _jsx(Button, { onClick: handleDelete, color: "error", variant: "contained", disabled: deleteMutation.isPending, children: deleteMutation.isPending ? 'Deleting...' : 'Delete' })] })] }), _jsx(EnhancedEnrollmentManager, { open: bulkEnrollDialogOpen, onClose: () => setBulkEnrollDialogOpen(false), students: selectedStudentsForBulk, classrooms: availableClassrooms.map(c => ({
                    id: c.id,
                    name: c.name,
                    subject: c.subject,
                    room: c.room,
                    capacity: undefined, // Add if available in your data
                    enrolled_count: undefined, // Add if available in your data
                    academic_year_id: activeYear?.id,
                })), academicYearName: activeYear?.name, onEnroll: handleProcessBulkEnrollments })] }));
}
