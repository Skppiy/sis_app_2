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
  TextField,
  Switch,
  FormControlLabel,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  CircularProgress,
  Autocomplete,
  alpha,
  useTheme,
} from '@mui/material';
import {
  Star as SpecialIcon,
  Person as StudentIcon,
  School as ProgramIcon,
  Assignment as EnrollmentIcon,
  PlayArrow as StartIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  ExpandMore as ExpandMoreIcon,
  PersonAdd as PersonAddIcon,
} from '@mui/icons-material';

import type { Student } from '@/schemas/students';
import type { 
  SpecialProgramEnrollmentRequest,
  SpecialProgramEnrollmentResponse,
  SpecialProgramDetails
} from '@/schemas/threeTierEnrollment';
import { 
  useSpecialProgramEnrollment 
} from '@/features/enrollment/hooks/useThreeTierEnrollment';
import { useTeachers } from '@/features/academics/hooks/useTeachers';
import { useSubjects } from '@/features/academics/hooks/useSubjects';

interface TierThreeComponentProps {
  students: Student[];
  academicYearId: string;
  gradeLevel: string;
  onComplete: (results: SpecialProgramEnrollmentResponse) => void;
  tiersInfo?: {
    name: string;
    description: string;
    use_case: string;
    features: string[];
    automation_level: string;
  };
}

export const TierThreeComponent: React.FC<TierThreeComponentProps> = ({
  students,
  academicYearId,
  gradeLevel,
  onComplete,
  tiersInfo,
}) => {
  const theme = useTheme();
  
  // State
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedTeacherAssignment, setSelectedTeacherAssignment] = useState<string>('');
  const [enrollmentDetails, setEnrollmentDetails] = useState<SpecialProgramDetails>({
    enrollment_type: 'GIFTED',
    reason: '',
    has_iep: false,
    has_504: false,
    accommodation_notes: '',
    override_conflicts: false,
    parent_consent_required: true,
    evaluation_required: false,
    start_date: undefined,
    end_date: undefined,
    additional_requirements: {}
  });
  const [completedEnrollments, setCompletedEnrollments] = useState<SpecialProgramEnrollmentResponse[]>([]);
  const [isEnrolling, setIsEnrolling] = useState(false);

  // Hooks
  const specialEnrollmentMutation = useSpecialProgramEnrollment();
  const { data: teachers, isLoading: loadingTeachers } = useTeachers({ 
    is_active: true 
  });
  const { data: subjects, isLoading: loadingSubjects } = useSubjects({ 
    is_active: true 
  });

  // Mock teacher-subject assignments (would come from API)
  const teacherSubjectAssignments = useMemo(() => {
    if (!teachers || !subjects) return [];
    
    // This would be fetched from the API showing teacher-subject assignments
    // For now, create mock assignments for special programs
    return teachers.flatMap(teacher => 
      subjects
        .filter(subject => 
          subject.name.includes('Advanced') || 
          subject.name.includes('Special') ||
          subject.name.includes('Gifted') ||
          subject.name.includes('ESL') ||
          subject.name.includes('Support')
        )
        .map(subject => ({
          id: `${teacher.id}-${subject.id}`,
          teacher_id: teacher.id,
          teacher_name: `${teacher.first_name} ${teacher.last_name}`,
          subject_id: subject.id,
          subject_name: subject.name,
          subject_code: subject.code,
          program_type: subject.name.includes('Gifted') ? 'GIFTED' :
                       subject.name.includes('Special') ? 'SPECIAL_EDUCATION' :
                       subject.name.includes('ESL') ? 'ESL' :
                       subject.name.includes('Advanced') ? 'ADVANCED' : 'OTHER',
          capacity: 15,
          current_enrollment: Math.floor(Math.random() * 10)
        }))
    );
  }, [teachers, subjects]);

  // Filter assignments by enrollment type
  const filteredAssignments = useMemo(() => {
    return teacherSubjectAssignments.filter(assignment =>
      assignment.program_type === enrollmentDetails.enrollment_type ||
      assignment.program_type === 'OTHER'
    );
  }, [teacherSubjectAssignments, enrollmentDetails.enrollment_type]);

  // Validation
  const canEnroll = useMemo(() => {
    return (
      selectedStudent &&
      selectedTeacherAssignment &&
      enrollmentDetails.reason.length >= 10 &&
      !isEnrolling
    );
  }, [selectedStudent, selectedTeacherAssignment, enrollmentDetails.reason, isEnrolling]);

  // Handle enrollment
  const handleEnrollStudent = async () => {
    if (!selectedStudent || !selectedTeacherAssignment) return;
    
    setIsEnrolling(true);
    
    try {
      const request: SpecialProgramEnrollmentRequest = {
        student_id: selectedStudent.id,
        teacher_subject_assignment_id: selectedTeacherAssignment,
        academic_year_id: academicYearId,
        enrollment_details: enrollmentDetails
      };

      const result = await specialEnrollmentMutation.mutateAsync(request);
      
      setCompletedEnrollments(prev => [...prev, result]);
      
      // Reset form for next enrollment
      setSelectedStudent(null);
      setSelectedTeacherAssignment('');
      setEnrollmentDetails(prev => ({
        ...prev,
        reason: '',
        accommodation_notes: '',
        additional_requirements: {}
      }));
      
      // If this was the last student or user wants to complete
      if (completedEnrollments.length + 1 >= students.length) {
        onComplete(result);
      }
    } catch (error) {
      console.error('Special program enrollment failed:', error);
    } finally {
      setIsEnrolling(false);
    }
  };

  // Handle complete all enrollments
  const handleCompleteAll = () => {
    if (completedEnrollments.length > 0) {
      onComplete(completedEnrollments[completedEnrollments.length - 1]);
    }
  };

  // Loading state
  if (loadingTeachers || loadingSubjects) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Tier Information */}
      {tiersInfo && (
        <Card sx={{ mb: 3, bgcolor: alpha(theme.palette.warning.main, 0.05) }}>
          <CardContent>
            <Stack direction="row" alignItems="flex-start" spacing={2}>
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: '50%',
                  bgcolor: alpha(theme.palette.warning.main, 0.1),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <SpecialIcon sx={{ color: theme.palette.warning.main, fontSize: 24 }} />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  {tiersInfo.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  {tiersInfo.description}
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  <Chip label={tiersInfo.automation_level} size="small" color="warning" />
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

      {/* Progress Summary */}
      {completedEnrollments.length > 0 && (
        <Alert severity="success" sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Progress: {completedEnrollments.length} of {students.length} students enrolled
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {completedEnrollments.map((enrollment, index) => {
              const student = students.find(s => s.id === enrollment.enrollment_created?.student_id);
              return student ? (
                <Chip 
                  key={index}
                  label={`${student.first_name} ${student.last_name}`}
                  size="small"
                  color="success"
                  icon={<CheckIcon />}
                />
              ) : null;
            })}
          </Stack>
        </Alert>
      )}

      <Stack spacing={3}>
        {/* Student Selection */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Step 1: Select Student
          </Typography>
          
          <Autocomplete
            value={selectedStudent}
            onChange={(_, newValue) => setSelectedStudent(newValue)}
            options={students.filter(s => 
              !completedEnrollments.some(ce => ce.enrollment_created?.student_id === s.id)
            )}
            getOptionLabel={(student) => `${student.first_name} ${student.last_name} (${student.current_grade_level})`}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Select Student"
                placeholder="Choose a student for special program enrollment"
              />
            )}
            renderOption={(props, student) => (
              <Box component="li" {...props}>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <StudentIcon fontSize="small" color="primary" />
                  <Box>
                    <Typography variant="body1">
                      {student.first_name} {student.last_name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Grade {student.current_grade_level} • ID: {student.student_id}
                    </Typography>
                  </Box>
                </Stack>
              </Box>
            )}
          />
        </Paper>

        {/* Program Type Selection */}
        {selectedStudent && (
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Step 2: Select Program Type
            </Typography>
            
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Program Type</InputLabel>
              <Select
                value={enrollmentDetails.enrollment_type}
                onChange={(e) => setEnrollmentDetails(prev => ({
                  ...prev,
                  enrollment_type: e.target.value as any
                }))}
                label="Program Type"
              >
                <MenuItem value="GIFTED">Gifted & Talented Program</MenuItem>
                <MenuItem value="SPECIAL_EDUCATION">Special Education</MenuItem>
                <MenuItem value="ESL">English as Second Language (ESL)</MenuItem>
                <MenuItem value="REMEDIAL">Remedial/Support Program</MenuItem>
                <MenuItem value="ADVANCED">Advanced Placement</MenuItem>
                <MenuItem value="OTHER">Other Special Program</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Reason for Enrollment"
              multiline
              rows={3}
              value={enrollmentDetails.reason}
              onChange={(e) => setEnrollmentDetails(prev => ({
                ...prev,
                reason: e.target.value
              }))}
              placeholder="Provide detailed reason for special program enrollment..."
              helperText="Minimum 10 characters required"
              error={enrollmentDetails.reason.length > 0 && enrollmentDetails.reason.length < 10}
            />
          </Paper>
        )}

        {/* Teacher Assignment Selection */}
        {selectedStudent && enrollmentDetails.enrollment_type && (
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Step 3: Select Teacher Assignment
            </Typography>
            
            {filteredAssignments.length === 0 ? (
              <Alert severity="warning">
                No teacher assignments available for {enrollmentDetails.enrollment_type} programs.
              </Alert>
            ) : (
              <FormControl fullWidth>
                <InputLabel>Teacher & Subject Assignment</InputLabel>
                <Select
                  value={selectedTeacherAssignment}
                  onChange={(e) => setSelectedTeacherAssignment(e.target.value)}
                  label="Teacher & Subject Assignment"
                >
                  {filteredAssignments.map(assignment => (
                    <MenuItem key={assignment.id} value={assignment.id}>
                      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ width: '100%' }}>
                        <Box>
                          <Typography variant="body1">
                            {assignment.teacher_name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {assignment.subject_name} ({assignment.subject_code})
                          </Typography>
                        </Box>
                        <Chip
                          label={`${assignment.current_enrollment}/${assignment.capacity}`}
                          size="small"
                          color={assignment.current_enrollment >= assignment.capacity ? 'error' : 'success'}
                        />
                      </Stack>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </Paper>
        )}

        {/* Special Requirements */}
        {selectedStudent && selectedTeacherAssignment && (
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Step 4: Special Requirements & Accommodations
            </Typography>
            
            <Stack spacing={2}>
              <Stack direction="row" spacing={2}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={enrollmentDetails.has_iep}
                      onChange={(e) => setEnrollmentDetails(prev => ({
                        ...prev,
                        has_iep: e.target.checked
                      }))}
                    />
                  }
                  label="Student has IEP (Individualized Education Program)"
                />
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={enrollmentDetails.has_504}
                      onChange={(e) => setEnrollmentDetails(prev => ({
                        ...prev,
                        has_504: e.target.checked
                      }))}
                    />
                  }
                  label="Student has 504 Plan"
                />
              </Stack>
              
              <TextField
                fullWidth
                label="Accommodation Notes"
                multiline
                rows={2}
                value={enrollmentDetails.accommodation_notes}
                onChange={(e) => setEnrollmentDetails(prev => ({
                  ...prev,
                  accommodation_notes: e.target.value
                }))}
                placeholder="Describe any special accommodations needed..."
              />
              
              <Stack direction="row" spacing={2}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={enrollmentDetails.parent_consent_required}
                      onChange={(e) => setEnrollmentDetails(prev => ({
                        ...prev,
                        parent_consent_required: e.target.checked
                      }))}
                    />
                  }
                  label="Parent consent required"
                />
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={enrollmentDetails.evaluation_required}
                      onChange={(e) => setEnrollmentDetails(prev => ({
                        ...prev,
                        evaluation_required: e.target.checked
                      }))}
                    />
                  }
                  label="Evaluation required"
                />
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={enrollmentDetails.override_conflicts}
                      onChange={(e) => setEnrollmentDetails(prev => ({
                        ...prev,
                        override_conflicts: e.target.checked
                      }))}
                    />
                  }
                  label="Override conflicts"
                />
              </Stack>
            </Stack>
          </Paper>
        )}

        {/* Enrollment Preview */}
        {canEnroll && (
          <Paper sx={{ p: 3, bgcolor: alpha(theme.palette.success.main, 0.05) }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Enrollment Preview
            </Typography>
            
            <Stack spacing={2}>
              <Stack direction="row" alignItems="center" spacing={2}>
                <StudentIcon sx={{ color: theme.palette.primary.main }} />
                <Box>
                  <Typography variant="subtitle1" fontWeight={500}>
                    {selectedStudent?.first_name} {selectedStudent?.last_name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Grade {selectedStudent?.current_grade_level}
                  </Typography>
                </Box>
              </Stack>
              
              <Stack direction="row" alignItems="center" spacing={2}>
                <ProgramIcon sx={{ color: theme.palette.secondary.main }} />
                <Box>
                  <Typography variant="subtitle1" fontWeight={500}>
                    {enrollmentDetails.enrollment_type.replace('_', ' ')} Program
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {enrollmentDetails.reason}
                  </Typography>
                </Box>
              </Stack>
              
              {selectedTeacherAssignment && (
                <Stack direction="row" alignItems="center" spacing={2}>
                  <EnrollmentIcon sx={{ color: theme.palette.warning.main }} />
                  <Box>
                    <Typography variant="subtitle1" fontWeight={500}>
                      {filteredAssignments.find(a => a.id === selectedTeacherAssignment)?.teacher_name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {filteredAssignments.find(a => a.id === selectedTeacherAssignment)?.subject_name}
                    </Typography>
                  </Box>
                </Stack>
              )}
            </Stack>
          </Paper>
        )}

        {/* Action Buttons */}
        <Stack direction="row" justifyContent="center" spacing={2}>
          <Button
            variant="contained"
            size="large"
            onClick={handleEnrollStudent}
            disabled={!canEnroll}
            startIcon={
              isEnrolling ? (
                <CircularProgress size={20} />
              ) : (
                <PersonAddIcon />
              )
            }
            sx={{
              minWidth: 200,
              py: 1.5,
            }}
          >
            {isEnrolling ? 'Enrolling...' : 'Enroll Student'}
          </Button>
          
          {completedEnrollments.length > 0 && (
            <Button
              variant="outlined"
              size="large"
              onClick={handleCompleteAll}
              startIcon={<CheckIcon />}
              sx={{
                minWidth: 200,
                py: 1.5,
              }}
            >
              Complete All Enrollments
            </Button>
          )}
        </Stack>
      </Stack>

      {/* Completed Enrollments */}
      {completedEnrollments.length > 0 && (
        <Accordion sx={{ mt: 3 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">
              Completed Enrollments ({completedEnrollments.length})
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <List>
              {completedEnrollments.map((enrollment, index) => {
                const student = students.find(s => s.id === enrollment.enrollment_created?.student_id);
                return (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <CheckIcon color="success" />
                    </ListItemIcon>
                    <ListItemText
                      primary={student ? `${student.first_name} ${student.last_name}` : 'Unknown Student'}
                      secondary={enrollment.message}
                    />
                  </ListItem>
                );
              })}
            </List>
          </AccordionDetails>
        </Accordion>
      )}
    </Box>
  );
};