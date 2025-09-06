import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// src/features/facilities/components/RoomFormDialog.tsx
import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, FormControl, InputLabel, Select, MenuItem, FormGroup, FormControlLabel, Checkbox, Alert, Stack } from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { RoomCreateSchema, RoomUpdateSchema, RoomTypes } from '@/schemas/facilities';
export function RoomFormDialog({ open, onClose, onSubmit, room, isLoading = false, error = null, schoolId }) {
    const isEdit = !!room;
    const schema = isEdit ? RoomUpdateSchema : RoomCreateSchema;
    const { control, handleSubmit, reset, formState: { errors } } = useForm({
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
            }
            else {
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
    return (_jsxs(Dialog, { open: open, onClose: onClose, maxWidth: "sm", fullWidth: true, children: [_jsx(DialogTitle, { children: isEdit ? 'Edit Room' : 'Create New Room' }), _jsxs("form", { onSubmit: handleSubmit(async (data) => { await onSubmit(data); onClose(); }), children: [_jsx(DialogContent, { children: _jsxs(Stack, { spacing: 3, sx: { mt: 1 }, children: [error && (_jsx(Alert, { severity: "error", children: error })), _jsx(Controller, { name: "name", control: control, render: ({ field }) => (_jsx(TextField, { ...field, label: "Room Name", fullWidth: true, required: true, error: !!errors.name, helperText: errors.name?.message, placeholder: "e.g., Room 101, Science Lab A" })) }), _jsx(Controller, { name: "room_code", control: control, render: ({ field }) => (_jsx(TextField, { ...field, label: "Room Code", fullWidth: true, required: true, error: !!errors.room_code, helperText: errors.room_code?.message, placeholder: "e.g., R101, SCI-A" })) }), _jsx(Controller, { name: "room_type", control: control, render: ({ field }) => (_jsxs(FormControl, { fullWidth: true, children: [_jsx(InputLabel, { children: "Room Type" }), _jsx(Select, { ...field, label: "Room Type", children: RoomTypes.map((type) => (_jsx(MenuItem, { value: type, children: type.replace('_', ' ') }, type))) })] })) }), _jsx(Controller, { name: "capacity", control: control, render: ({ field: { value, onChange, ...field } }) => (_jsx(TextField, { ...field, label: "Capacity", type: "number", fullWidth: true, value: value || '', onChange: (e) => onChange(parseInt(e.target.value) || 0), error: !!errors.capacity, helperText: errors.capacity?.message, inputProps: { min: 1, max: 100 } })) }), _jsxs(FormGroup, { children: [_jsx(Controller, { name: "has_projector", control: control, render: ({ field }) => (_jsx(FormControlLabel, { control: _jsx(Checkbox, { ...field, checked: field.value }), label: "Has Projector" })) }), _jsx(Controller, { name: "has_computers", control: control, render: ({ field }) => (_jsx(FormControlLabel, { control: _jsx(Checkbox, { ...field, checked: field.value }), label: "Has Computers" })) }), _jsx(Controller, { name: "has_smartboard", control: control, render: ({ field }) => (_jsx(FormControlLabel, { control: _jsx(Checkbox, { ...field, checked: field.value }), label: "Has Smart Board" })) }), _jsx(Controller, { name: "has_sink", control: control, render: ({ field }) => (_jsx(FormControlLabel, { control: _jsx(Checkbox, { ...field, checked: field.value }), label: "Has Sink" })) }), _jsx(Controller, { name: "is_bookable", control: control, render: ({ field }) => (_jsx(FormControlLabel, { control: _jsx(Checkbox, { ...field, checked: field.value }), label: "Available for Booking" })) })] })] }) }), _jsxs(DialogActions, { children: [_jsx(Button, { onClick: onClose, disabled: isLoading, children: "Cancel" }), _jsx(Button, { type: "submit", variant: "contained", disabled: isLoading, children: isLoading ? 'Saving...' : (isEdit ? 'Update' : 'Create') })] })] })] }));
}
