import React from 'react';
import { Paper, Typography } from '@mui/material';

export const SubjectsPage: React.FC = () => {
  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6">Subjects</Typography>
      <Typography variant="body2" sx={{ mt: 1 }}>
        TODO: Wire to /subjects with React Query + MUI DataGrid.
      </Typography>
    </Paper>
  );
};
