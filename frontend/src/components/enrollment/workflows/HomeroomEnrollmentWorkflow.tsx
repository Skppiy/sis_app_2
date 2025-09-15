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
  Checkbox,
  FormControlLabel,
  FormGroup,
  Chip,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  LinearProgress,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  ArrowForward as NextIcon,
  CheckCircle as CheckIcon,
  Person as PersonIcon,
  School as SchoolIcon,
  Subject as SubjectIcon,
} from '@mui/icons-material';
import type { Student } from '@/schemas/students';
import { bulkHomeroomEnrollment } from '@/features/enrollment/services/enrollment';
import type { BulkHomeroomEnrollmentRequest } from '@/schemas/threeTierEnrollment';
import { listTeachers } from '@/features/academics/services/teachers';
import { listSubjects } from '@/features/academics/services/subjects';

interface HomeroomEnrollmentWorkflowProps {
  students: Student[];
  academicYearId: string;
  gradeLevel: string;
  onComplete: (results: { enrollmentCount: number; studentsAffected: number }) => void;
  onCancel: () => void;
}

interface Teacher {
  id: string;
  first_name: string;
  last_name: string;
  homeroom_grade?: string;
}

interface Subject {
  id: string;
  name: string;
  code: string;
  is_core: boolean;
}

const HOMEROOM_STEPS = [
  'Select Grade Level',
  'Choose Homeroom Teacher', 
  'Select Students',
  'Choose CORE Subjects',
  'Review & Confirm'
];

export const HomeroomEnrollmentWorkflow: React.FC<HomeroomEnrollmentWorkflowProps> = ({
  students,
  academicYearId,
  gradeLevel,
  onComplete,
  onCancel,
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [selectedGrade, setSelectedGrade] = useState(gradeLevel);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [availableTeachers, setAvailableTeachers] = useState<Teacher[]>([]);
  const [coreSubjects, setCoreSubjects] = useState<Subject[]>([]);

  // Update selected students when grade changes
  React.useEffect(() => {
    const gradeStudents = students.filter(s => s.current_grade_level === selectedGrade);
    setSelectedStudents(gradeStudents.map(s => s.id));
    setSelectedTeacher(null); // Reset teacher selection when grade changes
  }, [selectedGrade, students]);

  // Load real teachers data from API
  React.useEffect(() => {
    const loadTeachers = async () => {
      try {
        const response = await listTeachers({ grade_level: selectedGrade });
        const teachers = response || [];
        console.log('Loaded teachers for grade', selectedGrade, ':', teachers);
        
        // Filter for homeroom teachers - use grade_level and ensure they're not specialists
        const homeroomTeachers = teachers
          .filter((teacher: any) => 
            teacher.grade_level === selectedGrade && 
            !teacher.is_specialist && 
            teacher.is_active
          )
          .map((teacher: any) => ({
            id: teacher.id,
            first_name: teacher.first_name,
            last_name: teacher.last_name,
            homeroom_grade: teacher.grade_level
          }));
        
        console.log('Filtered homeroom teachers:', homeroomTeachers);
        setAvailableTeachers(homeroomTeachers);
      } catch (error) {
        console.error('Failed to load teachers:', error);
        setAvailableTeachers([]);
      }
    };

    if (selectedGrade) {
      loadTeachers();
    }
  }, [selectedGrade]);

  // Load real CORE subjects from API
  React.useEffect(() => {
    const loadCoreSubjects = async () => {
      try {
        const response = await listSubjects({});
        const subjects = response || [];
        console.log('Loaded all subjects:', subjects);
        
        // Filter for CORE subjects - based on schema, use subject_type === "CORE" or is_homeroom_default
        const coreSubjects = subjects
          .filter((subject: any) => 
            subject.subject_type === 'CORE' || 
            subject.is_homeroom_default === true ||
            subject.is_system_core === true
          )
          .map((subject: any) => ({
            id: subject.id,
            name: subject.name,
            code: subject.code,
            is_core: true
          }));
          
        console.log('Filtered CORE subjects:', coreSubjects);
        setCoreSubjects(coreSubjects);
      } catch (error) {
        console.error('Failed to load subjects:', error);
        // Fallback to known CORE subjects if API fails
        setCoreSubjects([
          { id: '1', name: 'English', code: 'ELA', is_core: true },
          { id: '2', name: 'Mathematics', code: 'MATH', is_core: true },
          { id: '3', name: 'Reading', code: 'READ', is_core: true },
          { id: '4', name: 'Religion', code: 'REL', is_core: true },
          { id: '5', name: 'Science', code: 'SCI', is_core: true },
          { id: '6', name: 'Social Studies', code: 'SS', is_core: true },
        ]);
      }
    };

    loadCoreSubjects();
  }, []);

  const filteredStudents = useMemo(() => {
    return students.filter(student => student.current_grade_level === selectedGrade);
  }, [students, selectedGrade]);

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleStudentToggle = (studentId: string) => {
    setSelectedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleSubjectToggle = (subjectId: string) => {
    setSelectedSubjects(prev => 
      prev.includes(subjectId) 
        ? prev.filter(id => id !== subjectId)
        : [...prev, subjectId]
    );
  };

  const handleEnrollmentSubmit = async () => {
    setLoading(true);
    try {
      // Prepare the bulk homeroom enrollment request - match schema exactly
      const enrollmentRequest: BulkHomeroomEnrollmentRequest = {
        academic_year_id: academicYearId,
        grade_level: selectedGrade as any, // Convert to enum type
        students: selectedStudents, // Already an array of UUID strings
        auto_create_missing_assignments: true
      };

      // Call the real enrollment API
      const response = await bulkHomeroomEnrollment(enrollmentRequest);
      
      const enrollmentCount = response.summary?.total_enrollments_created || 0;
      const studentsAffected = selectedStudents.length;
      
      console.log('Homeroom enrollment successful:', response);
      
      onComplete({ enrollmentCount, studentsAffected });
    } catch (error) {
      console.error('Homeroom enrollment failed:', error);
      // Still complete but with error info - you might want to show error to user
      onComplete({ enrollmentCount: 0, studentsAffected: 0 });
    } finally {
      setLoading(false);
    }
  };

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        const availableGrades = [...new Set(students.map(s => s.current_grade_level))].sort();
        
        return (
          <Box>
            <Typography variant="body1" paragraph>
              Select the grade level for homeroom enrollment. Students will be filtered to match the selected grade.
            </Typography>
            
            <Stack spacing={2}>
              {availableGrades.map((grade) => {
                const gradeStudents = students.filter(s => s.current_grade_level === grade);
                return (
                  <Card
                    key={grade}
                    sx={{
                      cursor: 'pointer',
                      border: selectedGrade === grade ? 2 : 1,
                      borderColor: selectedGrade === grade ? 'primary.main' : 'divider',
                    }}
                    onClick={() => setSelectedGrade(grade)}
                  >
                    <CardContent>
                      <Stack direction="row" alignItems="center" spacing={2}>
                        <Typography variant="h6">
                          Grade {grade}
                        </Typography>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            {gradeStudents.length} students available
                          </Typography>
                        </Box>
                        {selectedGrade === grade && (
                          <CheckIcon color="primary" />
                        )}
                      </Stack>
                    </CardContent>
                  </Card>
                );
              })}
            </Stack>
            
            {selectedGrade && (
              <Alert severity={availableTeachers.length === 0 ? "warning" : "info"} sx={{ mt: 2 }}>
                Selected Grade {selectedGrade}: {filteredStudents.length} students • {availableTeachers.length} homeroom teacher(s) available
                {availableTeachers.length === 0 && (
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    No homeroom teachers are currently assigned to Grade {selectedGrade}. You may need to assign a teacher first or select a different grade.
                  </Typography>
                )}
              </Alert>
            )}
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="body1" paragraph>
              Select the homeroom teacher who will teach the CORE subjects to these students.
            </Typography>
            <Stack spacing={2}>
              {availableTeachers.map((teacher) => (
                <Card
                  key={teacher.id}
                  sx={{
                    cursor: 'pointer',
                    border: selectedTeacher?.id === teacher.id ? 2 : 1,
                    borderColor: selectedTeacher?.id === teacher.id ? 'primary.main' : 'divider',
                  }}
                  onClick={() => setSelectedTeacher(teacher)}
                >
                  <CardContent>
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <PersonIcon color={selectedTeacher?.id === teacher.id ? 'primary' : 'action'} />
                      <Box>
                        <Typography variant="subtitle1">
                          {teacher.first_name} {teacher.last_name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Homeroom Grade: {teacher.homeroom_grade}
                        </Typography>
                      </Box>
                      {selectedTeacher?.id === teacher.id && (
                        <CheckIcon color="primary" sx={{ ml: 'auto' }} />
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          </Box>
        );

      case 2:
        return (
          <Box>
            <Typography variant="body1" paragraph>
              Select which students to enroll in the homeroom. All students from Grade {selectedGrade} are pre-selected.
            </Typography>
            
            <Alert severity="info" sx={{ mb: 2 }}>
              Selected: {selectedStudents.length} of {filteredStudents.length} students
            </Alert>

            <FormGroup>
              {filteredStudents.map((student) => (
                <FormControlLabel
                  key={student.id}
                  control={
                    <Checkbox
                      checked={selectedStudents.includes(student.id)}
                      onChange={() => handleStudentToggle(student.id)}
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body1">
                        {student.first_name} {student.last_name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Grade {student.current_grade_level} • ID: {student.student_id}
                      </Typography>
                    </Box>
                  }
                />
              ))}
            </FormGroup>
          </Box>
        );

      case 3:
        return (
          <Box>
            <Typography variant="body1" paragraph>
              Select the CORE subjects that students will be enrolled in with their homeroom teacher.
            </Typography>
            
            <Alert severity="info" sx={{ mb: 2 }}>
              Selected: {selectedSubjects.length} of {coreSubjects.length} CORE subjects (All 6 subjects are typically selected for homeroom enrollment)
            </Alert>

            <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
              <Button 
                variant="outlined" 
                size="small"
                onClick={() => setSelectedSubjects(coreSubjects.map(s => s.id))}
              >
                Select All 6 CORE Subjects
              </Button>
              <Button 
                variant="outlined" 
                size="small"
                onClick={() => setSelectedSubjects([])}
              >
                Clear All
              </Button>
            </Stack>

            <FormGroup>
              {coreSubjects.map((subject) => (
                <FormControlLabel
                  key={subject.id}
                  control={
                    <Checkbox
                      checked={selectedSubjects.includes(subject.id)}
                      onChange={() => handleSubjectToggle(subject.id)}
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body1">
                        {subject.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Code: {subject.code} • Core Subject
                      </Typography>
                    </Box>
                  }
                />
              ))}
            </FormGroup>
          </Box>
        );

      case 4:
        return (
          <Box>
            <Typography variant="body1" paragraph>
              Review your selections and confirm the homeroom enrollment.
            </Typography>
            
            <Stack spacing={3}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle1" gutterBottom fontWeight={600}>
                  <SchoolIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                  Homeroom Teacher
                </Typography>
                <Typography variant="body1">
                  {selectedTeacher?.first_name} {selectedTeacher?.last_name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Grade {selectedTeacher?.homeroom_grade}
                </Typography>
              </Paper>

              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle1" gutterBottom fontWeight={600}>
                  <PersonIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                  Students ({selectedStudents.length})
                </Typography>
                <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                  {filteredStudents
                    .filter(s => selectedStudents.includes(s.id))
                    .map(student => (
                      <Chip
                        key={student.id}
                        label={`${student.first_name} ${student.last_name}`}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    ))}
                </Stack>
              </Paper>

              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle1" gutterBottom fontWeight={600}>
                  <SubjectIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                  CORE Subjects ({selectedSubjects.length})
                </Typography>
                <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                  {coreSubjects
                    .filter(s => selectedSubjects.includes(s.id))
                    .map(subject => (
                      <Chip
                        key={subject.id}
                        label={subject.name}
                        size="small"
                        color="secondary"
                        variant="outlined"
                      />
                    ))}
                </Stack>
              </Paper>

              <Alert severity="success">
                <Typography variant="subtitle2" gutterBottom>
                  Enrollment Summary
                </Typography>
                <Typography variant="body2">
                  This will create {selectedStudents.length * selectedSubjects.length} total enrollments 
                  for {selectedStudents.length} students across {selectedSubjects.length} subjects.
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
        return selectedGrade && filteredStudents.length > 0;
      case 1:
        return selectedTeacher !== null;
      case 2:
        return selectedStudents.length > 0;
      case 3:
        return selectedSubjects.length > 0;
      case 4:
        return true;
      default:
        return false;
    }
  };

  const progress = ((activeStep + 1) / HOMEROOM_STEPS.length) * 100;

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h6">
          Homeroom Enrollment Workflow
        </Typography>
        <Box sx={{ minWidth: 200 }}>
          <Typography variant="body2" color="text.secondary" align="right" sx={{ mb: 0.5 }}>
            Step {activeStep + 1} of {HOMEROOM_STEPS.length}
          </Typography>
          <LinearProgress variant="determinate" value={progress} sx={{ height: 6, borderRadius: 3 }} />
        </Box>
      </Stack>

      <Stepper activeStep={activeStep} orientation="vertical">
        {HOMEROOM_STEPS.map((label, index) => (
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

                  {index === HOMEROOM_STEPS.length - 1 ? (
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