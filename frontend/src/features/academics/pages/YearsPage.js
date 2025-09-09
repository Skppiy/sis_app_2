import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import * as React from 'react';
import { Box, Button, Stack, Typography, Paper, Grid, TextField, InputAdornment, FormControl, InputLabel, Select, MenuItem, Chip, alpha, useTheme, Dialog, DialogTitle, DialogContent, DialogActions, } from '@mui/material';
import { Add as AddIcon, Search as SearchIcon, FilterList as FilterIcon, CalendarToday as CalendarIcon, } from '@mui/icons-material';
import { useYears, useCreateYear, useUpdateYear, useDeleteYear } from '../hooks/useYears';
import YearFormDialog from '../components/YearFormDialog';
import { AcademicYearCard } from '@/components/academic-years';
export default function YearsPage() {
    const theme = useTheme();
    const [open, setOpen] = React.useState(false);
    const [editing, setEditing] = React.useState(null);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState(false);
    const [yearToDelete, setYearToDelete] = React.useState(null);
    // Filter and search state
    const [searchQuery, setSearchQuery] = React.useState('');
    const [statusFilter, setStatusFilter] = React.useState('');
    const yearsQuery = useYears();
    const createMutation = useCreateYear();
    const updateMutation = useUpdateYear(editing?.id || '');
    const deleteMutation = useDeleteYear();
    const years = yearsQuery.data ?? [];
    // Filter and search logic
    const filteredYears = years.filter(year => {
        // Search filter
        const searchMatch = searchQuery === '' ||
            year.name.toLowerCase().includes(searchQuery.toLowerCase());
        // Status filter
        const statusMatch = statusFilter === '' ||
            (statusFilter === 'active' && year.is_active) ||
            (statusFilter === 'inactive' && !year.is_active);
        return searchMatch && statusMatch;
    });
    // Sort years: active first, then by start date
    const sortedYears = [...filteredYears].sort((a, b) => {
        if (a.is_active !== b.is_active) {
            return a.is_active ? -1 : 1; // Active years first
        }
        return new Date(b.start_date).getTime() - new Date(a.start_date).getTime(); // Most recent first
    });
    // Get statistics
    const activeCount = years.filter(y => y.is_active).length;
    const totalCount = years.length;
    const handleEdit = (year) => {
        setEditing(year);
        setOpen(true);
    };
    const handleDelete = (year) => {
        setYearToDelete(year);
        setDeleteConfirmOpen(true);
    };
    const confirmDelete = async () => {
        if (!yearToDelete)
            return;
        try {
            await deleteMutation.mutateAsync(yearToDelete.id);
            setDeleteConfirmOpen(false);
            setYearToDelete(null);
        }
        catch (error) {
            console.error('Failed to delete academic year:', error);
        }
    };
    return (_jsxs(Box, { children: [_jsxs(Paper, { sx: {
                    p: 3,
                    mb: 3,
                    background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.02)} 0%, ${alpha(theme.palette.primary.light, 0.05)} 100%)`,
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
                }, children: [_jsxs(Stack, { direction: "row", justifyContent: "space-between", alignItems: "center", sx: { mb: 3 }, children: [_jsxs(Box, { children: [_jsx(Typography, { variant: "h4", component: "h1", sx: { fontWeight: 600, mb: 1 }, children: "Academic Years" }), _jsx(Typography, { variant: "body1", color: "text.secondary", children: "Manage academic calendar periods and enrollment cycles" })] }), _jsx(Button, { variant: "contained", startIcon: _jsx(AddIcon, {}), onClick: () => {
                                    setEditing(null);
                                    setOpen(true);
                                }, size: "large", sx: {
                                    borderRadius: 2,
                                    px: 3,
                                }, children: "Add Academic Year" })] }), _jsxs(Grid, { container: true, spacing: 3, alignItems: "center", children: [_jsx(Grid, { size: { xs: 12, md: 6 }, children: _jsx(TextField, { fullWidth: true, placeholder: "Search academic years...", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), InputProps: {
                                        startAdornment: (_jsx(InputAdornment, { position: "start", children: _jsx(SearchIcon, { sx: { color: theme.palette.text.secondary } }) })),
                                    }, sx: {
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: 2,
                                        },
                                    } }) }), _jsx(Grid, { size: { xs: 12, md: 6 }, children: _jsxs(FormControl, { fullWidth: true, children: [_jsx(InputLabel, { children: "Status Filter" }), _jsxs(Select, { value: statusFilter, label: "Status Filter", onChange: (e) => setStatusFilter(e.target.value), startAdornment: _jsx(InputAdornment, { position: "start", children: _jsx(FilterIcon, { sx: { color: theme.palette.text.secondary, mr: 1 } }) }), sx: { borderRadius: 2 }, children: [_jsx(MenuItem, { value: "", children: "All Status" }), _jsx(MenuItem, { value: "active", children: "Active" }), _jsx(MenuItem, { value: "inactive", children: "Inactive" })] })] }) })] }), _jsxs(Stack, { direction: "row", justifyContent: "space-between", alignItems: "center", sx: { mt: 2 }, children: [_jsxs(Typography, { variant: "body2", color: "text.secondary", children: ["Showing ", sortedYears.length, " of ", totalCount, " academic years", searchQuery && ` matching "${searchQuery}"`] }), _jsxs(Stack, { direction: "row", spacing: 1, children: [_jsx(Chip, { label: `${activeCount} Active`, size: "small", color: "success", variant: "outlined" }), _jsx(Chip, { label: `${totalCount - activeCount} Inactive`, size: "small", color: "default", variant: "outlined" })] })] })] }), _jsx(Box, { children: yearsQuery.isLoading ? (_jsx(Grid, { container: true, spacing: 3, children: Array.from({ length: 4 }).map((_, index) => (_jsx(Grid, { size: { xs: 12, sm: 6, md: 4, lg: 3 }, children: _jsx(Paper, { sx: { p: 3, height: 320 }, children: _jsxs(Stack, { spacing: 2, children: [_jsxs(Stack, { direction: "row", spacing: 2, children: [_jsx(Box, { sx: { width: 56, height: 56, bgcolor: 'grey.200', borderRadius: 2 } }), _jsxs(Box, { sx: { flex: 1 }, children: [_jsx(Box, { sx: { width: '70%', height: 20, bgcolor: 'grey.200', borderRadius: 1, mb: 1 } }), _jsx(Box, { sx: { width: '40%', height: 16, bgcolor: 'grey.200', borderRadius: 1 } })] })] }), _jsx(Box, { sx: { width: '100%', height: 8, bgcolor: 'grey.200', borderRadius: 1 } }), _jsx(Box, { sx: { width: '80%', height: 16, bgcolor: 'grey.200', borderRadius: 1 } }), _jsx(Box, { sx: { width: '60%', height: 16, bgcolor: 'grey.200', borderRadius: 1 } })] }) }) }, index))) })) : (_jsxs(_Fragment, { children: [_jsx(Grid, { container: true, spacing: 3, children: sortedYears.map(year => (_jsx(Grid, { size: { xs: 12, sm: 6, md: 4, lg: 3 }, children: _jsx(AcademicYearCard, { academicYear: year, onEdit: handleEdit, onDelete: handleDelete, 
                                    // Mock stats - these would come from backend queries
                                    studentCount: Math.floor(Math.random() * 500) + 100, classroomCount: Math.floor(Math.random() * 50) + 10, enrollmentCount: Math.floor(Math.random() * 800) + 200 }) }, year.id))) }), sortedYears.length === 0 && !yearsQuery.isLoading && (_jsxs(Paper, { sx: {
                                p: 6,
                                textAlign: 'center',
                                background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.02)} 0%, ${alpha(theme.palette.primary.light, 0.05)} 100%)`,
                            }, children: [_jsx(CalendarIcon, { sx: { fontSize: 64, color: 'text.secondary', mb: 2 } }), _jsx(Typography, { variant: "h6", color: "text.secondary", gutterBottom: true, children: "No Academic Years Found" }), _jsx(Typography, { variant: "body2", color: "text.secondary", sx: { mb: 2 }, children: searchQuery || statusFilter
                                        ? 'Try adjusting your search or filter criteria'
                                        : 'No academic years have been created yet' }), !searchQuery && !statusFilter && (_jsx(Button, { variant: "contained", startIcon: _jsx(AddIcon, {}), onClick: () => {
                                        setEditing(null);
                                        setOpen(true);
                                    }, children: "Create First Academic Year" }))] }))] })) }), _jsx(YearFormDialog, { open: open, initial: editing ?? undefined, onClose: () => {
                    setOpen(false);
                    setEditing(null);
                }, onSubmit: async (values) => {
                    if (editing) {
                        await updateMutation.mutateAsync(values);
                    }
                    else {
                        await createMutation.mutateAsync(values);
                    }
                    setOpen(false);
                    setEditing(null);
                } }), _jsxs(Dialog, { open: deleteConfirmOpen, onClose: () => setDeleteConfirmOpen(false), children: [_jsx(DialogTitle, { children: "Confirm Delete" }), _jsx(DialogContent, { children: _jsxs(Typography, { children: ["Are you sure you want to delete academic year \"", yearToDelete?.name, "\"? This action cannot be undone and may affect associated classrooms and enrollments."] }) }), _jsxs(DialogActions, { children: [_jsx(Button, { onClick: () => setDeleteConfirmOpen(false), children: "Cancel" }), _jsx(Button, { onClick: confirmDelete, color: "error", variant: "contained", disabled: deleteMutation.isPending, children: deleteMutation.isPending ? 'Deleting...' : 'Delete' })] })] })] }));
}
