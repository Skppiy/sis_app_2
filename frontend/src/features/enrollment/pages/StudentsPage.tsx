import React from 'react';
import { Paper, Typography } from '@mui/material';

const StudentsPage: React.FC = () => {
  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6">Students</Typography>
      <Typography variant="body2" sx={{ mt: 1 }}>
        TODO: Wire to /students and enrollment flows.
      </Typography>
    </Paper>
  );
};

export default StudentsPage;
