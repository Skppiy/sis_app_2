import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
// src/features/enrollment/pages/StudentsPage.tsx
import { useState } from 'react';
import { Paper, Box, Button, IconButton, Typography, Chip, Stack, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Select, MenuItem, FormControl, InputLabel, Alert, Tooltip, Collapse, List, ListItem, ListItemText, ListItemSecondaryAction, FormHelperText, } from '@mui/material';
import { DataGrid, GridToolbar, } from '@mui/x-data-grid';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, School as SchoolIcon, ExpandMore as ExpandMoreIcon, ExpandLess as ExpandLessIcon, PersonAdd as PersonAddIcon, Close as CloseIcon, } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { z } from 'zod';
import { useAuth } from '@/auth/AuthContext';
import { useStudents, useCreateStudent, useUpdateStudent, useDeleteStudent, useStudentEnrollments, useEnrollStudent, useWithdrawEnrollment, } from '@/features/enrollment/hooks/useStudents';
import { useClassrooms } from '@/features/academics/hooks/useClassrooms';
import { useYears } from '@/features/academics/hooks/useYears';
import { StudentCreateSchema, StudentUpdateSchema, GRADE_LEVELS, } from '@/schemas/students';
// Enrollment form schema
const EnrollmentFormSchema = z.object({
    classroom_id: z.string().min(1, "Classroom is required"),
    grade_level: z.string().min(1, "Grade level is required"),
    enrollment_date: z.string().min(1, "Enrollment date is required"),
});
export default function StudentsPage() {
    const { user, activeSchool } = useAuth();
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [enrollDialogOpen, setEnrollDialogOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [expandedRows, setExpandedRows] = useState(new Set());
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
    // Toggle row expansion
    const toggleRowExpansion = (studentId) => {
        const newExpanded = new Set(expandedRows);
        if (newExpanded.has(studentId)) {
            newExpanded.delete(studentId);
        }
        else {
            newExpanded.add(studentId);
        }
        setExpandedRows(newExpanded);
    };
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
    // DataGrid columns
    // DataGrid columns - FIXED valueGetter syntax
    // DataGrid columns - FIXED valueGetter syntax + Added Enrolled column
    const columns = [
        {
            field: 'expand',
            headerName: '',
            width: 50,
            renderCell: (params) => (_jsx(IconButton, { size: "small", onClick: () => toggleRowExpansion(params.row.id), children: expandedRows.has(params.row.id) ? _jsx(ExpandLessIcon, {}) : _jsx(ExpandMoreIcon, {}) })),
        },
        {
            field: 'student_id',
            headerName: 'Student ID',
            width: 100,
            renderCell: (params) => params.value || '-',
        },
        {
            field: 'name',
            headerName: 'Name',
            width: 180,
            renderCell: (params) => {
                const firstName = params.row?.first_name || '';
                const lastName = params.row?.last_name || '';
                return `${firstName} ${lastName}`.trim() || '-';
            },
        },
        {
            field: 'current_grade_level',
            headerName: 'Grade',
            width: 80,
            renderCell: (params) => {
                const grade = GRADE_LEVELS.find(g => g.value === params.value);
                return grade ? grade.label : params.value;
            },
        },
        {
            field: 'enrollment_count', // Use actual API field when backend is updated
            headerName: 'Enrolled',
            width: 100,
            renderCell: (params) => {
                // TODO: Replace with actual enrollment_count from API
                // For now, show placeholder until backend provides enrollment_count
                return (_jsx(Chip, { label: "Check", size: "small", color: "default", onClick: () => toggleRowExpansion(params.row.id), sx: { cursor: 'pointer' } }));
            },
        },
        {
            field: 'email',
            headerName: 'Email',
            width: 180,
            renderCell: (params) => params.value || '-',
        },
        {
            field: 'date_of_birth',
            headerName: 'Birth Date',
            width: 120,
            renderCell: (params) => params.value ? format(new Date(params.value), 'MM/dd/yyyy') : '-',
        },
        {
            field: 'is_active',
            headerName: 'Status',
            width: 90,
            renderCell: (params) => (_jsx(Chip, { label: params.value ? 'Active' : 'Inactive', color: params.value ? 'success' : 'default', size: "small" })),
        }, // ← CRITICAL: This comma was missing, causing the syntax error
        {
            field: 'actions',
            headerName: 'Actions',
            width: 150,
            renderCell: (params) => (_jsxs(Stack, { direction: "row", spacing: 1, children: [_jsx(Tooltip, { title: "Enroll in Class", children: _jsx(IconButton, { size: "small", onClick: () => {
                                setSelectedStudent(params.row);
                                setEnrollDialogOpen(true);
                            }, children: _jsx(PersonAddIcon, {}) }) }), _jsx(Tooltip, { title: "Edit", children: _jsx(IconButton, { size: "small", onClick: () => {
                                setSelectedStudent(params.row);
                                reset(params.row);
                                setEditDialogOpen(true);
                            }, children: _jsx(EditIcon, {}) }) }), _jsx(Tooltip, { title: "Delete", children: _jsx(IconButton, { size: "small", color: "error", onClick: () => {
                                setSelectedStudent(params.row);
                                setDeleteConfirmOpen(true);
                            }, children: _jsx(DeleteIcon, {}) }) })] })),
        },
    ]; // ← Array properly closed
    // Render enrollment details row
    const EnrollmentDetails = ({ student }) => {
        const { data: enrollments = [], isLoading } = useStudentEnrollments(student.id, {
            active_only: true,
            academic_year_id: activeYear?.id, // Filter by active academic year
        });
        const withdrawMutation = useWithdrawEnrollment(student.id);
        const handleWithdraw = async (enrollmentId) => {
            try {
                await withdrawMutation.mutateAsync(enrollmentId);
            }
            catch (error) {
                console.error('Failed to withdraw enrollment:', error);
            }
        };
        if (isLoading)
            return _jsx(Typography, { children: "Loading enrollments..." });
        return (_jsxs(Box, { sx: { p: 2, bgcolor: 'grey.50' }, children: [_jsxs(Typography, { variant: "subtitle2", gutterBottom: true, children: ["Current Enrollments (Grade ", student.current_grade_level, ")", activeYear && (_jsxs(Typography, { component: "span", variant: "body2", color: "text.secondary", sx: { ml: 1 }, children: ["\u2022 ", activeYear.name] }))] }), enrollments.length === 0 ? (_jsx(Typography, { variant: "body2", color: "text.secondary", children: "Not enrolled in any classes" })) : (_jsx(List, { dense: true, children: enrollments.map((enrollment) => (_jsxs(ListItem, { children: [_jsx(SchoolIcon, { sx: { mr: 2, color: 'primary.main' } }), _jsx(ListItemText, { primary: _jsxs(_Fragment, { children: ["Classroom ID: ", enrollment.classroom_id, enrollment.grade_level && (_jsx(Chip, { label: `Grade ${enrollment.grade_level}`, size: "small", sx: { ml: 1 } }))] }), secondary: `Enrolled: ${enrollment.enrollment_date
                                    ? format(new Date(enrollment.enrollment_date), 'MM/dd/yyyy')
                                    : 'N/A'}` }), _jsx(ListItemSecondaryAction, { children: _jsx(Button, { size: "small", color: "error", onClick: () => handleWithdraw(enrollment.id), children: "Withdraw" }) })] }, enrollment.id))) }))] }));
    };
    if (error) {
        return (_jsx(Paper, { sx: { p: 3 }, children: _jsx(Alert, { severity: "error", children: "Failed to load students" }) }));
    }
    return (_jsxs(Box, { children: [_jsx(Paper, { sx: { p: 2, mb: 2 }, children: _jsxs(Stack, { direction: "row", justifyContent: "space-between", alignItems: "center", children: [_jsxs(Box, { children: [_jsx(Typography, { variant: "h5", children: "Students" }), activeYear && (_jsxs(Typography, { variant: "body2", color: "text.secondary", sx: { mt: 0.5 }, children: ["Academic Year: ", activeYear.name, " (Enrollments)"] }))] }), _jsx(Button, { variant: "contained", startIcon: _jsx(AddIcon, {}), onClick: () => {
                                // Open dialog - useEffect will handle form reset and ID generation
                                setCreateDialogOpen(true);
                            }, children: "Add Student" })] }) }), _jsxs(Paper, { sx: { height: 600 }, children: [_jsx(DataGrid, { rows: students, columns: columns, loading: isLoading, pageSizeOptions: [10, 25, 50], initialState: {
                            pagination: { paginationModel: { pageSize: 10 } },
                        }, slots: {
                            toolbar: GridToolbar,
                        }, slotProps: {
                            toolbar: {
                                showQuickFilter: true,
                                quickFilterProps: { debounceMs: 500 },
                            },
                        }, getRowHeight: () => 'auto', sx: {
                            '& .MuiDataGrid-row': {
                                cursor: 'pointer',
                            },
                        } }), Array.from(expandedRows).map((studentId) => {
                        const student = students.find(s => s.id === studentId);
                        if (!student)
                            return null;
                        return (_jsx(Collapse, { in: expandedRows.has(studentId), children: _jsx(EnrollmentDetails, { student: student }) }, studentId));
                    })] }), _jsx(Dialog, { open: createDialogOpen, onClose: () => setCreateDialogOpen(false), maxWidth: "sm", fullWidth: true, children: _jsxs("form", { onSubmit: handleSubmit(handleCreate), children: [_jsx(DialogTitle, { children: "Add New Student" }), _jsxs(DialogContent, { children: [createMutation.error && (_jsxs(Alert, { severity: "error", sx: { mb: 2 }, children: ["Failed to create student: ", String(createMutation.error)] })), _jsxs(Box, { sx: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2, mt: 1 }, children: [_jsx(Box, { children: _jsx(Controller, { name: "first_name", control: control, defaultValue: "", render: ({ field }) => (_jsx(TextField, { ...field, label: "First Name", fullWidth: true, required: true, error: !!errors.first_name, helperText: errors.first_name?.message })) }) }), _jsx(Box, { children: _jsx(Controller, { name: "last_name", control: control, defaultValue: "", render: ({ field }) => (_jsx(TextField, { ...field, label: "Last Name", fullWidth: true, required: true, error: !!errors.last_name, helperText: errors.last_name?.message })) }) }), _jsx(Box, { children: _jsx(Controller, { name: "entry_grade_level", control: control, defaultValue: "", render: ({ field }) => (_jsxs(FormControl, { fullWidth: true, required: true, error: !!errors.entry_grade_level, children: [_jsx(InputLabel, { children: "Grade Level" }), _jsx(Select, { ...field, label: "Grade Level", children: GRADE_LEVELS.map((grade) => (_jsx(MenuItem, { value: grade.value, children: grade.label }, grade.value))) }), errors.entry_grade_level && (_jsx(FormHelperText, { children: errors.entry_grade_level?.message }))] })) }) }), _jsx(Box, { children: _jsx(Controller, { name: "date_of_birth", control: control, defaultValue: "", render: ({ field }) => (_jsx(TextField, { ...field, label: "Date of Birth", type: "date", fullWidth: true, InputLabelProps: { shrink: true }, error: !!errors.date_of_birth, helperText: errors.date_of_birth?.message })) }) }), _jsx(Box, { children: _jsx(Controller, { name: "entry_date", control: control, defaultValue: format(new Date(), 'yyyy-MM-dd'), render: ({ field }) => (_jsx(TextField, { ...field, label: "Entry Date", type: "date", fullWidth: true, InputLabelProps: { shrink: true }, error: !!errors.entry_date, helperText: errors.entry_date?.message })) }) })] })] }), _jsxs(DialogActions, { children: [_jsx(Button, { onClick: () => setCreateDialogOpen(false), children: "Cancel" }), _jsx(Button, { type: "submit", variant: "contained", disabled: createMutation.isPending, children: createMutation.isPending ? 'Creating...' : 'Create Student' })] })] }) }), _jsx(Dialog, { open: editDialogOpen, onClose: () => setEditDialogOpen(false), maxWidth: "sm", fullWidth: true, children: _jsxs("form", { onSubmit: handleEditSubmit(handleUpdate), children: [_jsx(DialogTitle, { children: "Edit Student" }), _jsxs(DialogContent, { children: [updateMutation.error && (_jsxs(Alert, { severity: "error", sx: { mb: 2 }, children: ["Failed to update student: ", String(updateMutation.error)] })), _jsxs(Box, { sx: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2, mt: 1 }, children: [_jsx(Box, { children: _jsx(Controller, { name: "first_name", control: editControl, render: ({ field }) => (_jsx(TextField, { ...field, label: "First Name", fullWidth: true, required: true, error: !!errors.first_name, helperText: errors.first_name?.message })) }) }), _jsx(Box, { children: _jsx(Controller, { name: "last_name", control: editControl, render: ({ field }) => (_jsx(TextField, { ...field, label: "Last Name", fullWidth: true, required: true, error: !!errors.last_name, helperText: errors.last_name?.message })) }) }), _jsx(Box, { children: _jsx(Controller, { name: "current_grade_level", control: editControl, render: ({ field }) => (_jsxs(FormControl, { fullWidth: true, children: [_jsx(InputLabel, { children: "Current Grade Level" }), _jsx(Select, { ...field, label: "Current Grade Level", children: GRADE_LEVELS.map((grade) => (_jsx(MenuItem, { value: grade.value, children: grade.label }, grade.value))) })] })) }) }), _jsx(Box, { children: _jsx(Controller, { name: "student_id", control: editControl, render: ({ field }) => (_jsx(TextField, { ...field, label: "Student ID", fullWidth: true, error: !!errors.student_id, helperText: errors.student_id?.message })) }) }), _jsx(Box, { children: _jsx(Controller, { name: "email", control: editControl, render: ({ field }) => (_jsx(TextField, { ...field, label: "Email", type: "email", fullWidth: true, error: !!errors.email, helperText: errors.email?.message })) }) }), _jsx(Box, { children: _jsx(Controller, { name: "date_of_birth", control: editControl, render: ({ field }) => (_jsx(TextField, { ...field, label: "Date of Birth", type: "date", fullWidth: true, InputLabelProps: { shrink: true }, error: !!errors.date_of_birth, helperText: errors.date_of_birth?.message })) }) })] })] }), _jsxs(DialogActions, { children: [_jsx(Button, { onClick: () => setEditDialogOpen(false), children: "Cancel" }), _jsx(Button, { type: "submit", variant: "contained", disabled: updateMutation.isPending, children: updateMutation.isPending ? 'Updating...' : 'Update Student' })] })] }) }), _jsx(Dialog, { open: enrollDialogOpen, onClose: () => setEnrollDialogOpen(false), maxWidth: "md", fullWidth: true, children: _jsxs("form", { onSubmit: enrollForm.handleSubmit(handleEnroll), children: [_jsx(DialogTitle, { children: _jsxs(Stack, { direction: "row", justifyContent: "space-between", alignItems: "center", children: [_jsxs(Box, { children: [_jsx(Typography, { variant: "h6", children: "Enroll Student" }), _jsxs(Typography, { variant: "subtitle2", color: "text.secondary", children: [selectedStudent?.first_name, " ", selectedStudent?.last_name, " (Grade ", selectedStudent?.current_grade_level, ")"] })] }), _jsx(IconButton, { onClick: () => setEnrollDialogOpen(false), size: "small", children: _jsx(CloseIcon, {}) })] }) }), _jsxs(DialogContent, { sx: { pt: 2 }, children: [enrollMutation.error && (_jsxs(Alert, { severity: "error", sx: { mb: 2 }, children: ["Failed to enroll student: ", String(enrollMutation.error)] })), !activeYear && (_jsx(Alert, { severity: "warning", sx: { mb: 2 }, children: _jsxs(Stack, { direction: "row", alignItems: "center", spacing: 1, children: [_jsx(SchoolIcon, {}), _jsxs(Box, { children: [_jsx(Typography, { variant: "subtitle2", children: "No Active Academic Year" }), _jsx(Typography, { variant: "body2", children: "Please set an active year first to enable enrollments." })] })] }) })), _jsxs(Box, { sx: { display: 'flex', flexDirection: 'column', gap: 3 }, children: [_jsxs(Box, { children: [_jsxs(Typography, { variant: "subtitle1", gutterBottom: true, sx: { display: 'flex', alignItems: 'center', gap: 1 }, children: [_jsx(SchoolIcon, { color: "primary" }), "Select Classroom"] }), _jsx(Controller, { name: "classroom_id", control: enrollForm.control, rules: { required: 'Please select a classroom' }, render: ({ field, fieldState }) => (_jsxs(FormControl, { fullWidth: true, error: !!fieldState.error, children: [_jsx(InputLabel, { children: "Classroom" }), _jsxs(Select, { ...field, label: "Classroom", size: "medium", children: [availableClassrooms.length === 0 && (_jsx(MenuItem, { disabled: true, children: _jsx(Typography, { variant: "body2", color: "text.secondary", children: "No classrooms available for the active academic year" }) })), availableClassrooms.map((classroom) => (_jsx(MenuItem, { value: classroom.id, children: _jsxs(Stack, { direction: "column", spacing: 0, children: [_jsx(Typography, { variant: "body1", fontWeight: "medium", children: classroom.name }), _jsxs(Typography, { variant: "body2", color: "text.secondary", children: [classroom.subject?.name || 'No Subject', classroom.room && ` • ${classroom.room.name}`] })] }) }, classroom.id)))] }), availableClassrooms.length === 0 && (_jsxs(FormHelperText, { children: ["Found ", classrooms.length, " total classrooms \u2022 Active Year: ", activeYear?.name || 'None'] })), fieldState.error && (_jsx(FormHelperText, { error: true, children: fieldState.error.message }))] })) })] }), _jsxs(Box, { children: [_jsx(Typography, { variant: "subtitle1", gutterBottom: true, children: "Enrollment Date" }), _jsx(Controller, { name: "enrollment_date", control: enrollForm.control, render: ({ field }) => (_jsx(TextField, { ...field, label: "Enrollment Date", type: "date", fullWidth: true, InputLabelProps: { shrink: true }, size: "medium" })) })] }), _jsxs(Box, { children: [_jsx(Typography, { variant: "subtitle1", gutterBottom: true, children: "Grade Level" }), _jsx(TextField, { value: selectedStudent?.current_grade_level || '', label: "Student's Current Grade", fullWidth: true, disabled: true, size: "medium", helperText: "Based on student's current grade level" })] })] })] }), _jsxs(DialogActions, { sx: { px: 3, py: 2, gap: 1 }, children: [_jsx(Button, { onClick: () => setEnrollDialogOpen(false), variant: "outlined", size: "large", children: "Cancel" }), _jsx(Button, { type: "submit", variant: "contained", disabled: enrollMutation.isPending || !activeYear || availableClassrooms.length === 0, startIcon: enrollMutation.isPending ? null : _jsx(PersonAddIcon, {}), size: "large", children: enrollMutation.isPending ? 'Enrolling...' : 'Enroll Student' })] })] }) }), _jsxs(Dialog, { open: deleteConfirmOpen, onClose: () => setDeleteConfirmOpen(false), children: [_jsx(DialogTitle, { children: "Confirm Delete" }), _jsx(DialogContent, { children: _jsxs(Typography, { children: ["Are you sure you want to delete student \"", selectedStudent?.first_name, " ", selectedStudent?.last_name, "\"? This will also remove all their enrollments."] }) }), _jsxs(DialogActions, { children: [_jsx(Button, { onClick: () => setDeleteConfirmOpen(false), children: "Cancel" }), _jsx(Button, { onClick: handleDelete, color: "error", variant: "contained", disabled: deleteMutation.isPending, children: deleteMutation.isPending ? 'Deleting...' : 'Delete' })] })] })] }));
}
