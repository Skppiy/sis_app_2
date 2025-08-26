// src/features/enrollment/pages/StudentsPage.tsx
import React, { useState, useMemo } from 'react';
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
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Alert,
  Tooltip,
  Collapse,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  FormHelperText,
} from '@mui/material';
import {
  DataGrid,
  GridColDef,
  GridRenderCellParams,
  GridRowParams,
  GridToolbar,
} from '@mui/x-data-grid';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  School as SchoolIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  PersonAdd as PersonAddIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';

import { useAuth } from '@/auth/AuthContext';
import {
  useStudents,
  useCreateStudent,
  useUpdateStudent,
  useDeleteStudent,
  useStudentEnrollments,
  useEnrollStudent,
  useWithdrawEnrollment,
} from '@/features/enrollment/hooks/useStudents';
import { useClassrooms } from '@/features/academics/hooks/useClassrooms';
import { useYears } from '@/features/academics/hooks/useYears';
import {
  StudentCreate,
  StudentUpdate,
  StudentCreateSchema,
  StudentUpdateSchema,
  GRADE_LEVELS,
  Student,
  Enrollment,
} from '@/schemas/students';

export default function StudentsPage() {
  const { user, activeSchool } = useAuth();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [enrollDialogOpen, setEnrollDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const schoolId = activeSchool?.id;

  // Queries
  const { data: students = [], isLoading, error } = useStudents({ 
    school_id: schoolId 
  });
  const { data: classrooms = [] } = useClassrooms();
  const { data: academicYears = [] } = useYears();

  // Mutations
  const createMutation = useCreateStudent();
  const updateMutation = useUpdateStudent(selectedStudent?.id || '');
  const deleteMutation = useDeleteStudent();
  const enrollMutation = useEnrollStudent();

  // Get active academic year
  const activeYear = academicYears.find(y => y.is_active);

  // Filter classrooms by active academic year
  const availableClassrooms = classrooms.filter(
    c => c.academic_year_id === activeYear?.id
  );

  // Form for create/edit
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<StudentCreate | StudentUpdate>({
    resolver: zodResolver(editDialogOpen ? StudentUpdateSchema : StudentCreateSchema),
  });

  // Enrollment form
  const enrollForm = useForm({
    defaultValues: {
      classroom_id: '',
      grade_level: '',  // ADD: grade level field
      enrollment_date: format(new Date(), 'yyyy-MM-dd'),
    },
  });
  

  // Toggle row expansion
  const toggleRowExpansion = (studentId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(studentId)) {
      newExpanded.delete(studentId);
    } else {
      newExpanded.add(studentId);
    }
    setExpandedRows(newExpanded);
  };

  // Handle create
  const handleCreate = async (data: StudentCreate) => {
    try {
      await createMutation.mutateAsync(data);
      setCreateDialogOpen(false);
      reset();
    } catch (error) {
      console.error('Failed to create student:', error);
    }
  };

  // Handle update
  const handleUpdate = async (data: StudentUpdate) => {
    if (!selectedStudent) return;
    try {
      await updateMutation.mutateAsync(data);
      setEditDialogOpen(false);
      setSelectedStudent(null);
      reset();
    } catch (error) {
      console.error('Failed to update student:', error);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!selectedStudent) return;
    try {
      await deleteMutation.mutateAsync(selectedStudent.id);
      setDeleteConfirmOpen(false);
      setSelectedStudent(null);
    } catch (error) {
      console.error('Failed to delete student:', error);
    }
  };

  // Handle enroll
  const handleEnroll = async (data: any) => {
  if (!selectedStudent) return;
  try {
    await enrollMutation.mutateAsync({
      student_id: selectedStudent.id,
      classroom_id: data.classroom_id,
      grade_level: data.grade_level || selectedStudent.current_grade_level,  // Include grade level
      enrollment_date: data.enrollment_date,
    });
    setEnrollDialogOpen(false);
    enrollForm.reset();
  } catch (error) {
    console.error('Failed to enroll student:', error);
  }
};

  // DataGrid columns
  // DataGrid columns - FIXED valueGetter syntax
  const columns: GridColDef[] = [
    {
      field: 'expand',
      headerName: '',
      width: 50,
      renderCell: (params: GridRenderCellParams) => (
        <IconButton
          size="small"
          onClick={() => toggleRowExpansion(params.row.id)}
        >
          {expandedRows.has(params.row.id) ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      ),
    },
    {
      field: 'student_id',
      headerName: 'Student ID',
      width: 120,
      renderCell: (params) => params.value || '-',
    },
    {
      field: 'name',
      headerName: 'Name',
      width: 200,
      // FIX: Use renderCell instead of valueGetter for computed fields
      renderCell: (params: GridRenderCellParams) => {
        const firstName = params.row?.first_name || '';
        const lastName = params.row?.last_name || '';
        return `${firstName} ${lastName}`.trim() || '-';
      },
    },
    {
      field: 'entry_grade_level',
      headerName: 'Entry Grade',
      width: 100,
      renderCell: (params) => {
        const grade = GRADE_LEVELS.find(g => g.value === params.value);
        return (
          <Tooltip title="Grade when enrolled">
            <span style={{ opacity: 0.7 }}>{grade ? grade.label : params.value}</span>
          </Tooltip>
        );
      },
    },
    {
      field: 'current_grade_level',
      headerName: 'Current Grade',
      width: 110,
      renderCell: (params) => {
        const grade = GRADE_LEVELS.find(g => g.value === params.value);
        const isPromoted = params.value !== params.row?.entry_grade_level;
        return (
          <Chip
            label={grade ? grade.label : params.value}
            color={isPromoted ? 'primary' : 'default'}
            size="small"
            variant={isPromoted ? 'filled' : 'outlined'}
          />
        );
      },
    },
    {
      field: 'email',
      headerName: 'Email',
      width: 200,
      renderCell: (params) => params.value || '-',
    },
    {
      field: 'date_of_birth',
      headerName: 'Birth Date',
      width: 120,
      renderCell: (params) => 
        params.value ? format(new Date(params.value), 'MM/dd/yyyy') : '-',
    },
    {
      field: 'is_active',
      headerName: 'Status',
      width: 100,
      renderCell: (params) => (
        <Chip
          label={params.value ? 'Active' : 'Inactive'}
          color={params.value ? 'success' : 'default'}
          size="small"
        />
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      renderCell: (params: GridRenderCellParams) => (
        <Stack direction="row" spacing={1}>
          <Tooltip title="Enroll in Class">
            <IconButton
              size="small"
              onClick={() => {
                setSelectedStudent(params.row);
                setEnrollDialogOpen(true);
              }}
            >
              <PersonAddIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit">
            <IconButton
              size="small"
              onClick={() => {
                setSelectedStudent(params.row);
                reset(params.row);
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
                setSelectedStudent(params.row);
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

  // Render enrollment details row
  const EnrollmentDetails = ({ student }: { student: Student }) => {
    const { data: enrollments = [], isLoading } = useStudentEnrollments(student.id, {
      active_only: true,
    });
    const withdrawMutation = useWithdrawEnrollment(student.id);
  
    const handleWithdraw = async (enrollmentId: string) => {
      try {
        await withdrawMutation.mutateAsync(enrollmentId);
      } catch (error) {
        console.error('Failed to withdraw enrollment:', error);
      }
    };
  
    if (isLoading) return <Typography>Loading enrollments...</Typography>;
  
    return (
      <Box sx={{ p: 2, bgcolor: 'grey.50' }}>
        <Typography variant="subtitle2" gutterBottom>
          Current Enrollments (Grade {student.current_grade_level})
        </Typography>
        {enrollments.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            Not enrolled in any classes
          </Typography>
        ) : (
          <List dense>
            {enrollments.map((enrollment: any) => (
              <ListItem key={enrollment.id}>
                <SchoolIcon sx={{ mr: 2, color: 'primary.main' }} />
                <ListItemText
                  primary={
                    <>
                      Classroom ID: {enrollment.classroom_id}
                      {enrollment.grade_level && (
                        <Chip 
                          label={`Grade ${enrollment.grade_level}`} 
                          size="small" 
                          sx={{ ml: 1 }}
                        />
                      )}
                    </>
                  }
                  secondary={`Enrolled: ${
                    enrollment.enrollment_date 
                      ? format(new Date(enrollment.enrollment_date), 'MM/dd/yyyy')
                      : 'N/A'
                  }`}
                />
                <ListItemSecondaryAction>
                  <Button
                    size="small"
                    color="error"
                    onClick={() => handleWithdraw(enrollment.id)}
                  >
                    Withdraw
                  </Button>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        )}
      </Box>
    );
  };

  if (error) {
    return (
      <Paper sx={{ p: 3 }}>
        <Alert severity="error">Failed to load students</Alert>
      </Paper>
    );
  }

  return (
    <Box>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h5">Students</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              reset({});
              setCreateDialogOpen(true);
            }}
          >
            Add Student
          </Button>
        </Stack>
      </Paper>

      <Paper sx={{ height: 600 }}>
        <DataGrid
          rows={students}
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
          getRowHeight={() => 'auto'}
          sx={{
            '& .MuiDataGrid-row': {
              cursor: 'pointer',
            },
          }}
        />
        {/* Render expanded enrollment details */}
        {Array.from(expandedRows).map((studentId) => {
          const student = students.find(s => s.id === studentId);
          if (!student) return null;
          
          return (
            <Collapse key={studentId} in={expandedRows.has(studentId)}>
              <EnrollmentDetails student={student} />
            </Collapse>
          );
        })}
      </Paper>

      {/* Create Dialog */}
      <Dialog open={enrollDialogOpen} onClose={() => setEnrollDialogOpen(false)} maxWidth="sm" fullWidth>
  <form onSubmit={enrollForm.handleSubmit(handleEnroll)}>
    <DialogTitle>
      Enroll Student: {selectedStudent?.first_name} {selectedStudent?.last_name}
      <Typography variant="caption" display="block" color="text.secondary">
        Current Grade: {selectedStudent?.current_grade_level}
      </Typography>
    </DialogTitle>
    <DialogContent>
      <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={6}>
                <Controller
                  name="first_name"
                  control={control}
                  defaultValue=""
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="First Name"
                      fullWidth
                      error={!!errors.first_name}
                      helperText={errors.first_name?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={6}>
                <Controller
                  name="last_name"
                  control={control}
                  defaultValue=""
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Last Name"
                      fullWidth
                      error={!!errors.last_name}
                      helperText={errors.last_name?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name="email"
                  control={control}
                  defaultValue=""
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Email"
                      type="email"
                      fullWidth
                      error={!!errors.email}
                      helperText={errors.email?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={6}>
                <Controller
                  name="student_id"
                  control={control}
                  defaultValue=""
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Student ID"
                      fullWidth
                      error={!!errors.student_id}
                      helperText={errors.student_id?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={6}>
                <Controller
                  name="entry_grade_level"
                  control={control}
                  defaultValue=""
                  render={({ field }) => (
                    <FormControl fullWidth error={!!errors.entry_grade_level}>
                      <InputLabel>Grade Level</InputLabel>
                      <Select {...field} label="Grade Level">
                        {GRADE_LEVELS.map((grade) => (
                          <MenuItem key={grade.value} value={grade.value}>
                            {grade.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>
              <Grid item xs={6}>
                <Controller
                  name="date_of_birth"
                  control={control}
                  defaultValue=""
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Date of Birth"
                      type="date"
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                      error={!!errors.date_of_birth}
                      helperText={errors.date_of_birth?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={6}>
                <Controller
                  name="entry_date"
                  control={control}
                  defaultValue={format(new Date(), 'yyyy-MM-dd')}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Entry Date"
                      type="date"
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                      error={!!errors.entry_date}
                      helperText={errors.entry_date?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name="classroom_id"
                  control={enrollForm.control}
                  rules={{ required: 'Please select a classroom' }}
                  render={({ field, fieldState }) => (
                    <FormControl fullWidth error={!!fieldState.error}>
                      <InputLabel>Classroom</InputLabel>
                      <Select {...field} label="Classroom">
                        {availableClassrooms.map((classroom) => (
                          <MenuItem key={classroom.id} value={classroom.id}>
                            {classroom.name} - {classroom.subject?.name || 'No Subject'} 
                            {classroom.room && ` (${classroom.room.name})`}
                            {classroom.grade_level && ` - Grade ${classroom.grade_level}`}
                          </MenuItem>
                        ))}
                      </Select>
                      {fieldState.error && (
                        <Typography variant="caption" color="error">
                          {fieldState.error.message}
                        </Typography>
                      )}
                    </FormControl>
                  )}
                />
              </Grid>
        
              <Grid item xs={6}>
                <Controller
                  name="grade_level"
                  control={enrollForm.control}
                  defaultValue={selectedStudent?.current_grade_level || ''}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>Grade Level for Enrollment</InputLabel>
                      <Select {...field} label="Grade Level for Enrollment">
                        {GRADE_LEVELS.map((grade) => (
                          <MenuItem key={grade.value} value={grade.value}>
                            {grade.label}
                          </MenuItem>
                        ))}
                      </Select>
                      <FormHelperText>
                        Usually matches current grade ({selectedStudent?.current_grade_level})
                      </FormHelperText>
                    </FormControl>
                  )}
                />
              </Grid>
        
              <Grid item xs={6}>
                <Controller
                  name="enrollment_date"
                  control={enrollForm.control}
                  defaultValue={format(new Date(), 'yyyy-MM-dd')}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Enrollment Date"
                      type="date"
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                    />
                  )}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating...' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit(handleUpdate)}>
          <DialogTitle>Edit Student</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={6}>
                <Controller
                  name="first_name"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="First Name"
                      fullWidth
                      error={!!errors.first_name}
                      helperText={errors.first_name?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={6}>
                <Controller
                  name="last_name"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Last Name"
                      fullWidth
                      error={!!errors.last_name}
                      helperText={errors.last_name?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name="email"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Email"
                      type="email"
                      fullWidth
                      error={!!errors.email}
                      helperText={errors.email?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={6}>
                <Controller
                  name="student_id"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Student ID"
                      fullWidth
                      error={!!errors.student_id}
                      helperText={errors.student_id?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={6}>
                <Controller
                  name="entry_grade_level"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth error={!!errors.entry_grade_level}>
                      <InputLabel>Grade Level</InputLabel>
                      <Select {...field} label="Grade Level">
                        {GRADE_LEVELS.map((grade) => (
                          <MenuItem key={grade.value} value={grade.value}>
                            {grade.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>
              <Grid item xs={6}>
                <Controller
                  name="date_of_birth"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Date of Birth"
                      type="date"
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                      error={!!errors.date_of_birth}
                      helperText={errors.date_of_birth?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={6}>
                <Controller
                  name="is_active"
                  control={control}
                  defaultValue={true}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>Status</InputLabel>
                      <Select {...field} label="Status">
                        <MenuItem value={true}>Active</MenuItem>
                        <MenuItem value={false}>Inactive</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Updating...' : 'Update'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Enrollment Dialog */}
      <Dialog open={enrollDialogOpen} onClose={() => setEnrollDialogOpen(false)} maxWidth="sm" fullWidth>
        <form onSubmit={enrollForm.handleSubmit(handleEnroll)}>
          <DialogTitle>
            Enroll Student: {selectedStudent?.first_name} {selectedStudent?.last_name}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              {!activeYear && (
                <Grid item xs={12}>
                  <Alert severity="warning">
                    No active academic year. Please set an active year first.
                  </Alert>
                </Grid>
              )}
              <Grid item xs={12}>
                <Controller
                  name="classroom_id"
                  control={enrollForm.control}
                  rules={{ required: 'Please select a classroom' }}
                  render={({ field, fieldState }) => (
                    <FormControl fullWidth error={!!fieldState.error}>
                      <InputLabel>Classroom</InputLabel>
                      <Select {...field} label="Classroom">
                        {availableClassrooms.map((classroom) => (
                          <MenuItem key={classroom.id} value={classroom.id}>
                            {classroom.name} - {classroom.subject?.name || 'No Subject'} 
                            {classroom.room && ` (${classroom.room.name})`}
                          </MenuItem>
                        ))}
                      </Select>
                      {fieldState.error && (
                        <Typography variant="caption" color="error">
                          {fieldState.error.message}
                        </Typography>
                      )}
                    </FormControl>
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name="enrollment_date"
                  control={enrollForm.control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Enrollment Date"
                      type="date"
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                    />
                  )}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEnrollDialogOpen(false)}>Cancel</Button>
            <Button 
              type="submit" 
              variant="contained" 
              disabled={enrollMutation.isPending || !activeYear}
            >
              {enrollMutation.isPending ? 'Enrolling...' : 'Enroll'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete student "{selectedStudent?.first_name} {selectedStudent?.last_name}"?
            This will also remove all their enrollments.
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