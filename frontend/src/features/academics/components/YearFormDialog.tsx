import * as React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Stack, TextField, FormControlLabel, Checkbox } from '@mui/material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AcademicYearCreate, AcademicYearCreateSchema, AcademicYear } from '../schemas/years';

type Props = {
  open: boolean;
  initial?: Partial<AcademicYear>;
  onClose: () => void;
  onSubmit: (values: AcademicYearCreate) => Promise<void> | void;
};

export default function YearFormDialog({ open, initial, onClose, onSubmit }: Props) {
  const { register, handleSubmit, formState: { errors }, reset } = useForm<AcademicYearCreate>({
    resolver: zodResolver(AcademicYearCreateSchema),
    defaultValues: {
      name: initial?.name ?? '',
      start_date: initial?.start_date ?? '',
      end_date: initial?.end_date ?? '',
      is_active: initial?.is_active ?? false,
    },
  });

  React.useEffect(() => {
    if (open) {
      reset({
        name: initial?.name ?? '',
        start_date: initial?.start_date ?? '',
        end_date: initial?.end_date ?? '',
        is_active: initial?.is_active ?? false,
      });
    }
  }, [open, initial, reset]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{initial?.id ? 'Edit Year' : 'Add Year'}</DialogTitle>
      <form onSubmit={handleSubmit(async (values) => { await onSubmit(values); onClose(); })}>
        <DialogContent>
          <Stack spacing={2}>
            <TextField label="Name" {...register('name')} error={!!errors.name} helperText={errors.name?.message} />
            <TextField label="Start Date (YYYY-MM-DD)" {...register('start_date')} error={!!errors.start_date} helperText={errors.start_date?.message} />
            <TextField label="End Date (YYYY-MM-DD)" {...register('end_date')} error={!!errors.end_date} helperText={errors.end_date?.message} />
            <FormControlLabel control={<Checkbox {...register('is_active')} />} label="Active" />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="inherit">Cancel</Button>
          <Button type="submit">Save</Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
