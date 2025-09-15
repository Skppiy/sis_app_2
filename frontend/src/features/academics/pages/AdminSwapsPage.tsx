// src/features/academics/pages/AdminSwapsPage.tsx
import React from 'react';
import {
  Box,
  Typography,
  Stack,
  Alert,
  AlertTitle,
  Breadcrumbs,
  Link,
} from '@mui/material';
import {
  AdminPanelSettings as AdminIcon,
  SwapHoriz as SwapIcon,
  NavigateNext as NavigateNextIcon,
} from '@mui/icons-material';
import { useAuth } from '@/auth/AuthContext';
import AdminSwapReview from '../components/AdminSwapReview';

export default function AdminSwapsPage() {
  const { user } = useAuth();

  // Check if user has admin permissions (adjust this based on your auth system)
  const isAdmin = user?.role === 'admin';

  if (!isAdmin) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          <AlertTitle>Access Denied</AlertTitle>
          You do not have permission to access the subject swap administration panel.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Stack spacing={3}>
        {/* Breadcrumbs */}
        <Breadcrumbs 
          separator={<NavigateNextIcon fontSize="small" />}
          aria-label="breadcrumb"
        >
          <Link 
            underline="hover" 
            color="inherit" 
            href="/app/dashboard"
          >
            Dashboard
          </Link>
          <Link 
            underline="hover" 
            color="inherit" 
            href="/app/teachers"
          >
            Teachers
          </Link>
          <Typography color="text.primary">Subject Swaps</Typography>
        </Breadcrumbs>

        {/* Page Header */}
        <Box>
          <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 1 }}>
            <AdminIcon color="primary" fontSize="large" />
            <Box>
              <Typography variant="h4" gutterBottom>
                Subject Swap Administration
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Review and manage teacher subject swap requests for elementary classrooms
              </Typography>
            </Box>
          </Stack>
        </Box>

        {/* Admin Panel Instructions */}
        <Alert severity="info">
          <AlertTitle>Administrator Guidelines</AlertTitle>
          <Stack spacing={1}>
            <Typography variant="body2">
              • <strong>Priority Review:</strong> Focus on requests that are 3+ days old first
            </Typography>
            <Typography variant="body2">
              • <strong>Impact Assessment:</strong> Consider student disruption and teacher workload balance
            </Typography>
            <Typography variant="body2">
              • <strong>Core Subjects Only:</strong> Only core elementary subjects (Math, ELA, Science, Social Studies, Reading) can be swapped
            </Typography>
            <Typography variant="body2">
              • <strong>Bulk Actions:</strong> Use bulk approval for similar, low-impact requests
            </Typography>
            <Typography variant="body2">
              • <strong>Comments Required:</strong> Always provide feedback for rejected requests
            </Typography>
          </Stack>
        </Alert>

        {/* Main Admin Panel */}
        <AdminSwapReview />
      </Stack>
    </Box>
  );
}