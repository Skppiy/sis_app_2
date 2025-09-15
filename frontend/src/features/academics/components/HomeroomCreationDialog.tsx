// src/features/academics/components/HomeroomCreationDialog.tsx
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Divider,
  Alert,
  AlertTitle,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Paper,
} from '@mui/material';
import {
  Home as HomeIcon,
  School as SchoolIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { HomeroomCreate, HomeroomCreateSchema, ELEMENTARY_GRADES } from '@/schemas/academics';
import { useAuth } from '@/auth/AuthContext';
import { useTeachers } from '@/features/academics/hooks/useTeachers';
import { useRooms } from '@/features/facilities/hooks/useRooms';
import { useYears } from '@/features/academics/hooks/useYears';
import { useCreateHomeroom, useElementaryGrades } from '@/features/academics/hooks/useHomeroom';
import AutoAssignmentPreview from './AutoAssignmentPreview';

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
};

const CREATION_STEPS = [
  {
    label: 'Select Teacher & Grade',
    description: 'Choose the homeroom teacher and grade level',
  },
  {
    label: 'Choose Room',
    description: 'Select a physical room for the homeroom (optional)',
  },
  {
    label: 'Preview & Create',
    description: 'Review auto-assignments and create the homeroom',
  },
];

export default function HomeroomCreationDialog({ open, onClose, onSuccess }: Props) {
  const { activeSchool } = useAuth();
  const [activeStep, setActiveStep] = useState(0);
  
  // Data queries
  const { data: teachers = [] } = useTeachers();
  const { data: rooms = [] } = useRooms({ school_id: activeSchool?.id });
  const { data: academicYears = [] } = useYears();
  const elementaryGrades = useElementaryGrades();
  
  // Get active academic year
  const activeYear = academicYears.find(y => {
    const isActive = y.is_active;
    return isActive === true || String(isActive) === 'true' || String(isActive) === 't';
  });

  // Mutations
  const createMutation = useCreateHomeroom();

  // Form setup
  const { register, handleSubmit, control, formState: { errors }, reset, watch } = useForm({
    resolver: zodResolver(HomeroomCreateSchema),
    defaultValues: {
      teacher_id: '',
      grade_level: '',
      room_id: '',
      academic_year_id: activeYear?.id || '',
    },
  });

  // Watch form values for preview
  const watchedTeacherId = watch('teacher_id');
  const watchedGradeLevel = watch('grade_level');
  const watchedRoomId = watch('room_id');

  // Get selected teacher details
  const selectedTeacher = teachers.find(t => t.id === watchedTeacherId);
  const selectedRoom = rooms.find(r => r.id === watchedRoomId);

  // Filter teachers to exclude specialists (homeroom should be non-specialist teachers)
  const homeroomEligibleTeachers = teachers.filter(teacher => !teacher.is_specialist);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      reset({
        teacher_id: '',
        grade_level: '',
        room_id: '',
        academic_year_id: activeYear?.id || '',
      });
      setActiveStep(0);
    }
  }, [open, activeYear?.id, reset]);

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleFormSubmit = async (values: HomeroomCreate) => {
    try {
      const result = await createMutation.mutateAsync(values);
      onSuccess?.();
      onClose();
      
      // Reset form after successful creation
      reset();
      setActiveStep(0);
    } catch (error) {
      console.error('Failed to create homeroom:', error);
    }
  };

  const canProceedFromStep0 = watchedTeacherId && watchedGradeLevel;
  const canCreateHomeroom = canProceedFromStep0 && activeYear;

  if (!activeYear) {
    return (
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
        <DialogContent>
          <Alert severity="warning">
            <AlertTitle>No Active Academic Year</AlertTitle>
            Please set an active academic year before creating homerooms.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">
      <DialogTitle>
        <Stack direction="row" alignItems="center" spacing={1}>
          <HomeIcon />
          <Box>
            <Typography variant="h6">Create Homeroom</Typography>
            <Typography variant="body2" color="text.secondary">
              {activeYear.name}
            </Typography>
          </Box>
        </Stack>
      </DialogTitle>
      
      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <DialogContent>
          <Box sx={{ width: '100%' }}>
            <Stepper activeStep={activeStep} orientation="vertical">
              {/* Step 1: Teacher & Grade Selection */}
              <Step>
                <StepLabel>
                  <Typography variant="subtitle1">{CREATION_STEPS[0].label}</Typography>
                </StepLabel>
                <StepContent>
                  <Stack spacing={3}>
                    <Typography variant="body2" color="text.secondary">
                      {CREATION_STEPS[0].description}
                    </Typography>
                    
                    <Stack spacing={2}>
                      {/* Teacher Selection */}
                      <FormControl fullWidth error={!!errors.teacher_id}>
                        <InputLabel>Homeroom Teacher</InputLabel>
                        <Controller
                          name="teacher_id"
                          control={control}
                          render={({ field }) => (
                            <Select {...field} label="Homeroom Teacher">
                              <MenuItem value="">
                                <em>Select a teacher</em>
                              </MenuItem>
                              {homeroomEligibleTeachers.map((teacher) => (
                                <MenuItem key={teacher.id} value={teacher.id}>
                                  <Stack direction="row" alignItems="center" spacing={1}>
                                    <PersonIcon fontSize="small" />
                                    <Typography>
                                      {teacher.first_name} {teacher.last_name}
                                    </Typography>
                                    {teacher.grade_level && (
                                      <Typography variant="caption" color="text.secondary">
                                        (Current: Grade {teacher.grade_level})
                                      </Typography>
                                    )}
                                  </Stack>
                                </MenuItem>
                              ))}
                            </Select>
                          )}
                        />
                        {errors.teacher_id && (
                          <Typography variant="caption" color="error" sx={{ mt: 1 }}>
                            {errors.teacher_id.message}
                          </Typography>
                        )}
                      </FormControl>

                      {/* Grade Level Selection */}
                      <FormControl fullWidth error={!!errors.grade_level}>
                        <InputLabel>Grade Level</InputLabel>
                        <Controller
                          name="grade_level"
                          control={control}
                          render={({ field }) => (
                            <Select {...field} label="Grade Level">
                              <MenuItem value="">
                                <em>Select a grade level</em>
                              </MenuItem>
                              {elementaryGrades.map((grade) => (
                                <MenuItem key={grade.value} value={grade.value}>
                                  {grade.label}
                                </MenuItem>
                              ))}
                            </Select>
                          )}
                        />
                        {errors.grade_level && (
                          <Typography variant="caption" color="error" sx={{ mt: 1 }}>
                            {errors.grade_level.message}
                          </Typography>
                        )}
                      </FormControl>

                      {selectedTeacher && (
                        <Alert severity="info">
                          <Typography variant="body2">
                            <strong>{selectedTeacher.first_name} {selectedTeacher.last_name}</strong>
                            {selectedTeacher.grade_level 
                              ? ` currently teaches Grade ${selectedTeacher.grade_level}`
                              : ' will be assigned as homeroom teacher'
                            }
                          </Typography>
                        </Alert>
                      )}
                    </Stack>

                    <Box sx={{ mb: 1 }}>
                      <Button
                        variant="contained"
                        onClick={handleNext}
                        disabled={!canProceedFromStep0}
                      >
                        Continue
                      </Button>
                    </Box>
                  </Stack>
                </StepContent>
              </Step>

              {/* Step 2: Room Selection */}
              <Step>
                <StepLabel>
                  <Typography variant="subtitle1">{CREATION_STEPS[1].label}</Typography>
                </StepLabel>
                <StepContent>
                  <Stack spacing={3}>
                    <Typography variant="body2" color="text.secondary">
                      {CREATION_STEPS[1].description}
                    </Typography>
                    
                    {/* Room Selection */}
                    <FormControl fullWidth>
                      <InputLabel>Room (Optional)</InputLabel>
                      <Controller
                        name="room_id"
                        control={control}
                        render={({ field }) => (
                          <Select {...field} label="Room (Optional)">
                            <MenuItem value="">
                              <em>No room assigned</em>
                            </MenuItem>
                            {rooms.map((room) => (
                              <MenuItem key={room.id} value={room.id}>
                                <Stack direction="row" alignItems="center" spacing={1}>
                                  <SchoolIcon fontSize="small" />
                                  <Typography>
                                    {room.name}
                                    {room.capacity && ` (Capacity: ${room.capacity})`}
                                  </Typography>
                                </Stack>
                              </MenuItem>
                            ))}
                          </Select>
                        )}
                      />
                    </FormControl>

                    <Box sx={{ mb: 1 }}>
                      <Stack direction="row" spacing={1}>
                        <Button onClick={handleBack}>
                          Back
                        </Button>
                        <Button variant="contained" onClick={handleNext}>
                          Continue
                        </Button>
                      </Stack>
                    </Box>
                  </Stack>
                </StepContent>
              </Step>

              {/* Step 3: Preview & Create */}
              <Step>
                <StepLabel>
                  <Typography variant="subtitle1">{CREATION_STEPS[2].label}</Typography>
                </StepLabel>
                <StepContent>
                  <Stack spacing={3}>
                    <Typography variant="body2" color="text.secondary">
                      {CREATION_STEPS[2].description}
                    </Typography>

                    {/* Summary */}
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Homeroom Summary
                      </Typography>
                      <Stack spacing={1}>
                        <Typography variant="body2">
                          <strong>Teacher:</strong> {selectedTeacher ? `${selectedTeacher.first_name} ${selectedTeacher.last_name}` : 'Not selected'}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Grade:</strong> {watchedGradeLevel ? `${elementaryGrades.find(g => g.value === watchedGradeLevel)?.label}` : 'Not selected'}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Room:</strong> {selectedRoom ? selectedRoom.name : 'No room assigned'}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Academic Year:</strong> {activeYear.name}
                        </Typography>
                      </Stack>
                    </Paper>

                    {/* Auto-Assignment Preview */}
                    <Divider />
                    <AutoAssignmentPreview
                      grade={watchedGradeLevel}
                      teacherId={watchedTeacherId}
                      academicYearId={activeYear.id}
                      teacherName={selectedTeacher ? `${selectedTeacher.first_name} ${selectedTeacher.last_name}` : undefined}
                    />

                    <Box sx={{ mb: 1 }}>
                      <Stack direction="row" spacing={1}>
                        <Button onClick={handleBack}>
                          Back
                        </Button>
                        <Button
                          type="submit"
                          variant="contained"
                          disabled={!canCreateHomeroom || createMutation.isPending}
                        >
                          {createMutation.isPending ? 'Creating Homeroom...' : 'Create Homeroom'}
                        </Button>
                      </Stack>
                    </Box>
                  </Stack>
                </StepContent>
              </Step>
            </Stepper>
          </Box>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={onClose} disabled={createMutation.isPending}>
            Cancel
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}