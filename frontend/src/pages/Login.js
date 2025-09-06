import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from 'react';
import { Box, Button, Paper, Stack, TextField, Typography } from '@mui/material';
import { useAuth } from '@auth/AuthContext';
import { useNavigate } from '@tanstack/react-router';
export default function Login() {
    const { login, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [username, setU] = React.useState('admin@springfield.edu');
    const [password, setP] = React.useState('password');
    const [error, setError] = React.useState(null);
    React.useEffect(() => {
        if (isAuthenticated)
            navigate({ to: '/app/dashboard' });
    }, [isAuthenticated, navigate]);
    const onSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        try {
            await login(username, password);
            navigate({ to: '/app/dashboard' });
        }
        catch (err) {
            setError(err.message || 'Login failed');
        }
    };
    return (_jsx(Box, { sx: { display: 'grid', placeItems: 'center', height: '100vh' }, children: _jsxs(Paper, { sx: { p: 4, width: 420 }, children: [_jsx(Typography, { variant: "h5", sx: { mb: 2 }, children: "Sign in" }), _jsx("form", { onSubmit: onSubmit, children: _jsxs(Stack, { spacing: 2, children: [_jsx(TextField, { label: "Username", value: username, onChange: e => setU(e.target.value), required: true }), _jsx(TextField, { label: "Password", type: "password", value: password, onChange: e => setP(e.target.value), required: true }), error && _jsx(Typography, { color: "error", children: error }), _jsx(Button, { type: "submit", children: "Login" })] }) })] }) }));
}
