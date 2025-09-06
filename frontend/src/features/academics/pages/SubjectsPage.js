import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// src/features/academics/pages/SubjectsPage.tsx
import { useState } from 'react';
import { Paper, Box, Button, IconButton, Typography, Chip, Stack, Dialog, DialogTitle, DialogContent, DialogActions, Alert, Tooltip, } from '@mui/material';
import { DataGrid, GridToolbar, } from '@mui/x-data-grid';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, } from '@mui/icons-material';
import { useAuth } from '@/auth/AuthContext';
import { useSubjects, useCreateSubject, useUpdateSubject, useDeleteSubject, } from '@/features/academics/hooks/useSubjects';
import SubjectFormDialog from '@/features/academics/components/SubjectFormDialog';
export default function SubjectsPage() {
    const { activeSchool } = useAuth();
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [selectedSubject, setSelectedSubject] = useState(null);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
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
    // DataGrid columns
    const columns = [
        {
            field: 'name',
            headerName: 'Name',
            width: 200,
            renderCell: (params) => params.value || '-',
        },
        {
            field: 'code',
            headerName: 'Code',
            width: 120,
            renderCell: (params) => params.value || '-',
        },
        {
            field: 'subject_type',
            headerName: 'Type',
            width: 120,
            renderCell: (params) => (_jsx(Chip, { label: params.value || 'CORE', size: "small", color: params.value === 'CORE' ? 'primary' : params.value === 'ENRICHMENT' ? 'secondary' : 'default' })),
        },
        {
            field: 'applies_to_elementary',
            headerName: 'Elementary',
            width: 100,
            renderCell: (params) => (_jsx(Chip, { label: params.value ? 'Yes' : 'No', size: "small", color: params.value ? 'success' : 'default' })),
        },
        {
            field: 'applies_to_middle',
            headerName: 'Middle School',
            width: 120,
            renderCell: (params) => (_jsx(Chip, { label: params.value ? 'Yes' : 'No', size: "small", color: params.value ? 'success' : 'default' })),
        },
        {
            field: 'requires_specialist',
            headerName: 'Specialist',
            width: 100,
            renderCell: (params) => (_jsx(Chip, { label: params.value ? 'Required' : 'No', size: "small", color: params.value ? 'warning' : 'default' })),
        },
        {
            field: 'actions',
            headerName: 'Actions',
            width: 120,
            renderCell: (params) => (_jsxs(Stack, { direction: "row", spacing: 1, children: [_jsx(Tooltip, { title: "Edit", children: _jsx(IconButton, { size: "small", onClick: () => {
                                setSelectedSubject(params.row);
                                setEditDialogOpen(true);
                            }, children: _jsx(EditIcon, {}) }) }), _jsx(Tooltip, { title: "Delete", children: _jsx(IconButton, { size: "small", color: "error", onClick: () => {
                                setSelectedSubject(params.row);
                                setDeleteConfirmOpen(true);
                            }, children: _jsx(DeleteIcon, {}) }) })] })),
        },
    ];
    if (error) {
        return (_jsx(Paper, { sx: { p: 3 }, children: _jsx(Alert, { severity: "error", children: "Failed to load subjects" }) }));
    }
    return (_jsxs(Box, { children: [_jsx(Paper, { sx: { p: 2, mb: 2 }, children: _jsxs(Stack, { direction: "row", justifyContent: "space-between", alignItems: "center", children: [_jsx(Typography, { variant: "h5", children: "Subjects" }), _jsx(Button, { variant: "contained", startIcon: _jsx(AddIcon, {}), onClick: () => setCreateDialogOpen(true), children: "Add Subject" })] }) }), _jsx(Paper, { sx: { height: 600 }, children: _jsx(DataGrid, { rows: subjects, columns: columns, loading: isLoading, pageSizeOptions: [10, 25, 50], initialState: {
                        pagination: { paginationModel: { pageSize: 10 } },
                    }, slots: {
                        toolbar: GridToolbar,
                    }, slotProps: {
                        toolbar: {
                            showQuickFilter: true,
                            quickFilterProps: { debounceMs: 500 },
                        },
                    } }) }), _jsx(SubjectFormDialog, { open: createDialogOpen, onClose: () => setCreateDialogOpen(false), onSubmit: handleCreate }), _jsx(SubjectFormDialog, { open: editDialogOpen, initial: selectedSubject, onClose: () => {
                    setEditDialogOpen(false);
                    setSelectedSubject(null);
                }, onSubmit: handleUpdate }), _jsxs(Dialog, { open: deleteConfirmOpen, onClose: () => setDeleteConfirmOpen(false), children: [_jsx(DialogTitle, { children: "Confirm Delete" }), _jsx(DialogContent, { children: _jsxs(Typography, { children: ["Are you sure you want to delete subject \"", selectedSubject?.name, "\"? This may affect existing classrooms that use this subject."] }) }), _jsxs(DialogActions, { children: [_jsx(Button, { onClick: () => setDeleteConfirmOpen(false), children: "Cancel" }), _jsx(Button, { onClick: handleDelete, color: "error", variant: "contained", disabled: deleteMutation.isPending, children: deleteMutation.isPending ? 'Deleting...' : 'Delete' })] })] })] }));
}
