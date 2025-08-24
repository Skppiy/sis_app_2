import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#1565c0' },
  },
  components: {
    MuiButton: {
      defaultProps: { variant: 'contained' },
    },
  },
});

export default theme;
