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
  Box,
  Typography
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { TeacherCreate, TeacherCreateSchema, Teacher } from '@/schemas/academics';

type Props = {
  open: boolean;
  initial?: Partial<Teacher>;
  onClose: () => void;
  onSubmit: (values: TeacherCreate) => Promise<void> | void;
};

export default function TeacherFormDialog({ open, initial, onClose, onSubmit }: Props) {

  // Helper function to normalize boolean values from database
  const normalizeBoolean = (value: unknown): boolean => {
    return value === true || value === 'true' || value === 't';
  };

  const { register, handleSubmit, control, formState: { errors }, reset } = useForm({
    resolver: zodResolver(TeacherCreateSchema),
    defaultValues: {
      first_name: initial?.first_name ?? '',
      last_name: initial?.last_name ?? '',
      email: initial?.email ?? '',
      is_active: normalizeBoolean(initial?.is_active ?? true),
    },
  });


  React.useEffect(() => {
    if (open) {
      reset({
        first_name: initial?.first_name ?? '',
        last_name: initial?.last_name ?? '',
        email: initial?.email ?? '',
        is_active: normalizeBoolean(initial?.is_active ?? true),
      });
    }
  }, [open, initial, reset]);

  const handleFormSubmit = async (values: any) => {
    await onSubmit(values);
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