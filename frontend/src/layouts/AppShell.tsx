import * as React from 'react';
import { AppBar, Box, Button, Toolbar, Typography, Container } from '@mui/material';
import { Link, Outlet } from '@tanstack/react-router';
import { useAuth } from '@/auth/AuthContext';

export function AppShell() {
  const { logout, user } = useAuth();

  // Check if user has admin permissions
  const isAdmin = user?.role === 'admin';

  const navItems = [
    { to: "/app/dashboard", label: "DASHBOARD" },
    { to: "/app/years", label: "YEARS" },
    { to: "/app/subjects", label: "SUBJECTS" },
    { to: "/app/classrooms", label: "CLASSROOMS" },
    { to: "/app/rooms", label: "ROOMS" },
    { to: "/app/teachers", label: "TEACHERS" },
    { to: "/app/student-services", label: "STUDENT SERVICES" },
    { to: "/app/students", label: "STUDENTS" },
    { to: "/app/enrollment", label: "ENROLLMENT" },
    ...(isAdmin ? [{ to: "/app/admin/subject-swaps", label: "SWAP ADMIN" }] : []),
  ];

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AppBar position="static" elevation={0}>
        <Toolbar sx={{ gap: 2, px: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
            SIS
          </Typography>
          <Box sx={{ flex: 1 }} />
          {navItems.map((item) => (
            <Button 
              key={item.to} 
              color="inherit" 
              component={Link} 
              to={item.to}
              sx={{ 
                mx: 1, 
                px: 2,
                fontWeight: 500,
                borderRadius: 2,
                transition: 'all 0.2s ease',
                '&:hover': {
                  backgroundColor: 'rgba(102, 126, 234, 0.1)',
                  transform: 'translateY(-1px)'
                }
              }}
            >
              {item.label}
            </Button>
          ))}
          <Button 
            onClick={logout} 
            sx={{ 
              ml: 2, 
              px: 3,
              fontWeight: 500,
              borderRadius: 2,
              backgroundColor: 'rgba(102, 126, 234, 0.1)',
              '&:hover': {
                backgroundColor: 'rgba(102, 126, 234, 0.2)',
                transform: 'translateY(-1px)'
              }
            }} 
            color="inherit"
          >
            LOGOUT
          </Button>
        </Toolbar>
      </AppBar>
      <Box component="main" sx={{ flexGrow: 1, py: 3 }}>
        <Container maxWidth="xl" sx={{ height: '100%' }}>
          <React.Suspense fallback={
            <Box sx={{ 
              textAlign: 'center', 
              py: 8, 
              color: 'primary.main',
              fontSize: '1.2rem',
              fontWeight: 500
            }}>
              Loading...
            </Box>
          }>
            <Outlet />
          </React.Suspense>
        </Container>
      </Box>
    </Box>
  );
}