// src/App.tsx
import React from "react";
import { Outlet, Link } from "@tanstack/react-router";
import { CssBaseline, ThemeProvider, createTheme, AppBar, Toolbar, Button, Box } from "@mui/material";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/auth/AuthContext";

const theme = createTheme();
const qc = new QueryClient();

function Nav() {
  const items = [
    { to: "/app/dashboard", label: "DASHBOARD" },
    { to: "/app/years", label: "YEARS" },
    { to: "/app/subjects", label: "SUBJECTS" },
    { to: "/app/classrooms", label: "CLASSROOMS" },
    { to: "/app/rooms", label: "ROOMS" },
    { to: "/app/students", label: "STUDENTS" },
  ];
  return (
    <AppBar position="static">
      <Toolbar sx={{ gap: 2 }}>
        <Box sx={{ fontWeight: 600 }}>SIS</Box>
        <Box sx={{ flex: 1 }} />
        {items.map((i) => (
          <Button key={i.to} color="inherit" component={Link as any} to={i.to}>
            {i.label}
          </Button>
        ))}
      </Toolbar>
    </AppBar>
  );
}

function AppInner() {
  return (
    <>
      <Nav />
      <Box p={3}><Outlet /></Box>
    </>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <AuthProvider>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <AppInner />
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
