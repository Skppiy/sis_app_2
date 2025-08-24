import React from 'react';
import { Paper, Typography } from '@mui/material';

export const ClassroomsPage: React.FC = () => {
  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6">Classrooms</Typography>
      <Typography variant="body2" sx={{ mt: 1 }}>
        TODO: Wire to /classrooms and include teacher assignment view.
      </Typography>
    </Paper>
  );
};
