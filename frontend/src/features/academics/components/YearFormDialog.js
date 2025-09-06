import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Stack, TextField, FormControlLabel, Checkbox } from '@mui/material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AcademicYearCreateSchema } from '../schemas/years';
export default function YearFormDialog({ open, initial, onClose, onSubmit }) {
    // Helper function to normalize boolean values from database
    const normalizeBoolean = (value) => {
        return value === true || value === 'true' || value === 't';
    };
    const { register, handleSubmit, formState: { errors }, reset } = useForm({
        resolver: zodResolver(AcademicYearCreateSchema),
        defaultValues: {
            name: initial?.name ?? '',
            start_date: initial?.start_date ?? '',
            end_date: initial?.end_date ?? '',
            is_active: normalizeBoolean(initial?.is_active),
        },
    });
    React.useEffect(() => {
        if (open) {
            reset({
                name: initial?.name ?? '',
                start_date: initial?.start_date ?? '',
                end_date: initial?.end_date ?? '',
                is_active: normalizeBoolean(initial?.is_active),
            });
        }
    }, [open, initial, reset]);
    return (_jsxs(Dialog, { open: open, onClose: onClose, fullWidth: true, maxWidth: "sm", children: [_jsx(DialogTitle, { children: initial?.id ? 'Edit Year' : 'Add Year' }), _jsxs("form", { onSubmit: handleSubmit(async (values) => { await onSubmit(values); onClose(); }), children: [_jsx(DialogContent, { children: _jsxs(Stack, { spacing: 2, children: [_jsx(TextField, { label: "Name", ...register('name'), error: !!errors.name, helperText: errors.name?.message }), _jsx(TextField, { label: "Start Date (YYYY-MM-DD)", ...register('start_date'), error: !!errors.start_date, helperText: errors.start_date?.message }), _jsx(TextField, { label: "End Date (YYYY-MM-DD)", ...register('end_date'), error: !!errors.end_date, helperText: errors.end_date?.message }), _jsx(FormControlLabel, { control: _jsx(Checkbox, { ...register('is_active') }), label: "Active" })] }) }), _jsxs(DialogActions, { children: [_jsx(Button, { onClick: onClose, color: "inherit", children: "Cancel" }), _jsx(Button, { type: "submit", children: "Save" })] })] })] }));
}
