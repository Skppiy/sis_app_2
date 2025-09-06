import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from 'react';
import { AppBar, Box, Button, Toolbar, Typography } from '@mui/material';
import { Link, Outlet } from '@tanstack/react-router';
import { useAuth } from '@/auth/AuthContext';
export function AppShell() {
    const { logout } = useAuth();
    return (_jsxs(Box, { sx: { minHeight: '100vh' }, children: [_jsx(AppBar, { position: "static", color: "primary", children: _jsxs(Toolbar, { children: [_jsx(Typography, { sx: { flexGrow: 1, fontWeight: 700 }, children: "SIS" }), _jsx(Button, { component: Link, to: "/app/dashboard", sx: { color: 'white' }, children: "Dashboard" }), _jsx(Button, { component: Link, to: "/app/years", sx: { color: 'white' }, children: "Years" }), _jsx(Button, { component: Link, to: "/app/subjects", sx: { color: 'white' }, children: "Subjects" }), _jsx(Button, { component: Link, to: "/app/classrooms", sx: { color: 'white' }, children: "Classrooms" }), _jsx(Button, { component: Link, to: "/app/rooms", sx: { color: 'white' }, children: "Rooms" }), _jsx(Button, { component: Link, to: "/app/students", sx: { color: 'white' }, children: "Students" }), _jsx(Button, { onClick: logout, sx: { color: 'white', ml: 2 }, children: "Logout" })] }) }), _jsx(Box, { sx: { p: 3 }, children: _jsx(React.Suspense, { fallback: _jsx("div", { children: "Loading..." }), children: _jsx(Outlet, {}) }) })] }));
}
