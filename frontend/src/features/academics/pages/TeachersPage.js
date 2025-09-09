import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// src/features/academics/pages/TeachersPage.tsx
import React, { useState } from 'react';
import { Paper, Box, Container, Button, IconButton, Typography, Chip, Stack, Dialog, DialogTitle, DialogContent, DialogActions, Alert, Tooltip, Tabs, Tab, List, ListItem, ListItemText, ListItemAvatar, ListItemSecondaryAction, Avatar, } from '@mui/material';
import { TextField, InputAdornment, alpha, useTheme, LinearProgress, } from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Search as SearchIcon, Person as TeacherIcon, School as HomeRoomIcon, SportsBasketball as PEIcon, LibraryBooks as LibraryIcon, Palette as ArtIcon, MusicNote as MusicIcon, Science as ScienceIcon, Room as RoomIcon, Groups as StudentsIcon, Refresh as RefreshIcon, } from '@mui/icons-material';
import { useAuth } from '@/auth/AuthContext';
import { useTeachers, useCreateTeacher, useUpdateTeacher, useDeleteTeacher } from '@/features/academics/hooks/useTeachers';
import TeacherFormDialog from '@/features/academics/components/TeacherFormDialog';
import { GRADE_LEVELS, getTeacherRoomDisplay, getTeacherSubjectDisplay } from '@/schemas/academics';
export default function TeachersPage() {
    const { activeSchool } = useAuth();
    const theme = useTheme();
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [selectedTeacher, setSelectedTeacher] = useState(null);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    // Tab and search state
    const [activeTab, setActiveTab] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const schoolId = activeSchool?.id;
    // Queries
    const { data: teachers = [], isLoading, error } = useTeachers({
        school_id: schoolId
    });
    // Track data loading state for better UX
    const [dataEnrichmentLoading, setDataEnrichmentLoading] = React.useState(false);
    // Monitor when teacher data is being enriched
    React.useEffect(() => {
        if (isLoading) {
            setDataEnrichmentLoading(true);
        }
        else {
            // Add small delay to show the enrichment process
            const timer = setTimeout(() => {
                setDataEnrichmentLoading(false);
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [isLoading]);
    // Mutations
    const createMutation = useCreateTeacher();
    const updateMutation = useUpdateTeacher(selectedTeacher?.id || '');
    const deleteMutation = useDeleteTeacher();
    // Handle create
    const handleCreate = async (data) => {
        try {
            await createMutation.mutateAsync(data);
            setCreateDialogOpen(false);
        }
        catch (error) {
            console.error('Failed to create teacher:', error);
        }
    };
    // Handle update
    const handleUpdate = async (data) => {
        if (!selectedTeacher)
            return;
        try {
            await updateMutation.mutateAsync(data);
            setEditDialogOpen(false);
            setSelectedTeacher(null);
        }
        catch (error) {
            console.error('Failed to update teacher:', error);
        }
    };
    // Handle delete
    const handleDelete = async () => {
        if (!selectedTeacher)
            return;
        try {
            await deleteMutation.mutateAsync(selectedTeacher.id);
            setDeleteConfirmOpen(false);
            setSelectedTeacher(null);
        }
        catch (error) {
            console.error('Failed to delete teacher:', error);
        }
    };
    // Helper function to get teacher icon
    const getTeacherIcon = (teacher) => {
        if (teacher.is_specialist) {
            const subject = teacher.specialist_subject?.toLowerCase() || '';
            if (subject.includes('pe') || subject.includes('gym') || subject.includes('physical'))
                return _jsx(PEIcon, {});
            if (subject.includes('library') || subject.includes('reading'))
                return _jsx(LibraryIcon, {});
            if (subject.includes('music'))
                return _jsx(MusicIcon, {});
            if (subject.includes('art'))
                return _jsx(ArtIcon, {});
            if (subject.includes('science'))
                return _jsx(ScienceIcon, {});
            return _jsx(TeacherIcon, {});
        }
        return _jsx(HomeRoomIcon, {});
    };
    // Helper function to get grade level label
    const getGradeLabel = (gradeValue) => {
        if (!gradeValue)
            return 'N/A';
        const grade = GRADE_LEVELS.find(g => g.value === gradeValue);
        return grade ? grade.label : gradeValue;
    };
    // Filter teachers by search and tab
    const filterTeachersByTab = (tabIndex) => {
        let filteredByType = teachers;
        // Filter by tab
        switch (tabIndex) {
            case 0: // All Teachers
                break;
            case 1: // Homeroom Teachers
                filteredByType = teachers.filter(t => !t.is_specialist && t.grade_level);
                break;
            case 2: // Specialist Teachers
                filteredByType = teachers.filter(t => t.is_specialist);
                break;
            case 3: // Unassigned
                filteredByType = teachers.filter(t => !t.is_specialist && !t.grade_level);
                break;
        }
        // Apply search filter
        if (searchQuery) {
            filteredByType = filteredByType.filter(teacher => teacher.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                teacher.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                teacher.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                teacher.specialist_subject?.toLowerCase().includes(searchQuery.toLowerCase()));
        }
        return filteredByType;
    };
    // Get current tab teachers
    const currentTabTeachers = filterTeachersByTab(activeTab);
    // Group teachers by type for counts
    const allTeachers = teachers;
    const homeroomTeachers = teachers.filter(t => !t.is_specialist && t.grade_level);
    const specialistTeachers = teachers.filter(t => t.is_specialist);
    const unassignedTeachers = teachers.filter(t => !t.is_specialist && !t.grade_level);
    if (error) {
        return (_jsx(Container, { maxWidth: "lg", children: _jsx(Paper, { sx: { p: 3 }, className: "card-hover", children: _jsx(Alert, { severity: "error", children: "Failed to load teachers" }) }) }));
    }
    return (_jsxs(Box, { children: [_jsxs(Paper, { sx: {
                    p: 3,
                    mb: 3,
                    background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.02)} 0%, ${alpha(theme.palette.primary.light, 0.05)} 100%)`,
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
                }, children: [_jsxs(Stack, { direction: "row", justifyContent: "space-between", alignItems: "center", sx: { mb: 3 }, children: [_jsxs(Box, { children: [_jsx(Typography, { variant: "h4", component: "h1", sx: { fontWeight: 600, mb: 1 }, children: "Teachers & Staff" }), _jsx(Typography, { variant: "body1", color: "text.secondary", children: "Manage teacher assignments to grades and rooms. Track homeroom and specialist assignments." })] }), _jsxs(Stack, { direction: "row", spacing: 2, children: [dataEnrichmentLoading && (_jsx(Button, { variant: "outlined", startIcon: _jsx(RefreshIcon, {}), disabled: true, size: "large", sx: { borderRadius: 2 }, children: "Loading Room Data..." })), _jsx(Button, { variant: "contained", startIcon: _jsx(AddIcon, {}), onClick: () => setCreateDialogOpen(true), size: "large", sx: {
                                            borderRadius: 2,
                                            px: 3,
                                        }, children: "Add Teacher" })] })] }), _jsx(TextField, { fullWidth: true, placeholder: "Search teachers...", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), InputProps: {
                            startAdornment: (_jsx(InputAdornment, { position: "start", children: _jsx(SearchIcon, { sx: { color: theme.palette.text.secondary } }) })),
                        }, sx: {
                            mb: 3,
                            '& .MuiOutlinedInput-root': {
                                borderRadius: 2,
                            },
                        } }), _jsxs(Tabs, { value: activeTab, onChange: (_, newValue) => setActiveTab(newValue), sx: { borderBottom: 1, borderColor: 'divider' }, children: [_jsx(Tab, { icon: _jsx(TeacherIcon, {}), label: `All (${allTeachers.length})`, sx: { fontWeight: 600 } }), _jsx(Tab, { icon: _jsx(HomeRoomIcon, {}), label: `Homeroom (${homeroomTeachers.length})`, sx: { fontWeight: 600 } }), _jsx(Tab, { icon: _jsx(PEIcon, {}), label: `Specialists (${specialistTeachers.length})`, sx: { fontWeight: 600 } }), _jsx(Tab, { icon: _jsx(RoomIcon, {}), label: `Unassigned (${unassignedTeachers.length})`, sx: { fontWeight: 600 } })] })] }), _jsx(Paper, { sx: { mb: 3 }, children: (isLoading || dataEnrichmentLoading) ? (_jsxs(Box, { sx: { p: 2, textAlign: 'center' }, children: [_jsx(LinearProgress, { sx: { mb: 2 } }), _jsx(Typography, { color: "text.secondary", children: isLoading ? 'Loading teachers...' : 'Enriching teacher data with classroom assignments...' })] })) : (_jsxs(List, { sx: { p: 0 }, children: [currentTabTeachers.map((teacher, index) => (_jsxs(ListItem, { sx: {
                                borderBottom: index < currentTabTeachers.length - 1 ? 1 : 0,
                                borderColor: 'divider',
                                py: 2,
                                px: 3,
                                '&:hover': {
                                    backgroundColor: alpha(theme.palette.primary.main, 0.04),
                                },
                            }, children: [_jsx(ListItemAvatar, { children: _jsx(Avatar, { sx: {
                                            bgcolor: teacher.is_specialist
                                                ? theme.palette.secondary.main
                                                : theme.palette.primary.main,
                                            width: 48,
                                            height: 48,
                                        }, children: getTeacherIcon(teacher) }) }), _jsx(ListItemText, { primary: _jsxs(Stack, { direction: "row", alignItems: "center", spacing: 2, children: [_jsxs(Typography, { variant: "h6", sx: { fontWeight: 600 }, children: [teacher.first_name, " ", teacher.last_name] }), teacher.email && (_jsx(Typography, { variant: "body2", color: "text.secondary", children: teacher.email })), teacher.is_specialist && (_jsx(Chip, { label: `Specialist: ${getTeacherSubjectDisplay(teacher).replace('Grade ', '')}`, size: "small", color: "secondary", sx: { fontSize: '0.7rem' } })), dataEnrichmentLoading && (_jsx(Chip, { label: "Loading room data...", size: "small", color: "info", sx: { fontSize: '0.7rem' } })), !teacher.is_active && (_jsx(Chip, { label: "Inactive", size: "small", color: "error", sx: { fontSize: '0.7rem' } }))] }), secondary: _jsxs(Stack, { direction: "row", spacing: 3, sx: { mt: 1 }, children: [_jsxs(Typography, { variant: "body2", color: "text.secondary", children: [_jsx("strong", { children: "Grade:" }), " ", getGradeLabel(teacher.grade_level)] }), _jsxs(Typography, { variant: "body2", color: "text.secondary", children: [_jsx("strong", { children: "Room:" }), " ", getTeacherRoomDisplay(teacher)] }), _jsxs(Stack, { direction: "row", alignItems: "center", spacing: 1, children: [_jsx(StudentsIcon, { sx: { fontSize: 16 } }), _jsxs(Typography, { variant: "body2", color: "text.secondary", children: [_jsx("strong", { children: dataEnrichmentLoading ? '...' : (teacher.student_count || 0) }), " students"] })] })] }) }), _jsx(ListItemSecondaryAction, { children: _jsxs(Stack, { direction: "row", spacing: 1, children: [_jsx(Tooltip, { title: "Edit Teacher", children: _jsx(IconButton, { onClick: () => {
                                                        setSelectedTeacher(teacher);
                                                        setEditDialogOpen(true);
                                                    }, size: "small", sx: {
                                                        color: theme.palette.primary.main,
                                                        '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.1) }
                                                    }, children: _jsx(EditIcon, { fontSize: "small" }) }) }), _jsx(Tooltip, { title: "Delete Teacher", children: _jsx(IconButton, { onClick: () => {
                                                        setSelectedTeacher(teacher);
                                                        setDeleteConfirmOpen(true);
                                                    }, size: "small", sx: {
                                                        color: theme.palette.error.main,
                                                        '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.1) }
                                                    }, children: _jsx(DeleteIcon, { fontSize: "small" }) }) })] }) })] }, teacher.id))), currentTabTeachers.length === 0 && (_jsxs(Box, { sx: { p: 6, textAlign: 'center' }, children: [_jsx(Typography, { variant: "h6", color: "text.secondary", gutterBottom: true, children: "No teachers found" }), _jsx(Typography, { variant: "body2", color: "text.secondary", children: searchQuery
                                        ? `No teachers match "${searchQuery}"`
                                        : 'No teachers in this category yet' })] }))] })) }), _jsx(TeacherFormDialog, { open: createDialogOpen, onClose: () => setCreateDialogOpen(false), onSubmit: handleCreate }), _jsx(TeacherFormDialog, { open: editDialogOpen, initial: selectedTeacher || undefined, onClose: () => {
                    setEditDialogOpen(false);
                    setSelectedTeacher(null);
                }, onSubmit: handleUpdate }), _jsxs(Dialog, { open: deleteConfirmOpen, onClose: () => setDeleteConfirmOpen(false), children: [_jsx(DialogTitle, { children: "Confirm Delete" }), _jsx(DialogContent, { children: _jsxs(Typography, { children: ["Are you sure you want to delete teacher \"", selectedTeacher?.first_name, " ", selectedTeacher?.last_name, "\"? This may affect existing student assignments."] }) }), _jsxs(DialogActions, { children: [_jsx(Button, { onClick: () => setDeleteConfirmOpen(false), children: "Cancel" }), _jsx(Button, { onClick: handleDelete, color: "error", variant: "contained", disabled: deleteMutation.isPending, children: deleteMutation.isPending ? 'Deleting...' : 'Delete' })] })] })] }));
}
