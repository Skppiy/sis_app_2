// src/features/academics/pages/SubjectsPage.tsx
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
} from '@mui/icons-material';

import { useAuth } from '@/auth/AuthContext';
import {
  useSubjects,
  useCreateSubject,
  useUpdateSubject,
  useDeleteSubject,
} from '@/features/academics/hooks/useSubjects';
import SubjectFormDialog from '@/features/academics/components/SubjectFormDialog';
import { Subject, SubjectCreate } from '@/schemas/academics';

export default function SubjectsPage() {
  const { activeSchool } = useAuth();
  
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
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
  const handleCreate = async (data: SubjectCreate) => {
    try {
      await createMutation.mutateAsync(data);
      setCreateDialogOpen(false);
    } catch (error) {
      console.error('Failed to create subject:', error);
    }
  };

  // Handle update
  const handleUpdate = async (data: Partial<Subject>) => {
    if (!selectedSubject) return;
    try {
      await updateMutation.mutateAsync(data);
      setEditDialogOpen(false);
      setSelectedSubject(null);
    } catch (error) {
      console.error('Failed to update subject:', error);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!selectedSubject) return;
    try {
      await deleteMutation.mutateAsync(selectedSubject.id);
      setDeleteConfirmOpen(false);
      setSelectedSubject(null);
    } catch (error) {
      console.error('Failed to delete subject:', error);
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
      field: 'code',
      headerName: 'Code',
      width: 120,
      renderCell: (params) => params.value || '-',
    },
    {
      field: 'subject_type',
      headerName: 'Type',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value || 'CORE'}
          size="small"
          color={params.value === 'CORE' ? 'primary' : params.value === 'ENRICHMENT' ? 'secondary' : 'default'}
        />
      ),
    },
    {
      field: 'applies_to_elementary',
      headerName: 'Elementary',
      width: 100,
      renderCell: (params) => (
        <Chip
          label={params.value ? 'Yes' : 'No'}
          size="small"
          color={params.value ? 'success' : 'default'}
        />
      ),
    },
    {
      field: 'applies_to_middle',
      headerName: 'Middle School',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value ? 'Yes' : 'No'}
          size="small"
          color={params.value ? 'success' : 'default'}
        />
      ),
    },
    {
      field: 'requires_specialist',
      headerName: 'Specialist',
      width: 100,
      renderCell: (params) => (
        <Chip
          label={params.value ? 'Required' : 'No'}
          size="small"
          color={params.value ? 'warning' : 'default'}
        />
      ),
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
                setSelectedSubject(params.row);
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
                setSelectedSubject(params.row);
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
        <Alert severity="error">Failed to load subjects</Alert>
      </Paper>
    );
  }

  return (
    <Box>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h5">Subjects</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateDialogOpen(true)}
          >
            Add Subject
          </Button>
        </Stack>
      </Paper>

      <Paper sx={{ height: 600 }}>
        <DataGrid
          rows={subjects}
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
        />
      </Paper>

      {/* Create Dialog */}
      <SubjectFormDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSubmit={handleCreate}
      />

      {/* Edit Dialog */}
      <SubjectFormDialog
        open={editDialogOpen}
        initial={selectedSubject || undefined}
        onClose={() => {
          setEditDialogOpen(false);
          setSelectedSubject(null);
        }}
        onSubmit={handleUpdate}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete subject "{selectedSubject?.name}"?
            This may affect existing classrooms that use this subject.
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
