import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Button,
  Paper,
  Stack,
  Alert,
  Card,
  CardContent,
  Autocomplete,
  TextField,
  Chip,
  CircularProgress,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  FormControlLabel,
  Checkbox,
  FormGroup,
  Grid,
  Avatar,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  ArrowForward as NextIcon,
  CheckCircle as CheckIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  School as SchoolIcon,
  Warning as WarningIcon,
  AccessibilityNew as AccommodationIcon,
  Subject as SubjectIcon,
} from '@mui/icons-material';
import type { Student } from '@/schemas/students';

interface IndividualEnrollmentWorkflowProps {
  students: Student[];
  academicYearId: string;
  gradeLevel: string;
  onComplete: (results: { enrollmentCount: number; studentsAffected: number }) => void;
  onCancel: () => void;
}

interface Class {
  id: string;
  subject_name: string;
  teacher_name: string;
  period: string;
  room: string;
  current_enrollment: number;
  max_capacity: number;
  prerequisites?: string[];
}

interface Conflict {
  type: 'schedule' | 'prerequisite' | 'capacity';
  description: string;
  severity: 'error' | 'warning';
}

interface Accommodation {
  id: string;
  type: string;
  description: string;
}

const INDIVIDUAL_ENROLLMENT_STEPS = [
  'Find Student',
  'Review Schedule', 
  'Select Class',
  'Check Requirements',
  'Add Accommodations',
  'Review & Confirm'
];

export const IndividualEnrollmentWorkflow: React.FC<IndividualEnrollmentWorkflowProps> = ({
  students,
  academicYearId,
  gradeLevel,
  onComplete,
  onCancel,
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [availableClasses, setAvailableClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [detectedConflicts, setDetectedConflicts] = useState<Conflict[]>([]);
  const [selectedAccommodations, setSelectedAccommodations] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Mock data - replace with actual API calls
  const mockClasses: Class[] = [
    {
      id: '1',
      subject_name: 'Advanced Mathematics',
      teacher_name: 'Dr. Smith',
      period: '2nd Period',
      room: 'Room 205',
      current_enrollment: 22,
      max_capacity: 25,
      prerequisites: ['Algebra II']
    },
    {
      id: '2',
      subject_name: 'Creative Writing',
      teacher_name: 'Ms. Johnson',
      period: '4th Period',
      room: 'Room 112',
      current_enrollment: 18,
      max_capacity: 20
    },
    {
      id: '3',
      subject_name: 'Biology Lab',
      teacher_name: 'Mr. Davis',
      period: '6th Period',
      room: 'Lab 301',
      current_enrollment: 24,
      max_capacity: 24
    },
    {
      id: '4',
      subject_name: 'Spanish II',
      teacher_name: 'Señora Martinez',
      period: '3rd Period',
      room: 'Room 108',
      current_enrollment: 19,
      max_capacity: 22,
      prerequisites: ['Spanish I']
    },
  ];

  const accommodationOptions: Accommodation[] = [
    {
      id: '1',
      type: 'Academic',
      description: 'Extended time on assessments'
    },
    {
      id: '2',
      type: 'Academic',
      description: 'Preferential seating'
    },
    {
      id: '3',
      type: 'Physical',
      description: 'Assistive technology support'
    },
    {
      id: '4',
      type: 'Behavioral',
      description: 'Frequent breaks'
    },
    {
      id: '5',
      type: 'Academic',
      description: 'Modified assignments'
    },
  ];

  const currentSchedule = useMemo(() => {
    // Mock current schedule for selected student
    if (!selectedStudent) return [];
    
    return [
      { period: '1st Period', subject: 'English Language Arts', teacher: 'Ms. Wilson', room: 'Room 101' },
      { period: '2nd Period', subject: 'Mathematics', teacher: 'Mr. Brown', room: 'Room 203' },
      { period: '3rd Period', subject: 'Free Period', teacher: '-', room: '-' },
      { period: '4th Period', subject: 'Science', teacher: 'Dr. Lee', room: 'Lab 201' },
      { period: '5th Period', subject: 'Social Studies', teacher: 'Mrs. Taylor', room: 'Room 150' },
      { period: '6th Period', subject: 'Free Period', teacher: '-', room: '-' },
    ];
  }, [selectedStudent]);

  const checkConflicts = (student: Student, classToAdd: Class) => {
    const conflicts: Conflict[] = [];

    // Check capacity
    if (classToAdd.current_enrollment >= classToAdd.max_capacity) {
      conflicts.push({
        type: 'capacity',
        description: 'Class is at maximum capacity',
        severity: 'error'
      });
    }

    // Check schedule conflicts
    const conflictingPeriod = currentSchedule.find(
      schedule => schedule.period === classToAdd.period && schedule.subject !== 'Free Period'
    );
    if (conflictingPeriod) {
      conflicts.push({
        type: 'schedule',
        description: `Schedule conflict with ${conflictingPeriod.subject} in ${classToAdd.period}`,
        severity: 'error'
      });
    }

    // Check prerequisites (mock logic)
    if (classToAdd.prerequisites && classToAdd.prerequisites.length > 0) {
      const missingPrereqs = classToAdd.prerequisites.filter(prereq => {
        // Mock: assume student doesn't have Advanced Math prereq for demo
        return prereq === 'Algebra II' && classToAdd.subject_name === 'Advanced Mathematics';
      });
      
      if (missingPrereqs.length > 0) {
        conflicts.push({
          type: 'prerequisite',
          description: `Missing prerequisites: ${missingPrereqs.join(', ')}`,
          severity: 'warning'
        });
      }
    }

    return conflicts;
  };

  const handleNext = () => {
    if (activeStep === 2 && selectedClass && selectedStudent) {
      const conflicts = checkConflicts(selectedStudent, selectedClass);
      setDetectedConflicts(conflicts);
    }
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleStudentSelect = (student: Student | null) => {
    setSelectedStudent(student);
    // Mock: load available classes based on student's grade/needs
    setAvailableClasses(mockClasses);
  };

  const handleAccommodationToggle = (accommodationId: string) => {
    setSelectedAccommodations(prev => 
      prev.includes(accommodationId) 
        ? prev.filter(id => id !== accommodationId)
        : [...prev, accommodationId]
    );
  };

  const handleEnrollmentSubmit = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      onComplete({ enrollmentCount: 1, studentsAffected: 1 });
    } catch (error) {
      console.error('Enrollment failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Typography variant="body1" paragraph>
              Search and select the student you want to enroll in an individual class.
            </Typography>
            
            <Autocomplete
              options={students}
              getOptionLabel={(student) => `${student.first_name} ${student.last_name} (${student.student_id})`}
              value={selectedStudent}
              onChange={(_, newValue) => handleStudentSelect(newValue)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Search for student"
                  placeholder="Type student name or ID..."
                  variant="outlined"
                  fullWidth
                />
              )}
              renderOption={(props, student) => (
                <li {...props}>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Avatar sx={{ width: 32, height: 32 }}>
                      {student.first_name[0]}{student.last_name[0]}
                    </Avatar>
                    <Box>
                      <Typography variant="body1">
                        {student.first_name} {student.last_name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        ID: {student.student_id} • Grade {student.current_grade_level}
                      </Typography>
                    </Box>
                  </Stack>
                </li>
              )}
            />

            {selectedStudent && (
              <Paper sx={{ mt: 2, p: 2, bgcolor: 'background.default' }}>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Avatar sx={{ width: 48, height: 48 }}>
                    {selectedStudent.first_name[0]}{selectedStudent.last_name[0]}
                  </Avatar>
                  <Box>
                    <Typography variant="h6">
                      {selectedStudent.first_name} {selectedStudent.last_name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Student ID: {selectedStudent.student_id} • Grade {selectedStudent.current_grade_level}
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
            )}
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="body1" paragraph>
              Review {selectedStudent?.first_name}'s current schedule to identify available periods.
            </Typography>
            
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle1" gutterBottom fontWeight={600}>
                Current Schedule
              </Typography>
              <List dense>
                {currentSchedule.map((item, index) => (
                  <React.Fragment key={item.period}>
                    <ListItem>
                      <ListItemIcon>
                        <ScheduleIcon color={item.subject === 'Free Period' ? 'success' : 'action'} />
                      </ListItemIcon>
                      <ListItemText
                        primary={`${item.period}: ${item.subject}`}
                        secondary={item.teacher !== '-' ? `${item.teacher} • ${item.room}` : 'Available for enrollment'}
                        sx={{
                          '& .MuiListItemText-primary': {
                            color: item.subject === 'Free Period' ? 'success.main' : 'text.primary',
                            fontWeight: item.subject === 'Free Period' ? 600 : 400
                          }
                        }}
                      />
                    </ListItem>
                    {index < currentSchedule.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </Paper>

            <Alert severity="info" sx={{ mt: 2 }}>
              Free periods are available for new class enrollment.
            </Alert>
          </Box>
        );

      case 2:
        return (
          <Box>
            <Typography variant="body1" paragraph>
              Select a class to enroll {selectedStudent?.first_name} in. Only classes with available capacity are shown.
            </Typography>
            
            <Stack spacing={2}>
              {availableClasses.map((classItem) => (
                <Card
                  key={classItem.id}
                  sx={{
                    cursor: 'pointer',
                    border: selectedClass?.id === classItem.id ? 2 : 1,
                    borderColor: selectedClass?.id === classItem.id ? 'primary.main' : 'divider',
                  }}
                  onClick={() => setSelectedClass(classItem)}
                >
                  <CardContent>
                    <Stack direction="row" alignItems="flex-start" spacing={2}>
                      <SchoolIcon color={selectedClass?.id === classItem.id ? 'primary' : 'action'} />
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle1" fontWeight={600}>
                          {classItem.subject_name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          {classItem.teacher_name} • {classItem.period} • {classItem.room}
                        </Typography>
                        <Stack direction="row" spacing={2} alignItems="center">
                          <Chip 
                            label={`${classItem.current_enrollment}/${classItem.max_capacity} enrolled`}
                            size="small"
                            color={classItem.current_enrollment >= classItem.max_capacity ? 'error' : 'default'}
                          />
                          {classItem.prerequisites && (
                            <Chip 
                              label={`Requires: ${classItem.prerequisites.join(', ')}`}
                              size="small"
                              variant="outlined"
                            />
                          )}
                        </Stack>
                      </Box>
                      {selectedClass?.id === classItem.id && (
                        <CheckIcon color="primary" />
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          </Box>
        );

      case 3:
        return (
          <Box>
            <Typography variant="body1" paragraph>
              Check enrollment requirements and resolve any conflicts for {selectedClass?.subject_name}.
            </Typography>
            
            {detectedConflicts.length === 0 ? (
              <Alert severity="success">
                <Typography variant="subtitle2" gutterBottom>
                  No Conflicts Detected
                </Typography>
                <Typography variant="body2">
                  {selectedStudent?.first_name} can be enrolled in {selectedClass?.subject_name} without issues.
                </Typography>
              </Alert>
            ) : (
              <Stack spacing={2}>
                {detectedConflicts.map((conflict, index) => (
                  <Alert key={index} severity={conflict.severity}>
                    <Typography variant="subtitle2" gutterBottom>
                      {conflict.type === 'schedule' && 'Schedule Conflict'}
                      {conflict.type === 'prerequisite' && 'Prerequisite Warning'}
                      {conflict.type === 'capacity' && 'Capacity Issue'}
                    </Typography>
                    <Typography variant="body2">
                      {conflict.description}
                    </Typography>
                  </Alert>
                ))}
              </Stack>
            )}

            {selectedClass && (
              <Paper sx={{ mt: 3, p: 2 }}>
                <Typography variant="subtitle1" gutterBottom fontWeight={600}>
                  Class Details
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Subject</Typography>
                    <Typography variant="body1">{selectedClass.subject_name}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Teacher</Typography>
                    <Typography variant="body1">{selectedClass.teacher_name}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Period</Typography>
                    <Typography variant="body1">{selectedClass.period}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Room</Typography>
                    <Typography variant="body1">{selectedClass.room}</Typography>
                  </Grid>
                </Grid>
              </Paper>
            )}
          </Box>
        );

      case 4:
        return (
          <Box>
            <Typography variant="body1" paragraph>
              Add any necessary accommodations for {selectedStudent?.first_name} in {selectedClass?.subject_name}.
            </Typography>
            
            <Alert severity="info" sx={{ mb: 2 }}>
              Select accommodations that {selectedStudent?.first_name} may need in this class. These can be modified later if needed.
            </Alert>

            <FormGroup>
              {accommodationOptions.map((accommodation) => (
                <FormControlLabel
                  key={accommodation.id}
                  control={
                    <Checkbox
                      checked={selectedAccommodations.includes(accommodation.id)}
                      onChange={() => handleAccommodationToggle(accommodation.id)}
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body1">
                        {accommodation.description}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Type: {accommodation.type}
                      </Typography>
                    </Box>
                  }
                />
              ))}
            </FormGroup>

            {selectedAccommodations.length === 0 && (
              <Alert severity="info" sx={{ mt: 2 }}>
                No accommodations selected. Student will be enrolled with standard requirements.
              </Alert>
            )}
          </Box>
        );

      case 5:
        return (
          <Box>
            <Typography variant="body1" paragraph>
              Review the individual enrollment details and confirm to proceed.
            </Typography>
            
            <Stack spacing={3}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle1" gutterBottom fontWeight={600}>
                  <PersonIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                  Student
                </Typography>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Avatar>
                    {selectedStudent?.first_name[0]}{selectedStudent?.last_name[0]}
                  </Avatar>
                  <Box>
                    <Typography variant="body1">
                      {selectedStudent?.first_name} {selectedStudent?.last_name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      ID: {selectedStudent?.student_id} • Grade {selectedStudent?.current_grade_level}
                    </Typography>
                  </Box>
                </Stack>
              </Paper>

              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle1" gutterBottom fontWeight={600}>
                  <SubjectIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                  Class Enrollment
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Subject</Typography>
                    <Typography variant="body1">{selectedClass?.subject_name}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Teacher</Typography>
                    <Typography variant="body1">{selectedClass?.teacher_name}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Period</Typography>
                    <Typography variant="body1">{selectedClass?.period}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Room</Typography>
                    <Typography variant="body1">{selectedClass?.room}</Typography>
                  </Grid>
                </Grid>
              </Paper>

              {selectedAccommodations.length > 0 && (
                <Paper sx={{ p: 2 }}>
                  <Typography variant="subtitle1" gutterBottom fontWeight={600}>
                    <AccommodationIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                    Accommodations ({selectedAccommodations.length})
                  </Typography>
                  <Stack spacing={1}>
                    {accommodationOptions
                      .filter(acc => selectedAccommodations.includes(acc.id))
                      .map(accommodation => (
                        <Chip
                          key={accommodation.id}
                          label={accommodation.description}
                          size="small"
                          color="secondary"
                          variant="outlined"
                        />
                      ))}
                  </Stack>
                </Paper>
              )}

              <Alert severity="success">
                <Typography variant="subtitle2" gutterBottom>
                  Enrollment Summary
                </Typography>
                <Typography variant="body2">
                  {selectedStudent?.first_name} will be enrolled in 1 class 
                  {selectedAccommodations.length > 0 && ` with ${selectedAccommodations.length} accommodation(s)`}.
                </Typography>
              </Alert>
            </Stack>
          </Box>
        );

      default:
        return 'Unknown step';
    }
  };

  const isStepValid = (step: number) => {
    switch (step) {
      case 0:
        return selectedStudent !== null;
      case 1:
        return true; // Review step
      case 2:
        return selectedClass !== null;
      case 3:
        return detectedConflicts.every(c => c.severity !== 'error');
      case 4:
        return true; // Accommodations are optional
      case 5:
        return true;
      default:
        return false;
    }
  };

  const progress = ((activeStep + 1) / INDIVIDUAL_ENROLLMENT_STEPS.length) * 100;

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h6">
          Individual Enrollment Workflow
        </Typography>
        <Box sx={{ minWidth: 200 }}>
          <Typography variant="body2" color="text.secondary" align="right" sx={{ mb: 0.5 }}>
            Step {activeStep + 1} of {INDIVIDUAL_ENROLLMENT_STEPS.length}
          </Typography>
          <LinearProgress variant="determinate" value={progress} sx={{ height: 6, borderRadius: 3 }} />
        </Box>
      </Stack>

      <Stepper activeStep={activeStep} orientation="vertical">
        {INDIVIDUAL_ENROLLMENT_STEPS.map((label, index) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
            <StepContent>
              <Box sx={{ mb: 2 }}>
                {getStepContent(index)}
              </Box>
              <Box sx={{ mb: 1 }}>
                <Stack direction="row" spacing={2}>
                  {index > 0 && (
                    <Button
                      onClick={handleBack}
                      startIcon={<BackIcon />}
                    >
                      Back
                    </Button>
                  )}
                  
                  {index === 0 && (
                    <Button onClick={onCancel}>
                      Cancel
                    </Button>
                  )}

                  <Box sx={{ flex: 1 }} />

                  {index === INDIVIDUAL_ENROLLMENT_STEPS.length - 1 ? (
                    <Button
                      variant="contained"
                      onClick={handleEnrollmentSubmit}
                      disabled={!isStepValid(index) || loading}
                      startIcon={loading ? <CircularProgress size={16} /> : <CheckIcon />}
                    >
                      {loading ? 'Enrolling...' : 'Complete Enrollment'}
                    </Button>
                  ) : (
                    <Button
                      variant="contained"
                      onClick={handleNext}
                      disabled={!isStepValid(index)}
                      endIcon={<NextIcon />}
                    >
                      Next
                    </Button>
                  )}
                </Stack>
              </Box>
            </StepContent>
          </Step>
        ))}
      </Stepper>
    </Box>
  );
};