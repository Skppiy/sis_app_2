import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from 'react';
import { AppBar, Box, Button, Toolbar, Typography, Container } from '@mui/material';
import { Link, Outlet } from '@tanstack/react-router';
import { useAuth } from '@/auth/AuthContext';
export function AppShell() {
    const { logout } = useAuth();
    const navItems = [
        { to: "/app/dashboard", label: "DASHBOARD" },
        { to: "/app/years", label: "YEARS" },
        { to: "/app/subjects", label: "SUBJECTS" },
        { to: "/app/classrooms", label: "CLASSROOMS" },
        { to: "/app/rooms", label: "ROOMS" },
        { to: "/app/teachers", label: "TEACHERS" },
        { to: "/app/students", label: "STUDENTS" },
    ];
    return (_jsxs(Box, { sx: { minHeight: '100vh', display: 'flex', flexDirection: 'column' }, children: [_jsx(AppBar, { position: "static", elevation: 0, children: _jsxs(Toolbar, { sx: { gap: 2, px: 3 }, children: [_jsx(Typography, { variant: "h6", sx: { fontWeight: 700, color: 'primary.main' }, children: "SIS" }), _jsx(Box, { sx: { flex: 1 } }), navItems.map((item) => (_jsx(Button, { color: "inherit", component: Link, to: item.to, sx: {
                                mx: 1,
                                px: 2,
                                fontWeight: 500,
                                borderRadius: 2,
                                transition: 'all 0.2s ease',
                                '&:hover': {
                                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                                    transform: 'translateY(-1px)'
                                }
                            }, children: item.label }, item.to))), _jsx(Button, { onClick: logout, sx: {
                                ml: 2,
                                px: 3,
                                fontWeight: 500,
                                borderRadius: 2,
                                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                                '&:hover': {
                                    backgroundColor: 'rgba(102, 126, 234, 0.2)',
                                    transform: 'translateY(-1px)'
                                }
                            }, color: "inherit", children: "LOGOUT" })] }) }), _jsx(Box, { component: "main", sx: { flexGrow: 1, py: 3 }, children: _jsx(Container, { maxWidth: "xl", sx: { height: '100%' }, children: _jsx(React.Suspense, { fallback: _jsx(Box, { sx: {
                                textAlign: 'center',
                                py: 8,
                                color: 'primary.main',
                                fontSize: '1.2rem',
                                fontWeight: 500
                            }, children: "Loading..." }), children: _jsx(Outlet, {}) }) }) })] }));
}
