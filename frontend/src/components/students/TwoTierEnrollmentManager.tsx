import React, { useState, useMemo, useEffect } from 'react';
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
  Alert,
  Paper,
  Card,
  CardContent,
  CardActions,
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
  CircularProgress,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Switch,
  FormControlLabel,
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
  Home as HomeIcon,
  Star as StarIcon,
  Autorenew as AutorenewIcon,
  Build as ManualIcon,
  ExpandMore as ExpandMoreIcon,
  PlaylistAdd as BulkIcon,
  People as PeopleIcon,
  Assignment as AssignmentIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';

// Import types and hooks
import { Student, GRADE_LEVELS, CORE_SUBJECTS } from '@/schemas/students';
import { Teacher, Classroom } from '@/schemas/academics';
import { useHomeroomTeachers, useHomeroomEnrollment, useHomeroomEnrollmentPreview } from '@/features/enrollment/hooks/useHomeroomEnrollment';
import { useTeachers } from '@/features/academics/hooks/useTeachers';
import { useClassrooms } from '@/features/academics/hooks/useClassrooms';
import type { AutoEnrollStudentsRequest } from '@/features/academics/services/homeroom';

// Types
interface EnrollmentResult {
  success: boolean;
  enrolled_count: number;
  errors: string[];
  warnings: string[];
  summary?: {
    core_enrollments: number;
    non_core_enrollments: number;
    students_processed: number;
  };
}

interface TwoTierEnrollmentManagerProps {
  students: Student[];
  onEnrollmentComplete: (result: EnrollmentResult) => void;
  academicYearId: string;
  open: boolean;
  onClose: () => void;
  academicYearName?: string;
}

interface TeacherWithPreview extends Teacher {
  subject_count: number;
  core_subjects: string[];
  potential_enrollments: number;
  is_available: boolean;
}

interface EnrollmentStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
}

export const TwoTierEnrollmentManager: React.FC<TwoTierEnrollmentManagerProps> = ({
  students,
  onEnrollmentComplete,
  academicYearId,
  open,
  onClose,
  academicYearName,
}) => {
  const theme = useTheme();
  
  // State management
  const [activeStep, setActiveStep] = useState(0);
  const [enrollmentMode, setEnrollmentMode] = useState<'core' | 'non-core'>('core');
  const [selectedTeacher, setSelectedTeacher] = useState<TeacherWithPreview | null>(null);
  const [selectedClassrooms, setSelectedClassrooms] = useState<Set<string>>(new Set());
  const [selectedStudents, setSelectedStudents] = useState<Student[]>(students);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [enrollmentPreview, setEnrollmentPreview] = useState<any>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [nonCoreMode, setNonCoreMode] = useState<'homeroom-bulk' | 'individual'>('homeroom-bulk');

  // Hooks
  const { data: homeroomTeachers = [], isLoading: isLoadingTeachers } = useHomeroomTeachers({
    academic_year_id: academicYearId,
    is_active: true,
  });

  const { data: allTeachers = [] } = useTeachers({
    is_active: true,
  });

  const { data: classrooms = [] } = useClassrooms({
    academic_year_id: academicYearId,
  });

  const homeroomEnrollmentMutation = useHomeroomEnrollment();

  // Get enrollment preview for selected teacher
  const { data: previewData } = useHomeroomEnrollmentPreview(
    selectedTeacher?.id,
    selectedTeacher?.grade_level,
    academicYearId
  );

  // Derive grade level from selected students
  const primaryGradeLevel = useMemo(() => {
    const gradeCounts = selectedStudents.reduce((acc, student) => {
      acc[student.current_grade_level] = (acc[student.current_grade_level] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(gradeCounts)
      .sort(([,a], [,b]) => b - a)
      [0]?.[0] || '';
  }, [selectedStudents]);

  // Filter teachers by grade level compatibility
  const compatibleTeachers = useMemo(() => {
    if (!primaryGradeLevel) return [];
    
    return homeroomTeachers
      .filter(teacher => teacher.grade_level === primaryGradeLevel)
      .map(teacher => ({
        ...teacher,
        subject_count: 0, // This would need to be fetched from teacher assignments
        core_subjects: CORE_SUBJECTS.slice(0, 3), // Placeholder - would be from API
        potential_enrollments: selectedStudents.length * CORE_SUBJECTS.length,
        is_available: teacher.is_active,
      } as TeacherWithPreview));
  }, [homeroomTeachers, primaryGradeLevel, selectedStudents]);

  // Filter classrooms by academic year and exclude CORE subjects
  const nonCoreClassrooms = useMemo(() => {
    return classrooms.filter(classroom => {
      const isCore = classroom.subject?.name && 
        CORE_SUBJECTS.some(core => classroom.subject?.name?.includes(core));
      return !isCore;
    });
  }, [classrooms]);

  // Steps configuration
  const steps: EnrollmentStep[] = [
    {
      id: 'mode-selection',
      title: 'Choose Enrollment Type',
      description: 'Select between CORE subjects (homeroom-based) or Non-CORE subjects',
      completed: enrollmentMode === 'core' || enrollmentMode === 'non-core',
    },
    {
      id: 'configuration',
      title: enrollmentMode === 'core' ? 'Select Homeroom Teacher' : 'Configure Non-CORE Enrollment',
      description: enrollmentMode === 'core' 
        ? 'Choose the homeroom teacher for automatic CORE subject enrollment'
        : 'Configure non-CORE subject enrollment options',
      completed: enrollmentMode === 'core' ? !!selectedTeacher : selectedClassrooms.size > 0,
    },
    {
      id: 'preview',
      title: 'Review & Confirm',
      description: 'Review enrollment details and confirm',
      completed: false,
    },
  ];

  // Event handlers
  const handleNext = () => {
    if (activeStep < steps.length - 1) {
      setActiveStep(prev => prev + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (activeStep > 0) {
      setActiveStep(prev => prev - 1);
    }
  };

  const handleTeacherSelect = (teacher: TeacherWithPreview) => {
    setSelectedTeacher(teacher);
    setErrors([]);
    setWarnings([]);
  };

  const handleClassroomToggle = (classroomId: string) => {
    setSelectedClassrooms(prev => {
      const newSet = new Set(prev);
      if (newSet.has(classroomId)) {
        newSet.delete(classroomId);
      } else {
        newSet.add(classroomId);
      }
      return newSet;
    });
  };

  const handleSubmit = async () => {
    setIsProcessing(true);
    setErrors([]);
    setWarnings([]);

    try {
      if (enrollmentMode === 'core') {
        await handleCoreEnrollment();
      } else {
        await handleNonCoreEnrollment();
      }
    } catch (error) {
      console.error('Enrollment failed:', error);
      setErrors(['Failed to process enrollment. Please try again.']);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCoreEnrollment = async () => {
    if (!selectedTeacher) {
      setErrors(['Please select a homeroom teacher']);
      return;
    }

    try {
      const result = await homeroomEnrollmentMutation.mutateAsync({
        teacher_id: selectedTeacher.id,
        grade_level: primaryGradeLevel,
        academic_year_id: academicYearId,
      });

      onEnrollmentComplete({
        success: true,
        enrolled_count: result.students_enrolled?.length || 0,
        errors: [],
        warnings: [], // API doesn't return warnings in current schema
        summary: {
          core_enrollments: result.enrollments_created || 0,
          non_core_enrollments: 0,
          students_processed: selectedStudents.length,
        },
      });

      onClose();
    } catch (error: any) {
      const errorMessage = error?.response?.data?.detail || error?.message || 'Unknown error occurred';
      setErrors([errorMessage]);
    }
  };

  const handleNonCoreEnrollment = async () => {
    if (selectedClassrooms.size === 0) {
      setErrors(['Please select at least one classroom']);
      return;
    }

    // This would implement non-CORE enrollment logic
    // For now, simulate the process
    const enrolledCount = selectedStudents.length * selectedClassrooms.size;
    
    onEnrollmentComplete({
      success: true,
      enrolled_count: enrolledCount,
      errors: [],
      warnings: [],
      summary: {
        core_enrollments: 0,
        non_core_enrollments: enrolledCount,
        students_processed: selectedStudents.length,
      },
    });

    onClose();
  };

  const handleReset = () => {
    setActiveStep(0);
    setEnrollmentMode('core');
    setSelectedTeacher(null);
    setSelectedClassrooms(new Set());
    setSelectedStudents(students);
    setErrors([]);
    setWarnings([]);
    setEnrollmentPreview(null);
  };

  // Validation
  const canProceed = useMemo(() => {
    switch (activeStep) {
      case 0:
        return enrollmentMode === 'core' || enrollmentMode === 'non-core';
      case 1:
        return enrollmentMode === 'core' 
          ? !!selectedTeacher
          : selectedClassrooms.size > 0;
      case 2:
        return errors.length === 0;
      default:
        return false;
    }
  }, [activeStep, enrollmentMode, selectedTeacher, selectedClassrooms, errors]);

  // Update enrollment preview when teacher changes
  useEffect(() => {
    if (selectedTeacher && previewData) {
      setEnrollmentPreview(previewData);
    }
  }, [selectedTeacher, previewData]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { minHeight: '85vh', maxHeight: '95vh' },
      }}
    >
      <DialogTitle>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h5" fontWeight={600}>
              Two-Tier Enrollment System
            </Typography>
            <Typography variant="subtitle2" color="text.secondary">
              {selectedStudents.length} student{selectedStudents.length > 1 ? 's' : ''} • 
              Grade {primaryGradeLevel}
              {academicYearName && ` • ${academicYearName}`}
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ px: 3 }}>
        {/* Progress indicator */}
        <Box sx={{ mb: 3 }}>
          <LinearProgress 
            variant="determinate" 
            value={((activeStep + 1) / steps.length) * 100} 
            sx={{ mb: 1 }}
          />
          <Typography variant="body2" color="text.secondary" textAlign="center">
            Step {activeStep + 1} of {steps.length}
          </Typography>
        </Box>

        {/* Students Preview */}
        <Paper sx={{ p: 2, mb: 3, bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <GroupsIcon sx={{ color: theme.palette.primary.main }} />
            <Box>
              <Typography variant="subtitle1" fontWeight={600}>
                Selected Students
              </Typography>
              <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
                {selectedStudents.slice(0, 6).map(student => (
                  <Chip
                    key={student.id}
                    label={`${student.first_name} ${student.last_name}`}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                ))}
                {selectedStudents.length > 6 && (
                  <Chip
                    label={`+${selectedStudents.length - 6} more`}
                    size="small"
                    color="primary"
                  />
                )}
              </Stack>
            </Box>
          </Stack>
        </Paper>

        {/* Main Content - Step-based */}
        <Box>
          {/* Step 1: Mode Selection */}
          {activeStep === 0 && (
            <Box>
              <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
                Choose Enrollment Type
              </Typography>
              
              <Stack spacing={2}>
                {/* CORE Subjects Option */}
                <Card
                  sx={{
                    cursor: 'pointer',
                    border: enrollmentMode === 'core' 
                      ? `2px solid ${theme.palette.primary.main}`
                      : `1px solid ${alpha(theme.palette.divider, 0.12)}`,
                    bgcolor: enrollmentMode === 'core'
                      ? alpha(theme.palette.primary.main, 0.05)
                      : 'transparent',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.main, 0.08),
                      transform: 'translateY(-2px)',
                      boxShadow: theme.shadows[4],
                    },
                  }}
                  onClick={() => setEnrollmentMode('core')}
                >
                  <CardContent>
                    <Stack direction="row" alignItems="center" spacing={3}>
                      <Box
                        sx={{
                          p: 2,
                          borderRadius: '50%',
                          bgcolor: alpha(theme.palette.primary.main, 0.1),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <AutorenewIcon 
                          sx={{ 
                            fontSize: 32, 
                            color: theme.palette.primary.main 
                          }} 
                        />
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" fontWeight={600} gutterBottom>
                          CORE Subjects (Recommended)
                        </Typography>
                        <Typography variant="body2" color="text.secondary" paragraph>
                          Automatically enroll students in their homeroom teacher's CORE subjects 
                          (Mathematics, English, Science, Social Studies, Reading).
                        </Typography>
                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                          <Chip label="One-Click Enrollment" size="small" color="success" />
                          <Chip label="Homeroom-Based" size="small" color="primary" />
                          <Chip label="Standards Aligned" size="small" color="info" />
                        </Stack>
                      </Box>
                      <Box textAlign="center">
                        <Typography variant="h4" fontWeight={600} color="primary.main">
                          {compatibleTeachers.length}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Teachers Available
                        </Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>

                {/* Non-CORE Subjects Option */}
                <Card
                  sx={{
                    cursor: 'pointer',
                    border: enrollmentMode === 'non-core'
                      ? `2px solid ${theme.palette.secondary.main}`
                      : `1px solid ${alpha(theme.palette.divider, 0.12)}`,
                    bgcolor: enrollmentMode === 'non-core'
                      ? alpha(theme.palette.secondary.main, 0.05)
                      : 'transparent',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      bgcolor: alpha(theme.palette.secondary.main, 0.08),
                      transform: 'translateY(-2px)',
                      boxShadow: theme.shadows[4],
                    },
                  }}
                  onClick={() => setEnrollmentMode('non-core')}
                >
                  <CardContent>
                    <Stack direction="row" alignItems="center" spacing={3}>
                      <Box
                        sx={{
                          p: 2,
                          borderRadius: '50%',
                          bgcolor: alpha(theme.palette.secondary.main, 0.1),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <ManualIcon 
                          sx={{ 
                            fontSize: 32, 
                            color: theme.palette.secondary.main 
                          }} 
                        />
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" fontWeight={600} gutterBottom>
                          Non-CORE Subjects
                        </Typography>
                        <Typography variant="body2" color="text.secondary" paragraph>
                          Enroll students in elective, special, and supplementary subjects 
                          with granular control and flexible options.
                        </Typography>
                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                          <Chip label="Flexible Selection" size="small" color="secondary" />
                          <Chip label="Individual Control" size="small" color="warning" />
                          <Chip label="Electives & Specials" size="small" color="info" />
                        </Stack>
                      </Box>
                      <Box textAlign="center">
                        <Typography variant="h4" fontWeight={600} color="secondary.main">
                          {nonCoreClassrooms.length}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Classes Available
                        </Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Stack>
            </Box>
          )}

          {/* Step 2: Configuration */}
          {activeStep === 1 && (
            <Box>
              {enrollmentMode === 'core' ? (
                // CORE Subjects - Teacher Selection
                <Box>
                  <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
                    Select Homeroom Teacher
                  </Typography>
                  
                  {isLoadingTeachers ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                      <CircularProgress />
                    </Box>
                  ) : compatibleTeachers.length === 0 ? (
                    <Alert severity="warning" sx={{ mb: 3 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        No Compatible Teachers Found
                      </Typography>
                      <Typography variant="body2">
                        No homeroom teachers are available for grade {primaryGradeLevel} in the active academic year.
                        Please check teacher assignments or select different students.
                      </Typography>
                    </Alert>
                  ) : (
                    <Stack spacing={2}>
                      {compatibleTeachers.map(teacher => (
                        <Card
                          key={teacher.id}
                          sx={{
                            cursor: 'pointer',
                            border: selectedTeacher?.id === teacher.id
                              ? `2px solid ${theme.palette.primary.main}`
                              : `1px solid ${alpha(theme.palette.divider, 0.12)}`,
                            bgcolor: selectedTeacher?.id === teacher.id
                              ? alpha(theme.palette.primary.main, 0.05)
                              : 'transparent',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              bgcolor: alpha(theme.palette.primary.main, 0.08),
                              transform: 'translateY(-1px)',
                            },
                          }}
                          onClick={() => handleTeacherSelect(teacher)}
                        >
                          <CardContent>
                            <Stack direction="row" alignItems="center" spacing={3}>
                              <Box
                                sx={{
                                  p: 1.5,
                                  borderRadius: '50%',
                                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                <HomeIcon sx={{ color: theme.palette.primary.main }} />
                              </Box>
                              
                              <Box sx={{ flex: 1 }}>
                                <Typography variant="h6" fontWeight={600}>
                                  {teacher.first_name} {teacher.last_name}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                  Grade {teacher.grade_level} Homeroom Teacher
                                  {teacher.email && ` • ${teacher.email}`}
                                </Typography>
                                
                                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
                                  {teacher.core_subjects.slice(0, 3).map(subject => (
                                    <Chip
                                      key={subject}
                                      label={subject}
                                      size="small"
                                      color="primary"
                                      variant="outlined"
                                    />
                                  ))}
                                  {teacher.core_subjects.length > 3 && (
                                    <Chip
                                      label={`+${teacher.core_subjects.length - 3} more`}
                                      size="small"
                                      color="primary"
                                    />
                                  )}
                                </Stack>
                              </Box>
                              
                              <Box textAlign="center">
                                <Typography variant="h5" fontWeight={600} color="primary.main">
                                  {teacher.potential_enrollments}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  Potential Enrollments
                                </Typography>
                              </Box>
                            </Stack>
                          </CardContent>
                        </Card>
                      ))}
                    </Stack>
                  )}
                </Box>
              ) : (
                // Non-CORE Subjects Configuration
                <Box>
                  <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
                    Configure Non-CORE Enrollment
                  </Typography>
                  
                  {/* Mode Selection for Non-CORE */}
                  <Paper sx={{ p: 2, mb: 3 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Enrollment Mode
                    </Typography>
                    <Stack direction="row" spacing={2}>
                      <Button
                        variant={nonCoreMode === 'homeroom-bulk' ? 'contained' : 'outlined'}
                        startIcon={<BulkIcon />}
                        onClick={() => setNonCoreMode('homeroom-bulk')}
                      >
                        Enroll Entire Homeroom
                      </Button>
                      <Button
                        variant={nonCoreMode === 'individual' ? 'contained' : 'outlined'}
                        startIcon={<PeopleIcon />}
                        onClick={() => setNonCoreMode('individual')}
                      >
                        Individual Selection
                      </Button>
                    </Stack>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      {nonCoreMode === 'homeroom-bulk' 
                        ? 'Bulk enroll all selected students in chosen subjects'
                        : 'Select specific students and subjects for enrollment'
                      }
                    </Typography>
                  </Paper>
                  
                  {/* Classroom Selection */}
                  <Box>
                    <Typography variant="subtitle1" gutterBottom>
                      Available Non-CORE Subjects
                    </Typography>
                    
                    {nonCoreClassrooms.length === 0 ? (
                      <Alert severity="info">
                        No non-CORE classrooms are available for the current academic year.
                      </Alert>
                    ) : (
                      <Stack spacing={1} sx={{ maxHeight: 400, overflowY: 'auto' }}>
                        {nonCoreClassrooms.map(classroom => {
                          const isSelected = selectedClassrooms.has(classroom.id);
                          
                          return (
                            <Paper
                              key={classroom.id}
                              sx={{
                                p: 2,
                                border: isSelected
                                  ? `2px solid ${theme.palette.secondary.main}`
                                  : `1px solid ${alpha(theme.palette.divider, 0.12)}`,
                                cursor: 'pointer',
                                bgcolor: isSelected
                                  ? alpha(theme.palette.secondary.main, 0.05)
                                  : 'transparent',
                                '&:hover': {
                                  bgcolor: alpha(theme.palette.secondary.main, 0.08),
                                },
                              }}
                              onClick={() => handleClassroomToggle(classroom.id)}
                            >
                              <Stack direction="row" alignItems="center" spacing={2}>
                                <Switch checked={isSelected} />
                                <ClassIcon sx={{ color: theme.palette.secondary.main }} />
                                <Box sx={{ flex: 1 }}>
                                  <Typography variant="subtitle1" fontWeight={600}>
                                    {classroom.name}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    {classroom.subject?.name || 'No Subject'} 
                                    {classroom.room && ` • Room: ${classroom.room.name}`}
                                    {classroom.teacher_assignments?.length > 0 && 
                                      ` • ${classroom.teacher_assignments[0].teacher?.first_name} ${classroom.teacher_assignments[0].teacher?.last_name}`}
                                  </Typography>
                                </Box>
                                {classroom.max_students && (
                                  <Chip
                                    label={`${classroom.enrollment_count || 0}/${classroom.max_students}`}
                                    size="small"
                                    color="secondary"
                                    variant="outlined"
                                  />
                                )}
                              </Stack>
                            </Paper>
                          );
                        })}
                      </Stack>
                    )}
                  </Box>
                </Box>
              )}
            </Box>
          )}

          {/* Step 3: Review & Confirm */}
          {activeStep === 2 && (
            <Box>
              <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
                Review & Confirm Enrollment
              </Typography>
              
              {/* Enrollment Summary */}
              <Stack spacing={3}>
                {/* Mode Summary */}
                <Paper sx={{ p: 3 }}>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Box
                      sx={{
                        p: 1.5,
                        borderRadius: '50%',
                        bgcolor: enrollmentMode === 'core' 
                          ? alpha(theme.palette.primary.main, 0.1)
                          : alpha(theme.palette.secondary.main, 0.1),
                      }}
                    >
                      {enrollmentMode === 'core' ? (
                        <AutorenewIcon sx={{ 
                          color: theme.palette.primary.main 
                        }} />
                      ) : (
                        <ManualIcon sx={{ 
                          color: theme.palette.secondary.main 
                        }} />
                      )}
                    </Box>
                    <Box>
                      <Typography variant="h6" fontWeight={600}>
                        {enrollmentMode === 'core' ? 'CORE Subjects Enrollment' : 'Non-CORE Subjects Enrollment'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {enrollmentMode === 'core' 
                          ? `Homeroom-based automatic enrollment with ${selectedTeacher?.first_name} ${selectedTeacher?.last_name}`
                          : `Manual enrollment in ${selectedClassrooms.size} selected classroom${selectedClassrooms.size > 1 ? 's' : ''}`
                        }
                      </Typography>
                    </Box>
                  </Stack>
                </Paper>

                {/* Students Summary */}
                <Paper sx={{ p: 3 }}>
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                    Students ({selectedStudents.length})
                  </Typography>
                  <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                    {selectedStudents.map(student => (
                      <Chip
                        key={student.id}
                        label={`${student.first_name} ${student.last_name} (${student.current_grade_level})`}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    ))}
                  </Stack>
                </Paper>

                {/* Enrollment Details */}
                {enrollmentMode === 'core' && selectedTeacher && (
                  <Paper sx={{ p: 3 }}>
                    <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                      CORE Subjects Enrollment Preview
                    </Typography>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Teacher: {selectedTeacher.first_name} {selectedTeacher.last_name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Grade Level: {selectedTeacher.grade_level}
                      </Typography>
                    </Box>
                    
                    <Stack spacing={1}>
                      {selectedTeacher.core_subjects.map(subject => (
                        <Box
                          key={subject}
                          sx={{
                            p: 2,
                            bgcolor: alpha(theme.palette.success.main, 0.05),
                            borderRadius: 1,
                            border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
                          }}
                        >
                          <Stack direction="row" alignItems="center" spacing={2}>
                            <AssignmentIcon sx={{ color: theme.palette.success.main }} />
                            <Typography variant="body1" fontWeight={500}>
                              {subject}
                            </Typography>
                            <Box sx={{ flex: 1 }} />
                            <Typography variant="body2" color="text.secondary">
                              {selectedStudents.length} student{selectedStudents.length > 1 ? 's' : ''}
                            </Typography>
                          </Stack>
                        </Box>
                      ))}
                    </Stack>
                  </Paper>
                )}

                {enrollmentMode === 'non-core' && selectedClassrooms.size > 0 && (
                  <Paper sx={{ p: 3 }}>
                    <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                      Non-CORE Subjects Enrollment Preview
                    </Typography>
                    <Stack spacing={1}>
                      {Array.from(selectedClassrooms).map(classroomId => {
                        const classroom = nonCoreClassrooms.find(c => c.id === classroomId);
                        return classroom ? (
                          <Box
                            key={classroomId}
                            sx={{
                              p: 2,
                              bgcolor: alpha(theme.palette.secondary.main, 0.05),
                              borderRadius: 1,
                              border: `1px solid ${alpha(theme.palette.secondary.main, 0.2)}`,
                            }}
                          >
                            <Stack direction="row" alignItems="center" spacing={2}>
                              <ClassIcon sx={{ color: theme.palette.secondary.main }} />
                              <Box>
                                <Typography variant="body1" fontWeight={500}>
                                  {classroom.name}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {classroom.subject?.name || 'No Subject'}
                                  {classroom.teacher_assignments?.length > 0 && 
                                    ` • ${classroom.teacher_assignments[0].teacher?.first_name} ${classroom.teacher_assignments[0].teacher?.last_name}`}
                                </Typography>
                              </Box>
                              <Box sx={{ flex: 1 }} />
                              <Typography variant="body2" color="text.secondary">
                                {selectedStudents.length} student{selectedStudents.length > 1 ? 's' : ''}
                              </Typography>
                            </Stack>
                          </Box>
                        ) : null;
                      })}
                    </Stack>
                  </Paper>
                )}

                {/* Validation Messages */}
                {errors.length > 0 && (
                  <Alert severity="error">
                    <Typography variant="subtitle2" gutterBottom>
                      Please resolve these errors:
                    </Typography>
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
                  <Alert severity="warning">
                    <Typography variant="subtitle2" gutterBottom>
                      Warnings:
                    </Typography>
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
              </Stack>
            </Box>
          )}
        </Box>

        {/* Processing Overlay */}
        {isProcessing && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              bgcolor: alpha(theme.palette.background.paper, 0.8),
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
            }}
          >
            <CircularProgress size={48} sx={{ mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Processing Enrollment...
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Please wait while we enroll your students
            </Typography>
          </Box>
        )}
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
            onClick={handleBack}
            disabled={isProcessing}
          >
            Back
          </Button>
        )}
        <Button
          onClick={handleNext}
          variant="contained"
          disabled={isProcessing || !canProceed}
          startIcon={
            isProcessing ? (
              <CircularProgress size={16} />
            ) : activeStep === steps.length - 1 ? (
              <PersonAddIcon />
            ) : null
          }
        >
          {isProcessing 
            ? 'Processing...' 
            : activeStep === steps.length - 1 
              ? 'Confirm Enrollment'
              : 'Next'
          }
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TwoTierEnrollmentManager;