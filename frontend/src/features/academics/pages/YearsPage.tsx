import * as React from 'react';
import { Box, Button, Stack, Typography } from '@mui/material';
import { DataGrid, GridColDef, GridRowParams } from '@mui/x-data-grid';
import { useYears } from '../hooks/useYears';
import YearFormDialog from '../components/YearFormDialog';
import { AcademicYear } from '../schemas/years';

export default function YearsPage() {
  const { list, create, update, remove } = useYears();
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<AcademicYear | null>(null);

  const cols: GridColDef[] = [
    { field: 'name', headerName: 'Name', flex: 1 },
    { field: 'start_date', headerName: 'Start', width: 140 },
    { field: 'end_date', headerName: 'End', width: 140 },
    { field: 'is_active', headerName: 'Active', width: 100, type: 'boolean' },
  ];

  return (
    <Stack spacing={2}>
      <Typography variant="h5">Academic Years</Typography>
      <Stack direction="row" spacing={1}>
        <Button onClick={() => { setEditing(null); setOpen(true); }}>Add Year</Button>
        <Button
          disabled={!list.data?.length}
          color="error"
          onClick={() => {
            const first = list.data?.[0];
            if (first) remove.mutate(first.id);
          }}
        >
          Delete First (demo)
        </Button>
      </Stack>

      <Box sx={{ height: 480 }}>
        <DataGrid
          rows={list.data ?? []}
          columns={cols}
          getRowId={(r) => r.id}
          loading={list.isLoading || list.isRefetching}
          onRowDoubleClick={(p: GridRowParams) => { setEditing(p.row as AcademicYear); setOpen(true); }}
          disableRowSelectionOnClick
        />
      </Box>

      <YearFormDialog
        open={open}
        initial={editing ?? undefined}
        onClose={() => setOpen(false)}
        onSubmit={async (values) => {
          if (editing) {
            await update.mutateAsync({ id: editing.id, data: values });
          } else {
            await create.mutateAsync(values);
          }
        }}
      />
    </Stack>
  );
}
