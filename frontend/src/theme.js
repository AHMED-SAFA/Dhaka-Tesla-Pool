import { createTheme } from '@mui/material/styles';

export const appTheme = createTheme({
  cssVariables: {
    colorSchemeSelector: 'data-toolpad-color-scheme',
  },
  colorSchemes: {
    light: {
      palette: {
        mode: 'light',
        primary: {
          main: '#059669', // solid emerald
          light: '#34d399',
          dark: '#047857',
          contrastText: '#ffffff',
        },
        secondary: {
          main: '#0284c7', // solid ocean
          contrastText: '#ffffff',
        },
        background: {
          default: '#f8fafc',
          paper: '#ffffff',
        },
        text: {
          primary: '#0f172a',
          secondary: '#475569',
        },
        divider: '#e2e8f0',
        action: {
          hover: 'rgba(0, 0, 0, 0.04)',
          selected: 'rgba(5, 150, 105, 0.08)',
        },
      },
    },
    dark: {
      palette: {
        mode: 'dark',
        primary: {
          main: '#10b981', // solid emerald
          light: '#34d399',
          dark: '#059669',
          contrastText: '#041d14',
        },
        secondary: {
          main: '#38bdf8', // solid sky
          contrastText: '#082f49',
        },
        background: {
          default: '#090d0b',
          paper: '#111714',
        },
        text: {
          primary: '#f8fafc',
          secondary: '#94a3b8',
        },
        divider: '#1c2621',
        action: {
          hover: 'rgba(255, 255, 255, 0.05)',
          selected: 'rgba(16, 185, 129, 0.12)',
        },
      },
    },
  },
  typography: {
    fontFamily: [
      'GeistVariable',
      'system-ui',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      'sans-serif',
    ].join(','),
    h1: { fontWeight: 700, letterSpacing: '-0.02em' },
    h2: { fontWeight: 700, letterSpacing: '-0.015em' },
    h3: { fontWeight: 600, letterSpacing: '-0.01em' },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none !important', // Strictly no gradients
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: 'none !important',
        },
      },
    },
  },
  breakpoints: {
    values: {
      xs: 0,
      sm: 640,
      md: 768,
      lg: 1024,
      xl: 1280,
    },
  },
});
