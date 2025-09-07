import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from 'react';
import { Box, Button, Stack, Typography } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { useYears, useCreateYear, useUpdateYear, useDeleteYear } from '../hooks/useYears';
import YearFormDialog from '../components/YearFormDialog';
export default function YearsPage() {
    const [open, setOpen] = React.useState(false);
    const [editing, setEditing] = React.useState(null);
    const yearsQuery = useYears();
    const createMutation = useCreateYear();
    const updateMutation = useUpdateYear(editing?.id || '');
    const deleteMutation = useDeleteYear();
    const cols = [
        { field: 'name', headerName: 'Name', flex: 1 },
        { field: 'start_date', headerName: 'Start', width: 140 },
        { field: 'end_date', headerName: 'End', width: 140 },
        { field: 'is_active', headerName: 'Active', width: 100, type: 'boolean' },
    ];
    return (_jsxs(Stack, { spacing: 2, children: [_jsx(Typography, { variant: "h5", children: "Academic Years" }), _jsxs(Stack, { direction: "row", spacing: 1, children: [_jsx(Button, { onClick: () => { setEditing(null); setOpen(true); }, children: "Add Year" }), _jsx(Button, { disabled: !yearsQuery.data?.length, color: "error", onClick: () => {
                            const first = yearsQuery.data?.[0];
                            if (first)
                                deleteMutation.mutate(first.id);
                        }, children: "Delete First (demo)" })] }), _jsx(Box, { sx: { height: 480 }, children: _jsx(DataGrid, { rows: yearsQuery.data ?? [], columns: cols, getRowId: (r) => r.id, loading: yearsQuery.isLoading || yearsQuery.isRefetching, onRowDoubleClick: (p) => { setEditing(p.row); setOpen(true); }, disableRowSelectionOnClick: true }) }), _jsx(YearFormDialog, { open: open, initial: editing ?? undefined, onClose: () => setOpen(false), onSubmit: async (values) => {
                    if (editing) {
                        await updateMutation.mutateAsync(values);
                    }
                    else {
                        await createMutation.mutateAsync(values);
                    }
                } })] }));
}
