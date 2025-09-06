import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Stack, TextField, FormControlLabel, Checkbox, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { SubjectCreateSchema } from '@/schemas/academics';
const SUBJECT_TYPES = [
    { value: 'CORE', label: 'Core' },
    { value: 'ENRICHMENT', label: 'Enrichment' },
    { value: 'SPECIAL', label: 'Special' },
];
export default function SubjectFormDialog({ open, initial, onClose, onSubmit }) {
    // Helper function to normalize boolean values from database
    const normalizeBoolean = (value) => {
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
    return (_jsxs(Dialog, { open: open, onClose: onClose, fullWidth: true, maxWidth: "sm", children: [_jsx(DialogTitle, { children: initial?.id ? 'Edit Subject' : 'Add Subject' }), _jsxs("form", { onSubmit: handleSubmit(async (values) => { await onSubmit(values); onClose(); }), children: [_jsx(DialogContent, { children: _jsxs(Stack, { spacing: 2, children: [_jsx(TextField, { label: "Name", ...register('name'), error: !!errors.name, helperText: errors.name?.message }), _jsx(TextField, { label: "Code", ...register('code'), error: !!errors.code, helperText: errors.code?.message }), _jsxs(FormControl, { fullWidth: true, error: !!errors.subject_type, children: [_jsx(InputLabel, { children: "Subject Type" }), _jsx(Controller, { name: "subject_type", control: control, render: ({ field }) => (_jsx(Select, { ...field, label: "Subject Type", children: SUBJECT_TYPES.map((type) => (_jsx(MenuItem, { value: type.value, children: type.label }, type.value))) })) })] }), _jsx(FormControlLabel, { control: _jsx(Checkbox, { ...register('applies_to_elementary') }), label: "Applies to Elementary" }), _jsx(FormControlLabel, { control: _jsx(Checkbox, { ...register('applies_to_middle') }), label: "Applies to Middle School" }), _jsx(FormControlLabel, { control: _jsx(Checkbox, { ...register('is_homeroom_default') }), label: "Homeroom Default" }), _jsx(FormControlLabel, { control: _jsx(Checkbox, { ...register('requires_specialist') }), label: "Requires Specialist" }), _jsx(FormControlLabel, { control: _jsx(Checkbox, { ...register('allows_cross_grade') }), label: "Allows Cross-Grade" })] }) }), _jsxs(DialogActions, { children: [_jsx(Button, { onClick: onClose, color: "inherit", children: "Cancel" }), _jsx(Button, { type: "submit", children: "Save" })] })] })] }));
}
