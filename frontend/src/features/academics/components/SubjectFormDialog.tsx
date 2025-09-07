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
  MenuItem
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { SubjectCreate, SubjectCreateSchema, Subject } from '@/schemas/academics';

type Props = {
  open: boolean;
  initial?: Partial<Subject>;
  onClose: () => void;
  onSubmit: (values: SubjectCreate) => Promise<void> | void;
};

const SUBJECT_TYPES = [
  { value: 'CORE', label: 'Core' },
  { value: 'ENRICHMENT', label: 'Enrichment' },
  { value: 'SPECIAL', label: 'Special' },
];

export default function SubjectFormDialog({ open, initial, onClose, onSubmit }: Props) {
  // Helper function to normalize boolean values from database
  const normalizeBoolean = (value: unknown): boolean => {
    return value === true || value === 'true' || value === 't';
  };

  const { register, handleSubmit, control, formState: { errors }, reset } = useForm({
    resolver: zodResolver(SubjectCreateSchema),
    defaultValues: {
      name: initial?.name ?? '',
      code: initial?.code ?? '',
      subject_type: initial?.subject_type ?? 'CORE',
      applies_to_elementary: normalizeBoolean(initial?.applies_to_elementary ?? true),
      applies_to_middle: normalizeBoolean(initial?.applies_to_middle ?? true),
      is_homeroom_default: normalizeBoolean(initial?.is_homeroom_default ?? false),
      requires_specialist: normalizeBoolean(initial?.requires_specialist ?? false),
      allows_cross_grade: normalizeBoolean(initial?.allows_cross_grade ?? false),
    },
  });

  React.useEffect(() => {
    if (open) {
      reset({
        name: initial?.name ?? '',
        code: initial?.code ?? '',
        subject_type: initial?.subject_type ?? 'CORE',
        applies_to_elementary: normalizeBoolean(initial?.applies_to_elementary ?? true),
        applies_to_middle: normalizeBoolean(initial?.applies_to_middle ?? true),
        is_homeroom_default: normalizeBoolean(initial?.is_homeroom_default ?? false),
        requires_specialist: normalizeBoolean(initial?.requires_specialist ?? false),
        allows_cross_grade: normalizeBoolean(initial?.allows_cross_grade ?? false),
      });
    }
  }, [open, initial, reset]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{initial?.id ? 'Edit Subject' : 'Add Subject'}</DialogTitle>
      <form onSubmit={handleSubmit(async (values) => { await onSubmit(values as SubjectCreate); onClose(); })}>
        <DialogContent>
          <Stack spacing={2}>
            <TextField 
              label="Name" 
              {...register('name')} 
              error={!!errors.name} 
              helperText={errors.name?.message} 
            />
            <TextField 
              label="Code" 
              {...register('code')} 
              error={!!errors.code} 
              helperText={errors.code?.message} 
            />
            <FormControl fullWidth error={!!errors.subject_type}>
              <InputLabel>Subject Type</InputLabel>
              <Controller
                name="subject_type"
                control={control}
                render={({ field }) => (
                  <Select {...field} label="Subject Type">
                    {SUBJECT_TYPES.map((type) => (
                      <MenuItem key={type.value} value={type.value}>
                        {type.label}
                      </MenuItem>
                    ))}
                  </Select>
                )}
              />
            </FormControl>
            <FormControlLabel 
              control={<Checkbox {...register('applies_to_elementary')} />} 
              label="Applies to Elementary" 
            />
            <FormControlLabel 
              control={<Checkbox {...register('applies_to_middle')} />} 
              label="Applies to Middle School" 
            />
            <FormControlLabel 
              control={<Checkbox {...register('is_homeroom_default')} />} 
              label="Homeroom Default" 
            />
            <FormControlLabel 
              control={<Checkbox {...register('requires_specialist')} />} 
              label="Requires Specialist" 
            />
            <FormControlLabel 
              control={<Checkbox {...register('allows_cross_grade')} />} 
              label="Allows Cross-Grade" 
            />
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