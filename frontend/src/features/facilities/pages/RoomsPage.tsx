// src/features/facilities/pages/RoomsPage.tsx
import React from 'react';
import {
  Paper,
  Typography,
  Button,
  Box,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Info as InfoIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';
import { DataGrid, GridColDef, GridActionsCellItem, GridRowParams, GridRenderCellParams } from '@mui/x-data-grid';
import { useQuery } from '@tanstack/react-query';
import { useRooms } from '../hooks/useRooms';
import { RoomFormDialog } from '../components/RoomFormDialog';
import { Room, RoomCreate, RoomUpdate, RoomTypes } from '@/schemas/facilities';
import { useAuth } from '@/auth/AuthContext';
import { apiFetch } from '@/api/requestHelper';

// Type for room usage data
interface RoomUsageInfo {
  room: {
    id: string;
    name: string;
    code: string;
    type: string;
    capacity: number;
  };
  is_available: boolean;
  assigned_classrooms: Array<{
    id: string;
    name: string;
    grade_level: string | null;
    subject: string | null;
  }>;
  usage_count: number;
}

// Hook to fetch usage for a specific room
function useRoomUsage(roomId: string) {
  return useQuery({
    queryKey: ['room-usage', roomId],
    queryFn: async () => {
      const data = await apiFetch<RoomUsageInfo>(`/rooms/${roomId}/usage`);
      return data;
    },
    enabled: !!roomId,
    staleTime: 30_000, // 30 seconds
  });
}

// Usage Cell Component
function UsageCell({ roomId }: { roomId: string }) {
  const { data: usage, isLoading, error } = useRoomUsage(roomId);

  if (isLoading) {
    return (
      <Box display="flex" alignItems="center" gap={1}>
        <CircularProgress size={16} />
        <Typography variant="caption">Loading...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Chip 
        label="Error" 
        color="error" 
        size="small" 
        variant="outlined"
      />
    );
  }

  if (!usage || usage.is_available) {
    return (
      <Chip 
        label="Available" 
        color="success" 
        size="small" 
        variant="outlined"
      />
    );
  }

  // Show first classroom assignment (most common case)
  const firstClassroom = usage.assigned_classrooms[0];
  if (!firstClassroom) {
    return (
      <Chip 
        label="Available" 
        color="success" 
        size="small" 
        variant="outlined"
      />
    );
  }

  const displayText = firstClassroom.grade_level 
    ? `${firstClassroom.name} (Grade ${firstClassroom.grade_level})`
    : firstClassroom.name;

  const hasMultiple = usage.assigned_classrooms.length > 1;

  return (
    <Tooltip 
      title={
        hasMultiple 
          ? `${usage.assigned_classrooms.length} classrooms assigned`
          : `Subject: ${firstClassroom.subject || 'N/A'}`
      }
    >
      <Chip 
        label={hasMultiple ? `${displayText} +${usage.assigned_classrooms.length - 1}` : displayText}
        color="primary" 
        size="small" 
        variant="filled"
      />
    </Tooltip>
  );
}

export default function RoomsPage() {
  const { user } = useAuth();
  const { list, create, update, remove } = useRooms();
  
  // Modal states
  const [formOpen, setFormOpen] = React.useState(false);
  const [selectedRoom, setSelectedRoom] = React.useState<Room | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [roomToDelete, setRoomToDelete] = React.useState<Room | null>(null);
  const [usageDialogOpen, setUsageDialogOpen] = React.useState(false);
  const [filtersOpen, setFiltersOpen] = React.useState(false);
  
  // Filter states
  const [filters, setFilters] = React.useState({
    room_type: '',
    bookable_only: false,
    available_only: false,
    has_projector: null as boolean | null,
    has_computers: null as boolean | null,
    has_smartboard: null as boolean | null,
    has_sink: null as boolean | null
  });

  // Error state
  const [error, setError] = React.useState<string | null>(null);

  // Get filtered rooms
  const filteredParams = React.useMemo(() => {
    const params: any = {};
    if (filters.room_type) params.room_type = filters.room_type;
    if (filters.bookable_only) params.bookable_only = true;
    if (filters.available_only) params.available_only = true;
    if (filters.has_projector !== null) params.has_projector = filters.has_projector;
    if (filters.has_computers !== null) params.has_computers = filters.has_computers;
    if (filters.has_smartboard !== null) params.has_smartboard = filters.has_smartboard;
    if (filters.has_sink !== null) params.has_sink = filters.has_sink;
    if (user?.school_id) params.school_id = user.school_id;
    return params;
  }, [filters, user?.school_id]);

  const rooms = list.data || [];

  const handleCreateRoom = () => {
    setSelectedRoom(null);
    setFormOpen(true);
    setError(null);
  };

  const handleEditRoom = (room: Room) => {
    setSelectedRoom(room);
    setFormOpen(true);
    setError(null);
  };

  const handleDeleteRoom = (room: Room) => {
    setRoomToDelete(room);
    setDeleteDialogOpen(true);
  };

  const handleViewUsage = (room: Room) => {
    setSelectedRoom(room);
    setUsageDialogOpen(true);
  };

  const handleFormSubmit = async (data: RoomCreate | RoomUpdate) => {
    try {
      setError(null);
      if (selectedRoom) {
        await update.mutateAsync({ id: selectedRoom.id, payload: data as RoomUpdate });
      } else {
        await create.mutateAsync({
          ...data as RoomCreate,
          school_id: user?.school_id || ''
        });
      }
      setFormOpen(false);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    }
  };

  const confirmDelete = async () => {
    if (!roomToDelete) return;
    
    try {
      await remove.mutateAsync(roomToDelete.id);
      setDeleteDialogOpen(false);
      setRoomToDelete(null);
    } catch (err: any) {
      setError(err.message || 'Failed to delete room');
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

  const columns: GridColDef[] = [
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
      renderCell: (params: GridRenderCellParams) => (
        <Chip 
          label={params.value.replace('_', ' ')} 
          size="small" 
          variant="outlined" 
        />
      )
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
      renderCell: (params: GridRenderCellParams) => (
        <UsageCell roomId={params.row.id} />
      )
    },
    {
      field: 'has_projector',
      headerName: 'Projector',
      width: 100,
      renderCell: (params: GridRenderCellParams) => (
        <Chip 
          label={params.value ? 'Yes' : 'No'}
          color={params.value ? 'success' : 'default'}
          size="small"
        />
      )
    },
    {
      field: 'has_computers',
      headerName: 'Computers',
      width: 110,
      renderCell: (params: GridRenderCellParams) => (
        <Chip 
          label={params.value ? 'Yes' : 'No'}
          color={params.value ? 'success' : 'default'}
          size="small"
        />
      )
    },
    {
      field: 'is_bookable',
      headerName: 'Bookable',
      width: 100,
      renderCell: (params: GridRenderCellParams) => (
        <Chip 
          label={params.value ? 'Yes' : 'No'}
          color={params.value ? 'success' : 'default'}
          size="small"
        />
      )
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 150,
      getActions: (params: GridRowParams) => {
        const room = params.row as Room;
        return [
          <GridActionsCellItem
            icon={
              <Tooltip title="View Usage">
                <InfoIcon />
              </Tooltip>
            }
            label="Usage"
            onClick={() => handleViewUsage(room)}
          />,
          <GridActionsCellItem
            icon={
              <Tooltip title="Edit Room">
                <EditIcon />
              </Tooltip>
            }
            label="Edit"
            onClick={() => handleEditRoom(room)}
          />,
          <GridActionsCellItem
            icon={
              <Tooltip title="Delete Room">
                <DeleteIcon />
              </Tooltip>
            }
            label="Delete"
            onClick={() => handleDeleteRoom(room)}
          />
        ];
      }
    }
  ];

  return (
    <Paper sx={{ p: 3 }}>
      <Stack spacing={3}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5" component="h1">
            Room Management
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              startIcon={<FilterIcon />}
              onClick={() => setFiltersOpen(!filtersOpen)}
              variant="outlined"
            >
              Filters
            </Button>
            <Button
              startIcon={<AddIcon />}
              onClick={handleCreateRoom}
              variant="contained"
            >
              Add Room
            </Button>
          </Box>
        </Box>

        {/* Filters Panel */}
        {filtersOpen && (
          <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
            <Stack spacing={2}>
              <Typography variant="h6">Filters</Typography>
              
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Room Type</InputLabel>
                  <Select
                    value={filters.room_type}
                    onChange={(e) => setFilters(prev => ({ ...prev, room_type: e.target.value }))}
                    label="Room Type"
                  >
                    <MenuItem value="">All Types</MenuItem>
                    {RoomTypes.map((type) => (
                      <MenuItem key={type} value={type}>
                        {type.replace('_', ' ')}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControlLabel
                  control={
                    <Switch
                      checked={filters.bookable_only}
                      onChange={(e) => setFilters(prev => ({ ...prev, bookable_only: e.target.checked }))}
                    />
                  }
                  label="Bookable Only"
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={filters.available_only}
                      onChange={(e) => setFilters(prev => ({ ...prev, available_only: e.target.checked }))}
                    />
                  }
                  label="Available Only"
                />
              </Box>

              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button size="small" onClick={clearFilters}>
                  Clear Filters
                </Button>
              </Box>
            </Stack>
          </Paper>
        )}

        <DataGrid
          rows={rooms}
          columns={columns}
          loading={list.isLoading}
          autoHeight
          disableRowSelectionOnClick
          pageSizeOptions={[10, 25, 50]}
          initialState={{
            pagination: { paginationModel: { pageSize: 25 } }
          }}
        />

        {/* Room Form Dialog */}
        <RoomFormDialog
          open={formOpen}
          onClose={() => setFormOpen(false)}
          onSubmit={handleFormSubmit}
          room={selectedRoom}
          isLoading={create.isPending || update.isPending}
          error={error}
          schoolId={user?.school_id || ''}
        />

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
        >
          <DialogTitle>Delete Room</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete "{roomToDelete?.name}"?
              This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={confirmDelete}
              color="error"
              disabled={remove.isPending}
            >
              {remove.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Usage Information Dialog - Placeholder */}
        <Dialog
          open={usageDialogOpen}
          onClose={() => setUsageDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Room Usage: {selectedRoom?.name}</DialogTitle>
          <DialogContent>
            <Typography>
              Room usage information will be displayed here.
              This feature connects to the backend usage endpoint.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setUsageDialogOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>
      </Stack>
    </Paper>
  );
}