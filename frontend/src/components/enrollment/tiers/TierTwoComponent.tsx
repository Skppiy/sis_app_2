import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Stack,
  Button,
  Card,
  CardContent,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Switch,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  CircularProgress,
  alpha,
  useTheme,
} from '@mui/material';
import {
  Tune as FlexibleIcon,
  Class as SubjectIcon,
  Person as TeacherIcon,
  Settings as OptionsIcon,
  PlayArrow as StartIcon,
  CheckCircle as CheckIcon,
  Balance as BalanceIcon,
  Group as GroupIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';

import type { Student } from '@/schemas/students';
import type { 
  FlexibleSubjectEnrollmentRequest,
  FlexibleSubjectEnrollmentResponse,
  TeacherPreference
} from '@/schemas/threeTierEnrollment';
import { 
  useFlexibleSubjectEnrollment 
} from '@/features/enrollment/hooks/useThreeTierEnrollment';
import { useSubjects } from '@/features/academics/hooks/useSubjects';
import { useTeachers } from '@/features/academics/hooks/useTeachers';

interface TierTwoComponentProps {
  students: Student[];
  academicYearId: string;
  gradeLevel: string;
  onComplete: (results: FlexibleSubjectEnrollmentResponse) => void;
  tiersInfo?: {
    name: string;
    description: string;
    use_case: string;
    features: string[];
    automation_level: string;
  };
}

export const TierTwoComponent: React.FC<TierTwoComponentProps> = ({
  students,
  academicYearId,
  gradeLevel,
  onComplete,
  tiersInfo,
}) => {
  const theme = useTheme();
  
  // State
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [teacherPreferences, setTeacherPreferences] = useState<Record<string, TeacherPreference>>({});
  const [enrollmentOptions, setEnrollmentOptions] = useState({
    respect_capacity_limits: true,
    allow_cross_grade_enrollment: false,
    prioritize_preferences: true,
    balance_class_sizes: true,
    conflict_resolution_strategy: 'REJECT' as const,
  });
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [enrollmentResult, setEnrollmentResult] = useState<FlexibleSubjectEnrollmentResponse | null>(null);

  // Hooks
  const flexibleEnrollmentMutation = useFlexibleSubjectEnrollment();
  const { data: subjects, isLoading: loadingSubjects } = useSubjects({ 
    is_active: true 
  });
  const { data: teachers, isLoading: loadingTeachers } = useTeachers({ 
    is_active: true 
  });

  // Filter non-CORE subjects
  const nonCoreSubjects = useMemo(() => {
    if (!subjects) return [];
    
    const coreSubjectNames = [
      'Mathematics',
      'English Language Arts',
      'Science',
      'Social Studies',
      'Reading'
    ];
    
    return subjects.filter(subject => 
      !coreSubjectNames.some(core => subject.name.includes(core))
    );
  }, [subjects]);

  // Get teachers for selected subject
  const availableTeachers = useMemo(() => {
    if (!teachers || !selectedSubject) return [];
    
    // This would typically filter teachers by subject assignments
    // For now, return all active teachers
    return teachers.filter(teacher => teacher.is_active);
  }, [teachers, selectedSubject]);

  // Enrollment validation
  const canEnroll = useMemo(() => {
    return (
      selectedSubject &&
      students.length > 0 &&
      !isEnrolling
    );
  }, [selectedSubject, students.length, isEnrolling]);

  // Handle teacher preference change
  const handleTeacherPreferenceChange = (
    teacherId: string,
    preference: TeacherPreference
  ) => {
    setTeacherPreferences(prev => ({
      ...prev,
      [teacherId]: preference
    }));
  };

  // Handle enrollment
  const handleStartEnrollment = async () => {
    if (!selectedSubject) return;
    
    setIsEnrolling(true);
    
    try {
      const request: FlexibleSubjectEnrollmentRequest = {
        subject_id: selectedSubject,
        academic_year_id: academicYearId,
        students: students.map(s => s.id),
        teacher_preferences: Object.keys(teacherPreferences).length > 0 
          ? { [selectedSubject]: Object.values(teacherPreferences) }
          : undefined,
        enrollment_options: enrollmentOptions
      };

      const result = await flexibleEnrollmentMutation.mutateAsync({
        subjectId: selectedSubject,
        request
      });
      
      setEnrollmentResult(result);
      onComplete(result);
    } catch (error) {
      console.error('Flexible enrollment failed:', error);
    } finally {
      setIsEnrolling(false);
    }
  };

  // Loading state
  if (loadingSubjects || loadingTeachers) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  // Success state
  if (enrollmentResult) {
    return (
      <Box>
        <Alert severity="success" sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Flexible Subject Enrollment Completed Successfully!
          </Typography>
          <Typography variant="body2">
            {enrollmentResult.summary.total_enrollments_created} enrollments created across {enrollmentResult.summary.teachers_utilized} teachers
          </Typography>
        </Alert>

        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">Enrollment Results</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={3}>
              {/* Summary Statistics */}
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
                    label={`${enrollmentResult.summary.teachers_utilized} Teachers`} 
                    color="secondary" 
                  />
                  <Chip 
                    label={`${enrollmentResult.summary.average_class_size.toFixed(1)} Avg Class Size`} 
                    color="info" 
                  />
                </Stack>
              </Box>

              {/* Teacher Distribution */}
              {Object.keys(enrollmentResult.teacher_distribution).length > 0 && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Teacher Distribution
                  </Typography>
                  <Stack spacing={1}>
                    {Object.values(enrollmentResult.teacher_distribution).map((distribution) => (
                      <Paper
                        key={distribution.teacher_id}
                        sx={{
                          p: 2,
                          bgcolor: alpha(theme.palette.secondary.main, 0.05),
                          border: 1,
                          borderColor: 'divider',
                        }}
                      >
                        <Stack direction="row" alignItems="center" justifyContent="space-between">
                          <Box>
                            <Typography variant="subtitle2" fontWeight={500}>
                              {distribution.teacher_name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {distribution.classroom_name}
                            </Typography>
                          </Box>
                          <Stack direction="row" spacing={1}>
                            <Chip 
                              label={`${distribution.students_enrolled} students`} 
                              size="small" 
                              color="primary" 
                            />
                            <Chip 
                              label={`${distribution.utilization_rate.toFixed(0)}% full`} 
                              size="small" 
                              color={distribution.utilization_rate > 90 ? 'error' : 'success'} 
                            />
                          </Stack>
                        </Stack>
                      </Paper>
                    ))}
                  </Stack>
                </Box>
              )}

              {/* Conflicts */}
              {enrollmentResult.conflicts.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom color="warning.main">
                    Conflicts Encountered ({enrollmentResult.conflicts.length})
                  </Typography>
                  <List dense>
                    {enrollmentResult.conflicts.map((conflict, index) => (
                      <ListItem key={index}>
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
        <Card sx={{ mb: 3, bgcolor: alpha(theme.palette.secondary.main, 0.05) }}>
          <CardContent>
            <Stack direction="row" alignItems="flex-start" spacing={2}>
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: '50%',
                  bgcolor: alpha(theme.palette.secondary.main, 0.1),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <FlexibleIcon sx={{ color: theme.palette.secondary.main, fontSize: 24 }} />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  {tiersInfo.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  {tiersInfo.description}
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  <Chip label={tiersInfo.automation_level} size="small" color="secondary" />
                  <Chip label={tiersInfo.use_case} size="small" color="primary" />
                  {tiersInfo.features.map(feature => (
                    <Chip key={feature} label={feature} size="small" color="info" />
                  ))}
                </Stack>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      )}

      <Stack spacing={3}>
        {/* Subject Selection */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Step 1: Select Non-CORE Subject
          </Typography>
          
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Choose Subject</InputLabel>
            <Select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              label="Choose Subject"
            >
              {nonCoreSubjects.map(subject => (
                <MenuItem key={subject.id} value={subject.id}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <SubjectIcon fontSize="small" />
                    <Box>
                      <Typography variant="body1">{subject.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {subject.code}
                      </Typography>
                    </Box>
                  </Stack>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {selectedSubject && (
            <Alert severity="info" sx={{ mt: 2 }}>
              Selected subject will be enrolled for all {students.length} students with flexible teacher assignment options.
            </Alert>
          )}
        </Paper>

        {/* Teacher Preferences */}
        {selectedSubject && availableTeachers.length > 0 && (
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Step 2: Configure Teacher Preferences (Optional)
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Set preferences for teacher assignments. The system will try to balance class sizes while respecting your preferences.
            </Typography>

            <Stack spacing={2} sx={{ mt: 2 }}>
              {availableTeachers.slice(0, 5).map(teacher => {
                const currentPreference = teacherPreferences[teacher.id];
                
                return (
                  <Card key={teacher.id} variant="outlined">
                    <CardContent>
                      <Stack direction="row" alignItems="center" justifyContent="space-between">
                        <Stack direction="row" alignItems="center" spacing={2}>
                          <TeacherIcon sx={{ color: theme.palette.secondary.main }} />
                          <Box>
                            <Typography variant="subtitle1" fontWeight={500}>
                              {teacher.first_name} {teacher.last_name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {teacher.email}
                            </Typography>
                          </Box>
                        </Stack>
                        
                        <Stack direction="row" spacing={1}>
                          <FormControl size="small" sx={{ minWidth: 120 }}>
                            <Select
                              value={currentPreference?.preference_level || ''}
                              onChange={(e) => {
                                if (e.target.value) {
                                  handleTeacherPreferenceChange(teacher.id, {
                                    teacher_id: teacher.id,
                                    preference_level: e.target.value as any,
                                    max_students: currentPreference?.max_students,
                                    notes: currentPreference?.notes
                                  });
                                }
                              }}
                              displayEmpty
                            >
                              <MenuItem value="">
                                <em>No preference</em>
                              </MenuItem>
                              <MenuItem value="PREFERRED">Preferred</MenuItem>
                              <MenuItem value="ACCEPTABLE">Acceptable</MenuItem>
                              <MenuItem value="AVOID">Avoid</MenuItem>
                            </Select>
                          </FormControl>
                        </Stack>
                      </Stack>
                    </CardContent>
                  </Card>
                );
              })}
              
              {availableTeachers.length > 5 && (
                <Typography variant="body2" color="text.secondary">
                  +{availableTeachers.length - 5} more teachers available (preferences will use system defaults)
                </Typography>
              )}
            </Stack>
          </Paper>
        )}

        {/* Enrollment Options */}
        {selectedSubject && (
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Step 3: Enrollment Options
            </Typography>
            
            <Stack spacing={2}>
              <FormControlLabel
                control={
                  <Switch
                    checked={enrollmentOptions.respect_capacity_limits}
                    onChange={(e) => setEnrollmentOptions(prev => ({
                      ...prev,
                      respect_capacity_limits: e.target.checked
                    }))}
                  />
                }
                label="Respect classroom capacity limits"
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={enrollmentOptions.allow_cross_grade_enrollment}
                    onChange={(e) => setEnrollmentOptions(prev => ({
                      ...prev,
                      allow_cross_grade_enrollment: e.target.checked
                    }))}
                  />
                }
                label="Allow cross-grade enrollment"
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={enrollmentOptions.prioritize_preferences}
                    onChange={(e) => setEnrollmentOptions(prev => ({
                      ...prev,
                      prioritize_preferences: e.target.checked
                    }))}
                  />
                }
                label="Prioritize teacher preferences"
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={enrollmentOptions.balance_class_sizes}
                    onChange={(e) => setEnrollmentOptions(prev => ({
                      ...prev,
                      balance_class_sizes: e.target.checked
                    }))}
                  />
                }
                label="Attempt to balance class sizes"
              />

              <FormControl sx={{ mt: 2 }}>
                <InputLabel>Conflict Resolution Strategy</InputLabel>
                <Select
                  value={enrollmentOptions.conflict_resolution_strategy}
                  onChange={(e) => setEnrollmentOptions(prev => ({
                    ...prev,
                    conflict_resolution_strategy: e.target.value as any
                  }))}
                  label="Conflict Resolution Strategy"
                >
                  <MenuItem value="REJECT">Reject conflicting enrollments</MenuItem>
                  <MenuItem value="OVERRIDE">Override conflicts (admin only)</MenuItem>
                  <MenuItem value="ASK">Ask for manual resolution</MenuItem>
                </Select>
              </FormControl>
            </Stack>
          </Paper>
        )}

        {/* Enrollment Preview */}
        {selectedSubject && (
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Enrollment Preview
            </Typography>
            
            <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
              <Chip 
                label={`${students.length} Students`} 
                color="primary" 
                icon={<GroupIcon />}
              />
              <Chip 
                label={`${availableTeachers.length} Available Teachers`} 
                color="secondary" 
                icon={<TeacherIcon />}
              />
              <Chip 
                label={Object.keys(teacherPreferences).length > 0 ? 'Custom Preferences' : 'Auto Distribution'} 
                color="info" 
                icon={<BalanceIcon />}
              />
            </Stack>

            <Alert severity="info">
              Students will be distributed across available teachers based on your preferences and enrollment options.
            </Alert>
          </Paper>
        )}

        {/* Action Button */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Button
            variant="contained"
            size="large"
            onClick={handleStartEnrollment}
            disabled={!canEnroll}
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
            {isEnrolling ? 'Processing Enrollment...' : 'Start Flexible Enrollment'}
          </Button>
        </Box>
      </Stack>
    </Box>
  );
};