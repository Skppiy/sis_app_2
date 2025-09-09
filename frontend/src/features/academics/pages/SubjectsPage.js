import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// src/features/academics/pages/SubjectsPage.tsx
import { useState } from 'react';
import { Paper, Box, Container, Button, IconButton, Typography, Chip, Stack, Dialog, DialogTitle, DialogContent, DialogActions, Alert, Tooltip, Tabs, Tab, List, ListItem, ListItemText, ListItemAvatar, ListItemSecondaryAction, Avatar, } from '@mui/material';
import { TextField, InputAdornment, alpha, useTheme, } from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Search as SearchIcon, Science as ScienceIcon, Calculate as MathIcon, Language as LanguageIcon, SportsBasketball as PEIcon, LibraryBooks as LibraryIcon, School as CoreIcon, Palette as EnrichmentIcon, Extension as SpecialIcon, } from '@mui/icons-material';
import { useAuth } from '@/auth/AuthContext';
import { useSubjects, useCreateSubject, useUpdateSubject, useDeleteSubject, } from '@/features/academics/hooks/useSubjects';
import SubjectFormDialog from '@/features/academics/components/SubjectFormDialog';
export default function SubjectsPage() {
    const { activeSchool } = useAuth();
    const theme = useTheme();
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [selectedSubject, setSelectedSubject] = useState(null);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    // Tab and search state
    const [activeTab, setActiveTab] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const schoolId = activeSchool?.id;
    // Queries
    const { data: subjects = [], isLoading, error } = useSubjects({
        school_id: schoolId
    });
    // Mutations
    const createMutation = useCreateSubject();
    const updateMutation = useUpdateSubject(selectedSubject?.id || '');
    const deleteMutation = useDeleteSubject();
    // Handle create
    const handleCreate = async (data) => {
        try {
            await createMutation.mutateAsync(data);
            setCreateDialogOpen(false);
        }
        catch (error) {
            console.error('Failed to create subject:', error);
        }
    };
    // Handle update
    const handleUpdate = async (data) => {
        if (!selectedSubject)
            return;
        try {
            await updateMutation.mutateAsync(data);
            setEditDialogOpen(false);
            setSelectedSubject(null);
        }
        catch (error) {
            console.error('Failed to update subject:', error);
        }
    };
    // Handle delete
    const handleDelete = async () => {
        if (!selectedSubject)
            return;
        try {
            await deleteMutation.mutateAsync(selectedSubject.id);
            setDeleteConfirmOpen(false);
            setSelectedSubject(null);
        }
        catch (error) {
            console.error('Failed to delete subject:', error);
        }
    };
    // Helper function to get subject icon
    const getSubjectIcon = (subject) => {
        const name = subject.name.toLowerCase();
        if (name.includes('math'))
            return _jsx(MathIcon, {});
        if (name.includes('science') || name.includes('physics') || name.includes('chemistry'))
            return _jsx(ScienceIcon, {});
        if (name.includes('english') || name.includes('language') || name.includes('writing'))
            return _jsx(LanguageIcon, {});
        if (name.includes('gym') || name.includes('pe') || name.includes('physical'))
            return _jsx(PEIcon, {});
        if (name.includes('library') || name.includes('reading'))
            return _jsx(LibraryIcon, {});
        if (subject.subject_type === 'CORE')
            return _jsx(CoreIcon, {});
        if (subject.subject_type === 'ENRICHMENT')
            return _jsx(EnrichmentIcon, {});
        return _jsx(SpecialIcon, {});
    };
    // Helper function to get grade level display
    const getGradeLevels = (subject) => {
        const levels = [];
        if (subject.applies_to_elementary)
            levels.push('Elementary');
        if (subject.applies_to_middle)
            levels.push('Middle');
        if (subject.applies_to_high)
            levels.push('High School');
        return levels.join(', ');
    };
    // Filter subjects by search and tab
    const filterSubjectsByTab = (tabIndex) => {
        let filteredByType = subjects;
        // Filter by tab
        switch (tabIndex) {
            case 0: // Core
                filteredByType = subjects.filter(s => s.subject_type === 'CORE');
                break;
            case 1: // Enrichment
                filteredByType = subjects.filter(s => s.subject_type === 'ENRICHMENT');
                break;
            case 2: // Special Services
                filteredByType = subjects.filter(s => s.subject_type !== 'CORE' && s.subject_type !== 'ENRICHMENT');
                break;
        }
        // Apply search filter
        if (searchQuery) {
            filteredByType = filteredByType.filter(subject => subject.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                subject.code?.toLowerCase().includes(searchQuery.toLowerCase()));
        }
        return filteredByType;
    };
    // Get current tab subjects
    const currentTabSubjects = filterSubjectsByTab(activeTab);
    // Group subjects by type for counts
    const coreSubjects = subjects.filter(s => s.subject_type === 'CORE');
    const enrichmentSubjects = subjects.filter(s => s.subject_type === 'ENRICHMENT');
    const specialSubjects = subjects.filter(s => s.subject_type !== 'CORE' && s.subject_type !== 'ENRICHMENT');
    if (error) {
        return (_jsx(Container, { maxWidth: "lg", children: _jsx(Paper, { sx: { p: 3 }, className: "card-hover", children: _jsx(Alert, { severity: "error", children: "Failed to load subjects" }) }) }));
    }
    return (_jsxs(Box, { children: [_jsxs(Paper, { sx: {
                    p: 3,
                    mb: 3,
                    background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.02)} 0%, ${alpha(theme.palette.primary.light, 0.05)} 100%)`,
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
                }, children: [_jsxs(Stack, { direction: "row", justifyContent: "space-between", alignItems: "center", sx: { mb: 3 }, children: [_jsxs(Box, { children: [_jsx(Typography, { variant: "h4", component: "h1", sx: { fontWeight: 600, mb: 1 }, children: "Academic Subjects" }), _jsx(Typography, { variant: "body1", color: "text.secondary", children: "Manage academic structure: years, subjects, and classrooms. All changes are immediately saved." })] }), _jsx(Button, { variant: "contained", startIcon: _jsx(AddIcon, {}), onClick: () => setCreateDialogOpen(true), size: "large", sx: {
                                    borderRadius: 2,
                                    px: 3,
                                }, children: "Add Subject" })] }), _jsx(TextField, { fullWidth: true, placeholder: "Search subjects...", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), InputProps: {
                            startAdornment: (_jsx(InputAdornment, { position: "start", children: _jsx(SearchIcon, { sx: { color: theme.palette.text.secondary } }) })),
                        }, sx: {
                            mb: 3,
                            '& .MuiOutlinedInput-root': {
                                borderRadius: 2,
                            },
                        } }), _jsxs(Tabs, { value: activeTab, onChange: (_, newValue) => setActiveTab(newValue), sx: { borderBottom: 1, borderColor: 'divider' }, children: [_jsx(Tab, { icon: _jsx(CoreIcon, {}), label: `Core (${coreSubjects.length})`, sx: { fontWeight: 600 } }), _jsx(Tab, { icon: _jsx(EnrichmentIcon, {}), label: `Enrichment (${enrichmentSubjects.length})`, sx: { fontWeight: 600 } }), _jsx(Tab, { icon: _jsx(SpecialIcon, {}), label: `Special Services (${specialSubjects.length})`, sx: { fontWeight: 600 } })] })] }), _jsx(Paper, { sx: { mb: 3 }, children: isLoading ? (_jsx(Box, { sx: { p: 2 }, children: _jsx(Typography, { children: "Loading subjects..." }) })) : (_jsxs(List, { sx: { p: 0 }, children: [currentTabSubjects.map((subject, index) => (_jsxs(ListItem, { sx: {
                                borderBottom: index < currentTabSubjects.length - 1 ? 1 : 0,
                                borderColor: 'divider',
                                py: 2,
                                px: 3,
                                '&:hover': {
                                    backgroundColor: alpha(theme.palette.primary.main, 0.04),
                                },
                            }, children: [_jsx(ListItemAvatar, { children: _jsx(Avatar, { sx: {
                                            bgcolor: subject.subject_type === 'CORE'
                                                ? theme.palette.primary.main
                                                : subject.subject_type === 'ENRICHMENT'
                                                    ? theme.palette.secondary.main
                                                    : theme.palette.success.main,
                                            width: 48,
                                            height: 48,
                                        }, children: getSubjectIcon(subject) }) }), _jsx(ListItemText, { primary: _jsxs(Stack, { direction: "row", alignItems: "center", spacing: 2, children: [_jsx(Typography, { variant: "h6", sx: { fontWeight: 600 }, children: subject.name }), _jsxs(Typography, { variant: "body2", color: "text.secondary", children: ["Code: ", subject.code || 'N/A'] }), subject.requires_specialist && (_jsx(Chip, { label: "Requires Specialist", size: "small", color: "warning", sx: { fontSize: '0.7rem' } })), subject.is_homeroom_default && (_jsx(Chip, { label: "Homeroom", size: "small", color: "info", sx: { fontSize: '0.7rem' } }))] }), secondary: _jsxs(Stack, { direction: "row", spacing: 3, sx: { mt: 1 }, children: [_jsxs(Typography, { variant: "body2", color: "text.secondary", children: [_jsx("strong", { children: "Grades:" }), " ", getGradeLevels(subject)] }), _jsxs(Typography, { variant: "body2", color: "text.secondary", children: [_jsx("strong", { children: "Specialist:" }), " ", subject.requires_specialist ? 'Required' : 'No'] }), _jsxs(Typography, { variant: "body2", color: "text.secondary", children: [_jsx("strong", { children: "Cross-Grade:" }), " ", subject.allows_cross_grade ? 'Yes' : 'No'] })] }) }), _jsx(ListItemSecondaryAction, { children: _jsxs(Stack, { direction: "row", spacing: 1, children: [_jsx(Tooltip, { title: "Edit Subject", children: _jsx(IconButton, { onClick: () => {
                                                        setSelectedSubject(subject);
                                                        setEditDialogOpen(true);
                                                    }, size: "small", sx: {
                                                        color: theme.palette.primary.main,
                                                        '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.1) }
                                                    }, children: _jsx(EditIcon, { fontSize: "small" }) }) }), _jsx(Tooltip, { title: "Delete Subject", children: _jsx(IconButton, { onClick: () => {
                                                        setSelectedSubject(subject);
                                                        setDeleteConfirmOpen(true);
                                                    }, size: "small", sx: {
                                                        color: theme.palette.error.main,
                                                        '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.1) }
                                                    }, children: _jsx(DeleteIcon, { fontSize: "small" }) }) })] }) })] }, subject.id))), currentTabSubjects.length === 0 && (_jsxs(Box, { sx: { p: 6, textAlign: 'center' }, children: [_jsx(Typography, { variant: "h6", color: "text.secondary", gutterBottom: true, children: "No subjects found" }), _jsx(Typography, { variant: "body2", color: "text.secondary", children: searchQuery
                                        ? `No subjects match "${searchQuery}"`
                                        : 'No subjects in this category yet' })] }))] })) }), _jsx(SubjectFormDialog, { open: createDialogOpen, onClose: () => setCreateDialogOpen(false), onSubmit: handleCreate }), _jsx(SubjectFormDialog, { open: editDialogOpen, initial: selectedSubject || undefined, onClose: () => {
                    setEditDialogOpen(false);
                    setSelectedSubject(null);
                }, onSubmit: handleUpdate }), _jsxs(Dialog, { open: deleteConfirmOpen, onClose: () => setDeleteConfirmOpen(false), children: [_jsx(DialogTitle, { children: "Confirm Delete" }), _jsx(DialogContent, { children: _jsxs(Typography, { children: ["Are you sure you want to delete subject \"", selectedSubject?.name, "\"? This may affect existing classrooms that use this subject."] }) }), _jsxs(DialogActions, { children: [_jsx(Button, { onClick: () => setDeleteConfirmOpen(false), children: "Cancel" }), _jsx(Button, { onClick: handleDelete, color: "error", variant: "contained", disabled: deleteMutation.isPending, children: deleteMutation.isPending ? 'Deleting...' : 'Delete' })] })] })] }));
}
