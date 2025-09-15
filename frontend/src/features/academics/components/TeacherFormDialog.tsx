import * as React from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  Stack, 
  TextField, 
  FormControlLabel, 
  Checkbox,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Divider
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { TeacherCreate, TeacherCreateSchema, Teacher, GRADE_LEVELS } from '@/schemas/academics';
import { useRooms } from '@/features/facilities/hooks/useRooms';
import { useAuth } from '@/auth/AuthContext';

type Props = {
  open: boolean;
  initial?: Partial<Teacher>;
  onClose: () => void;
  onSubmit: (values: TeacherCreate) => Promise<void> | void;
};

export default function TeacherFormDialog({ open, initial, onClose, onSubmit }: Props) {
  const { activeSchool } = useAuth();
  
  // Fetch available rooms
  const { data: rooms = [] } = useRooms({
    school_id: activeSchool?.id
  });

  // Helper function to normalize boolean values from database
  const normalizeBoolean = (value: unknown): boolean => {
    return value === true || value === 'true' || value === 't';
  };

  const { register, handleSubmit, control, formState: { errors }, reset, watch } = useForm({
    resolver: zodResolver(TeacherCreateSchema),
    defaultValues: {
      first_name: initial?.first_name ?? '',
      last_name: initial?.last_name ?? '',
      email: initial?.email ?? '',
      grade_level: initial?.grade_level ?? '',
      homeroom_id: initial?.homeroom_id ?? '',
      is_specialist: normalizeBoolean(initial?.is_specialist ?? false),
      specialist_subject: initial?.specialist_subject ?? '',
      specialist_room_id: initial?.specialist_room_id ?? '',
      is_active: normalizeBoolean(initial?.is_active ?? true),
    },
  });

  // Watch is_specialist to conditionally show fields
  const isSpecialist = watch('is_specialist');

  React.useEffect(() => {
    if (open) {
      reset({
        first_name: initial?.first_name ?? '',
        last_name: initial?.last_name ?? '',
        email: initial?.email ?? '',
        grade_level: initial?.grade_level ?? '',
        homeroom_id: initial?.homeroom_id ?? '',
        is_specialist: normalizeBoolean(initial?.is_specialist ?? false),
        specialist_subject: initial?.specialist_subject ?? '',
        specialist_room_id: initial?.specialist_room_id ?? '',
        is_active: normalizeBoolean(initial?.is_active ?? true),
      });
    }
  }, [open, initial, reset]);

  const handleFormSubmit = async (values: any) => {
    // Clean up conditional fields based on teacher type
    const cleanedValues = { ...values };
    
    if (values.is_specialist) {
      // For specialists, clear homeroom fields
      cleanedValues.grade_level = '';
      cleanedValues.homeroom_id = '';
    } else {
      // For non-specialists, clear specialist fields
      cleanedValues.specialist_subject = '';
      cleanedValues.specialist_room_id = '';
    }

    await onSubmit(cleanedValues);
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>{initial?.id ? 'Edit Teacher' : 'Add Teacher'}</DialogTitle>
      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <DialogContent>
          <Stack spacing={3}>
            {/* Basic Information */}
            <Box>
              <Typography variant="h6" gutterBottom>
                Basic Information
              </Typography>
              <Stack spacing={2}>
                <Stack direction="row" spacing={2}>
                  <TextField 
                    label="First Name" 
                    {...register('first_name')} 
                    error={!!errors.first_name} 
                    helperText={errors.first_name?.message}
                    fullWidth
                  />
                  <TextField 
                    label="Last Name" 
                    {...register('last_name')} 
                    error={!!errors.last_name} 
                    helperText={errors.last_name?.message}
                    fullWidth
                  />
                </Stack>
                <TextField 
                  label="Email Address" 
                  type="email"
                  {...register('email')} 
                  error={!!errors.email} 
                  helperText={errors.email?.message}
                  fullWidth
                />
                <Controller
                  name="is_active"
                  control={control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={<Checkbox {...field} checked={field.value} />}
                      label="Active Teacher"
                    />
                  )}
                />
              </Stack>
            </Box>

            <Divider />

            {/* Teacher Type */}
            <Box>
              <Typography variant="h6" gutterBottom>
                Assignment Type
              </Typography>
              <Controller
                name="is_specialist"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={<Checkbox {...field} checked={field.value} />}
                    label="Specialist Teacher (PE, Music, Library, etc.)"
                  />
                )}
              />
            </Box>

            <Divider />

            {/* Conditional Fields Based on Teacher Type */}
            {isSpecialist ? (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Specialist Assignment
                </Typography>
                <Stack spacing={2}>
                  <TextField 
                    label="Specialist Subject" 
                    placeholder="e.g., Physical Education, Music, Library"
                    {...register('specialist_subject')} 
                    error={!!errors.specialist_subject} 
                    helperText={errors.specialist_subject?.message || "What subject/area does this teacher specialize in?"}
                    fullWidth
                  />
                  <FormControl fullWidth error={!!errors.specialist_room_id}>
                    <InputLabel>Specialist Room</InputLabel>
                    <Controller
                      name="specialist_room_id"
                      control={control}
                      render={({ field }) => (
                        <Select {...field} label="Specialist Room">
                          <MenuItem value="">
                            <em>No room assigned</em>
                          </MenuItem>
                          {rooms.map((room) => (
                            <MenuItem key={room.id} value={room.id}>
                              {room.name} ({room.room_code})
                            </MenuItem>
                          ))}
                        </Select>
                      )}
                    />
                    {errors.specialist_room_id && (
                      <Box component="span" sx={{ color: 'error.main', fontSize: '0.75rem', mt: 0.5 }}>
                        {errors.specialist_room_id.message}
                      </Box>
                    )}
                  </FormControl>
                </Stack>
              </Box>
            ) : (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Homeroom Assignment
                </Typography>
                <Stack spacing={2}>
                  <FormControl fullWidth error={!!errors.grade_level}>
                    <InputLabel>Grade Level</InputLabel>
                    <Controller
                      name="grade_level"
                      control={control}
                      render={({ field }) => (
                        <Select {...field} label="Grade Level">
                          <MenuItem value="">
                            <em>No grade assigned</em>
                          </MenuItem>
                          {GRADE_LEVELS.map((grade) => (
                            <MenuItem key={grade.value} value={grade.value}>
                              {grade.label}
                            </MenuItem>
                          ))}
                        </Select>
                      )}
                    />
                    {errors.grade_level && (
                      <Box component="span" sx={{ color: 'error.main', fontSize: '0.75rem', mt: 0.5 }}>
                        {errors.grade_level.message}
                      </Box>
                    )}
                  </FormControl>

                  <FormControl fullWidth error={!!errors.homeroom_id}>
                    <InputLabel>Homeroom</InputLabel>
                    <Controller
                      name="homeroom_id"
                      control={control}
                      render={({ field }) => (
                        <Select {...field} label="Homeroom">
                          <MenuItem value="">
                            <em>No room assigned</em>
                          </MenuItem>
                          {rooms.map((room) => (
                            <MenuItem key={room.id} value={room.id}>
                              {room.name} ({room.room_code})
                            </MenuItem>
                          ))}
                        </Select>
                      )}
                    />
                    {errors.homeroom_id && (
                      <Box component="span" sx={{ color: 'error.main', fontSize: '0.75rem', mt: 0.5 }}>
                        {errors.homeroom_id.message}
                      </Box>
                    )}
                  </FormControl>
                </Stack>
              </Box>
            )}
          </Stack>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained">
            {initial?.id ? 'Update Teacher' : 'Add Teacher'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}