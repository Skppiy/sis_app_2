import React, { useState } from 'react';
import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Stack,
  Chip,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Checkbox,
  FormControlLabel,
  Alert,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Tooltip,
  Badge,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  alpha,
  useTheme,
} from '@mui/material';
import {
  School as SchoolIcon,
  PersonAdd as PersonAddIcon,
  Class as ClassIcon,
  Schedule as ScheduleIcon,
  Groups as GroupsIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Close as CloseIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { Student, GRADE_LEVELS } from '@/schemas/students';

interface Classroom {
  id: string;
  name: string;
  subject?: { name: string };
  room?: { name: string };
  capacity?: number;
  enrolled_count?: number;
  grade_levels?: string[];
  academic_year_id?: string;
  teacher?: { first_name: string; last_name: string };
}

interface EnrollmentSelection {
  classroom_id: string;
  students: Student[];
  grade_level: string;
  enrollment_date: string;
  is_audit_only: boolean;
  requires_accommodation: boolean;
}

interface EnhancedEnrollmentManagerProps {
  open: boolean;
  onClose: () => void;
  students: Student[];
  classrooms: Classroom[];
  academicYearName?: string;
  onEnroll: (enrollments: EnrollmentSelection[]) => Promise<void>;
  onMultiClassroomEnroll?: (studentId: string, classroomIds: string[], options: any) => Promise<void>;
}

export const EnhancedEnrollmentManager: React.FC<EnhancedEnrollmentManagerProps> = ({
  open,
  onClose,
  students,
  classrooms,
  academicYearName,
  onEnroll,
  onMultiClassroomEnroll,
}) => {
  const theme = useTheme();
  const [activeStep, setActiveStep] = useState(0);
  const [enrollmentSelections, setEnrollmentSelections] = useState<EnrollmentSelection[]>([]);
  const [selectedClassrooms, setSelectedClassrooms] = useState<Set<string>>(new Set());
  const [enrollmentDate, setEnrollmentDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [defaultGradeLevel, setDefaultGradeLevel] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);

  const steps = [
    'Select Classrooms',
    'Configure Enrollments',
    'Review & Confirm',
  ];

  // Validation functions
  const validateClassroomCapacity = (classroom: Classroom, studentCount: number) => {
    if (classroom.capacity && classroom.enrolled_count) {
      const available = classroom.capacity - classroom.enrolled_count;
      return available >= studentCount;
    }
    return true; // Assume valid if no capacity info
  };

  const validateGradeLevel = (classroom: Classroom, gradeLevel: string) => {
    if (classroom.grade_levels && classroom.grade_levels.length > 0) {
      return classroom.grade_levels.includes(gradeLevel);
    }
    return true; // Assume valid if no grade restrictions
  };

  // Step 1: Classroom Selection
  const handleClassroomToggle = (classroomId: string) => {
    setSelectedClassrooms(prev => {
      const newSet = new Set(prev);
      if (newSet.has(classroomId)) {
        newSet.delete(classroomId);
        // Remove from enrollments
        setEnrollmentSelections(prevEnrollments => 
          prevEnrollments.filter(e => e.classroom_id !== classroomId)
        );
      } else {
        newSet.add(classroomId);
        // Add to enrollments
        setEnrollmentSelections(prevEnrollments => [
          ...prevEnrollments,
          {
            classroom_id: classroomId,
            students: [...students],
            grade_level: defaultGradeLevel,
            enrollment_date: enrollmentDate,
            is_audit_only: false,
            requires_accommodation: false,
          },
        ]);
      }
      return newSet;
    });
  };

  // Step 2: Configure enrollments
  const updateEnrollmentSelection = (
    classroomId: string,
    updates: Partial<EnrollmentSelection>
  ) => {
    setEnrollmentSelections(prev =>
      prev.map(enrollment =>
        enrollment.classroom_id === classroomId
          ? { ...enrollment, ...updates }
          : enrollment
      )
    );
  };

  const toggleStudentForClassroom = (classroomId: string, student: Student) => {
    setEnrollmentSelections(prev =>
      prev.map(enrollment => {
        if (enrollment.classroom_id === classroomId) {
          const isCurrentlySelected = enrollment.students.some(s => s.id === student.id);
          const newStudents = isCurrentlySelected
            ? enrollment.students.filter(s => s.id !== student.id)
            : [...enrollment.students, student];
          return { ...enrollment, students: newStudents };
        }
        return enrollment;
      })
    );
  };

  // Step 3: Validation and submission
  const validateEnrollments = () => {
    const newErrors: string[] = [];
    const newWarnings: string[] = [];

    enrollmentSelections.forEach(enrollment => {
      const classroom = classrooms.find(c => c.id === enrollment.classroom_id);
      if (!classroom) return;

      // Check capacity
      if (!validateClassroomCapacity(classroom, enrollment.students.length)) {
        newErrors.push(`${classroom.name}: Exceeds capacity`);
      }

      // Check grade levels
      enrollment.students.forEach(student => {
        if (!validateGradeLevel(classroom, enrollment.grade_level)) {
          newWarnings.push(
            `${student.first_name} ${student.last_name}: Grade ${enrollment.grade_level} may not be appropriate for ${classroom.name}`
          );
        }
      });

      // Check empty enrollments
      if (enrollment.students.length === 0) {
        newWarnings.push(`${classroom.name}: No students selected`);
      }
    });

    setErrors(newErrors);
    setWarnings(newWarnings);
    return newErrors.length === 0;
  };

  const handleNext = () => {
    if (activeStep === steps.length - 1) {
      handleSubmit();
    } else if (activeStep === 1) {
      if (validateEnrollments()) {
        setActiveStep(prev => prev + 1);
      }
    } else {
      setActiveStep(prev => prev + 1);
    }
  };

  const handleSubmit = async () => {
    setIsProcessing(true);
    try {
      // Filter out empty enrollments
      const validEnrollments = enrollmentSelections.filter(e => e.students.length > 0);
      await onEnroll(validEnrollments);
      onClose();
      // Reset state
      setActiveStep(0);
      setEnrollmentSelections([]);
      setSelectedClassrooms(new Set());
    } catch (error) {
      console.error('Failed to enroll students:', error);
      setErrors(['Failed to process enrollments. Please try again.']);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setActiveStep(0);
    setEnrollmentSelections([]);
    setSelectedClassrooms(new Set());
    setErrors([]);
    setWarnings([]);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { minHeight: '80vh' },
      }}
    >
      <DialogTitle>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h5" fontWeight={600}>
              Multi-Classroom Enrollment
            </Typography>
            <Typography variant="subtitle2" color="text.secondary">
              Enroll {students.length} student{students.length > 1 ? 's' : ''} into multiple classrooms
              {academicYearName && ` • ${academicYearName}`}
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ px: 3 }}>
        {/* Students Preview */}
        <Paper sx={{ p: 2, mb: 3, bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <GroupsIcon sx={{ color: theme.palette.primary.main }} />
            <Box>
              <Typography variant="subtitle1" fontWeight={600}>
                Selected Students
              </Typography>
              <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
                {students.slice(0, 8).map(student => (
                  <Chip
                    key={student.id}
                    label={`${student.first_name} ${student.last_name} (${student.current_grade_level})`}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                ))}
                {students.length > 8 && (
                  <Chip
                    label={`+${students.length - 8} more`}
                    size="small"
                    color="primary"
                  />
                )}
              </Stack>
            </Box>
          </Stack>
        </Paper>

        {/* Stepper */}
        <Stepper activeStep={activeStep} orientation="vertical">
          {/* Step 1: Select Classrooms */}
          <Step>
            <StepLabel>
              <Typography variant="h6">Select Classrooms</Typography>
            </StepLabel>
            <StepContent>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Choose the classrooms where you want to enroll the selected students.
              </Typography>
              
              <Stack spacing={2}>
                {/* Quick Settings */}
                <Paper sx={{ p: 2, bgcolor: alpha(theme.palette.background.default, 0.5) }}>
                  <Typography variant="subtitle2" sx={{ mb: 2 }}>Quick Settings</Typography>
                  <Stack direction="row" spacing={2}>
                    <TextField
                      label="Default Enrollment Date"
                      type="date"
                      value={enrollmentDate}
                      onChange={(e) => setEnrollmentDate(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      size="small"
                      sx={{ minWidth: 180 }}
                    />
                    <FormControl size="small" sx={{ minWidth: 150 }}>
                      <InputLabel>Default Grade</InputLabel>
                      <Select
                        value={defaultGradeLevel}
                        onChange={(e) => setDefaultGradeLevel(e.target.value)}
                        label="Default Grade"
                      >
                        {GRADE_LEVELS.map(grade => (
                          <MenuItem key={grade.value} value={grade.value}>
                            {grade.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Stack>
                </Paper>

                {/* Classroom List */}
                <Stack spacing={1} sx={{ maxHeight: 400, overflowY: 'auto' }}>
                  {classrooms.map(classroom => {
                    const isSelected = selectedClassrooms.has(classroom.id);
                    const capacityIssue = !validateClassroomCapacity(classroom, students.length);
                    
                    return (
                      <Paper
                        key={classroom.id}
                        sx={{
                          p: 2,
                          border: isSelected 
                            ? `2px solid ${theme.palette.primary.main}`
                            : `1px solid ${alpha(theme.palette.divider, 0.12)}`,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          bgcolor: isSelected 
                            ? alpha(theme.palette.primary.main, 0.05)
                            : 'transparent',
                          '&:hover': {
                            bgcolor: alpha(theme.palette.primary.main, 0.08),
                            transform: 'translateY(-1px)',
                          },
                        }}
                        onClick={() => handleClassroomToggle(classroom.id)}
                      >
                        <Stack direction="row" alignItems="center" spacing={2}>
                          <Checkbox
                            checked={isSelected}
                            onChange={() => {}}
                            color="primary"
                          />
                          
                          <ClassIcon sx={{ color: theme.palette.primary.main }} />
                          
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="subtitle1" fontWeight={600}>
                              {classroom.name}
                            </Typography>
                            <Stack direction="row" spacing={1} alignItems="center">
                              {classroom.subject && (
                                <Typography variant="body2" color="text.secondary">
                                  {classroom.subject.name}
                                </Typography>
                              )}
                              {classroom.room && (
                                <Typography variant="body2" color="text.secondary">
                                  • {classroom.room.name}
                                </Typography>
                              )}
                              {classroom.teacher && (
                                <Typography variant="body2" color="text.secondary">
                                  • {classroom.teacher.first_name} {classroom.teacher.last_name}
                                </Typography>
                              )}
                            </Stack>
                          </Box>

                          <Stack alignItems="center" spacing={0.5}>
                            {classroom.capacity && (
                              <Badge
                                badgeContent={`${classroom.enrolled_count || 0}/${classroom.capacity}`}
                                color={capacityIssue ? 'error' : 'primary'}
                                sx={{
                                  '& .MuiBadge-badge': {
                                    fontSize: '0.7rem',
                                  },
                                }}
                              >
                                <GroupsIcon />
                              </Badge>
                            )}
                            {capacityIssue && (
                              <WarningIcon color="error" sx={{ fontSize: 18 }} />
                            )}
                          </Stack>
                        </Stack>
                      </Paper>
                    );
                  })}
                </Stack>
              </Stack>
            </StepContent>
          </Step>

          {/* Step 2: Configure Enrollments */}
          <Step>
            <StepLabel>
              <Typography variant="h6">Configure Enrollments</Typography>
            </StepLabel>
            <StepContent>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Customize enrollment settings for each classroom and select which students to enroll.
              </Typography>

              <Stack spacing={3}>
                {enrollmentSelections.map(enrollment => {
                  const classroom = classrooms.find(c => c.id === enrollment.classroom_id);
                  if (!classroom) return null;

                  return (
                    <Paper key={enrollment.classroom_id} sx={{ p: 3 }}>
                      <Stack spacing={2}>
                        {/* Classroom Header */}
                        <Stack direction="row" alignItems="center" spacing={2}>
                          <ClassIcon sx={{ color: theme.palette.primary.main }} />
                          <Box>
                            <Typography variant="subtitle1" fontWeight={600}>
                              {classroom.name}
                            </Typography>
                            {classroom.subject && (
                              <Typography variant="body2" color="text.secondary">
                                {classroom.subject.name}
                              </Typography>
                            )}
                          </Box>
                          <Box sx={{ flex: 1 }} />
                          <Typography variant="body2" color="primary.main" fontWeight={500}>
                            {enrollment.students.length} of {students.length} students
                          </Typography>
                        </Stack>

                        <Divider />

                        {/* Enrollment Settings */}
                        <Stack direction="row" spacing={2}>
                          <TextField
                            label="Enrollment Date"
                            type="date"
                            value={enrollment.enrollment_date}
                            onChange={(e) => updateEnrollmentSelection(
                              enrollment.classroom_id,
                              { enrollment_date: e.target.value }
                            )}
                            InputLabelProps={{ shrink: true }}
                            size="small"
                            sx={{ minWidth: 180 }}
                          />
                          
                          <FormControl size="small" sx={{ minWidth: 150 }}>
                            <InputLabel>Grade Level</InputLabel>
                            <Select
                              value={enrollment.grade_level}
                              onChange={(e) => updateEnrollmentSelection(
                                enrollment.classroom_id,
                                { grade_level: e.target.value }
                              )}
                              label="Grade Level"
                            >
                              {GRADE_LEVELS.map(grade => (
                                <MenuItem key={grade.value} value={grade.value}>
                                  {grade.label}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>

                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={enrollment.is_audit_only}
                                onChange={(e) => updateEnrollmentSelection(
                                  enrollment.classroom_id,
                                  { is_audit_only: e.target.checked }
                                )}
                              />
                            }
                            label="Audit Only"
                          />

                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={enrollment.requires_accommodation}
                                onChange={(e) => updateEnrollmentSelection(
                                  enrollment.classroom_id,
                                  { requires_accommodation: e.target.checked }
                                )}
                              />
                            }
                            label="Requires Accommodation"
                          />
                        </Stack>

                        {/* Student Selection */}
                        <Box>
                          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                            <Typography variant="subtitle2">Select Students</Typography>
                            <Stack direction="row" spacing={1}>
                              <Button
                                size="small"
                                onClick={() => updateEnrollmentSelection(
                                  enrollment.classroom_id,
                                  { students: [...students] }
                                )}
                              >
                                All
                              </Button>
                              <Button
                                size="small"
                                onClick={() => updateEnrollmentSelection(
                                  enrollment.classroom_id,
                                  { students: [] }
                                )}
                              >
                                None
                              </Button>
                            </Stack>
                          </Stack>
                          
                          <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                            {students.map(student => {
                              const isSelected = enrollment.students.some(s => s.id === student.id);
                              return (
                                <Chip
                                  key={student.id}
                                  label={`${student.first_name} ${student.last_name}`}
                                  color={isSelected ? 'primary' : 'default'}
                                  variant={isSelected ? 'filled' : 'outlined'}
                                  onClick={() => toggleStudentForClassroom(enrollment.classroom_id, student)}
                                  clickable
                                  size="small"
                                />
                              );
                            })}
                          </Stack>
                        </Box>
                      </Stack>
                    </Paper>
                  );
                })}
              </Stack>
            </StepContent>
          </Step>

          {/* Step 3: Review & Confirm */}
          <Step>
            <StepLabel>
              <Typography variant="h6">Review & Confirm</Typography>
            </StepLabel>
            <StepContent>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Review all enrollment details before confirming.
              </Typography>

              {/* Validation Messages */}
              {errors.length > 0 && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>Errors found:</Typography>
                  <List dense>
                    {errors.map((error, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          <ErrorIcon color="error" sx={{ fontSize: 16 }} />
                        </ListItemIcon>
                        <ListItemText primary={error} />
                      </ListItem>
                    ))}
                  </List>
                </Alert>
              )}

              {warnings.length > 0 && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>Warnings:</Typography>
                  <List dense>
                    {warnings.map((warning, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          <WarningIcon color="warning" sx={{ fontSize: 16 }} />
                        </ListItemIcon>
                        <ListItemText primary={warning} />
                      </ListItem>
                    ))}
                  </List>
                </Alert>
              )}

              {/* Enrollment Summary */}
              <Stack spacing={2}>
                {enrollmentSelections.filter(e => e.students.length > 0).map(enrollment => {
                  const classroom = classrooms.find(c => c.id === enrollment.classroom_id);
                  if (!classroom) return null;

                  return (
                    <Paper key={enrollment.classroom_id} sx={{ p: 2 }}>
                      <Stack direction="row" alignItems="center" spacing={2}>
                        <CheckCircleIcon sx={{ color: theme.palette.success.main }} />
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="subtitle1" fontWeight={600}>
                            {classroom.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {enrollment.students.length} student{enrollment.students.length > 1 ? 's' : ''} • 
                            Grade {enrollment.grade_level} • 
                            {format(new Date(enrollment.enrollment_date), 'MMM dd, yyyy')}
                            {enrollment.is_audit_only && ' • Audit Only'}
                            {enrollment.requires_accommodation && ' • Requires Accommodation'}
                          </Typography>
                        </Box>
                      </Stack>
                    </Paper>
                  );
                })}
              </Stack>
            </StepContent>
          </Step>
        </Stepper>
      </DialogContent>

      <DialogActions sx={{ p: 3, gap: 1 }}>
        <Button onClick={handleReset} disabled={isProcessing}>
          Reset
        </Button>
        <Button onClick={onClose} disabled={isProcessing}>
          Cancel
        </Button>
        <Box sx={{ flex: 1 }} />
        {activeStep > 0 && (
          <Button
            onClick={() => setActiveStep(prev => prev - 1)}
            disabled={isProcessing}
          >
            Back
          </Button>
        )}
        <Button
          onClick={handleNext}
          variant="contained"
          disabled={
            isProcessing ||
            (activeStep === 0 && selectedClassrooms.size === 0) ||
            (activeStep === steps.length - 1 && errors.length > 0)
          }
          startIcon={
            isProcessing ? null : 
            activeStep === steps.length - 1 ? <PersonAddIcon /> : null
          }
        >
          {isProcessing 
            ? 'Processing...' 
            : activeStep === steps.length - 1 
              ? 'Confirm Enrollments'
              : 'Next'
          }
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EnhancedEnrollmentManager;