import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Stack, TextField, FormControlLabel, Checkbox, FormControl, InputLabel, Select, MenuItem, Box, Typography, Divider } from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { TeacherCreateSchema, GRADE_LEVELS } from '@/schemas/academics';
import { useRooms } from '@/features/facilities/hooks/useRooms';
import { useAuth } from '@/auth/AuthContext';
export default function TeacherFormDialog({ open, initial, onClose, onSubmit }) {
    const { activeSchool } = useAuth();
    // Fetch available rooms
    const { data: rooms = [] } = useRooms({
        school_id: activeSchool?.id
    });
    // Helper function to normalize boolean values from database
    const normalizeBoolean = (value) => {
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
    const handleFormSubmit = async (values) => {
        // Clean up conditional fields based on teacher type
        const cleanedValues = { ...values };
        if (values.is_specialist) {
            // For specialists, clear homeroom fields
            cleanedValues.grade_level = '';
            cleanedValues.homeroom_id = '';
        }
        else {
            // For non-specialists, clear specialist fields
            cleanedValues.specialist_subject = '';
            cleanedValues.specialist_room_id = '';
        }
        await onSubmit(cleanedValues);
    };
    return (_jsxs(Dialog, { open: open, onClose: onClose, fullWidth: true, maxWidth: "md", children: [_jsx(DialogTitle, { children: initial?.id ? 'Edit Teacher' : 'Add Teacher' }), _jsxs("form", { onSubmit: handleSubmit(handleFormSubmit), children: [_jsx(DialogContent, { children: _jsxs(Stack, { spacing: 3, children: [_jsxs(Box, { children: [_jsx(Typography, { variant: "h6", gutterBottom: true, children: "Basic Information" }), _jsxs(Stack, { spacing: 2, children: [_jsxs(Stack, { direction: "row", spacing: 2, children: [_jsx(TextField, { label: "First Name", ...register('first_name'), error: !!errors.first_name, helperText: errors.first_name?.message, fullWidth: true }), _jsx(TextField, { label: "Last Name", ...register('last_name'), error: !!errors.last_name, helperText: errors.last_name?.message, fullWidth: true })] }), _jsx(TextField, { label: "Email Address", type: "email", ...register('email'), error: !!errors.email, helperText: errors.email?.message, fullWidth: true }), _jsx(Controller, { name: "is_active", control: control, render: ({ field }) => (_jsx(FormControlLabel, { control: _jsx(Checkbox, { ...field, checked: field.value }), label: "Active Teacher" })) })] })] }), _jsx(Divider, {}), _jsxs(Box, { children: [_jsx(Typography, { variant: "h6", gutterBottom: true, children: "Assignment Type" }), _jsx(Controller, { name: "is_specialist", control: control, render: ({ field }) => (_jsx(FormControlLabel, { control: _jsx(Checkbox, { ...field, checked: field.value }), label: "Specialist Teacher (PE, Music, Library, etc.)" })) })] }), _jsx(Divider, {}), isSpecialist ? (_jsxs(Box, { children: [_jsx(Typography, { variant: "h6", gutterBottom: true, children: "Specialist Assignment" }), _jsxs(Stack, { spacing: 2, children: [_jsx(TextField, { label: "Specialist Subject", placeholder: "e.g., Physical Education, Music, Library", ...register('specialist_subject'), error: !!errors.specialist_subject, helperText: errors.specialist_subject?.message || "What subject/area does this teacher specialize in?", fullWidth: true }), _jsxs(FormControl, { fullWidth: true, error: !!errors.specialist_room_id, children: [_jsx(InputLabel, { children: "Specialist Room" }), _jsx(Controller, { name: "specialist_room_id", control: control, render: ({ field }) => (_jsxs(Select, { ...field, label: "Specialist Room", children: [_jsx(MenuItem, { value: "", children: _jsx("em", { children: "No room assigned" }) }), rooms.map((room) => (_jsxs(MenuItem, { value: room.id, children: [room.name, " (", room.room_code, ")"] }, room.id)))] })) }), errors.specialist_room_id && (_jsx(Typography, { variant: "caption", color: "error", children: errors.specialist_room_id.message }))] })] })] })) : (_jsxs(Box, { children: [_jsx(Typography, { variant: "h6", gutterBottom: true, children: "Homeroom Assignment" }), _jsxs(Stack, { spacing: 2, children: [_jsxs(FormControl, { fullWidth: true, error: !!errors.grade_level, children: [_jsx(InputLabel, { children: "Grade Level" }), _jsx(Controller, { name: "grade_level", control: control, render: ({ field }) => (_jsxs(Select, { ...field, label: "Grade Level", children: [_jsx(MenuItem, { value: "", children: _jsx("em", { children: "No grade assigned" }) }), GRADE_LEVELS.map((grade) => (_jsx(MenuItem, { value: grade.value, children: grade.label }, grade.value)))] })) }), errors.grade_level && (_jsx(Typography, { variant: "caption", color: "error", children: errors.grade_level.message }))] }), _jsxs(FormControl, { fullWidth: true, error: !!errors.homeroom_id, children: [_jsx(InputLabel, { children: "Homeroom" }), _jsx(Controller, { name: "homeroom_id", control: control, render: ({ field }) => (_jsxs(Select, { ...field, label: "Homeroom", children: [_jsx(MenuItem, { value: "", children: _jsx("em", { children: "No room assigned" }) }), rooms.map((room) => (_jsxs(MenuItem, { value: room.id, children: [room.name, " (", room.room_code, ")"] }, room.id)))] })) }), errors.homeroom_id && (_jsx(Typography, { variant: "caption", color: "error", children: errors.homeroom_id.message }))] })] })] }))] }) }), _jsxs(DialogActions, { children: [_jsx(Button, { onClick: onClose, children: "Cancel" }), _jsx(Button, { type: "submit", variant: "contained", children: initial?.id ? 'Update Teacher' : 'Add Teacher' })] })] })] }));
}
