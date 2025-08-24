import * as React from 'react';
import { Box, Button, Paper, Stack, TextField, Typography } from '@mui/material';
import { useAuth } from '@auth/AuthContext';
import { useNavigate } from '@tanstack/react-router';

export default function Login() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [username, setU] = React.useState('admin@springfield.edu');
  const [password, setP] = React.useState('password');
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (isAuthenticated) navigate({ to: '/app/dashboard' });
  }, [isAuthenticated, navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await login(username, password);
      navigate({ to: '/app/dashboard' });
    } catch (err: any) {
      setError(err.message || 'Login failed');
    }
  };

  return (
    <Box sx={{ display: 'grid', placeItems: 'center', height: '100vh' }}>
      <Paper sx={{ p: 4, width: 420 }}>
        <Typography variant="h5" sx={{ mb: 2 }}>Sign in</Typography>
        <form onSubmit={onSubmit}>
          <Stack spacing={2}>
            <TextField label="Username" value={username} onChange={e => setU(e.target.value)} required />
            <TextField label="Password" type="password" value={password} onChange={e => setP(e.target.value)} required />
            {error && <Typography color="error">{error}</Typography>}
            <Button type="submit">Login</Button>
          </Stack>
        </form>
      </Paper>
    </Box>
  );
}
