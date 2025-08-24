import * as React from 'react';
import { AppBar, Box, Button, Toolbar, Typography } from '@mui/material';
import { Link, Outlet } from '@tanstack/react-router';
import { useAuth } from '@/auth/AuthContext';

export function AppShell() {
  const { logout } = useAuth();

  return (
    <Box sx={{ minHeight: '100vh' }}>
      <AppBar position="static" color="primary">
        <Toolbar>
          <Typography sx={{ flexGrow: 1, fontWeight: 700 }}>SIS</Typography>
          <Button component={Link} to="/app/dashboard" sx={{ color: 'white' }}>
            Dashboard
          </Button>
          <Button component={Link} to="/app/years" sx={{ color: 'white' }}>
            Years
          </Button>
          <Button component={Link} to="/app/subjects" sx={{ color: 'white' }}>
            Subjects
          </Button>
          <Button component={Link} to="/app/classrooms" sx={{ color: 'white' }}>
            Classrooms
          </Button>
          <Button component={Link} to="/app/rooms" sx={{ color: 'white' }}>
            Rooms
          </Button>
          <Button component={Link} to="/app/students" sx={{ color: 'white' }}>
            Students
          </Button>
          <Button onClick={logout} sx={{ color: 'white', ml: 2 }}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>
      <Box sx={{ p: 3 }}>
        <React.Suspense fallback={<div>Loading...</div>}>
          <Outlet />
        </React.Suspense>
      </Box>
    </Box>
  );
}