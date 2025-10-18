// src/features/academics/components/ClassroomCreateDialog.tsx
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { ClassroomCreateSchema, type ClassroomCreate, GRADE_LEVELS, type Subject } from '@/schemas/academics';
import { useCreateClassroom } from '../hooks/useClassrooms';
import { useSubjects } from '../hooks/useSubjects';
import { useYears } from '../hooks/useYears';
import { useRooms } from '@/features/facilities/hooks/useRooms';
import { useTeachers } from '../hooks/useTeachers';

interface ClassroomCreateDialogProps {
  open: boolean;
  onClose: () => void;
}

export default function ClassroomCreateDialog({ open, onClose }: ClassroomCreateDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);

  const { data: subjects = [] } = useSubjects();
  const { data: academicYears = [] } = useYears();
  const { data: rooms = [] } = useRooms();
  const { data: teachers = [] } = useTeachers({ is_active: true });

  const createClassroomMutation = useCreateClassroom();

  const activeYear = academicYears.find(year => year.is_active);

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ClassroomCreate>({
    resolver: zodResolver(ClassroomCreateSchema),
    defaultValues: {
      name: '',
      grade_level: '',
      max_students: 25,
      subject_id: '',
      academic_year_id: activeYear?.id || '',
      room_id: '',
      teacher_id: '',
    },
  });

  const watchedSubjectId = watch('subject_id');

  // Update selected subject when subject_id changes
  useEffect(() => {
    if (watchedSubjectId) {
      const subject = subjects.find(s => s.id === watchedSubjectId);
      setSelectedSubject(subject || null);
    } else {
      setSelectedSubject(null);
    }
  }, [watchedSubjectId, subjects]);

  // Update academic year when it changes
  useEffect(() => {
    if (activeYear?.id) {
      setValue('academic_year_id', activeYear.id);
    }
  }, [activeYear, setValue]);

  const handleClose = () => {
    reset();
    setSelectedSubject(null);
    setIsSubmitting(false);
    onClose();
  };

  // Get the classroom type that will be derived from the selected subject
  const getClassroomTypeDisplay = () => {
    if (!selectedSubject) return 'Select a subject first';
    return selectedSubject.requires_specialist ? 'SPECIALIST' : 'CORE';
  };

  const onSubmit = async (data: ClassroomCreate) => {
    setIsSubmitting(true);
    try {
      await createClassroomMutation.mutateAsync(data);
      handleClose();
    } catch (error) {
      console.error('Failed to create classroom:', error);
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogTitle>Add Classroom</DialogTitle>

        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            {createClassroomMutation.isError && (
              <Alert severity="error">
                Failed to create classroom: {createClassroomMutation.error?.message || 'Please try again.'}
              </Alert>
            )}

            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Classroom Name"
                  fullWidth
                  error={!!errors.name}
                  helperText={errors.name?.message}
                  placeholder="e.g., Ms. Smith's 3rd Grade Math"
                />
              )}
            />

            <Controller
              name="grade_level"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth error={!!errors.grade_level}>
                  <InputLabel>Grade Level</InputLabel>
                  <Select
                    {...field}
                    label="Grade Level"
                  >
                    {GRADE_LEVELS.map((grade) => (
                      <MenuItem key={grade.value} value={grade.value}>
                        {grade.label}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.grade_level && (
                    <Alert severity="error" sx={{ mt: 1 }}>
                      {errors.grade_level.message}
                    </Alert>
                  )}
                </FormControl>
              )}
            />

            <Controller
              name="subject_id"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth error={!!errors.subject_id}>
                  <InputLabel>Subject</InputLabel>
                  <Select
                    {...field}
                    label="Subject"
                  >
                    {subjects.map((subject) => (
                      <MenuItem key={subject.id} value={subject.id}>
                        {subject.name} ({subject.code})
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.subject_id && (
                    <Alert severity="error" sx={{ mt: 1 }}>
                      {errors.subject_id.message}
                    </Alert>
                  )}
                </FormControl>
              )}
            />

            <Controller
              name="teacher_id"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth error={!!errors.teacher_id}>
                  <InputLabel>Teacher</InputLabel>
                  <Select
                    {...field}
                    label="Teacher"
                  >
                    {teachers.map((teacher) => (
                      <MenuItem key={teacher.id} value={teacher.id}>
                        {teacher.first_name} {teacher.last_name}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.teacher_id && (
                    <Alert severity="error" sx={{ mt: 1 }}>
                      {errors.teacher_id.message}
                    </Alert>
                  )}
                </FormControl>
              )}
            />

            {/* Academic Year - Auto-set to active year */}
            {activeYear && (
              <Alert severity="info" sx={{ py: 1 }}>
                Academic Year: {activeYear.name} (Active)
              </Alert>
            )}

            <Controller
              name="room_id"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth>
                  <InputLabel>Room (Optional)</InputLabel>
                  <Select
                    {...field}
                    label="Room (Optional)"
                  >
                    <MenuItem value="">
                      <em>No Room Assigned</em>
                    </MenuItem>
                    {rooms.map((room) => (
                      <MenuItem key={room.id} value={room.id}>
                        {room.name} {room.capacity && `(Capacity: ${room.capacity})`}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            />

            {/* Classroom Type Display - Auto-derived from Subject */}
            <Alert
              severity={selectedSubject ? "info" : "warning"}
              sx={{ py: 1 }}
            >
              <strong>Classroom Type:</strong> {getClassroomTypeDisplay()}
              {selectedSubject && (
                <div style={{ fontSize: '0.875rem', marginTop: '4px' }}>
                  {selectedSubject.requires_specialist
                    ? 'This subject requires a specialist teacher'
                    : 'This is a core academic subject'
                  }
                </div>
              )}
            </Alert>

            <Controller
              name="max_students"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Maximum Students"
                  type="number"
                  fullWidth
                  error={!!errors.max_students}
                  helperText={errors.max_students?.message}
                  InputProps={{
                    inputProps: { min: 1, max: 50 }
                  }}
                />
              )}
            />
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isSubmitting}
            startIcon={isSubmitting ? <CircularProgress size={16} /> : null}
          >
            {isSubmitting ? 'Creating...' : 'Create Classroom'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}