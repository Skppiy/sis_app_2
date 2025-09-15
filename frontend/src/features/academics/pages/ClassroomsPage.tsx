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
  ToggleButton,
  ToggleButtonGroup,
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
  Home as HomeIcon,
  ViewList as ViewListIcon,
  ViewModule as ViewModuleIcon,
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
import { Classroom, ClassroomCreate, GRADE_LEVELS, CORE_SUBJECTS } from '@/schemas/academics';
import HomeroomCreationDialog from '@/features/academics/components/HomeroomCreationDialog';

// Helper function to group homeroom classrooms for display
const groupHomeroomClassrooms = (classrooms: Classroom[]) => {
  const grouped = new Map();
  const nonHomeroom = [];
  
  for (const classroom of classrooms) {
    const isCore = CORE_SUBJECTS.some(subject => 
      classroom.subject?.name?.includes(subject)
    );
    const isHomeroom = classroom.classroom_type === 'HOMEROOM' || 
                      (isCore && classroom.teacher_assignments?.[0]?.role_name === 'Primary Teacher');
    
    if (isHomeroom && classroom.teacher_assignments?.[0]) {
      const teacherId = classroom.teacher_assignments[0].teacher_user_id;
      const gradeLevel = classroom.grade_level;
      const key = `${teacherId}_${gradeLevel}`;
      
      if (!grouped.has(key)) {
        const teacher = classroom.teacher_assignments[0];
        grouped.set(key, {
          id: classroom.id, // Use a real classroom ID, not a fake one
          name: `Grade ${gradeLevel} Homeroom`,
          grade_level: gradeLevel,
          classroom_type: 'HOMEROOM',
          teacher_assignments: [{
            ...teacher,
            display_name: `${teacher.teacher?.first_name || ''} ${teacher.teacher?.last_name || ''}`.trim()
          }],
          subject: { name: 'Homeroom (All CORE Subjects)' },
          room: classroom.room,
          max_students: classroom.max_students,
          enrollment_count: classroom.enrollment_count,
          core_subjects: [],
          individual_classrooms: [], // Track all individual classrooms in this homeroom
          homeroom_key: key, // Track the homeroom group key
          academic_year_id: classroom.academic_year_id,
        });
      }
      
      // Add this classroom to the individual classrooms list
      const grouped_classroom = grouped.get(key);
      grouped_classroom.individual_classrooms.push(classroom);
      
      // Add this subject to the core subjects list
      if (classroom.subject?.name && !grouped_classroom.core_subjects.includes(classroom.subject.name)) {
        grouped_classroom.core_subjects.push(classroom.subject.name);
      }
      
      // Update enrollment count to be the max of all CORE subjects
      grouped_classroom.enrollment_count = Math.max(
        grouped_classroom.enrollment_count || 0, 
        classroom.enrollment_count || 0
      );
    } else {
      nonHomeroom.push(classroom);
    }
  }
  
  return [...Array.from(grouped.values()), ...nonHomeroom];
};

export default function ClassroomsPage() {
  const { activeSchool } = useAuth();
  
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [homeroomDialogOpen, setHomeroomDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grouped' | 'detailed'>('grouped');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedClassroom, setSelectedClassroom] = useState<Classroom | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const schoolId = activeSchool?.id;
  
  // Get academic years and find active one
  const { data: academicYears = [] } = useYears();
  const activeYear = academicYears.find(y => {
    const isActive = y.is_active;
    return isActive === true || String(isActive) === 'true' || String(isActive) === 't';
  });
  
  // Queries - filter by active academic year
  const classroomsQuery = useClassrooms(
    activeYear?.id ? { academic_year_id: activeYear.id } : {}
  );
  const { data: classrooms = [], isLoading, error } = classroomsQuery;

  console.log('Classrooms data:', { classrooms, activeYear, isLoading, error });
  const { data: subjects = [] } = useSubjects();
  const { data: rooms = [] } = useRooms();

  // Apply grouping based on view mode
  const displayClassrooms = viewMode === 'grouped' 
    ? groupHomeroomClassrooms(classrooms)
    : classrooms;

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

  // Handle delete individual classroom
  const handleDelete = async () => {
    if (!selectedClassroom) return;
    try {
      await deleteMutation.mutateAsync(selectedClassroom.id);
      // Force refresh of classrooms data
      await classroomsQuery.refetch();
      // Close dialog after successful deletion and refresh
      setDeleteConfirmOpen(false);
      setSelectedClassroom(null);
    } catch (error) {
      console.error('Failed to delete classroom:', error);
      // Close dialog even on error to prevent it from being stuck
      setDeleteConfirmOpen(false);
      setSelectedClassroom(null);
    }
  };

  // Handle delete entire homeroom (all classrooms for same teacher + grade)
  const handleDeleteHomeroom = async () => {
    if (!selectedClassroom) return;
    
    // If it's a grouped homeroom, use the individual_classrooms array
    const classroomsToDelete = selectedClassroom.individual_classrooms || [selectedClassroom];

    try {
      // Delete all homeroom classrooms in parallel
      await Promise.all(
        classroomsToDelete.map(classroom => 
          deleteMutation.mutateAsync(classroom.id)
        )
      );
      // Force refresh of classrooms data
      await classroomsQuery.refetch();
      // Close dialog after successful deletion and refresh
      setDeleteConfirmOpen(false);
      setSelectedClassroom(null);
    } catch (error) {
      console.error('Failed to delete homeroom:', error);
      // Close dialog even on error to prevent it from being stuck
      setDeleteConfirmOpen(false);
      setSelectedClassroom(null);
    }
  };

  // DataGrid columns
  const columns: GridColDef[] = [
    {
      field: 'name',
      headerName: 'Name',
      width: 160,
      renderCell: (params) => params.value || '-',
    },
    {
      field: 'grade_level',
      headerName: 'Grade',
      width: 80,
      renderCell: (params) => {
        const grade = GRADE_LEVELS.find(g => g.value === params.value);
        return grade ? grade.label : params.value;
      },
    },
    {
      field: 'subject',
      headerName: 'Subject',
      width: 220,
      renderCell: (params) => {
        // If this is a grouped homeroom, show the core subjects list
        if (params.row.core_subjects && params.row.core_subjects.length > 0) {
          return (
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                {params.row.core_subjects.length} CORE Subjects:
              </Typography>
              {params.row.core_subjects.map((subject, index) => (
                <Typography key={index} variant="caption" display="block" sx={{ fontSize: '0.75rem' }}>
                  • {subject}
                </Typography>
              ))}
            </Box>
          );
        }
        return params.row.subject?.name || '-';
      },
    },
    {
      field: 'teacher',
      headerName: 'Teacher',
      width: 140,
      renderCell: (params) => {
        const teacher = params.row.teacher_assignments?.[0];
        if (teacher) {
          const firstName = teacher.teacher?.first_name || '';
          const lastName = teacher.teacher?.last_name || '';
          const displayName = teacher.display_name || `${firstName} ${lastName}`.trim();
          return displayName || '-';
        }
        return '-';
      },
    },
    {
      field: 'room',
      headerName: 'Room',
      width: 90,
      renderCell: (params) => params.row.room?.name || '-',
    },
    {
      field: 'classroom_type',
      headerName: 'Type',
      width: 120,
      renderCell: (params) => {
        const isHomeroom = params.row.subject?.name?.includes('Homeroom') || 
                          params.row.name?.includes('Homeroom') ||
                          params.row.classroom_type === 'HOMEROOM';
        
        if (isHomeroom) {
          return (
            <Chip
              label="Homeroom"
              size="small"
              color="success"
              icon={<HomeIcon />}
              sx={{ 
                background: 'linear-gradient(45deg, #2e7d32 30%, #4caf50 90%)',
                color: 'white',
                fontWeight: 'bold'
              }}
            />
          );
        }
        
        return (
          <Chip
            label={params.value || 'CORE'}
            size="small"
            color={params.value === 'CORE' ? 'primary' : params.value === 'ENRICHMENT' ? 'secondary' : 'default'}
          />
        );
      },
    },
    {
      field: 'max_students',
      headerName: 'Max',
      width: 80,
      renderCell: (params) => params.value || '-',
    },
    {
      field: 'enrollment_count',
      headerName: 'Enrolled',
      width: 80,
      renderCell: (params) => params.value || 0,
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 110,
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
    <Box sx={{ margin: '0 auto', maxWidth: 1300 }}>
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
            <Stack direction="row" spacing={2} alignItems="center">
              <ToggleButtonGroup
                value={viewMode}
                exclusive
                onChange={(event, newViewMode) => {
                  if (newViewMode !== null) {
                    setViewMode(newViewMode);
                  }
                }}
                size="small"
              >
                <ToggleButton value="grouped" aria-label="grouped view">
                  <Tooltip title="Grouped View - Homerooms shown as single entries">
                    <ViewModuleIcon />
                  </Tooltip>
                </ToggleButton>
                <ToggleButton value="detailed" aria-label="detailed view">
                  <Tooltip title="Detailed View - All individual classrooms shown">
                    <ViewListIcon />
                  </Tooltip>
                </ToggleButton>
              </ToggleButtonGroup>
              
              <Button
                variant="contained"
                startIcon={<HomeIcon />}
                onClick={() => setHomeroomDialogOpen(true)}
                disabled={!activeYear}
                sx={{ 
                  background: 'linear-gradient(45deg, #2e7d32 30%, #4caf50 90%)',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #1b5e20 30%, #388e3c 90%)',
                  }
                }}
              >
                Create Homeroom
              </Button>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={() => setCreateDialogOpen(true)}
                disabled={!activeYear}
              >
                Add Classroom
              </Button>
            </Stack>
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
          rows={displayClassrooms || []}
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
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Delete Classroom Options</DialogTitle>
        <DialogContent>
          <Typography variant="h6" gutterBottom>
            Selected: "{selectedClassroom?.name}"
          </Typography>
          
          {/* Show details about what will be deleted */}
          {selectedClassroom?.individual_classrooms && selectedClassroom.individual_classrooms.length > 0 ? (
            // This is a grouped homeroom - show both options
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Contains {selectedClassroom.individual_classrooms.length} CORE subjects. Choose what to delete:
              </Typography>
              
              <Stack spacing={3}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="subtitle2" gutterBottom color="warning.main">
                    Delete Individual Subject Classroom
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Delete one CORE subject classroom:
                  </Typography>
                  <Box sx={{ ml: 1, mb: 1 }}>
                    {selectedClassroom.individual_classrooms.slice(0, 3).map((classroom) => (
                      <Typography key={classroom.id} variant="caption" display="block">
                        • {classroom.subject?.name || 'Unknown'} ({classroom.enrollment_count || 0})
                      </Typography>
                    ))}
                    {selectedClassroom.individual_classrooms.length > 3 && (
                      <Typography variant="caption" color="text.secondary">
                        ... and {selectedClassroom.individual_classrooms.length - 3} more
                      </Typography>
                    )}
                  </Box>
                  <Typography variant="caption" color="warning.main">
                    Advanced users only - select specific classroom first.
                  </Typography>
                  <Button
                    onClick={handleDelete}
                    color="warning"
                    variant="outlined"
                    disabled={deleteMutation.isPending}
                    sx={{ mt: 2 }}
                    fullWidth
                  >
                    {deleteMutation.isPending ? 'Deleting...' : 'Delete Individual Classroom (Advanced)'}
                  </Button>
                </Paper>
                
                <Paper variant="outlined" sx={{ p: 2, bgcolor: 'error.50' }}>
                  <Typography variant="subtitle2" gutterBottom color="error.main">
                    Delete Complete Homeroom
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Delete ALL {selectedClassroom.individual_classrooms.length} CORE classrooms:
                  </Typography>
                  <Box sx={{ ml: 1, mb: 1, p: 1.5, bgcolor: 'grey.100', borderRadius: 1 }}>
                    <Typography variant="body2" gutterBottom>
                      <strong>Teacher:</strong> {selectedClassroom.teacher_assignments?.[0] && 
                      `${selectedClassroom.teacher_assignments[0].teacher?.first_name} ${selectedClassroom.teacher_assignments[0].teacher?.last_name}`}
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                      <strong>Grade:</strong> {selectedClassroom.grade_level}
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                      Will delete:
                    </Typography>
                    {selectedClassroom.individual_classrooms.map((classroom) => (
                      <Typography key={classroom.id} variant="caption" display="block" sx={{ ml: 1 }}>
                        • {classroom.subject?.name || 'Unknown'} ({classroom.enrollment_count || 0})
                      </Typography>
                    ))}
                    <Typography variant="caption" sx={{ mt: 0.5, fontWeight: 'bold', color: 'error.main' }}>
                      Total affected: {selectedClassroom.individual_classrooms.reduce((sum, c) => sum + (c.enrollment_count || 0), 0)} students
                    </Typography>
                  </Box>
                  <Button
                    onClick={handleDeleteHomeroom}
                    color="error"
                    variant="contained"
                    disabled={deleteMutation.isPending}
                    sx={{ mt: 1 }}
                    fullWidth
                  >
                    {deleteMutation.isPending ? 'Deleting...' : `Delete All ${selectedClassroom.individual_classrooms.length} Classrooms`}
                  </Button>
                </Paper>
              </Stack>
            </Box>
          ) : (
            // This is a single classroom - only show single delete option
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                This will delete the classroom and all student enrollments in it.
              </Typography>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Classroom Details:
                </Typography>
                <Typography variant="body2">
                  • Subject: {selectedClassroom?.subject?.name || 'Unknown'}
                </Typography>
                <Typography variant="body2">
                  • Grade: {selectedClassroom?.grade_level || 'Unknown'}
                </Typography>
                <Typography variant="body2">
                  • Enrolled Students: {selectedClassroom?.enrollment_count || 0}
                </Typography>
                <Button
                  onClick={handleDelete}
                  color="error"
                  variant="contained"
                  disabled={deleteMutation.isPending}
                  sx={{ mt: 2 }}
                  fullWidth
                >
                  {deleteMutation.isPending ? 'Deleting...' : 'Delete Classroom'}
                </Button>
              </Paper>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)} disabled={deleteMutation.isPending}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>

        {/* Homeroom Creation Dialog */}
        <HomeroomCreationDialog
          open={homeroomDialogOpen}
          onClose={() => setHomeroomDialogOpen(false)}
          onSuccess={() => {
            // Refresh classrooms data after homeroom creation
            classroomsQuery.refetch();
          }}
        />
    </Box>
  );
}