import React from 'react';
import ReactDOM from 'react-dom/client';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import { ToastContainer } from 'react-toastify';
import App from './App';
import './styles.css';
import 'react-toastify/dist/ReactToastify.css';

const theme = createTheme({
  palette: {
    mode: 'dark', primary: { main: '#8b83ff', dark: '#7067ee', light: '#b7b2ff' },
    background: { default: '#080d18', paper: '#111827' }, text: { primary: '#f3f5f9', secondary: '#9aa6bb' },
    divider: '#263147', error: { main: '#ff647c' }, warning: { main: '#e69a38' }, success: { main: '#43b995' },
  },
  typography: { fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', h4: { fontWeight: 750, letterSpacing: '-0.04em' }, h6: { fontWeight: 700, letterSpacing: '-0.02em' }, button: { textTransform: 'none', fontWeight: 600 }, body2: { lineHeight: 1.55 } },
  shape: { borderRadius: 10 },
  components: {
    MuiButton: { defaultProps: { disableElevation: true } },
    MuiPaper: { styleOverrides: { root: { backgroundImage: 'none' } } },
    MuiOutlinedInput: { styleOverrides: { root: { backgroundColor: '#0c1423' } } },
    MuiDialog: { styleOverrides: { paper: { border: '1px solid #263147' } } },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
      <ToastContainer position="top-right" autoClose={3000} theme="dark" />
    </ThemeProvider>
  </React.StrictMode>,
);
