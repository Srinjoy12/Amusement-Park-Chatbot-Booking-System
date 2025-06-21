import { createTheme } from '@mui/material/styles';

// Define base configurations
const typography = {
  fontFamily: '"Space Grotesk", sans-serif',
  h1: { fontWeight: 600 },
  h2: { fontWeight: 600 },
  h3: { fontWeight: 600 },
  h4: { fontWeight: 500 },
  h5: { fontWeight: 500 },
  h6: { fontWeight: 500 },
  subtitle1: { fontWeight: 400, fontSize: '1.1rem' },
  subtitle2: { fontWeight: 400, fontSize: '0.9rem' },
  body1: { fontWeight: 400 },
  body2: { fontWeight: 400 },
  button: { fontWeight: 500, textTransform: 'none' },
};

const components = {
  MuiTextField: {
    styleOverrides: {
      root: { fontFamily: '"Space Grotesk", sans-serif' },
    },
  },
  MuiButton: {
    styleOverrides: {
      root: { fontFamily: '"Space Grotesk", sans-serif', fontWeight: 500 },
    },
  },
};

// Function to create theme based on mode
const getAppTheme = (mode) => {
  return createTheme({
    palette: {
      mode, // This automatically sets light/dark palette defaults
      ...(mode === 'light'
        ? {
            // --- Light Mode Palette Overrides ---
            primary: {
              main: '#673ab7', // Example purple
            },
            secondary: {
              main: '#ff4081', // Example pink
            },
            background: {
              default: '#f4f6f8',
              paper: '#ffffff',
            },
          }
        : {
            // --- Dark Mode Palette Overrides ---
            primary: {
              main: '#b39ddb', // Lighter purple for dark mode
            },
            secondary: {
              main: '#f48fb1', // Lighter pink
            },
            background: {
              default: '#121212',
              paper: '#1e1e1e',
            },
          }),
    },
    typography,
    components,
  });
};

export default getAppTheme; 