// src/pages/EnrollmentPage.tsx
import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { SchoolIcon } from '@mui/icons-material';
import ThreeTierEnrollmentManager from '@/components/enrollment/ThreeTierEnrollmentManager';

export default function EnrollmentPage() {
  return (
    <Box sx={{ margin: '0 auto', maxWidth: 1300 }}>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <SchoolIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <Box>
            <Typography variant="h4" component="h1">
              Student Enrollment Management
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
              Three-tier enrollment system for comprehensive student management
            </Typography>
          </Box>
        </Box>
      </Paper>
      
      <ThreeTierEnrollmentManager />
    </Box>
  );
}