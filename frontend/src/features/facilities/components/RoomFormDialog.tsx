// src/features/facilities/components/RoomFormDialog.tsx
import React from 'react';
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
  FormGroup,
  FormControlLabel,
  Checkbox,
  Alert,
  Stack
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Room, RoomCreate, RoomUpdate, RoomCreateSchema, RoomUpdateSchema, RoomTypes } from '@/schemas/facilities';

interface RoomFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: RoomCreate | RoomUpdate) => Promise<void>;
  room?: Room | null;
  isLoading?: boolean;
  error?: string | null;
  schoolId: string; // Required for creating rooms
}

export function RoomFormDialog({ 
  open, 
  onClose, 
  onSubmit, 
  room, 
  isLoading = false, 
  error = null,
  schoolId 
}: RoomFormDialogProps) {
  const isEdit = !!room;
  const schema = isEdit ? RoomUpdateSchema : RoomCreateSchema;
  
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<RoomCreate | RoomUpdate>({
    resolver: zodResolver(schema),
    defaultValues: isEdit ? {
      name: room.name,
      room_code: room.room_code,
      room_type: room.room_type,
      capacity: room.capacity,
      has_projector: room.has_projector,
      has_computers: room.has_computers,
      has_smartboard: room.has_smartboard,
      has_sink: room.has_sink,
      is_bookable: room.is_bookable
    } : {
      name: '',
      room_code: '',
      room_type: 'CLASSROOM',
      capacity: 25,
      has_projector: false,
      has_computers: false,
      has_smartboard: false,
      has_sink: false,
      is_bookable: true,
      school_id: schoolId
    }
  });

  // Reset form when dialog opens/closes or room changes
  React.useEffect(() => {
    if (open) {
      if (isEdit && room) {
        reset({
          name: room.name,
          room_code: room.room_code,
          room_type: room.room_type,
          capacity: room.capacity,
          has_projector: room.has_projector,
          has_computers: room.has_computers,
          has_smartboard: room.has_smartboard,
          has_sink: room.has_sink,
          is_bookable: room.is_bookable
        });
      } else {
        reset({
          name: '',
          room_code: '',
          room_type: 'CLASSROOM',
          capacity: 25,
          has_projector: false,
          has_computers: false,
          has_smartboard: false,
          has_sink: false,
          is_bookable: true,
          school_id: schoolId
        });
      }
    }
  }, [open, isEdit, room, reset, schoolId]);

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="sm" 
      fullWidth
    >
      <DialogTitle>
        {isEdit ? 'Edit Room' : 'Create New Room'}
      </DialogTitle>
      
      <form onSubmit={handleSubmit(async (data) => { await onSubmit(data); onClose(); })}>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            {error && (
              <Alert severity="error">{error}</Alert>
            )}

            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Room Name"
                  fullWidth
                  required
                  error={!!errors.name}
                  helperText={errors.name?.message}
                  placeholder="e.g., Room 101, Science Lab A"
                />
              )}
            />

            <Controller
              name="room_code"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Room Code"
                  fullWidth
                  required
                  error={!!errors.room_code}
                  helperText={errors.room_code?.message}
                  placeholder="e.g., R101, SCI-A"
                />
              )}
            />

            <Controller
              name="room_type"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth>
                  <InputLabel>Room Type</InputLabel>
                  <Select {...field} label="Room Type">
                    {RoomTypes.map((type) => (
                      <MenuItem key={type} value={type}>
                        {type.replace('_', ' ')}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            />

            <Controller
              name="capacity"
              control={control}
              render={({ field: { value, onChange, ...field } }) => (
                <TextField
                  {...field}
                  label="Capacity"
                  type="number"
                  fullWidth
                  value={value || ''}
                  onChange={(e) => onChange(parseInt(e.target.value) || 0)}
                  error={!!errors.capacity}
                  helperText={errors.capacity?.message}
                  inputProps={{ min: 1, max: 100 }}
                />
              )}
            />

            <FormGroup>
              <Controller
                name="has_projector"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={<Checkbox {...field} checked={field.value} />}
                    label="Has Projector"
                  />
                )}
              />
              
              <Controller
                name="has_computers"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={<Checkbox {...field} checked={field.value} />}
                    label="Has Computers"
                  />
                )}
              />
              
              <Controller
                name="has_smartboard"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={<Checkbox {...field} checked={field.value} />}
                    label="Has Smart Board"
                  />
                )}
              />
              
              <Controller
                name="has_sink"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={<Checkbox {...field} checked={field.value} />}
                    label="Has Sink"
                  />
                )}
              />
              
              <Controller
                name="is_bookable"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={<Checkbox {...field} checked={field.value} />}
                    label="Available for Booking"
                  />
                )}
              />
            </FormGroup>
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            variant="contained" 
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : (isEdit ? 'Update' : 'Create')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}