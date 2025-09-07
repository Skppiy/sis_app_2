import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// src/features/facilities/pages/RoomsPage.tsx
import React from 'react';
import { Paper, Typography, Button, Box, Chip, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, Stack, FormControl, InputLabel, Select, MenuItem, FormControlLabel, Switch, CircularProgress } from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Info as InfoIcon, FilterList as FilterIcon } from '@mui/icons-material';
import { DataGrid, GridActionsCellItem } from '@mui/x-data-grid';
import { useQuery } from '@tanstack/react-query';
import { useRooms, useCreateRoom, useUpdateRoom, useDeleteRoom } from '../hooks/useRooms';
import { RoomFormDialog } from '../components/RoomFormDialog';
import { RoomTypes } from '@/schemas/facilities';
import { useAuth } from '@/auth/AuthContext';
import { apiFetch } from '@/api/requestHelper';
// Hook to fetch usage for a specific room
function useRoomUsage(roomId) {
    return useQuery({
        queryKey: ['room-usage', roomId],
        queryFn: async () => {
            const data = await apiFetch(`/rooms/${roomId}/usage`);
            return data;
        },
        enabled: !!roomId,
        staleTime: 30_000, // 30 seconds
    });
}
// Usage Cell Component
function UsageCell({ roomId }) {
    const { data: usage, isLoading, error } = useRoomUsage(roomId);
    if (isLoading) {
        return (_jsxs(Box, { display: "flex", alignItems: "center", gap: 1, children: [_jsx(CircularProgress, { size: 16 }), _jsx(Typography, { variant: "caption", children: "Loading..." })] }));
    }
    if (error) {
        return (_jsx(Chip, { label: "Error", color: "error", size: "small", variant: "outlined" }));
    }
    if (!usage || usage.is_available) {
        return (_jsx(Chip, { label: "Available", color: "success", size: "small", variant: "outlined" }));
    }
    // Show first classroom assignment (most common case)
    const firstClassroom = usage.assigned_classrooms[0];
    if (!firstClassroom) {
        return (_jsx(Chip, { label: "Available", color: "success", size: "small", variant: "outlined" }));
    }
    const displayText = firstClassroom.grade_level
        ? `${firstClassroom.name} (Grade ${firstClassroom.grade_level})`
        : firstClassroom.name;
    const hasMultiple = usage.assigned_classrooms.length > 1;
    return (_jsx(Tooltip, { title: hasMultiple
            ? `${usage.assigned_classrooms.length} classrooms assigned`
            : `Subject: ${firstClassroom.subject || 'N/A'}`, children: _jsx(Chip, { label: hasMultiple ? `${displayText} +${usage.assigned_classrooms.length - 1}` : displayText, color: "primary", size: "small", variant: "filled" }) }));
}
export default function RoomsPage() {
    const { user } = useAuth();
    // Modal states
    const [formOpen, setFormOpen] = React.useState(false);
    const [selectedRoom, setSelectedRoom] = React.useState(null);
    const roomsQuery = useRooms();
    const createMutation = useCreateRoom();
    const updateMutation = useUpdateRoom(selectedRoom?.id || '');
    const deleteMutation = useDeleteRoom();
    const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
    const [roomToDelete, setRoomToDelete] = React.useState(null);
    const [usageDialogOpen, setUsageDialogOpen] = React.useState(false);
    const [filtersOpen, setFiltersOpen] = React.useState(false);
    // Filter states
    const [filters, setFilters] = React.useState({
        room_type: '',
        bookable_only: false,
        available_only: false,
        has_projector: null,
        has_computers: null,
        has_smartboard: null,
        has_sink: null
    });
    // Error state
    const [error, setError] = React.useState(null);
    // Get filtered rooms
    const filteredParams = React.useMemo(() => {
        const params = {};
        if (filters.room_type)
            params.room_type = filters.room_type;
        if (filters.bookable_only)
            params.bookable_only = true;
        if (filters.available_only)
            params.available_only = true;
        if (filters.has_projector !== null)
            params.has_projector = filters.has_projector;
        if (filters.has_computers !== null)
            params.has_computers = filters.has_computers;
        if (filters.has_smartboard !== null)
            params.has_smartboard = filters.has_smartboard;
        if (filters.has_sink !== null)
            params.has_sink = filters.has_sink;
        if (user?.school_id)
            params.school_id = user.school_id;
        return params;
    }, [filters, user?.school_id]);
    const rooms = roomsQuery.data || [];
    const handleCreateRoom = () => {
        setSelectedRoom(null);
        setFormOpen(true);
        setError(null);
    };
    const handleEditRoom = (room) => {
        setSelectedRoom(room);
        setFormOpen(true);
        setError(null);
    };
    const handleDeleteRoom = (room) => {
        setRoomToDelete(room);
        setDeleteDialogOpen(true);
    };
    const handleViewUsage = (room) => {
        setSelectedRoom(room);
        setUsageDialogOpen(true);
    };
    const handleFormSubmit = async (data) => {
        try {
            setError(null);
            if (selectedRoom) {
                await updateMutation.mutateAsync(data);
            }
            else {
                await createMutation.mutateAsync({
                    ...data,
                    school_id: user?.school_id || ''
                });
            }
            setFormOpen(false);
        }
        catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An error occurred';
            setError(errorMessage);
        }
    };
    const confirmDelete = async () => {
        if (!roomToDelete)
            return;
        try {
            await deleteMutation.mutateAsync(roomToDelete.id);
            setDeleteDialogOpen(false);
            setRoomToDelete(null);
        }
        catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to delete room';
            setError(errorMessage);
        }
    };
    const clearFilters = () => {
        setFilters({
            room_type: '',
            bookable_only: false,
            available_only: false,
            has_projector: null,
            has_computers: null,
            has_smartboard: null,
            has_sink: null
        });
    };
    const columns = [
        {
            field: 'name',
            headerName: 'Room Name',
            flex: 1,
            minWidth: 150,
        },
        {
            field: 'room_code',
            headerName: 'Code',
            width: 100,
        },
        {
            field: 'room_type',
            headerName: 'Type',
            width: 120,
            renderCell: (params) => (_jsx(Chip, { label: params.value.replace('_', ' '), size: "small", variant: "outlined" }))
        },
        {
            field: 'capacity',
            headerName: 'Capacity',
            type: 'number',
            width: 90,
        },
        {
            field: 'usage',
            headerName: 'Usage',
            width: 200,
            sortable: false,
            renderCell: (params) => (_jsx(UsageCell, { roomId: params.row.id }))
        },
        {
            field: 'has_projector',
            headerName: 'Projector',
            width: 100,
            renderCell: (params) => (_jsx(Chip, { label: params.value ? 'Yes' : 'No', color: params.value ? 'success' : 'default', size: "small" }))
        },
        {
            field: 'has_computers',
            headerName: 'Computers',
            width: 110,
            renderCell: (params) => (_jsx(Chip, { label: params.value ? 'Yes' : 'No', color: params.value ? 'success' : 'default', size: "small" }))
        },
        {
            field: 'is_bookable',
            headerName: 'Bookable',
            width: 100,
            renderCell: (params) => (_jsx(Chip, { label: params.value ? 'Yes' : 'No', color: params.value ? 'success' : 'default', size: "small" }))
        },
        {
            field: 'actions',
            type: 'actions',
            headerName: 'Actions',
            width: 150,
            getActions: (params) => {
                const room = params.row;
                return [
                    _jsx(GridActionsCellItem, { icon: _jsx(Tooltip, { title: "View Usage", children: _jsx(InfoIcon, {}) }), label: "Usage", onClick: () => handleViewUsage(room) }),
                    _jsx(GridActionsCellItem, { icon: _jsx(Tooltip, { title: "Edit Room", children: _jsx(EditIcon, {}) }), label: "Edit", onClick: () => handleEditRoom(room) }),
                    _jsx(GridActionsCellItem, { icon: _jsx(Tooltip, { title: "Delete Room", children: _jsx(DeleteIcon, {}) }), label: "Delete", onClick: () => handleDeleteRoom(room) })
                ];
            }
        }
    ];
    return (_jsx(Paper, { sx: { p: 3 }, children: _jsxs(Stack, { spacing: 3, children: [_jsxs(Box, { sx: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }, children: [_jsx(Typography, { variant: "h5", component: "h1", children: "Room Management" }), _jsxs(Box, { sx: { display: 'flex', gap: 1 }, children: [_jsx(Button, { startIcon: _jsx(FilterIcon, {}), onClick: () => setFiltersOpen(!filtersOpen), variant: "outlined", children: "Filters" }), _jsx(Button, { startIcon: _jsx(AddIcon, {}), onClick: handleCreateRoom, variant: "contained", children: "Add Room" })] })] }), filtersOpen && (_jsx(Paper, { sx: { p: 2, bgcolor: 'background.default' }, children: _jsxs(Stack, { spacing: 2, children: [_jsx(Typography, { variant: "h6", children: "Filters" }), _jsxs(Box, { sx: { display: 'flex', gap: 2, flexWrap: 'wrap' }, children: [_jsxs(FormControl, { size: "small", sx: { minWidth: 120 }, children: [_jsx(InputLabel, { children: "Room Type" }), _jsxs(Select, { value: filters.room_type, onChange: (e) => setFilters(prev => ({ ...prev, room_type: e.target.value })), label: "Room Type", children: [_jsx(MenuItem, { value: "", children: "All Types" }), RoomTypes.map((type) => (_jsx(MenuItem, { value: type, children: type.replace('_', ' ') }, type)))] })] }), _jsx(FormControlLabel, { control: _jsx(Switch, { checked: filters.bookable_only, onChange: (e) => setFilters(prev => ({ ...prev, bookable_only: e.target.checked })) }), label: "Bookable Only" }), _jsx(FormControlLabel, { control: _jsx(Switch, { checked: filters.available_only, onChange: (e) => setFilters(prev => ({ ...prev, available_only: e.target.checked })) }), label: "Available Only" })] }), _jsx(Box, { sx: { display: 'flex', gap: 1 }, children: _jsx(Button, { size: "small", onClick: clearFilters, children: "Clear Filters" }) })] }) })), _jsx(DataGrid, { rows: rooms, columns: columns, loading: roomsQuery.isLoading, autoHeight: true, disableRowSelectionOnClick: true, pageSizeOptions: [10, 25, 50], initialState: {
                        pagination: { paginationModel: { pageSize: 25 } }
                    } }), _jsx(RoomFormDialog, { open: formOpen, onClose: () => setFormOpen(false), onSubmit: handleFormSubmit, room: selectedRoom, isLoading: createMutation.isPending || updateMutation.isPending, error: error, schoolId: user?.school_id || '' }), _jsxs(Dialog, { open: deleteDialogOpen, onClose: () => setDeleteDialogOpen(false), children: [_jsx(DialogTitle, { children: "Delete Room" }), _jsx(DialogContent, { children: _jsxs(Typography, { children: ["Are you sure you want to delete \"", roomToDelete?.name, "\"? This action cannot be undone."] }) }), _jsxs(DialogActions, { children: [_jsx(Button, { onClick: () => setDeleteDialogOpen(false), children: "Cancel" }), _jsx(Button, { onClick: confirmDelete, color: "error", disabled: deleteMutation.isPending, children: deleteMutation.isPending ? 'Deleting...' : 'Delete' })] })] }), _jsxs(Dialog, { open: usageDialogOpen, onClose: () => setUsageDialogOpen(false), maxWidth: "sm", fullWidth: true, children: [_jsxs(DialogTitle, { children: ["Room Usage: ", selectedRoom?.name] }), _jsx(DialogContent, { children: _jsx(Typography, { children: "Room usage information will be displayed here. This feature connects to the backend usage endpoint." }) }), _jsx(DialogActions, { children: _jsx(Button, { onClick: () => setUsageDialogOpen(false), children: "Close" }) })] })] }) }));
}
