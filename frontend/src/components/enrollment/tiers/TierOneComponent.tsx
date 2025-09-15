import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Stack,
  Button,
  Card,
  CardContent,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  LinearProgress,
  CircularProgress,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  alpha,
  useTheme,
} from '@mui/material';
import {
  AutoAwesome as AutoIcon,
  Home as HomeIcon,
  School as SchoolIcon,
  Assignment as SubjectIcon,
  PlayArrow as StartIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  ExpandMore as ExpandMoreIcon,
  Speed as FastIcon,
} from '@mui/icons-material';

import type { Student } from '@/schemas/students';
import type { BulkHomeroomEnrollmentResponse } from '@/schemas/threeTierEnrollment';
import { 
  useBulkHomeroomEnrollment,
  useBulkEnrollmentValidation
} from '@/features/enrollment/hooks/useThreeTierEnrollment';
import { useHomeroomTeachers } from '@/features/enrollment/hooks/useHomeroomEnrollment';
import { ELEMENTARY_GRADES } from '@/schemas/threeTierEnrollment';

interface TierOneComponentProps {
  students: Student[];
  academicYearId: string;
  gradeLevel: string;
  onComplete: (results: BulkHomeroomEnrollmentResponse) => void;
  tiersInfo?: {
    name: string;
    description: string;
    use_case: string;
    subjects: string[];
    automation_level: string;
  };
}

export const TierOneComponent: React.FC<TierOneComponentProps> = ({
  students,
  academicYearId,
  gradeLevel,
  onComplete,
  tiersInfo,
}) => {
  const theme = useTheme();
  
  // State
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [enrollmentResult, setEnrollmentResult] = useState<BulkHomeroomEnrollmentResponse | null>(null);
  
  // Hooks
  const bulkEnrollmentMutation = useBulkHomeroomEnrollment();
  const { validationResult, validateRequest } = useBulkEnrollmentValidation();
  const { data: homeroomTeachers, isLoading: loadingTeachers } = useHomeroomTeachers({
    academic_year_id: academicYearId,
    grade_level: gradeLevel,
    is_active: true,
  });

  // Validation
  const isValidGrade = ['K', '1', '2', '3', '4', '5'].includes(gradeLevel);
  const studentIds = students.map(s => s.id);

  // Validate enrollment request on mount and when dependencies change
  React.useEffect(() => {
    if (isValidGrade && studentIds.length > 0) {
      validateRequest(studentIds, gradeLevel, academicYearId);
    }
  }, [studentIds.length, gradeLevel, academicYearId, isValidGrade, validateRequest]);

  // Enrollment stats
  const enrollmentStats = useMemo(() => {
    const coreSubjects = tiersInfo?.subjects || [
      'Mathematics',
      'English Language Arts',
      'Science',
      'Social Studies',
      'Reading'
    ];
    
    const estimatedEnrollments = students.length * coreSubjects.length;
    const availableTeachers = homeroomTeachers?.length || 0;
    
    return {
      students: students.length,
      coreSubjectsCount: coreSubjects.length,
      estimatedEnrollments,
      availableTeachers,
      coreSubjects: coreSubjects
    };
  }, [students.length, tiersInfo, homeroomTeachers]);

  // Handle enrollment
  const handleStartEnrollment = async () => {
    setIsEnrolling(true);
    
    try {
      const result = await bulkEnrollmentMutation.mutateAsync({
        academic_year_id: academicYearId,
        grade_level: gradeLevel,
        students: studentIds,
        auto_create_missing_assignments: true
      });
      
      setEnrollmentResult(result);
      onComplete(result);
    } catch (error) {
      console.error('Bulk enrollment failed:', error);
    } finally {
      setIsEnrolling(false);
    }
  };

  // Loading state
  if (loadingTeachers) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  // Invalid grade level
  if (!isValidGrade) {
    return (
      <Alert severity="error">
        <Typography variant="subtitle2" gutterBottom>
          Invalid Grade Level for Tier 1 Enrollment
        </Typography>
        <Typography variant="body2">
          Tier 1 bulk homeroom enrollment is only available for elementary grades (K-5).
          Current grade level: {gradeLevel}
        </Typography>
      </Alert>
    );
  }

  // Success state
  if (enrollmentResult) {
    return (
      <Box>
        <Alert severity="success" sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Bulk Homeroom Enrollment Completed Successfully!
          </Typography>
          <Typography variant="body2">
            {enrollmentResult.summary.total_enrollments_created} enrollments created for {enrollmentResult.summary.total_students_processed} students
          </Typography>
        </Alert>

        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">Enrollment Results</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={2}>
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Summary Statistics
                </Typography>
                <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
                  <Chip 
                    label={`${enrollmentResult.summary.total_enrollments_created} Enrollments`} 
                    color="success" 
                    icon={<CheckIcon />}
                  />
                  <Chip 
                    label={`${enrollmentResult.summary.total_students_processed} Students`} 
                    color="primary" 
                  />
                  <Chip 
                    label={`${enrollmentResult.summary.total_subjects_assigned} Subjects`} 
                    color="secondary" 
                  />
                  <Chip 
                    label={`${enrollmentResult.summary.success_rate.toFixed(1)}% Success Rate`} 
                    color="info" 
                  />
                </Stack>
              </Box>

              {enrollmentResult.conflicts.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom color="warning.main">
                    Conflicts Encountered ({enrollmentResult.conflicts.length})
                  </Typography>
                  <List dense>
                    {enrollmentResult.conflicts.map((conflict, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          <WarningIcon color="warning" fontSize="small" />
                        </ListItemIcon>
                        <ListItemText 
                          primary={conflict.message}
                          secondary={conflict.student_name && `Student: ${conflict.student_name}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}
            </Stack>
          </AccordionDetails>
        </Accordion>
      </Box>
    );
  }

  return (
    <Box>
      {/* Tier Information */}
      {tiersInfo && (
        <Card sx={{ mb: 3, bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
          <CardContent>
            <Stack direction="row" alignItems="flex-start" spacing={2}>
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
                <AutoIcon sx={{ color: theme.palette.primary.main, fontSize: 24 }} />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  {tiersInfo.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  {tiersInfo.description}
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  <Chip label={tiersInfo.automation_level} size="small" color="primary" />
                  <Chip label={tiersInfo.use_case} size="small" color="secondary" />
                  <Chip 
                    label={`${tiersInfo.subjects.length} Core Subjects`} 
                    size="small" 
                    color="info" 
                  />
                </Stack>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* Validation Errors */}
      {!validationResult.isValid && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Validation Errors
          </Typography>
          <List dense>
            {validationResult.errors.map((error, index) => (
              <ListItem key={index}>
                <ListItemText primary={error} />
              </ListItem>
            ))}
          </List>
        </Alert>
      )}

      {/* Validation Warnings */}
      {validationResult.warnings.length > 0 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Please Note
          </Typography>
          <List dense>
            {validationResult.warnings.map((warning, index) => (
              <ListItem key={index}>
                <ListItemText primary={warning} />
              </ListItem>
            ))}
          </List>
        </Alert>
      )}

      {/* Enrollment Preview */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" fontWeight={600} gutterBottom>
          Enrollment Preview
        </Typography>
        
        <Stack spacing={3}>
          {/* Stats Cards */}
          <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
            <Card sx={{ flex: 1, minWidth: 200 }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" fontWeight={600} color="primary.main">
                  {enrollmentStats.students}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Students
                </Typography>
              </CardContent>
            </Card>
            
            <Card sx={{ flex: 1, minWidth: 200 }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" fontWeight={600} color="secondary.main">
                  {enrollmentStats.coreSubjectsCount}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Core Subjects
                </Typography>
              </CardContent>
            </Card>
            
            <Card sx={{ flex: 1, minWidth: 200 }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" fontWeight={600} color="success.main">
                  {enrollmentStats.estimatedEnrollments}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Est. Enrollments
                </Typography>
              </CardContent>
            </Card>
            
            <Card sx={{ flex: 1, minWidth: 200 }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" fontWeight={600} color="info.main">
                  {enrollmentStats.availableTeachers}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Available Teachers
                </Typography>
              </CardContent>
            </Card>
          </Stack>

          {/* Core Subjects List */}
          <Box>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Core Subjects to be Assigned
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {enrollmentStats.coreSubjects.map(subject => (
                <Chip
                  key={subject}
                  label={subject}
                  icon={<SubjectIcon />}
                  color="primary"
                  variant="outlined"
                />
              ))}
            </Stack>
          </Box>

          {/* Available Teachers Preview */}
          {homeroomTeachers && homeroomTeachers.length > 0 && (
            <Box>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Available Homeroom Teachers ({homeroomTeachers.length})
              </Typography>
              <Stack spacing={1}>
                {homeroomTeachers.slice(0, 3).map((teacher: any, index: number) => (
                  <Box
                    key={teacher.id || index}
                    sx={{
                      p: 2,
                      border: 1,
                      borderColor: 'divider',
                      borderRadius: 1,
                      bgcolor: alpha(theme.palette.success.main, 0.05),
                    }}
                  >
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <HomeIcon sx={{ color: theme.palette.success.main }} />
                      <Box>
                        <Typography variant="subtitle2" fontWeight={500}>
                          {teacher.first_name} {teacher.last_name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Grade {teacher.grade_level} • {teacher.email}
                        </Typography>
                      </Box>
                    </Stack>
                  </Box>
                ))}
                {homeroomTeachers.length > 3 && (
                  <Typography variant="body2" color="text.secondary">
                    +{homeroomTeachers.length - 3} more teachers available
                  </Typography>
                )}
              </Stack>
            </Box>
          )}
        </Stack>
      </Paper>

      {/* Action Button */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
        <Button
          variant="contained"
          size="large"
          onClick={handleStartEnrollment}
          disabled={!validationResult.isValid || isEnrolling}
          startIcon={
            isEnrolling ? (
              <CircularProgress size={20} />
            ) : (
              <StartIcon />
            )
          }
          sx={{
            minWidth: 200,
            py: 1.5,
            fontSize: '1.1rem',
          }}
        >
          {isEnrolling ? 'Enrolling Students...' : 'Start Bulk Enrollment'}
        </Button>
      </Box>

      {/* Features List */}
      <Paper sx={{ p: 2, mt: 3, bgcolor: alpha(theme.palette.info.main, 0.05) }}>
        <Typography variant="subtitle2" fontWeight={600} gutterBottom>
          Tier 1 Features
        </Typography>
        <Stack spacing={1}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <FastIcon sx={{ fontSize: 16, color: theme.palette.success.main }} />
            <Typography variant="body2">
              One-click enrollment for all core subjects
            </Typography>
          </Stack>
          <Stack direction="row" alignItems="center" spacing={1}>
            <HomeIcon sx={{ fontSize: 16, color: theme.palette.success.main }} />
            <Typography variant="body2">
              Automatic homeroom teacher assignment
            </Typography>
          </Stack>
          <Stack direction="row" alignItems="center" spacing={1}>
            <SchoolIcon sx={{ fontSize: 16, color: theme.palette.success.main }} />
            <Typography variant="body2">
              Standards-aligned core subject coverage
            </Typography>
          </Stack>
          <Stack direction="row" alignItems="center" spacing={1}>
            <AutoIcon sx={{ fontSize: 16, color: theme.palette.success.main }} />
            <Typography variant="body2">
              Intelligent conflict detection and resolution
            </Typography>
          </Stack>
        </Stack>
      </Paper>
    </Box>
  );
};