import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// src/features/facilities/pages/RoomsPage.tsx
import React from 'react';
import { Paper, Typography, Button, Box, Chip, IconButton, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, Stack, FormControl, InputLabel, Select, MenuItem, FormControlLabel, Switch, CircularProgress, TextField, InputAdornment, Card, CardContent, CardActions, Grid, alpha, useTheme } from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Info as InfoIcon, FilterList as FilterIcon, ViewModule as CardViewIcon, CalendarMonth as CalendarViewIcon, Room as RoomIcon, Search as SearchIcon, People as CapacityIcon, Computer as ComputerIcon, Tv as ProjectorIcon, CheckCircle as CheckIcon } from '@mui/icons-material';
import { GridActionsCellItem } from '@mui/x-data-grid';
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
    const theme = useTheme();
    // View and search state
    const [viewMode, setViewMode] = React.useState('management');
    const [searchQuery, setSearchQuery] = React.useState('');
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
    // Filter and search rooms
    const filteredRooms = React.useMemo(() => {
        return rooms.filter(room => {
            const searchLower = searchQuery.toLowerCase();
            const matchesSearch = !searchQuery ||
                room.name.toLowerCase().includes(searchLower) ||
                room.room_code?.toLowerCase().includes(searchLower) ||
                room.room_type.toLowerCase().includes(searchLower);
            return matchesSearch;
        });
    }, [rooms, searchQuery]);
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
    return (_jsxs(Box, { children: [_jsxs(Paper, { sx: {
                    p: 3,
                    mb: 3,
                    background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.02)} 0%, ${alpha(theme.palette.primary.light, 0.05)} 100%)`,
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
                }, children: [_jsxs(Stack, { direction: "row", justifyContent: "space-between", alignItems: "center", sx: { mb: 3 }, children: [_jsxs(Box, { children: [_jsx(Typography, { variant: "h4", component: "h1", sx: { fontWeight: 600, mb: 1 }, children: "Room Management" }), _jsxs(Typography, { variant: "body1", color: "text.secondary", children: ["Manage facilities with dual-mode interface: scheduling calendar and room administration \u2022 ", filteredRooms.length, " rooms"] })] }), _jsxs(Stack, { direction: "row", spacing: 2, children: [_jsxs(Stack, { direction: "row", spacing: 1, sx: {
                                            bgcolor: alpha(theme.palette.primary.main, 0.04),
                                            borderRadius: 2,
                                            p: 0.5,
                                        }, children: [_jsx(Button, { variant: viewMode === 'calendar' ? "contained" : "text", startIcon: _jsx(CalendarViewIcon, {}), onClick: () => setViewMode('calendar'), size: "small", sx: { minWidth: 'auto' }, children: "Calendar" }), _jsx(Button, { variant: viewMode === 'management' ? "contained" : "text", startIcon: _jsx(CardViewIcon, {}), onClick: () => setViewMode('management'), size: "small", sx: { minWidth: 'auto' }, children: "Rooms" })] }), _jsx(Button, { startIcon: _jsx(FilterIcon, {}), onClick: () => setFiltersOpen(!filtersOpen), variant: "outlined", size: "large", children: "Filters" }), _jsx(Button, { startIcon: _jsx(AddIcon, {}), onClick: handleCreateRoom, variant: "contained", size: "large", sx: {
                                            borderRadius: 2,
                                            px: 3,
                                        }, children: "Add Room" })] })] }), _jsx(TextField, { fullWidth: true, placeholder: "Search rooms by name, code, or type...", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), InputProps: {
                            startAdornment: (_jsx(InputAdornment, { position: "start", children: _jsx(SearchIcon, { sx: { color: theme.palette.text.secondary } }) })),
                        }, sx: {
                            '& .MuiOutlinedInput-root': {
                                borderRadius: 2,
                            },
                        } })] }), _jsxs(Stack, { spacing: 3, children: [filtersOpen && (_jsx(Paper, { sx: { p: 2, bgcolor: 'background.default' }, children: _jsxs(Stack, { spacing: 2, children: [_jsx(Typography, { variant: "h6", children: "Filters" }), _jsxs(Box, { sx: { display: 'flex', gap: 2, flexWrap: 'wrap' }, children: [_jsxs(FormControl, { size: "small", sx: { minWidth: 120 }, children: [_jsx(InputLabel, { children: "Room Type" }), _jsxs(Select, { value: filters.room_type, onChange: (e) => setFilters(prev => ({ ...prev, room_type: e.target.value })), label: "Room Type", children: [_jsx(MenuItem, { value: "", children: "All Types" }), RoomTypes.map((type) => (_jsx(MenuItem, { value: type, children: type.replace('_', ' ') }, type)))] })] }), _jsx(FormControlLabel, { control: _jsx(Switch, { checked: filters.bookable_only, onChange: (e) => setFilters(prev => ({ ...prev, bookable_only: e.target.checked })) }), label: "Bookable Only" }), _jsx(FormControlLabel, { control: _jsx(Switch, { checked: filters.available_only, onChange: (e) => setFilters(prev => ({ ...prev, available_only: e.target.checked })) }), label: "Available Only" })] }), _jsx(Box, { sx: { display: 'flex', gap: 1 }, children: _jsx(Button, { size: "small", onClick: clearFilters, children: "Clear Filters" }) })] }) })), viewMode === 'calendar' ? (
                    /* Calendar View for Booking */
                    _jsxs(Paper, { sx: { p: 4, textAlign: 'center', minHeight: 400 }, children: [_jsx(CalendarViewIcon, { sx: { fontSize: 80, color: theme.palette.text.disabled, mb: 2 } }), _jsx(Typography, { variant: "h5", color: "text.secondary", gutterBottom: true, children: "Calendar View Coming Soon" }), _jsx(Typography, { variant: "body1", color: "text.secondary", sx: { maxWidth: 600, mx: 'auto' }, children: "This view will display an interactive calendar for room booking and scheduling. You can view availability, make reservations, and manage room assignments by time slots." }), _jsx(Box, { sx: { mt: 3 }, children: _jsx(Button, { variant: "outlined", onClick: () => setViewMode('management'), startIcon: _jsx(CardViewIcon, {}), children: "View Rooms Instead" }) })] })) : (
                    /* Professional Card Grid for Room Management */
                    _jsx(Box, { children: roomsQuery.isLoading ? (_jsx(Box, { sx: { display: 'flex', justifyContent: 'center', p: 4 }, children: _jsx(CircularProgress, {}) })) : (_jsxs(Grid, { container: true, spacing: 3, children: [filteredRooms.map((room) => (_jsx(Grid, { size: { xs: 12, sm: 6, md: 4, lg: 3 }, children: _jsxs(Card, { sx: {
                                            height: '100%',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            position: 'relative',
                                            backgroundColor: '#ffffff',
                                            border: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                                            borderRadius: 3,
                                            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                            '&:hover': {
                                                transform: 'translateY(-4px)',
                                                boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)',
                                                borderColor: theme.palette.primary.main,
                                            },
                                            '&::before': {
                                                content: '""',
                                                position: 'absolute',
                                                top: 0,
                                                left: 0,
                                                right: 0,
                                                height: 4,
                                                background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
                                                borderRadius: '12px 12px 0 0',
                                            },
                                        }, children: [_jsxs(CardContent, { sx: { flex: 1, p: 3 }, children: [_jsxs(Stack, { direction: "row", justifyContent: "space-between", alignItems: "flex-start", sx: { mb: 2 }, children: [_jsxs(Box, { sx: { flex: 1 }, children: [_jsx(Typography, { variant: "h6", sx: { fontWeight: 600, mb: 1 }, children: room.name }), _jsxs(Typography, { variant: "body2", color: "text.secondary", sx: { mb: 1 }, children: ["Code: ", room.room_code || 'N/A'] }), _jsx(Chip, { label: room.room_type.replace('_', ' '), size: "small", sx: {
                                                                            background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
                                                                            color: 'white',
                                                                            fontWeight: 500,
                                                                            fontSize: '0.7rem',
                                                                        } })] }), _jsx(UsageCell, { roomId: room.id })] }), _jsxs(Stack, { direction: "row", alignItems: "center", spacing: 1, sx: { mb: 2 }, children: [_jsx(CapacityIcon, { sx: { fontSize: 18, color: theme.palette.text.secondary } }), _jsxs(Typography, { variant: "body2", color: "text.secondary", children: [_jsx("strong", { children: "Capacity:" }), " ", room.capacity, " people"] })] }), _jsxs(Stack, { direction: "row", spacing: 1, sx: { mb: 2, flexWrap: 'wrap', gap: 0.5 }, children: [room.has_projector && (_jsx(Chip, { icon: _jsx(ProjectorIcon, {}), label: "Projector", size: "small", color: "success", variant: "outlined" })), room.has_computers && (_jsx(Chip, { icon: _jsx(ComputerIcon, {}), label: "Computers", size: "small", color: "success", variant: "outlined" })), room.has_smartboard && (_jsx(Chip, { icon: _jsx(CheckIcon, {}), label: "Smartboard", size: "small", color: "info", variant: "outlined" })), room.is_bookable && (_jsx(Chip, { label: "Bookable", size: "small", color: "primary", variant: "outlined" }))] }), room.description && (_jsx(Typography, { variant: "body2", color: "text.secondary", sx: {
                                                            fontSize: '0.85rem',
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                            display: '-webkit-box',
                                                            '-webkit-line-clamp': 2,
                                                            '-webkit-box-orient': 'vertical',
                                                        }, children: room.description }))] }), _jsx(CardActions, { sx: { px: 3, pb: 2, pt: 0 }, children: _jsxs(Stack, { direction: "row", spacing: 1, sx: { width: '100%', justifyContent: 'flex-end' }, children: [_jsx(Tooltip, { title: "View Usage", children: _jsx(IconButton, { size: "small", onClick: () => handleViewUsage(room), sx: {
                                                                    color: theme.palette.info.main,
                                                                    '&:hover': { bgcolor: alpha(theme.palette.info.main, 0.1) }
                                                                }, children: _jsx(InfoIcon, { fontSize: "small" }) }) }), _jsx(Tooltip, { title: "Edit Room", children: _jsx(IconButton, { size: "small", onClick: () => handleEditRoom(room), sx: {
                                                                    color: theme.palette.primary.main,
                                                                    '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.1) }
                                                                }, children: _jsx(EditIcon, { fontSize: "small" }) }) }), _jsx(Tooltip, { title: "Delete Room", children: _jsx(IconButton, { size: "small", onClick: () => handleDeleteRoom(room), sx: {
                                                                    color: theme.palette.error.main,
                                                                    '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.1) }
                                                                }, children: _jsx(DeleteIcon, { fontSize: "small" }) }) })] }) })] }) }, room.id))), filteredRooms.length === 0 && !roomsQuery.isLoading && (_jsx(Grid, { size: { xs: 12 }, children: _jsxs(Box, { sx: { textAlign: 'center', py: 6 }, children: [_jsx(RoomIcon, { sx: { fontSize: 80, color: theme.palette.text.disabled, mb: 2 } }), _jsx(Typography, { variant: "h5", color: "text.secondary", gutterBottom: true, children: "No rooms found" }), _jsx(Typography, { variant: "body1", color: "text.secondary", sx: { mb: 3 }, children: searchQuery
                                                    ? `No rooms match "${searchQuery}"`
                                                    : 'No rooms have been added yet' }), !searchQuery && (_jsx(Button, { variant: "contained", startIcon: _jsx(AddIcon, {}), onClick: handleCreateRoom, children: "Add First Room" }))] }) }))] })) })), _jsx(RoomFormDialog, { open: formOpen, onClose: () => setFormOpen(false), onSubmit: handleFormSubmit, room: selectedRoom, isLoading: createMutation.isPending || updateMutation.isPending, error: error, schoolId: user?.school_id || '' }), _jsxs(Dialog, { open: deleteDialogOpen, onClose: () => setDeleteDialogOpen(false), children: [_jsx(DialogTitle, { children: "Delete Room" }), _jsx(DialogContent, { children: _jsxs(Typography, { children: ["Are you sure you want to delete \"", roomToDelete?.name, "\"? This action cannot be undone."] }) }), _jsxs(DialogActions, { children: [_jsx(Button, { onClick: () => setDeleteDialogOpen(false), children: "Cancel" }), _jsx(Button, { onClick: confirmDelete, color: "error", disabled: deleteMutation.isPending, children: deleteMutation.isPending ? 'Deleting...' : 'Delete' })] })] }), _jsxs(Dialog, { open: usageDialogOpen, onClose: () => setUsageDialogOpen(false), maxWidth: "sm", fullWidth: true, children: [_jsxs(DialogTitle, { children: ["Room Usage: ", selectedRoom?.name] }), _jsx(DialogContent, { children: _jsx(Typography, { children: "Room usage information will be displayed here. This feature connects to the backend usage endpoint." }) }), _jsx(DialogActions, { children: _jsx(Button, { onClick: () => setUsageDialogOpen(false), children: "Close" }) })] })] })] }));
}
