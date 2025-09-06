// src/features/academics/pages/ClassroomsPage.tsx
import React, { useState } from 'react';
import {
  Paper,
  Box,
  Button,
  IconButton,
  Typography,
  Chip,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Tooltip,
} from '@mui/material';
import {
  DataGrid,
  GridColDef,
  GridRenderCellParams,
  GridToolbar,
} from '@mui/x-data-grid';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  School as SchoolIcon,
  Room as RoomIcon,
} from '@mui/icons-material';

import { useAuth } from '@/auth/AuthContext';
import {
  useClassrooms,
  useCreateClassroom,
  useUpdateClassroom,
  useDeleteClassroom,
} from '@/features/academics/hooks/useClassrooms';
import { useSubjects } from '@/features/academics/hooks/useSubjects';
import { useYears } from '@/features/academics/hooks/useYears';
import { useRooms } from '@/features/facilities/hooks/useRooms';
import { Classroom, ClassroomCreate, GRADE_LEVELS } from '@/schemas/academics';

export default function ClassroomsPage() {
  const { activeSchool } = useAuth();
  
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedClassroom, setSelectedClassroom] = useState<Classroom | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const schoolId = activeSchool?.id;
  
  // Get academic years and find active one
  const { list: { data: academicYears = [] } } = useYears();
  const activeYear = academicYears.find((y: any) => y.is_active === true || y.is_active === 'true' || y.is_active === 't');
  
  // Queries - filter by active academic year
  const classroomsQuery = useClassrooms(
    activeYear?.id ? { academic_year_id: activeYear.id } : {}
  );
  const { data: classrooms = [], isLoading, error } = classroomsQuery;

  console.log('Classrooms data:', { classrooms, activeYear, isLoading, error });
  const { data: subjects = [] } = useSubjects();
  const { list: { data: rooms = [] } } = useRooms();

  // Mutations
  const createMutation = useCreateClassroom();
  const updateMutation = useUpdateClassroom(selectedClassroom?.id || '');
  const deleteMutation = useDeleteClassroom();

  // Handle create - placeholder for now
  const handleCreate = async (data: ClassroomCreate) => {
    try {
      console.log('Create classroom:', data);
      // Will implement form dialog later
    } catch (error) {
      console.error('Failed to create classroom:', error);
    }
  };

  // Handle update - placeholder for now
  const handleUpdate = async (data: Partial<Classroom>) => {
    if (!selectedClassroom) return;
    try {
      await updateMutation.mutateAsync(data);
      setEditDialogOpen(false);
      setSelectedClassroom(null);
    } catch (error) {
      console.error('Failed to update classroom:', error);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!selectedClassroom) return;
    try {
      await deleteMutation.mutateAsync(selectedClassroom.id);
      setDeleteConfirmOpen(false);
      setSelectedClassroom(null);
    } catch (error) {
      console.error('Failed to delete classroom:', error);
    }
  };

  // DataGrid columns
  const columns: GridColDef[] = [
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
      renderCell: (params) => (
        <Chip
          label={params.value || 'CORE'}
          size="small"
          color={params.value === 'CORE' ? 'primary' : params.value === 'ENRICHMENT' ? 'secondary' : 'default'}
        />
      ),
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
      renderCell: (params: GridRenderCellParams) => (
        <Stack direction="row" spacing={1}>
          <Tooltip title="Edit">
            <IconButton
              size="small"
              onClick={() => {
                setSelectedClassroom(params.row);
                setEditDialogOpen(true);
              }}
            >
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton
              size="small"
              color="error"
              onClick={() => {
                setSelectedClassroom(params.row);
                setDeleteConfirmOpen(true);
              }}
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      ),
    },
  ];

  if (error) {
    return (
      <Paper sx={{ p: 3 }}>
        <Alert severity="error">Failed to load classrooms</Alert>
      </Paper>
    );
  }

  return (
    <Box>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h5">Classrooms</Typography>
            {activeYear && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Academic Year: {activeYear.name}
              </Typography>
            )}
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateDialogOpen(true)}
            disabled={!activeYear}
          >
            Add Classroom
          </Button>
        </Stack>
        {!activeYear && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <SchoolIcon />
              <Box>
                <Typography variant="subtitle2">No Active Academic Year</Typography>
                <Typography variant="body2">Please set an active academic year to manage classrooms.</Typography>
              </Box>
            </Stack>
          </Alert>
        )}
      </Paper>

      <Paper sx={{ height: 600 }}>
        <DataGrid
          rows={classrooms || []}
          columns={columns}
          loading={isLoading}
          pageSizeOptions={[10, 25, 50]}
          initialState={{
            pagination: { paginationModel: { pageSize: 10 } },
          }}
          slots={{
            toolbar: GridToolbar,
          }}
          slotProps={{
            toolbar: {
              showQuickFilter: true,
              quickFilterProps: { debounceMs: 500 },
            },
          }}
          getRowId={(row) => row.id}
        />
      </Paper>

      {/* Create Dialog - Placeholder */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)}>
        <DialogTitle>Add Classroom</DialogTitle>
        <DialogContent>
          <Typography>Form implementation coming next...</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog - Placeholder */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)}>
        <DialogTitle>Edit Classroom</DialogTitle>
        <DialogContent>
          <Typography>Edit form implementation coming next...</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete classroom "{selectedClassroom?.name}"?
            This will also remove all student enrollments in this classroom.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
          <Button
            onClick={handleDelete}
            color="error"
            variant="contained"
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}