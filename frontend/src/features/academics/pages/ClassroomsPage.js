import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// src/features/academics/pages/ClassroomsPage.tsx
import { useState } from 'react';
import { Paper, Box, Button, IconButton, Typography, Chip, Stack, Dialog, DialogTitle, DialogContent, DialogActions, Alert, Tooltip, } from '@mui/material';
import { DataGrid, GridToolbar, } from '@mui/x-data-grid';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, School as SchoolIcon, } from '@mui/icons-material';
import { useAuth } from '@/auth/AuthContext';
import { useClassrooms, useCreateClassroom, useUpdateClassroom, useDeleteClassroom, } from '@/features/academics/hooks/useClassrooms';
import { useSubjects } from '@/features/academics/hooks/useSubjects';
import { useYears } from '@/features/academics/hooks/useYears';
import { useRooms } from '@/features/facilities/hooks/useRooms';
import { GRADE_LEVELS } from '@/schemas/academics';
export default function ClassroomsPage() {
    const { activeSchool } = useAuth();
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [selectedClassroom, setSelectedClassroom] = useState(null);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const schoolId = activeSchool?.id;
    // Get academic years and find active one
    const { data: academicYears = [] } = useYears();
    const activeYear = academicYears.find(y => {
        const isActive = y.is_active;
        return isActive === true || String(isActive) === 'true' || String(isActive) === 't';
    });
    // Queries - filter by active academic year
    const classroomsQuery = useClassrooms(activeYear?.id ? { academic_year_id: activeYear.id } : {});
    const { data: classrooms = [], isLoading, error } = classroomsQuery;
    console.log('Classrooms data:', { classrooms, activeYear, isLoading, error });
    const { data: subjects = [] } = useSubjects();
    const { data: rooms = [] } = useRooms();
    // Mutations
    const createMutation = useCreateClassroom();
    const updateMutation = useUpdateClassroom(selectedClassroom?.id || '');
    const deleteMutation = useDeleteClassroom();
    // Handle create - placeholder for now
    const handleCreate = async (data) => {
        try {
            console.log('Create classroom:', data);
            // Will implement form dialog later
        }
        catch (error) {
            console.error('Failed to create classroom:', error);
        }
    };
    // Handle update - placeholder for now
    const handleUpdate = async (data) => {
        if (!selectedClassroom)
            return;
        try {
            await updateMutation.mutateAsync(data);
            setEditDialogOpen(false);
            setSelectedClassroom(null);
        }
        catch (error) {
            console.error('Failed to update classroom:', error);
        }
    };
    // Handle delete
    const handleDelete = async () => {
        if (!selectedClassroom)
            return;
        try {
            await deleteMutation.mutateAsync(selectedClassroom.id);
            setDeleteConfirmOpen(false);
            setSelectedClassroom(null);
        }
        catch (error) {
            console.error('Failed to delete classroom:', error);
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
            field: 'grade_level',
            headerName: 'Grade',
            width: 100,
            renderCell: (params) => {
                const grade = GRADE_LEVELS.find(g => g.value === params.value);
                return grade ? grade.label : params.value;
            },
        },
        {
            field: 'subject',
            headerName: 'Subject',
            width: 150,
            renderCell: (params) => params.row.subject?.name || '-',
        },
        {
            field: 'room',
            headerName: 'Room',
            width: 120,
            renderCell: (params) => params.row.room?.name || '-',
        },
        {
            field: 'classroom_type',
            headerName: 'Type',
            width: 100,
            renderCell: (params) => (_jsx(Chip, { label: params.value || 'CORE', size: "small", color: params.value === 'CORE' ? 'primary' : params.value === 'ENRICHMENT' ? 'secondary' : 'default' })),
        },
        {
            field: 'max_students',
            headerName: 'Max Students',
            width: 110,
            renderCell: (params) => params.value || '-',
        },
        {
            field: 'enrollment_count',
            headerName: 'Enrolled',
            width: 100,
            renderCell: (params) => params.value || 0,
        },
        {
            field: 'actions',
            headerName: 'Actions',
            width: 120,
            renderCell: (params) => (_jsxs(Stack, { direction: "row", spacing: 1, children: [_jsx(Tooltip, { title: "Edit", children: _jsx(IconButton, { size: "small", onClick: () => {
                                setSelectedClassroom(params.row);
                                setEditDialogOpen(true);
                            }, children: _jsx(EditIcon, {}) }) }), _jsx(Tooltip, { title: "Delete", children: _jsx(IconButton, { size: "small", color: "error", onClick: () => {
                                setSelectedClassroom(params.row);
                                setDeleteConfirmOpen(true);
                            }, children: _jsx(DeleteIcon, {}) }) })] })),
        },
    ];
    if (error) {
        return (_jsx(Paper, { sx: { p: 3 }, children: _jsx(Alert, { severity: "error", children: "Failed to load classrooms" }) }));
    }
    return (_jsxs(Box, { children: [_jsxs(Paper, { sx: { p: 2, mb: 2 }, children: [_jsxs(Stack, { direction: "row", justifyContent: "space-between", alignItems: "center", children: [_jsxs(Box, { children: [_jsx(Typography, { variant: "h5", children: "Classrooms" }), activeYear && (_jsxs(Typography, { variant: "body2", color: "text.secondary", sx: { mt: 0.5 }, children: ["Academic Year: ", activeYear.name] }))] }), _jsx(Button, { variant: "contained", startIcon: _jsx(AddIcon, {}), onClick: () => setCreateDialogOpen(true), disabled: !activeYear, children: "Add Classroom" })] }), !activeYear && (_jsx(Alert, { severity: "warning", sx: { mt: 2 }, children: _jsxs(Stack, { direction: "row", alignItems: "center", spacing: 1, children: [_jsx(SchoolIcon, {}), _jsxs(Box, { children: [_jsx(Typography, { variant: "subtitle2", children: "No Active Academic Year" }), _jsx(Typography, { variant: "body2", children: "Please set an active academic year to manage classrooms." })] })] }) }))] }), _jsx(Paper, { sx: { height: 600 }, children: _jsx(DataGrid, { rows: classrooms || [], columns: columns, loading: isLoading, pageSizeOptions: [10, 25, 50], initialState: {
                        pagination: { paginationModel: { pageSize: 10 } },
                    }, slots: {
                        toolbar: GridToolbar,
                    }, slotProps: {
                        toolbar: {
                            showQuickFilter: true,
                            quickFilterProps: { debounceMs: 500 },
                        },
                    }, getRowId: (row) => row.id }) }), _jsxs(Dialog, { open: createDialogOpen, onClose: () => setCreateDialogOpen(false), children: [_jsx(DialogTitle, { children: "Add Classroom" }), _jsx(DialogContent, { children: _jsx(Typography, { children: "Form implementation coming next..." }) }), _jsx(DialogActions, { children: _jsx(Button, { onClick: () => setCreateDialogOpen(false), children: "Cancel" }) })] }), _jsxs(Dialog, { open: editDialogOpen, onClose: () => setEditDialogOpen(false), children: [_jsx(DialogTitle, { children: "Edit Classroom" }), _jsx(DialogContent, { children: _jsx(Typography, { children: "Edit form implementation coming next..." }) }), _jsx(DialogActions, { children: _jsx(Button, { onClick: () => setEditDialogOpen(false), children: "Cancel" }) })] }), _jsxs(Dialog, { open: deleteConfirmOpen, onClose: () => setDeleteConfirmOpen(false), children: [_jsx(DialogTitle, { children: "Confirm Delete" }), _jsx(DialogContent, { children: _jsxs(Typography, { children: ["Are you sure you want to delete classroom \"", selectedClassroom?.name, "\"? This will also remove all student enrollments in this classroom."] }) }), _jsxs(DialogActions, { children: [_jsx(Button, { onClick: () => setDeleteConfirmOpen(false), children: "Cancel" }), _jsx(Button, { onClick: handleDelete, color: "error", variant: "contained", disabled: deleteMutation.isPending, children: deleteMutation.isPending ? 'Deleting...' : 'Delete' })] })] })] }));
}
