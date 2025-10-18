import React, { useState, useMemo, useEffect } from 'react';
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
  Chip,
  CircularProgress,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Checkbox,
  Divider,
  Select,
  MenuItem,
  InputLabel,
  OutlinedInput,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  ArrowForward as NextIcon,
  CheckCircle as CheckIcon,
  Groups as GroupsIcon,
  School as SchoolIcon,
  Class as ClassIcon,
  Assignment as AssignmentIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';

import type { Student } from '@/schemas/students';
import type { Classroom } from '@/schemas/academics';
import { useClassrooms } from '@/features/academics/hooks/useClassrooms';
import { useBulkClassroomEnrollment } from '@/features/enrollment/hooks/useStudents';
import { useStudents } from '@/features/enrollment/hooks/useStudents';
import { useTeachers } from '@/features/academics/hooks/useTeachers';

// Helper function to create descriptive classroom display name
const getClassroomDisplayName = (classroom: Classroom): string => {
  const teacherName = classroom.teacher_assignments?.[0]?.teacher
    ? `${classroom.teacher_assignments[0].teacher.first_name} ${classroom.teacher_assignments[0].teacher.last_name}'s`
    : '';
  const gradeName = classroom.grade_level ? `Grade ${classroom.grade_level}` : '';
  const subjectName = classroom.subject?.name || 'Unknown Subject';
  const roomName = classroom.room?.name ? `(Room ${classroom.room.name})` : '';
  const enrollmentInfo = classroom.max_students
    ? `[${classroom.enrollment_count || 0}/${classroom.max_students} students]`
    : `[${classroom.enrollment_count || 0} students]`;

  // Format: "Teacher's Grade X Subject (Room 123) [5/20 students]"
  return `${teacherName} ${gradeName} ${subjectName} ${roomName} ${enrollmentInfo}`.trim();
};

interface HomeroomBulkEnrollmentWorkflowProps {
  students: Student[]; // Will be ignored - workflow selects its own students
  academicYearId: string;
  gradeLevel: string;
  onComplete: (results: { enrollmentCount: number; studentsAffected: number }) => void;
  onCancel: () => void;
}

// Types for homeroom population selection
interface HomeroomPopulation {
  id: string;
  name: string;
  teacher_name: string;
  grade_level: string;
  student_count: number;
  students: Student[];
}

const HOMEROOM_BULK_STEPS = [
  'Select Homeroom Population',
  'Select Multiple Classrooms',
  'Review & Confirm'
];

export const HomeroomBulkEnrollmentWorkflow: React.FC<HomeroomBulkEnrollmentWorkflowProps> = ({
  students, // Ignored - we fetch our own students
  academicYearId,
  gradeLevel,
  onComplete,
  onCancel,
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [selectedPopulation, setSelectedPopulation] = useState<HomeroomPopulation | null>(null);
  const [selectedClassrooms, setSelectedClassrooms] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all students to build real homeroom populations
  const { data: allStudents = [], isLoading: isLoadingStudents } = useStudents({
    is_active: true,
  });

  // Fetch teachers to identify homeroom teachers
  const { data: allTeachers = [], isLoading: isLoadingTeachers } = useTeachers({
    is_active: true,
  });

  // Fetch classrooms - will be filtered by selected population's grade level
  const { data: allClassrooms = [], isLoading: isLoadingClassrooms } = useClassrooms({
    academic_year_id: academicYearId,
  });

  // Bulk enrollment mutation
  const bulkEnrollmentMutation = useBulkClassroomEnrollment();

  // Create actual homeroom populations from classrooms with CORE subjects
  const homeroomPopulations = useMemo(() => {
    if (!allStudents.length || !allClassrooms.length || !allTeachers.length) return [];

    // Find HOMEROOM classrooms - use proper subject type and homeroom designation
    const coreClassrooms = allClassrooms.filter(classroom => {
      return classroom.subject?.subject_type === 'CORE' &&
             classroom.subject?.is_homeroom_default === true &&
             classroom.classroom_type === 'HOMEROOM';
    });

    // Group by teacher + grade level to create homeroom populations
    const teacherGradeGroups = new Map<string, {
      teacher_id: string;
      teacher_name: string;
      grade_level: string;
      students: Student[];
      classrooms: typeof allClassrooms;
    }>();

    coreClassrooms.forEach(classroom => {
      if (classroom.teacher_assignments && classroom.teacher_assignments.length > 0) {
        const teacher = classroom.teacher_assignments[0].teacher;
        const key = `${teacher?.id}-${classroom.grade_level}`;

        if (!teacherGradeGroups.has(key)) {
          teacherGradeGroups.set(key, {
            teacher_id: teacher?.id || '',
            teacher_name: `${teacher?.first_name || ''} ${teacher?.last_name || ''}`.trim(),
            grade_level: classroom.grade_level || '',
            students: [],
            classrooms: []
          });
        }

        const group = teacherGradeGroups.get(key)!;
        group.classrooms.push(classroom);

        // Add students from this classroom (approximation - in real system would get enrolled students)
        const gradeStudents = allStudents.filter(s => s.current_grade_level === classroom.grade_level);
        // Distribute students across homeroom teachers for that grade
        const teachersForGrade = Array.from(teacherGradeGroups.values()).filter(g => g.grade_level === classroom.grade_level);
        const studentsPerTeacher = Math.ceil(gradeStudents.length / Math.max(teachersForGrade.length, 1));
        group.students = gradeStudents.slice(0, studentsPerTeacher);
      }
    });

    // If no homeroom teachers found, fall back to grade-level groups
    if (teacherGradeGroups.size === 0) {
      const gradeGroups = allStudents.reduce((acc, student) => {
        const grade = student.current_grade_level;
        if (!acc[grade]) {
          acc[grade] = [];
        }
        acc[grade].push(student);
        return acc;
      }, {} as Record<string, Student[]>);

      return Object.entries(gradeGroups)
        .filter(([_, students]) => students.length > 0)
        .map(([grade, studentsInGrade]) => ({
          id: `grade-${grade}`,
          name: `Grade ${grade} Students`,
          teacher_name: `Grade ${grade} Population`,
          grade_level: grade,
          student_count: studentsInGrade.length,
          students: studentsInGrade,
        }))
        .sort((a, b) => {
          const gradeOrder = ['K', '1', '2', '3', '4', '5', '6', '7', '8'];
          return gradeOrder.indexOf(a.grade_level) - gradeOrder.indexOf(b.grade_level);
        });
    }

    // Convert teacher groups to homeroom populations
    const populations: HomeroomPopulation[] = Array.from(teacherGradeGroups.values()).map(group => ({
      id: `homeroom-${group.teacher_id}-${group.grade_level}`,
      name: `${group.teacher_name}'s Grade ${group.grade_level} Homeroom`,
      teacher_name: group.teacher_name,
      grade_level: group.grade_level,
      student_count: group.students.length,
      students: group.students,
    }));

    // Sort by grade level, then by teacher name
    return populations.sort((a, b) => {
      const gradeOrder = ['K', '1', '2', '3', '4', '5', '6', '7', '8'];
      const gradeCompare = gradeOrder.indexOf(a.grade_level) - gradeOrder.indexOf(b.grade_level);
      if (gradeCompare !== 0) return gradeCompare;
      return a.teacher_name.localeCompare(b.teacher_name);
    });
  }, [allStudents, allClassrooms, allTeachers]);

  // Filter classrooms for the selected grade level (excluding CORE subjects)
  const gradeAppropriateClassrooms = useMemo(() => {
    if (!selectedPopulation) return [];

    // Filter classrooms that are appropriate for the grade level
    // Exclude HOMEROOM subjects as this is for non-HOMEROOM enrollment
    return allClassrooms.filter(classroom => {
      // Check if it's a HOMEROOM subject
      const isHomeroom = classroom.subject?.subject_type === 'CORE' &&
                        classroom.subject?.is_homeroom_default === true &&
                        classroom.classroom_type === 'HOMEROOM';

      // Include if: not HOMEROOM, same grade level, and has capacity
      return !isHomeroom &&
             classroom.grade_level === selectedPopulation.grade_level &&
             (classroom.max_students === null ||
              (classroom.enrollment_count || 0) < (classroom.max_students || 0));
    });
  }, [allClassrooms, selectedPopulation]);

  // Clear invalid classroom selections when population changes
  useEffect(() => {
    if (selectedPopulation) {
      // Clear invalid selections (classrooms not available for the new grade)
      setSelectedClassrooms(prev => {
        const validSelections = new Set<string>();
        prev.forEach(classroomId => {
          if (gradeAppropriateClassrooms.some(c => c.id === classroomId)) {
            validSelections.add(classroomId);
          }
        });
        return validSelections;
      });
    }
  }, [selectedPopulation?.id, gradeAppropriateClassrooms]);

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handlePopulationSelect = (population: HomeroomPopulation) => {
    setSelectedPopulation(population);
    setError(null);
  };

  const handleClassroomToggle = (classroomId: string) => {
    setSelectedClassrooms(prev => {
      const newSet = new Set(prev);
      if (newSet.has(classroomId)) {
        newSet.delete(classroomId);
      } else {
        // Validate that classroom exists in grade appropriate classrooms
        const isValidClassroom = gradeAppropriateClassrooms.some(c => c.id === classroomId);
        if (isValidClassroom) {
          newSet.add(classroomId);
        }
      }
      return newSet;
    });
  };

  const handleEnrollmentSubmit = async () => {
    if (!selectedPopulation || selectedClassrooms.size === 0) {
      setError('Please select homeroom population and classrooms');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Filter valid classrooms before creating enrollment requests
      const validSelectedClassrooms = Array.from(selectedClassrooms).filter(classroomId =>
        gradeAppropriateClassrooms.some(c => c.id === classroomId)
      );

      if (validSelectedClassrooms.length === 0) {
        setError('No valid classrooms selected');
        return;
      }

      // Create single bulk enrollment request for all student-classroom combinations
      const enrollmentRequest = {
        students: selectedPopulation.students.map(s => s.id),
        classrooms: validSelectedClassrooms,
        grade_level: selectedPopulation.grade_level,
        academic_year_id: academicYearId,
      };

      const result = await bulkEnrollmentMutation.mutateAsync(enrollmentRequest);

      // Calculate totals
      const totalEnrollments = result.summary.total_enrollments_created;
      const studentsAffected = selectedPopulation.students.length;

      onComplete({ enrollmentCount: totalEnrollments, studentsAffected });
    } catch (error: any) {
      console.error('Bulk enrollment failed:', error);
      setError(error?.response?.data?.detail || error?.message || 'Enrollment failed');
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
              Select the homeroom population to be enrolled. This will determine which students
              will be enrolled in the selected classrooms.
            </Typography>

            <Stack spacing={3}>
              {(isLoadingStudents || isLoadingTeachers || isLoadingClassrooms) ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                  <Typography variant="body2" sx={{ ml: 2 }}>
                    Loading homeroom populations...
                  </Typography>
                </Box>
              ) : homeroomPopulations.length === 0 ? (
                <Alert severity="info">
                  No homeroom populations available. Please ensure students are enrolled in the system.
                </Alert>
              ) : (
                <FormControl fullWidth>
                  <InputLabel id="homeroom-select-label">Select Homeroom Population</InputLabel>
                  <Select
                    labelId="homeroom-select-label"
                    value={selectedPopulation?.id || ''}
                    label="Select Homeroom Population"
                    onChange={(e) => {
                      const population = homeroomPopulations.find(p => p.id === e.target.value);
                      if (population) handlePopulationSelect(population);
                    }}
                  >
                    {homeroomPopulations.map((population) => (
                      <MenuItem key={population.id} value={population.id}>
                        <Box>
                          <Typography variant="subtitle1">
                            {population.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Teacher: {population.teacher_name} • {population.student_count} students
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}

              {/* Show selected population details */}
              {selectedPopulation && (
                <Paper sx={{ p: 2, bgcolor: 'primary.50' }}>
                  <Typography variant="subtitle1" gutterBottom fontWeight={600}>
                    <GroupsIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                    Selected: {selectedPopulation.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Grade {selectedPopulation.grade_level} • {selectedPopulation.student_count} students
                  </Typography>
                  <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
                    {selectedPopulation.students.slice(0, 8).map(student => (
                      <Chip
                        key={student.id}
                        label={`${student.first_name} ${student.last_name}`}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    ))}
                    {selectedPopulation.students.length > 8 && (
                      <Chip
                        label={`+${selectedPopulation.students.length - 8} more`}
                        size="small"
                        color="primary"
                      />
                    )}
                  </Stack>
                </Paper>
              )}
            </Stack>
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="body1" paragraph>
              Select multiple classrooms for the Grade {selectedPopulation?.grade_level} students.
              These are non-CORE subjects that have capacity for additional students.
            </Typography>

            <Stack spacing={2}>
              <Typography variant="subtitle2" color="text.secondary">
                {selectedClassrooms.size} classroom{selectedClassrooms.size !== 1 ? 's' : ''} selected
              </Typography>

              {isLoadingClassrooms ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : gradeAppropriateClassrooms.length === 0 ? (
                <Alert severity="warning">
                  <Typography variant="subtitle2" gutterBottom>
                    No Available Classrooms
                  </Typography>
                  <Typography variant="body2">
                    No non-CORE classrooms are available for Grade {selectedPopulation?.grade_level}
                    with sufficient capacity.
                  </Typography>
                </Alert>
              ) : (
                <List>
                  {gradeAppropriateClassrooms.map((classroom, index) => {
                    const isSelected = selectedClassrooms.has(classroom.id);

                    return (
                      <React.Fragment key={classroom.id}>
                        <ListItem
                          onClick={() => handleClassroomToggle(classroom.id)}
                          sx={{
                            cursor: 'pointer',
                            border: 1,
                            borderColor: isSelected ? 'primary.main' : 'divider',
                            borderRadius: 1,
                            mb: 1,
                            bgcolor: isSelected ? 'primary.50' : 'background.paper',
                          }}
                        >
                          <ListItemIcon>
                            <Checkbox
                              checked={isSelected}
                              onChange={() => handleClassroomToggle(classroom.id)}
                            />
                          </ListItemIcon>
                          <ListItemIcon>
                            <ClassIcon color={isSelected ? 'primary' : 'action'} />
                          </ListItemIcon>
                          <ListItemText
                            primary={getClassroomDisplayName(classroom)}
                            secondary={
                              <Typography variant="caption" color="text.secondary">
                                {classroom.subject?.subject_type} •
                                {classroom.classroom_type === 'HOMEROOM' ? ' Homeroom' : ' Elective'}
                              </Typography>
                            }
                          />
                        </ListItem>
                        {index < gradeAppropriateClassrooms.length - 1 && <Divider />}
                      </React.Fragment>
                    );
                  })}
                </List>
              )}
            </Stack>
          </Box>
        );

      case 2:
        return (
          <Box>
            <Typography variant="body1" paragraph>
              Review your selection and confirm the bulk enrollment. This will enroll all students
              from the selected homeroom in the selected classrooms.
            </Typography>

            <Stack spacing={3}>
              {/* Homeroom Population Summary */}
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle1" gutterBottom fontWeight={600}>
                  <GroupsIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                  Selected Homeroom Population
                </Typography>
                {selectedPopulation && (
                  <Box>
                    <Typography variant="body1">{selectedPopulation.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Grade {selectedPopulation.grade_level} • {selectedPopulation.student_count} students
                    </Typography>
                    <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
                      {selectedPopulation.students.map(student => (
                        <Chip
                          key={student.id}
                          label={`${student.first_name} ${student.last_name}`}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      ))}
                    </Stack>
                  </Box>
                )}
              </Paper>

              {/* Selected Classrooms Summary */}
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle1" gutterBottom fontWeight={600}>
                  <SchoolIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                  Selected Classrooms ({selectedClassrooms.size})
                </Typography>
                <List dense>
                  {Array.from(selectedClassrooms).map((classroomId, index) => {
                    const classroom = gradeAppropriateClassrooms.find(c => c.id === classroomId);
                    return classroom ? (
                      <React.Fragment key={classroomId}>
                        <ListItem>
                          <ListItemIcon>
                            <AssignmentIcon color="secondary" />
                          </ListItemIcon>
                          <ListItemText
                            primary={getClassroomDisplayName(classroom)}
                            secondary={
                              <Typography variant="caption" color="text.secondary">
                                {classroom.subject?.subject_type} classroom
                              </Typography>
                            }
                          />
                        </ListItem>
                        {index < Array.from(selectedClassrooms).length - 1 && <Divider />}
                      </React.Fragment>
                    ) : null;
                  })}
                </List>
              </Paper>

              {/* Enrollment Summary */}
              <Alert severity="success">
                <Typography variant="subtitle2" gutterBottom>
                  Enrollment Summary
                </Typography>
                <Typography variant="body2">
                  This will create {(selectedPopulation?.student_count || 0) * selectedClassrooms.size} total enrollments
                  ({selectedPopulation?.student_count || 0} students × {selectedClassrooms.size} classrooms)
                </Typography>
              </Alert>

              {/* Error Display */}
              {error && (
                <Alert severity="error">
                  <Typography variant="subtitle2" gutterBottom>
                    Enrollment Error
                  </Typography>
                  <Typography variant="body2">{error}</Typography>
                </Alert>
              )}
            </Stack>
          </Box>
        );

      default:
        return 'Unknown step';
    }
  };

  const isStepValid = (step: number) => {
    const anyLoading = isLoadingStudents || isLoadingTeachers || isLoadingClassrooms;

    switch (step) {
      case 0:
        return selectedPopulation !== null && !anyLoading;
      case 1:
        return selectedClassrooms.size > 0 && !anyLoading;
      case 2:
        return selectedPopulation !== null && selectedClassrooms.size > 0 && !error && !anyLoading;
      default:
        return false;
    }
  };

  const progress = ((activeStep + 1) / HOMEROOM_BULK_STEPS.length) * 100;

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h6">
          Homeroom Bulk Enrollment Workflow
        </Typography>
        <Box sx={{ minWidth: 200 }}>
          <Typography variant="body2" color="text.secondary" align="right" sx={{ mb: 0.5 }}>
            Step {activeStep + 1} of {HOMEROOM_BULK_STEPS.length}
          </Typography>
          <LinearProgress variant="determinate" value={progress} sx={{ height: 6, borderRadius: 3 }} />
        </Box>
      </Stack>

      <Stepper activeStep={activeStep} orientation="vertical">
        {HOMEROOM_BULK_STEPS.map((label, index) => (
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
                      disabled={loading}
                    >
                      Back
                    </Button>
                  )}

                  {index === 0 && (
                    <Button onClick={onCancel} disabled={loading}>
                      Cancel
                    </Button>
                  )}

                  <Box sx={{ flex: 1 }} />

                  {index === HOMEROOM_BULK_STEPS.length - 1 ? (
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
                      disabled={!isStepValid(index) || loading}
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