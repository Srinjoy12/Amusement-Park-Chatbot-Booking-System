import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import { ThemeProvider, CssBaseline, Box, useMediaQuery } from '@mui/material';
import ChatInterface from './components/ChatInterface';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Signup from './pages/Signup';
import BookingHistory from './pages/BookingHistory';
import Navbar from './components/Navbar';
import getAppTheme from './theme';

// Initialize Supabase client
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

function App() {
  const [session, setSession] = useState(null);

  // --- Theme State ---
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const [themeMode, setThemeMode] = useState(() => {
    const storedMode = localStorage.getItem('themeMode');
    return storedMode ? storedMode : (prefersDarkMode ? 'dark' : 'light');
  });

  useEffect(() => {
    localStorage.setItem('themeMode', themeMode);
  }, [themeMode]);

  const toggleThemeMode = () => {
    setThemeMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  };
  
  // Create theme dynamically based on state
  const activeTheme = getAppTheme(themeMode);
  // --- End Theme State ---

  // --- Session Effect ---
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);
  // --- End Session Effect ---

  return (
    <ThemeProvider theme={activeTheme}>
      <CssBaseline />
      <Router>
        <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
          {session && <Navbar session={session} themeMode={themeMode} toggleThemeMode={toggleThemeMode} />}
          <Box component="main" sx={{ flexGrow: 1 }}>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={!session ? <LandingPage /> : <Navigate to="/chat" />} />
              <Route path="/login" element={!session ? <Login /> : <Navigate to="/chat" />} />
              <Route path="/signup" element={!session ? <Signup /> : <Navigate to="/chat" />} />

              {/* Protected routes */}
              <Route
                path="/chat"
                element={session ? <ChatInterface session={session} /> : <Navigate to="/login" />}
              />
              <Route
                path="/bookings"
                element={session ? <BookingHistory session={session} /> : <Navigate to="/login" />}
              />

              {/* Catch all route */}
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </Box>
        </Box>
      </Router>
    </ThemeProvider>
  );
}

export default App;

