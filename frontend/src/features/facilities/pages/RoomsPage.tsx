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
  Switch
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Info as InfoIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';
import { DataGrid, GridColDef, GridActionsCellItem, GridRowParams } from '@mui/x-data-grid';
import { useRooms } from '../hooks/useRooms';
import { RoomFormDialog } from '../components/RoomFormDialog';
import { Room, RoomCreate, RoomUpdate, RoomTypes } from '@/schemas/facilities';
import { useAuth } from '@/auth/AuthContext';

export default function RoomsPage() {
  const { user } = useAuth();
  const { list, create, update, remove, getRoomUsage } = useRooms();
  
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
      minWidth: 150
    },
    {
      field: 'room_code',
      headerName: 'Code',
      width: 100
    },
    {
      field: 'room_type',
      headerName: 'Type',
      width: 130,
      renderCell: (params) => (
        <Chip 
          label={params.value?.replace('_', ' ')} 
          size="small"
          variant="outlined"
        />
      )
    },
    {
      field: 'capacity',
      headerName: 'Capacity',
      type: 'number',
      width: 90
    },
    {
      field: 'equipment',
      headerName: 'Equipment',
      width: 200,
      renderCell: (params) => {
        const room = params.row as Room;
        const equipment = [];
        if (room.has_projector) equipment.push('Projector');
        if (room.has_computers) equipment.push('Computers');
        if (room.has_smartboard) equipment.push('Smart Board');
        if (room.has_sink) equipment.push('Sink');
        
        return (
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            {equipment.map((item) => (
              <Chip key={item} label={item} size="small" />
            ))}
          </Box>
        );
      }
    },
    {
      field: 'is_bookable',
      headerName: 'Bookable',
      width: 100,
      renderCell: (params) => (
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
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreateRoom}
            >
              Add Room
            </Button>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {filtersOpen && (
          <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
            <Stack spacing={2}>
              <Typography variant="subtitle1">Filters</Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <FormControl sx={{ minWidth: 120 }}>
                  <InputLabel>Room Type</InputLabel>
                  <Select
                    value={filters.room_type}
                    label="Room Type"
                    onChange={(e) => setFilters(prev => ({ ...prev, room_type: e.target.value }))}
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