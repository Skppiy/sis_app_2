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
  CircularProgress,
  TextField,
  InputAdornment,
  Card,
  CardContent,
  CardActions,
  Grid,
  Badge,
  alpha,
  useTheme
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Info as InfoIcon,
  FilterList as FilterIcon,
  ViewModule as CardViewIcon,
  CalendarMonth as CalendarViewIcon,
  Room as RoomIcon,
  Search as SearchIcon,
  People as CapacityIcon,
  Computer as ComputerIcon,
  Tv as ProjectorIcon,
  CheckCircle as CheckIcon
} from '@mui/icons-material';
import { DataGrid, GridColDef, GridActionsCellItem, GridRowParams, GridRenderCellParams } from '@mui/x-data-grid';
import { useQuery } from '@tanstack/react-query';
import { useRooms, useCreateRoom, useUpdateRoom, useDeleteRoom } from '../hooks/useRooms';
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
  const theme = useTheme();
  
  // View and search state
  const [viewMode, setViewMode] = React.useState<'calendar' | 'management'>('management');
  const [searchQuery, setSearchQuery] = React.useState('');
  
  // Modal states
  const [formOpen, setFormOpen] = React.useState(false);
  const [selectedRoom, setSelectedRoom] = React.useState<Room | null>(null);

  const roomsQuery = useRooms();
  const createMutation = useCreateRoom();
  const updateMutation = useUpdateRoom(selectedRoom?.id || '');
  const deleteMutation = useDeleteRoom();
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
    const params: Record<string, string | boolean> = {};
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
        await updateMutation.mutateAsync(data as RoomUpdate);
      } else {
        await createMutation.mutateAsync({
          ...data as RoomCreate,
          school_id: user?.school_id || ''
        });
      }
      setFormOpen(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
    }
  };

  const confirmDelete = async () => {
    if (!roomToDelete) return;
    
    try {
      await deleteMutation.mutateAsync(roomToDelete.id);
      setDeleteDialogOpen(false);
      setRoomToDelete(null);
    } catch (err) {
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
    <Box>
      {/* Enhanced Header Section */}
      <Paper 
        sx={{ 
          p: 3, 
          mb: 3,
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.02)} 0%, ${alpha(theme.palette.primary.light, 0.05)} 100%)`,
          border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
        }} 
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
          <Box>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 600, mb: 1 }}>
              Room Management
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage facilities with dual-mode interface: scheduling calendar and room administration • {filteredRooms.length} rooms
            </Typography>
          </Box>
          <Stack direction="row" spacing={2}>
            <Stack direction="row" spacing={1} sx={{ 
              bgcolor: alpha(theme.palette.primary.main, 0.04),
              borderRadius: 2,
              p: 0.5,
            }}>
              <Button
                variant={viewMode === 'calendar' ? "contained" : "text"}
                startIcon={<CalendarViewIcon />}
                onClick={() => setViewMode('calendar')}
                size="small"
                sx={{ minWidth: 'auto' }}
              >
                Calendar
              </Button>
              <Button
                variant={viewMode === 'management' ? "contained" : "text"}
                startIcon={<CardViewIcon />}
                onClick={() => setViewMode('management')}
                size="small"
                sx={{ minWidth: 'auto' }}
              >
                Rooms
              </Button>
            </Stack>
            <Button
              startIcon={<FilterIcon />}
              onClick={() => setFiltersOpen(!filtersOpen)}
              variant="outlined"
              size="large"
            >
              Filters
            </Button>
            <Button
              startIcon={<AddIcon />}
              onClick={handleCreateRoom}
              variant="contained"
              size="large"
              sx={{ 
                borderRadius: 2,
                px: 3,
              }}
            >
              Add Room
            </Button>
          </Stack>
        </Stack>

        {/* Search Bar */}
        <TextField
          fullWidth
          placeholder="Search rooms by name, code, or type..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: theme.palette.text.secondary }} />
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
            },
          }}
        />
      </Paper>

      <Stack spacing={3}>

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

        {/* Content - Conditional based on view mode */}
        {viewMode === 'calendar' ? (
          /* Calendar View for Booking */
          <Paper sx={{ p: 4, textAlign: 'center', minHeight: 400 }}>
            <CalendarViewIcon sx={{ fontSize: 80, color: theme.palette.text.disabled, mb: 2 }} />
            <Typography variant="h5" color="text.secondary" gutterBottom>
              Calendar View Coming Soon
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
              This view will display an interactive calendar for room booking and scheduling. 
              You can view availability, make reservations, and manage room assignments by time slots.
            </Typography>
            <Box sx={{ mt: 3 }}>
              <Button 
                variant="outlined" 
                onClick={() => setViewMode('management')}
                startIcon={<CardViewIcon />}
              >
                View Rooms Instead
              </Button>
            </Box>
          </Paper>
        ) : (
          /* Professional Card Grid for Room Management */
          <Box>
            {roomsQuery.isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <Grid container spacing={3}>
                {filteredRooms.map((room) => (
                  <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={room.id}>
                    <Card 
                      sx={{
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
                      }}
                    >
                      <CardContent sx={{ flex: 1, p: 3 }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                              {room.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                              Code: {room.room_code || 'N/A'}
                            </Typography>
                            <Chip 
                              label={room.room_type.replace('_', ' ')} 
                              size="small"
                              sx={{
                                background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
                                color: 'white',
                                fontWeight: 500,
                                fontSize: '0.7rem',
                              }}
                            />
                          </Box>
                          <UsageCell roomId={room.id} />
                        </Stack>

                        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                          <CapacityIcon sx={{ fontSize: 18, color: theme.palette.text.secondary }} />
                          <Typography variant="body2" color="text.secondary">
                            <strong>Capacity:</strong> {room.capacity} people
                          </Typography>
                        </Stack>

                        <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap', gap: 0.5 }}>
                          {room.has_projector && (
                            <Chip
                              icon={<ProjectorIcon />}
                              label="Projector"
                              size="small"
                              color="success"
                              variant="outlined"
                            />
                          )}
                          {room.has_computers && (
                            <Chip
                              icon={<ComputerIcon />}
                              label="Computers"
                              size="small"
                              color="success"
                              variant="outlined"
                            />
                          )}
                          {room.has_smartboard && (
                            <Chip
                              icon={<CheckIcon />}
                              label="Smartboard"
                              size="small"
                              color="info"
                              variant="outlined"
                            />
                          )}
                          {room.is_bookable && (
                            <Chip
                              label="Bookable"
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                          )}
                        </Stack>

                        {(room as any).description && (
                          <Typography variant="body2" color="text.secondary" sx={{ 
                            fontSize: '0.85rem',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            '-webkit-line-clamp': 2,
                            '-webkit-box-orient': 'vertical',
                          }}>
                            {(room as any).description}
                          </Typography>
                        )}
                      </CardContent>
                      
                      <CardActions sx={{ px: 3, pb: 2, pt: 0 }}>
                        <Stack direction="row" spacing={1} sx={{ width: '100%', justifyContent: 'flex-end' }}>
                          <Tooltip title="View Usage">
                            <IconButton
                              size="small"
                              onClick={() => handleViewUsage(room)}
                              sx={{ 
                                color: theme.palette.info.main,
                                '&:hover': { bgcolor: alpha(theme.palette.info.main, 0.1) }
                              }}
                            >
                              <InfoIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit Room">
                            <IconButton
                              size="small"
                              onClick={() => handleEditRoom(room)}
                              sx={{ 
                                color: theme.palette.primary.main,
                                '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.1) }
                              }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Room">
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteRoom(room)}
                              sx={{ 
                                color: theme.palette.error.main,
                                '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.1) }
                              }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
                
                {/* Empty State */}
                {filteredRooms.length === 0 && !roomsQuery.isLoading && (
                  <Grid size={{ xs: 12 }}>
                    <Box sx={{ textAlign: 'center', py: 6 }}>
                      <RoomIcon sx={{ fontSize: 80, color: theme.palette.text.disabled, mb: 2 }} />
                      <Typography variant="h5" color="text.secondary" gutterBottom>
                        No rooms found
                      </Typography>
                      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                        {searchQuery 
                          ? `No rooms match "${searchQuery}"`
                          : 'No rooms have been added yet'
                        }
                      </Typography>
                      {!searchQuery && (
                        <Button
                          variant="contained"
                          startIcon={<AddIcon />}
                          onClick={handleCreateRoom}
                        >
                          Add First Room
                        </Button>
                      )}
                    </Box>
                  </Grid>
                )}
              </Grid>
            )}
          </Box>
        )}

        {/* Room Form Dialog */}
        <RoomFormDialog
          open={formOpen}
          onClose={() => setFormOpen(false)}
          onSubmit={handleFormSubmit}
          room={selectedRoom}
          isLoading={createMutation.isPending || updateMutation.isPending}
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
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
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
    </Box>
  );
}