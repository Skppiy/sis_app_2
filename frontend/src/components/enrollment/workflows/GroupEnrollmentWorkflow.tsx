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
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Slider,
  Chip,
  CircularProgress,
  LinearProgress,
  Grid,
  List,
  ListItem,
  ListItemText,
  Divider,
  TextField,
  MenuItem,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  ArrowForward as NextIcon,
  CheckCircle as CheckIcon,
  Groups as GroupsIcon,
  Person as PersonIcon,
  School as SchoolIcon,
  Balance as BalanceIcon,
  Subject as SubjectIcon,
} from '@mui/icons-material';
import type { Student } from '@/schemas/students';

interface GroupEnrollmentWorkflowProps {
  students: Student[];
  academicYearId: string;
  gradeLevel: string;
  onComplete: (results: { enrollmentCount: number; studentsAffected: number }) => void;
  onCancel: () => void;
}

interface Subject {
  id: string;
  name: string;
  code: string;
  is_core: boolean;
  max_class_size?: number;
}

interface Teacher {
  id: string;
  first_name: string;
  last_name: string;
  subjects: string[];
}

interface StudentGroup {
  id: string;
  name: string;
  studentIds: string[];
}

const GROUP_ENROLLMENT_STEPS = [
  'Select Subject',
  'Choose Strategy', 
  'Create Groups',
  'Assign Teachers',
  'Balance Classes',
  'Review & Confirm'
];

type GroupingStrategy = 'equal' | 'random' | 'manual' | 'ability';

export const GroupEnrollmentWorkflow: React.FC<GroupEnrollmentWorkflowProps> = ({
  students,
  academicYearId,
  gradeLevel,
  onComplete,
  onCancel,
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [groupingStrategy, setGroupingStrategy] = useState<GroupingStrategy>('equal');
  const [numberOfGroups, setNumberOfGroups] = useState(2);
  const [studentGroups, setStudentGroups] = useState<StudentGroup[]>([]);
  const [teacherAssignments, setTeacherAssignments] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // Mock data - replace with actual API calls
  const nonCoreSubjects: Subject[] = [
    { id: '1', name: 'Art', code: 'ART', is_core: false, max_class_size: 24 },
    { id: '2', name: 'Music', code: 'MUS', is_core: false, max_class_size: 28 },
    { id: '3', name: 'Physical Education', code: 'PE', is_core: false, max_class_size: 30 },
    { id: '4', name: 'Library', code: 'LIB', is_core: false, max_class_size: 20 },
    { id: '5', name: 'Computer Lab', code: 'COMP', is_core: false, max_class_size: 24 },
  ];

  const availableTeachers: Teacher[] = [
    { id: '1', first_name: 'Emma', last_name: 'Wilson', subjects: ['1', '4'] }, // Art, Library
    { id: '2', first_name: 'David', last_name: 'Martinez', subjects: ['2'] }, // Music
    { id: '3', first_name: 'Jessica', last_name: 'Lee', subjects: ['3'] }, // PE
    { id: '4', first_name: 'Robert', last_name: 'Taylor', subjects: ['5'] }, // Computer
    { id: '5', first_name: 'Amanda', last_name: 'Davis', subjects: ['1', '2'] }, // Art, Music
  ];

  const qualifiedTeachers = useMemo(() => {
    if (!selectedSubject) return [];
    return availableTeachers.filter(teacher => 
      teacher.subjects.includes(selectedSubject.id)
    );
  }, [selectedSubject, availableTeachers]);

  const generateGroups = () => {
    if (!selectedSubject) return;

    const groupSize = Math.ceil(students.length / numberOfGroups);
    const groups: StudentGroup[] = [];

    switch (groupingStrategy) {
      case 'equal':
        for (let i = 0; i < numberOfGroups; i++) {
          const startIndex = i * groupSize;
          const endIndex = Math.min(startIndex + groupSize, students.length);
          const groupStudents = students.slice(startIndex, endIndex);
          
          groups.push({
            id: `group-${i + 1}`,
            name: `${selectedSubject.name} - Group ${i + 1}`,
            studentIds: groupStudents.map(s => s.id)
          });
        }
        break;

      case 'random':
        const shuffledStudents = [...students].sort(() => Math.random() - 0.5);
        for (let i = 0; i < numberOfGroups; i++) {
          const startIndex = i * groupSize;
          const endIndex = Math.min(startIndex + groupSize, shuffledStudents.length);
          const groupStudents = shuffledStudents.slice(startIndex, endIndex);
          
          groups.push({
            id: `group-${i + 1}`,
            name: `${selectedSubject.name} - Group ${i + 1}`,
            studentIds: groupStudents.map(s => s.id)
          });
        }
        break;

      default:
        // For manual and ability, start with equal distribution
        for (let i = 0; i < numberOfGroups; i++) {
          groups.push({
            id: `group-${i + 1}`,
            name: `${selectedSubject.name} - Group ${i + 1}`,
            studentIds: []
          });
        }
        break;
    }

    setStudentGroups(groups);
  };

  const handleNext = () => {
    if (activeStep === 2 && studentGroups.length === 0) {
      generateGroups();
    }
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleTeacherAssignment = (groupId: string, teacherId: string) => {
    setTeacherAssignments(prev => ({
      ...prev,
      [groupId]: teacherId
    }));
  };

  const handleEnrollmentSubmit = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const totalEnrollments = studentGroups.reduce((sum, group) => sum + group.studentIds.length, 0);
      const studentsAffected = new Set(studentGroups.flatMap(g => g.studentIds)).size;
      
      onComplete({ enrollmentCount: totalEnrollments, studentsAffected });
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
              Select the non-CORE subject for group enrollment. These are typically specials like Art, Music, PE, etc.
            </Typography>
            <Stack spacing={2}>
              {nonCoreSubjects.map((subject) => (
                <Card
                  key={subject.id}
                  sx={{
                    cursor: 'pointer',
                    border: selectedSubject?.id === subject.id ? 2 : 1,
                    borderColor: selectedSubject?.id === subject.id ? 'primary.main' : 'divider',
                  }}
                  onClick={() => setSelectedSubject(subject)}
                >
                  <CardContent>
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <SubjectIcon color={selectedSubject?.id === subject.id ? 'primary' : 'action'} />
                      <Box>
                        <Typography variant="subtitle1">
                          {subject.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Code: {subject.code} • Max Class Size: {subject.max_class_size}
                        </Typography>
                      </Box>
                      {selectedSubject?.id === subject.id && (
                        <CheckIcon color="primary" sx={{ ml: 'auto' }} />
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="body1" paragraph>
              Choose how to group the {students.length} students for {selectedSubject?.name}.
            </Typography>
            
            <Stack spacing={3}>
              <FormControl>
                <FormLabel>Grouping Strategy</FormLabel>
                <RadioGroup
                  value={groupingStrategy}
                  onChange={(e) => setGroupingStrategy(e.target.value as GroupingStrategy)}
                >
                  <FormControlLabel 
                    value="equal" 
                    control={<Radio />} 
                    label={
                      <Box>
                        <Typography variant="body1">Equal Distribution</Typography>
                        <Typography variant="caption" color="text.secondary">
                          Divide students evenly across groups in order
                        </Typography>
                      </Box>
                    }
                  />
                  <FormControlLabel 
                    value="random" 
                    control={<Radio />} 
                    label={
                      <Box>
                        <Typography variant="body1">Random Assignment</Typography>
                        <Typography variant="caption" color="text.secondary">
                          Randomly distribute students across groups
                        </Typography>
                      </Box>
                    }
                  />
                  <FormControlLabel 
                    value="manual" 
                    control={<Radio />} 
                    label={
                      <Box>
                        <Typography variant="body1">Manual Assignment</Typography>
                        <Typography variant="caption" color="text.secondary">
                          Manually assign students to specific groups
                        </Typography>
                      </Box>
                    }
                  />
                  <FormControlLabel 
                    value="ability" 
                    control={<Radio />} 
                    label={
                      <Box>
                        <Typography variant="body1">Ability-Based</Typography>
                        <Typography variant="caption" color="text.secondary">
                          Group by academic performance (requires student data)
                        </Typography>
                      </Box>
                    }
                  />
                </RadioGroup>
              </FormControl>

              <Box>
                <Typography variant="body2" gutterBottom>
                  Number of Groups: {numberOfGroups}
                </Typography>
                <Slider
                  value={numberOfGroups}
                  onChange={(_, value) => setNumberOfGroups(value as number)}
                  min={2}
                  max={Math.min(6, Math.ceil(students.length / 8))}
                  step={1}
                  marks
                  valueLabelDisplay="auto"
                />
                <Typography variant="caption" color="text.secondary">
                  ~{Math.ceil(students.length / numberOfGroups)} students per group
                </Typography>
              </Box>
            </Stack>
          </Box>
        );

      case 2:
        return (
          <Box>
            <Typography variant="body1" paragraph>
              Review and adjust the student groups for {selectedSubject?.name}.
            </Typography>
            
            {studentGroups.length === 0 && (
              <Alert severity="info" sx={{ mb: 2 }}>
                Groups will be generated based on your selected strategy when you proceed.
              </Alert>
            )}

            <Grid container spacing={2}>
              {studentGroups.map((group) => (
                <Grid item key={group.id} xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="subtitle1" gutterBottom fontWeight={600}>
                        {group.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {group.studentIds.length} students
                      </Typography>
                      <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                        {group.studentIds.map(studentId => {
                          const student = students.find(s => s.id === studentId);
                          return student ? (
                            <Chip
                              key={studentId}
                              label={`${student.first_name} ${student.last_name}`}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                          ) : null;
                        })}
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        );

      case 3:
        return (
          <Box>
            <Typography variant="body1" paragraph>
              Assign qualified teachers to each group. Teachers shown are qualified to teach {selectedSubject?.name}.
            </Typography>
            
            <Stack spacing={2}>
              {studentGroups.map((group) => (
                <Paper key={group.id} sx={{ p: 2 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                    <Typography variant="subtitle1" fontWeight={600}>
                      {group.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {group.studentIds.length} students
                    </Typography>
                  </Stack>
                  
                  <TextField
                    select
                    fullWidth
                    label="Assign Teacher"
                    value={teacherAssignments[group.id] || ''}
                    onChange={(e) => handleTeacherAssignment(group.id, e.target.value)}
                  >
                    <MenuItem value="">
                      <em>Select a teacher...</em>
                    </MenuItem>
                    {qualifiedTeachers.map((teacher) => (
                      <MenuItem key={teacher.id} value={teacher.id}>
                        {teacher.first_name} {teacher.last_name}
                      </MenuItem>
                    ))}
                  </TextField>
                </Paper>
              ))}
            </Stack>
          </Box>
        );

      case 4:
        return (
          <Box>
            <Typography variant="body1" paragraph>
              Review class sizes and balance if needed. Ensure no class exceeds the maximum size limit.
            </Typography>
            
            <Alert severity={
              studentGroups.some(g => g.studentIds.length > (selectedSubject?.max_class_size || 30)) 
                ? 'warning' 
                : 'success'
            } sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Class Size Analysis
              </Typography>
              <Typography variant="body2">
                Max allowed: {selectedSubject?.max_class_size} students per class
              </Typography>
            </Alert>

            <Stack spacing={2}>
              {studentGroups.map((group) => {
                const teacher = qualifiedTeachers.find(t => t.id === teacherAssignments[group.id]);
                const isOverCapacity = group.studentIds.length > (selectedSubject?.max_class_size || 30);
                
                return (
                  <Paper key={group.id} sx={{ p: 2, 
                    bgcolor: isOverCapacity ? 'error.50' : 'background.paper',
                    border: isOverCapacity ? 1 : 0,
                    borderColor: 'error.main'
                  }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography variant="subtitle1" fontWeight={600}>
                          {group.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Teacher: {teacher ? `${teacher.first_name} ${teacher.last_name}` : 'Unassigned'}
                        </Typography>
                      </Box>
                      <Box textAlign="right">
                        <Typography variant="h6" color={isOverCapacity ? 'error.main' : 'text.primary'}>
                          {group.studentIds.length}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          students
                        </Typography>
                      </Box>
                    </Stack>
                  </Paper>
                );
              })}
            </Stack>
          </Box>
        );

      case 5:
        return (
          <Box>
            <Typography variant="body1" paragraph>
              Review your group enrollment configuration and confirm to proceed.
            </Typography>
            
            <Stack spacing={3}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle1" gutterBottom fontWeight={600}>
                  <SubjectIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                  Subject
                </Typography>
                <Typography variant="body1">{selectedSubject?.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Code: {selectedSubject?.code} • Max Class Size: {selectedSubject?.max_class_size}
                </Typography>
              </Paper>

              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle1" gutterBottom fontWeight={600}>
                  <GroupsIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                  Groups & Teachers
                </Typography>
                <List dense>
                  {studentGroups.map((group, index) => {
                    const teacher = qualifiedTeachers.find(t => t.id === teacherAssignments[group.id]);
                    return (
                      <React.Fragment key={group.id}>
                        <ListItem>
                          <ListItemText
                            primary={group.name}
                            secondary={
                              <Stack direction="row" spacing={2}>
                                <span>{group.studentIds.length} students</span>
                                <span>•</span>
                                <span>Teacher: {teacher ? `${teacher.first_name} ${teacher.last_name}` : 'Unassigned'}</span>
                              </Stack>
                            }
                          />
                        </ListItem>
                        {index < studentGroups.length - 1 && <Divider />}
                      </React.Fragment>
                    );
                  })}
                </List>
              </Paper>

              <Alert severity="success">
                <Typography variant="subtitle2" gutterBottom>
                  Enrollment Summary
                </Typography>
                <Typography variant="body2">
                  This will create {studentGroups.reduce((sum, group) => sum + group.studentIds.length, 0)} total enrollments 
                  across {studentGroups.length} groups for {selectedSubject?.name}.
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
        return selectedSubject !== null;
      case 1:
        return groupingStrategy && numberOfGroups > 1;
      case 2:
        return studentGroups.length > 0;
      case 3:
        return studentGroups.every(group => teacherAssignments[group.id]);
      case 4:
        return !studentGroups.some(g => g.studentIds.length > (selectedSubject?.max_class_size || 30));
      case 5:
        return true;
      default:
        return false;
    }
  };

  const progress = ((activeStep + 1) / GROUP_ENROLLMENT_STEPS.length) * 100;

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h6">
          Group Enrollment Workflow
        </Typography>
        <Box sx={{ minWidth: 200 }}>
          <Typography variant="body2" color="text.secondary" align="right" sx={{ mb: 0.5 }}>
            Step {activeStep + 1} of {GROUP_ENROLLMENT_STEPS.length}
          </Typography>
          <LinearProgress variant="determinate" value={progress} sx={{ height: 6, borderRadius: 3 }} />
        </Box>
      </Stack>

      <Stepper activeStep={activeStep} orientation="vertical">
        {GROUP_ENROLLMENT_STEPS.map((label, index) => (
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

                  {index === GROUP_ENROLLMENT_STEPS.length - 1 ? (
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