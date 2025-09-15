// src/features/enrollment/pages/StudentsPage.tsx
import React, { useState, useMemo, useEffect } from 'react';
import {
  Paper,
  Box,
  Button,
  IconButton,
  Typography,
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
  Alert,
  FormHelperText,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
  Avatar,
  Chip,
  Tooltip,
  InputAdornment,
  alpha,
  useTheme,
} from '@mui/material';
import {
  Add as AddIcon,
  School as SchoolIcon,
  PersonAdd as PersonAddIcon,
  Close as CloseIcon,
  ViewModule as CardViewIcon,
  ViewList as ListViewIcon,
  Person as PersonIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Email as EmailIcon,
  Cake as CakeIcon,
  School as EnrollmentIcon,
  Search as SearchIcon,
  AutoAwesome as ThreeTierIcon,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { z } from 'zod';

import { useAuth } from '@/auth/AuthContext';
import {
  useStudents,
  useCreateStudent,
  useUpdateStudent,
  useDeleteStudent,
  useEnrollStudent,
  useWithdrawEnrollment,
} from '@/features/enrollment/hooks/useStudents';
import { useStudentEnrollments } from '@/features/enrollment/hooks/useStudentEnrollments';
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
  EnrollmentCreate,
} from '@/schemas/students';
import { StudentGrid, EnhancedEnrollmentManager } from '@/components/students';
import ThreeTierEnrollmentManager from '@/components/enrollment/ThreeTierEnrollmentManager';

// Enrollment form schema
const EnrollmentFormSchema = z.object({
  classroom_id: z.string().min(1, "Classroom is required"),
  grade_level: z.string().min(1, "Grade level is required"),
  enrollment_date: z.string().min(1, "Enrollment date is required"),
});

type EnrollmentFormData = z.infer<typeof EnrollmentFormSchema>;

export default function StudentsPage() {
  const { user, activeSchool } = useAuth();
  const theme = useTheme();
  
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [enrollDialogOpen, setEnrollDialogOpen] = useState(false);
  const [bulkEnrollDialogOpen, setBulkEnrollDialogOpen] = useState(false);
  const [twoTierEnrollDialogOpen, setTwoTierEnrollDialogOpen] = useState(false);
  const [threeTierEnrollDialogOpen, setThreeTierEnrollDialogOpen] = useState(false);
  const [selectedStudentsForTwoTier, setSelectedStudentsForTwoTier] = useState<Student[]>([]);
  const [selectedStudentsForThreeTier, setSelectedStudentsForThreeTier] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedStudentsForBulk, setSelectedStudentsForBulk] = useState<Student[]>([]);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');
  const [useEnhancedView, setUseEnhancedView] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const schoolId = activeSchool?.id;
  
  // Queries
  const { data: students = [], isLoading, error } = useStudents({ 
    school_id: schoolId 
  });
  const { data: academicYears = [] } = useYears();

  // Get active academic year - handle both boolean and string formats
  const activeYear = academicYears.find(y => {
    const isActive = y.is_active;
    return isActive === true || String(isActive).toLowerCase() === 'true' || String(isActive).toLowerCase() === 't';
  });


  // Filter classrooms by active academic year for enrollment
  const classroomsQuery = useClassrooms(
    activeYear?.id ? { academic_year_id: activeYear.id } : {}
  );
  const { data: classrooms = [] } = classroomsQuery;

  // Mutations
  const createMutation = useCreateStudent();
  const updateMutation = useUpdateStudent(selectedStudent?.id || '');
  const deleteMutation = useDeleteStudent();
  const enrollMutation = useEnrollStudent();
  
  // DEBUG: Log to see what's happening
  console.log('Students Page DEBUG:', {
    academicYears,
    activeYear,
    studentsCount: students.length,
    classroomsCount: classrooms.length
  });

  // Classrooms are already filtered by active academic year in the query above
  const availableClassrooms = classrooms;

  // Form for create/edit - Use proper types
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<StudentCreate>({
    resolver: zodResolver(StudentCreateSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      date_of_birth: '',
      entry_date: format(new Date(), 'yyyy-MM-dd'),
      entry_grade_level: '',
    },
  });

  // Separate form for edit with proper types
  const {
    control: editControl,
    handleSubmit: handleEditSubmit,
    reset: resetEdit,
    formState: { errors: editErrors },
  } = useForm<StudentUpdate>({
    resolver: zodResolver(StudentUpdateSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      current_grade_level: '',
    },
  });

  // Enrollment form
  const enrollForm = useForm<EnrollmentFormData>({
    resolver: zodResolver(EnrollmentFormSchema),
    defaultValues: {
      classroom_id: '',
      grade_level: '',
      enrollment_date: format(new Date(), 'yyyy-MM-dd'),
    },
  });



  // Handle create
  const handleCreate = async (data: StudentCreate) => {
    try {
      // Auto-generate email using firstname.lastname@domain from logged-in user
      let autoEmail = '';
      if (user?.email && data.first_name && data.last_name) {
        const userDomain = user.email.split('@')[1];
        const firstName = data.first_name.toLowerCase().replace(/\s+/g, '');
        const lastName = data.last_name.toLowerCase().replace(/\s+/g, '');
        autoEmail = `${firstName}.${lastName}@${userDomain}`;
      }

      const studentData = {
        ...data,
        email: autoEmail || undefined, // Let backend handle if empty
        // student_id will be auto-generated by backend
      };

      console.log('Creating student with auto-generated data:', studentData);
      await createMutation.mutateAsync(studentData);
      setCreateDialogOpen(false);
      reset();
    } catch (error) {
      console.error('Failed to create student:', error);
      // Show error to user - you can add a toast/alert here
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
  const handleEnroll = async (data: EnrollmentFormData) => {
  if (!selectedStudent) return;
  try {
    await enrollMutation.mutateAsync({
      student_id: selectedStudent.id,
      classroom_id: data.classroom_id,
      grade_level: data.grade_level,
      enrollment_date: data.enrollment_date,
    });
    setEnrollDialogOpen(false);
    enrollForm.reset();
  } catch (error) {
    console.error('Failed to enroll student:', error);
  }
};

  // Handle withdraw enrollment
  const handleWithdrawEnrollment = async (studentId: string, enrollmentId: string) => {
    try {
      const withdrawMutation = useWithdrawEnrollment(studentId);
      await withdrawMutation.mutateAsync(enrollmentId);
    } catch (error) {
      console.error('Failed to withdraw enrollment:', error);
    }
  };

  // Bulk operations handlers
  const handleBulkEnroll = (students: Student[]) => {
    setSelectedStudentsForBulk(students);
    setBulkEnrollDialogOpen(true);
  };

  const handleProcessBulkEnrollments = async (enrollmentSelections: any[]) => {
    try {
      // Process each enrollment selection
      for (const selection of enrollmentSelections) {
        for (const student of selection.students) {
          await enrollMutation.mutateAsync({
            student_id: student.id,
            classroom_id: selection.classroom_id,
            grade_level: selection.grade_level,
            enrollment_date: selection.enrollment_date,
            is_audit_only: selection.is_audit_only,
            requires_accommodation: selection.requires_accommodation,
          });
        }
      }
      console.log('Bulk enrollments completed successfully');
    } catch (error) {
      console.error('Failed to process bulk enrollments:', error);
      throw error;
    }
  };

  const handleBulkActivate = async (studentIds: string[]) => {
    try {
      // Implementation would depend on your backend API
      console.log('Bulk activating students:', studentIds);
    } catch (error) {
      console.error('Failed to bulk activate students:', error);
    }
  };

  const handleBulkInactivate = async (studentIds: string[]) => {
    try {
      // Implementation would depend on your backend API
      console.log('Bulk inactivating students:', studentIds);
    } catch (error) {
      console.error('Failed to bulk inactivate students:', error);
    }
  };

  const handleBulkDelete = async (studentIds: string[]) => {
    try {
      for (const id of studentIds) {
        await deleteMutation.mutateAsync(id);
      }
      console.log('Bulk delete completed');
    } catch (error) {
      console.error('Failed to bulk delete students:', error);
    }
  };

  const handleBulkExport = async (studentIds: string[], format: 'csv' | 'pdf') => {
    try {
      // Implementation would depend on your export functionality
      console.log(`Exporting ${studentIds.length} students as ${format}`);
    } catch (error) {
      console.error('Failed to export students:', error);
    }
  };

  const handleBulkEmail = async (studentIds: string[]) => {
    try {
      // Implementation would depend on your email functionality
      console.log('Sending bulk email to students:', studentIds);
    } catch (error) {
      console.error('Failed to send bulk email:', error);
    }
  };

  const handleBulkSms = async (studentIds: string[]) => {
    try {
      // Implementation would depend on your SMS functionality
      console.log('Sending bulk SMS to students:', studentIds);
    } catch (error) {
      console.error('Failed to send bulk SMS:', error);
    }
  };

  const handleBulkReport = async (studentIds: string[], reportType: string) => {
    try {
      // Implementation would depend on your reporting functionality
      console.log(`Generating ${reportType} report for students:`, studentIds);
    } catch (error) {
      console.error('Failed to generate bulk report:', error);
    }
  };

  // Helper functions for list view
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const getGradeLabel = (gradeValue: string) => {
    const grade = GRADE_LEVELS.find(g => g.value === gradeValue);
    return grade ? grade.label : gradeValue;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch {
      return 'Invalid Date';
    }
  };

  // Filter and search students
  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      const searchLower = searchQuery.toLowerCase();
      return (
        student.first_name.toLowerCase().includes(searchLower) ||
        student.last_name.toLowerCase().includes(searchLower) ||
        student.email?.toLowerCase().includes(searchLower) ||
        student.student_id?.toLowerCase().includes(searchLower)
      );
    });
  }, [students, searchQuery]);


  if (error) {
    return (
      <Paper sx={{ p: 3 }}>
        <Alert severity="error">Failed to load students</Alert>
      </Paper>
    );
  }

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
              Student Management
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {activeYear ? (
                `Academic Year: ${activeYear.name} • ${filteredStudents.length} students`
              ) : (
                `${filteredStudents.length} students • No active academic year`
              )}
            </Typography>
          </Box>
          <Stack direction="row" spacing={2}>
            <Stack direction="row" spacing={1} sx={{ 
              bgcolor: alpha(theme.palette.primary.main, 0.04),
              borderRadius: 2,
              p: 0.5,
            }}>
              <Button
                variant={viewMode === 'cards' ? "contained" : "text"}
                startIcon={<CardViewIcon />}
                onClick={() => setViewMode('cards')}
                size="small"
                sx={{ minWidth: 'auto' }}
              >
                Cards
              </Button>
              <Button
                variant={viewMode === 'list' ? "contained" : "text"}
                startIcon={<ListViewIcon />}
                onClick={() => setViewMode('list')}
                size="small"
                sx={{ minWidth: 'auto' }}
              >
                List
              </Button>
            </Stack>
            {viewMode === 'cards' && (
              <Button
                variant={useEnhancedView ? "contained" : "outlined"}
                onClick={() => setUseEnhancedView(!useEnhancedView)}
                size="small"
              >
                {useEnhancedView ? 'Enhanced' : 'Standard'}
              </Button>
            )}
            <Button
              variant="outlined"
              startIcon={<SchoolIcon />}
              onClick={() => {
                setSelectedStudentsForTwoTier(filteredStudents);
                setTwoTierEnrollDialogOpen(true);
              }}
              size="large"
              sx={{ 
                borderRadius: 2,
                px: 3,
              }}
            >
              Homeroom Enrollment
            </Button>
            <Button
              variant="outlined"
              startIcon={<ThreeTierIcon />}
              onClick={() => {
                setSelectedStudentsForThreeTier(filteredStudents);
                setThreeTierEnrollDialogOpen(true);
              }}
              size="large"
              sx={{ 
                borderRadius: 2,
                px: 3,
                borderColor: theme.palette.secondary.main,
                color: theme.palette.secondary.main,
                '&:hover': {
                  borderColor: theme.palette.secondary.dark,
                  backgroundColor: alpha(theme.palette.secondary.main, 0.04),
                },
              }}
            >
              Three-Tier Enrollment
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCreateDialogOpen(true)}
              size="large"
              sx={{ 
                borderRadius: 2,
                px: 3,
              }}
            >
              Add Student
            </Button>
          </Stack>
        </Stack>

        {/* Search Bar */}
        <TextField
          fullWidth
          placeholder="Search students by name, email, or ID..."
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

      {/* Content - Conditional based on view mode */}
      {viewMode === 'cards' ? (
        <StudentGrid
          students={filteredStudents}
          loading={isLoading}
          onEdit={(student) => {
            setSelectedStudent(student);
            resetEdit(student);
            setEditDialogOpen(true);
          }}
          onDelete={(student) => {
            setSelectedStudent(student);
            setDeleteConfirmOpen(true);
          }}
          onEnroll={(student) => {
            setSelectedStudent(student);
            setEnrollDialogOpen(true);
          }}
          onWithdrawEnrollment={handleWithdrawEnrollment}
          academicYearName={activeYear?.name}
          academicYearId={activeYear?.id}
          itemsPerPage={12}
          useEnhancedCards={useEnhancedView}
          showBulkOperations={useEnhancedView}
          availableClassrooms={availableClassrooms.map(c => ({ 
            id: c.id, 
            name: c.name, 
            subject: c.subject 
          }))}
          onBulkEnroll={(studentIds, classroomId) => {
            const studentsForBulk = filteredStudents.filter(s => studentIds.includes(s.id));
            handleBulkEnroll(studentsForBulk);
          }}
          onBulkActivate={handleBulkActivate}
          onBulkInactivate={handleBulkInactivate}
          onBulkDelete={handleBulkDelete}
          onBulkExport={handleBulkExport}
          onBulkEmail={handleBulkEmail}
          onBulkSms={handleBulkSms}
          onBulkReport={handleBulkReport}
        />
      ) : (
        /* Professional List View */
        <Paper sx={{ mb: 3 }}>
          {isLoading ? (
            <Box sx={{ p: 2 }}>
              <Typography>Loading students...</Typography>
            </Box>
          ) : (
            <List sx={{ p: 0 }}>
              {filteredStudents.map((student, index) => (
                <ListItem
                  key={student.id}
                  sx={{
                    borderBottom: index < filteredStudents.length - 1 ? 1 : 0,
                    borderColor: 'divider',
                    py: 2,
                    px: 3,
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.04),
                    },
                  }}
                >
                  <ListItemAvatar>
                    <Avatar
                      sx={{
                        bgcolor: student.is_active
                          ? theme.palette.primary.main
                          : theme.palette.grey[500],
                        width: 48,
                        height: 48,
                        fontSize: '1.1rem',
                        fontWeight: 600,
                      }}
                    >
                      {getInitials(student.first_name, student.last_name)}
                    </Avatar>
                  </ListItemAvatar>
                  
                  <ListItemText
                    primary={
                      <Stack direction="row" alignItems="center" spacing={2}>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {student.first_name} {student.last_name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          ID: {student.student_id || 'N/A'}
                        </Typography>
                        <Chip 
                          label={getGradeLabel(student.current_grade_level)} 
                          size="small"
                          sx={{
                            background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
                            color: 'white',
                            fontWeight: 500,
                            fontSize: '0.75rem',
                          }}
                        />
                        <Chip 
                          label={student.is_active ? 'Active' : 'Inactive'} 
                          size="small" 
                          color={student.is_active ? 'success' : 'default'}
                          variant={student.is_active ? 'filled' : 'outlined'}
                        />
                      </Stack>
                    }
                    secondary={
                      <Stack direction="row" spacing={3} sx={{ mt: 1 }}>
                        {student.email && (
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <EmailIcon sx={{ fontSize: 16, mr: 1, color: theme.palette.text.secondary }} />
                            <Typography variant="body2" color="text.secondary">
                              {student.email}
                            </Typography>
                          </Box>
                        )}
                        {student.date_of_birth && (
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <CakeIcon sx={{ fontSize: 16, mr: 1, color: theme.palette.text.secondary }} />
                            <Typography variant="body2" color="text.secondary">
                              Born: {formatDate(student.date_of_birth)}
                            </Typography>
                          </Box>
                        )}
                        {student.entry_date && (
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <EnrollmentIcon sx={{ fontSize: 16, mr: 1, color: theme.palette.text.secondary }} />
                            <Typography variant="body2" color="text.secondary">
                              Enrolled: {formatDate(student.entry_date)}
                            </Typography>
                          </Box>
                        )}
                      </Stack>
                    }
                  />
                  
                  <ListItemSecondaryAction>
                    <Stack direction="row" spacing={1}>
                      <Tooltip title="Enroll in Class">
                        <IconButton
                          onClick={() => {
                            setSelectedStudent(student);
                            setEnrollDialogOpen(true);
                          }}
                          size="small"
                          sx={{ 
                            color: theme.palette.primary.main,
                            '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.1) }
                          }}
                        >
                          <PersonAddIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit Student">
                        <IconButton
                          onClick={() => {
                            setSelectedStudent(student);
                            resetEdit(student);
                            setEditDialogOpen(true);
                          }}
                          size="small"
                          sx={{ 
                            color: theme.palette.info.main,
                            '&:hover': { bgcolor: alpha(theme.palette.info.main, 0.1) }
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Student">
                        <IconButton
                          onClick={() => {
                            setSelectedStudent(student);
                            setDeleteConfirmOpen(true);
                          }}
                          size="small"
                          sx={{ 
                            color: theme.palette.error.main,
                            '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.1) }
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
              
              {/* Empty State */}
              {filteredStudents.length === 0 && (
                <Box sx={{ p: 6, textAlign: 'center' }}>
                  <PersonIcon sx={{ fontSize: 64, color: theme.palette.text.disabled, mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No students found
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {searchQuery 
                      ? `No students match "${searchQuery}"`
                      : 'No students enrolled yet'
                    }
                  </Typography>
                </Box>
              )}
            </List>
          )}
        </Paper>
      )}

      {/* Create Dialog */}
      {/* Create Student Dialog - FIXED: Separate from enrollment */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit(handleCreate)}>
          <DialogTitle>Add New Student</DialogTitle>
          <DialogContent>
            {createMutation.error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                Failed to create student: {String(createMutation.error)}
              </Alert>
            )}
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2, mt: 1 }}>
              <Box>
                <Controller
                  name="first_name"
                  control={control}
                  defaultValue=""
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="First Name"
                      fullWidth
                      required
                      error={!!errors.first_name}
                      helperText={errors.first_name?.message}
                    />
                  )}
                />
              </Box>
              <Box>
                <Controller
                  name="last_name"
                  control={control}
                  defaultValue=""
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Last Name"
                      fullWidth
                      required
                      error={!!errors.last_name}
                      helperText={errors.last_name?.message}
                    />
                  )}
                />
              </Box>
              <Box>
                <Controller
                  name="entry_grade_level"
                  control={control}
                  defaultValue=""
                  render={({ field }) => (
                    <FormControl fullWidth required error={!!errors.entry_grade_level}>
                      <InputLabel>Grade Level</InputLabel>
                      <Select {...field} label="Grade Level">
                        {GRADE_LEVELS.map((grade) => (
                          <MenuItem key={grade.value} value={grade.value}>
                            {grade.label}
                          </MenuItem>
                        ))}
                      </Select>
                      {errors.entry_grade_level && (
                        <FormHelperText>{errors.entry_grade_level?.message}</FormHelperText>
                      )}
                    </FormControl>
                  )}
                />
              </Box>
              {/* Student ID and Email will be auto-generated on submit */}
              <Box>
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
              </Box>
              <Box>
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
              </Box>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating...' : 'Create Student'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Edit Student Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleEditSubmit(handleUpdate)}>
          <DialogTitle>Edit Student</DialogTitle>
          <DialogContent>
            {updateMutation.error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                Failed to update student: {String(updateMutation.error)}
              </Alert>
            )}
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2, mt: 1 }}>
              <Box>
                <Controller
                  name="first_name"
                  control={editControl}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="First Name"
                      fullWidth
                      required
                      error={!!errors.first_name}
                      helperText={errors.first_name?.message}
                    />
                  )}
                />
              </Box>
              <Box>
                <Controller
                  name="last_name"
                  control={editControl}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Last Name"
                      fullWidth
                      required
                      error={!!errors.last_name}
                      helperText={errors.last_name?.message}
                    />
                  )}
                />
              </Box>
              <Box>
                <Controller
                  name="current_grade_level"
                  control={editControl}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>Current Grade Level</InputLabel>
                      <Select {...field} label="Current Grade Level">
                        {GRADE_LEVELS.map((grade) => (
                          <MenuItem key={grade.value} value={grade.value}>
                            {grade.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                />
              </Box>
              <Box>
                <Controller
                  name="student_id"
                  control={editControl}
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
              </Box>
              <Box>
                <Controller
                  name="email"
                  control={editControl}
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
              </Box>
              <Box>
                <Controller
                  name="date_of_birth"
                  control={editControl}
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
              </Box>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Updating...' : 'Update Student'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Enrollment Dialog */}
      <Dialog open={enrollDialogOpen} onClose={() => setEnrollDialogOpen(false)} maxWidth="md" fullWidth>
        <form onSubmit={enrollForm.handleSubmit(handleEnroll)}>
          <DialogTitle>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="h6">Enroll Student</Typography>
                <Typography variant="subtitle2" color="text.secondary">
                  {selectedStudent?.first_name} {selectedStudent?.last_name} (Grade {selectedStudent?.current_grade_level})
                </Typography>
              </Box>
              <IconButton onClick={() => setEnrollDialogOpen(false)} size="small">
                <CloseIcon />
              </IconButton>
            </Stack>
          </DialogTitle>
          <DialogContent sx={{ pt: 2 }}>
            {enrollMutation.error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                Failed to enroll student: {String(enrollMutation.error)}
              </Alert>
            )}
            {!activeYear && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <SchoolIcon />
                  <Box>
                    <Typography variant="subtitle2">No Active Academic Year</Typography>
                    <Typography variant="body2">Please set an active year first to enable enrollments.</Typography>
                  </Box>
                </Stack>
              </Alert>
            )}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Box>
                <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <SchoolIcon color="primary" />
                  Select Classroom
                </Typography>
                <Controller
                  name="classroom_id"
                  control={enrollForm.control}
                  rules={{ required: 'Please select a classroom' }}
                  render={({ field, fieldState }) => (
                    <FormControl fullWidth error={!!fieldState.error}>
                      <InputLabel>Classroom</InputLabel>
                      <Select {...field} label="Classroom" size="medium">
                        {availableClassrooms.length === 0 && (
                          <MenuItem disabled>
                            <Typography variant="body2" color="text.secondary">
                              No classrooms available for the active academic year
                            </Typography>
                          </MenuItem>
                        )}
                        {availableClassrooms.map((classroom) => (
                          <MenuItem key={classroom.id} value={classroom.id}>
                            <Stack direction="column" spacing={0}>
                              <Typography variant="body1" fontWeight="medium">
                                {classroom.name}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {classroom.subject?.name || 'No Subject'}{classroom.room && ` • ${classroom.room.name}`}
                              </Typography>
                            </Stack>
                          </MenuItem>
                        ))}
                      </Select>
                      {availableClassrooms.length === 0 && (
                        <FormHelperText>
                          Found {classrooms.length} total classrooms • Active Year: {activeYear?.name || 'None'}
                        </FormHelperText>
                      )}
                      {fieldState.error && (
                        <FormHelperText error>
                          {fieldState.error.message}
                        </FormHelperText>
                      )}
                    </FormControl>
                  )}
                />
              </Box>
              <Box>
                <Typography variant="subtitle1" gutterBottom>
                  Enrollment Date
                </Typography>
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
                      size="medium"
                    />
                  )}
                />
              </Box>
              <Box>
                <Typography variant="subtitle1" gutterBottom>
                  Grade Level
                </Typography>
                <TextField
                  value={selectedStudent?.current_grade_level || ''}
                  label="Student's Current Grade"
                  fullWidth
                  disabled
                  size="medium"
                  helperText="Based on student's current grade level"
                />
              </Box>
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
            <Button 
              onClick={() => setEnrollDialogOpen(false)}
              variant="outlined"
              size="large"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="contained" 
              disabled={enrollMutation.isPending || !activeYear || availableClassrooms.length === 0}
              startIcon={enrollMutation.isPending ? null : <PersonAddIcon />}
              size="large"
            >
              {enrollMutation.isPending ? 'Enrolling...' : 'Enroll Student'}
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

      {/* Enhanced Bulk Enrollment Dialog */}
      <EnhancedEnrollmentManager
        open={bulkEnrollDialogOpen}
        onClose={() => setBulkEnrollDialogOpen(false)}
        students={selectedStudentsForBulk}
        classrooms={availableClassrooms.map(c => ({
          id: c.id,
          name: c.name,
          subject: c.subject,
          room: c.room,
          capacity: undefined, // Add if available in your data
          enrolled_count: undefined, // Add if available in your data
          academic_year_id: activeYear?.id,
        }))}
        academicYearName={activeYear?.name}
        onEnroll={handleProcessBulkEnrollments}
      />

      {/* Three-Tier Enrollment Dialog */}
      <ThreeTierEnrollmentManager
        open={twoTierEnrollDialogOpen}
        onClose={() => setTwoTierEnrollDialogOpen(false)}
        students={selectedStudentsForTwoTier}
        academicYearId={activeYear?.id || ''}
        academicYearName={activeYear?.name}
      />
    </Box>
  );
}