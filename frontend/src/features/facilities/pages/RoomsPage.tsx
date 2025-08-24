import React from 'react';
import { Paper, Typography } from '@mui/material';

const RoomsPage: React.FC = () => {
  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6">Rooms</Typography>
      <Typography variant="body2" sx={{ mt: 1 }}>
        TODO: Wire to /rooms; honor in_use on delete.
      </Typography>
    </Paper>
  );
};

export default RoomsPage;
