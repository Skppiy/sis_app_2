import * as React from 'react';
import { AppBar, Box, Button, Toolbar, Typography } from '@mui/material';
import { Link, Outlet } from '@tanstack/react-router';
import { useAuth } from '@auth/AuthContext';

export function AppShell() {
  const { logout } = useAuth();

  return (
    <Box sx={{ minHeight: '100vh' }}>
      <AppBar position="static" color="primary">
        <Toolbar>
          <Typography sx={{ flexGrow: 1, fontWeight: 700 }}>SIS</Typography>
          <Button component={Link} to="/app/dashboard">Dashboard</Button>
          <Button component={Link} to="/app/years">Years</Button>
          <Button onClick={logout}>Logout</Button>
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