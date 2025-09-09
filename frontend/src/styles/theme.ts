import { createTheme } from '@mui/material/styles';

// Design tokens extracted from previous version
const colors = {
  primary: '#667eea',
  primaryLight: '#764ba2',
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  cardBackground: '#ffffff',
  textPrimary: '#2d3748',
  textSecondary: '#4a5568',
  textMuted: '#718096',
  border: '#cbd5e0',
  hoverBackground: 'rgba(102, 126, 234, 0.1)',
  glassBackground: 'rgba(255, 255, 255, 0.95)',
};

const sisTheme = createTheme({
  palette: {
    primary: {
      main: colors.primary,
      light: colors.primaryLight,
    },
    background: {
      default: '#f8fafc', // Fallback for non-gradient support
      paper: colors.cardBackground,
    },
    text: {
      primary: colors.textPrimary,
      secondary: colors.textSecondary,
    },
  },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
      color: colors.textPrimary,
    },
    h2: {
      fontSize: '1.8rem',
      fontWeight: 600,
      color: colors.textSecondary,
    },
    h3: {
      fontSize: '1.2rem',
      fontWeight: 600,
      color: colors.textPrimary,
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background: colors.background,
          minHeight: '100vh',
        },
        '#root': {
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: colors.glassBackground,
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
          color: colors.primary,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)',
          padding: '30px',
          margin: '20px 0',
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-3px)',
            boxShadow: '0 12px 35px rgba(0, 0, 0, 0.2)',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 500,
          padding: '10px 15px',
          transition: 'all 0.2s ease',
        },
        text: {
          '&:hover': {
            backgroundColor: colors.hoverBackground,
          },
        },
        contained: {
          boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
          '&:hover': {
            boxShadow: '0 6px 16px rgba(102, 126, 234, 0.4)',
            transform: 'translateY(-1px)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)',
        },
        elevation1: {
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        },
      },
    },
    MuiContainer: {
      styleOverrides: {
        root: {
          maxWidth: '1200px !important',
          padding: '20px',
        },
      },
    },
    MuiTableContainer: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)',
          '& .MuiTable-root': {
            '& .MuiTableHead-root': {
              '& .MuiTableCell-root': {
                backgroundColor: 'rgba(102, 126, 234, 0.05)',
                fontWeight: 600,
                color: colors.textPrimary,
              },
            },
            '& .MuiTableBody-root': {
              '& .MuiTableRow-root': {
                transition: 'all 0.2s ease',
                '&:hover': {
                  backgroundColor: 'rgba(102, 126, 234, 0.03)',
                  transform: 'scale(1.005)',
                },
              },
            },
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            transition: 'all 0.2s ease',
            '&:hover': {
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: colors.primary,
              },
            },
            '&.Mui-focused': {
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: colors.primary,
                boxShadow: `0 0 0 2px rgba(102, 126, 234, 0.2)`,
              },
            },
          },
        },
      },
    },
  },
});

export default sisTheme;