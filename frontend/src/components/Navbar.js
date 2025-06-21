import React from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import ChatIcon from '@mui/icons-material/Chat';
import HistoryIcon from '@mui/icons-material/History';
import LogoutIcon from '@mui/icons-material/Logout';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { supabase } from '../App';

// Receive themeMode and toggleThemeMode as props
function Navbar({ session, themeMode, toggleThemeMode }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/login'); // Navigate after sign out
    } catch (error) {
      console.error('Error logging out:', error.message);
    }
  };

  return (
    <Box 
      sx={{ 
        width: '100%', 
        position: 'absolute', 
        top: 0, 
        left: 0, 
        zIndex: 10,
        background: 'transparent',
      }}
    >
      <Toolbar 
        sx={{ 
          display: 'flex',
          justifyContent: 'space-between',
          gap: 1,
          py: 1.5,
          px: 3,
        }}
      >
        {/* Logo Text */}
        <Typography
          variant="h5"
          component="div"
          sx={{
            fontFamily: '"Space Grotesk", sans-serif',
            fontWeight: 600,
            letterSpacing: '-0.02em',
            background: 'linear-gradient(to right, #fff, rgba(183, 148, 244, 0.8))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            cursor: 'pointer',
            '&:hover': {
              background: 'linear-gradient(to right, #fff, rgba(183, 148, 244, 1))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            },
            transition: 'all 0.3s ease',
          }}
          onClick={() => navigate('/')}
        >
          Saur.ai
        </Typography>

        {/* Right side icons */}
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton
            onClick={() => navigate('/')}
            title="Chat"
            sx={{
              color: 'rgba(255, 255, 255, 0.9)',
              background: 'transparent',
              border: 'none',
              '&:hover': {
                background: 'rgba(183, 148, 244, 0.1)',
              },
              transition: 'all 0.3s ease',
            }}
          >
            <ChatIcon sx={{ fontSize: 22 }} />
          </IconButton>

          <IconButton
            onClick={() => navigate('/bookings')}
            title="Booking History"
            sx={{
              color: 'rgba(255, 255, 255, 0.9)',
              background: 'transparent',
              border: 'none',
              '&:hover': {
                background: 'rgba(183, 148, 244, 0.1)',
              },
              transition: 'all 0.3s ease',
            }}
          >
            <HistoryIcon sx={{ fontSize: 22 }} />
          </IconButton>

          <IconButton 
            onClick={toggleThemeMode} 
            title="Toggle theme"
            sx={{
              color: 'rgba(255, 255, 255, 0.9)',
              background: 'transparent',
              border: 'none',
              '&:hover': {
                background: 'rgba(183, 148, 244, 0.1)',
              },
              transition: 'all 0.3s ease',
            }}
          >
            {themeMode === 'dark' ? (
              <Brightness7Icon sx={{ fontSize: 22 }} />
            ) : (
              <Brightness4Icon sx={{ fontSize: 22 }} />
            )}
          </IconButton>

          <IconButton
            onClick={handleLogout}
            title="Logout"
            sx={{
              color: 'rgba(255, 255, 255, 0.9)',
              background: 'transparent',
              border: 'none',
              '&:hover': {
                background: 'rgba(183, 148, 244, 0.1)',
              },
              transition: 'all 0.3s ease',
            }}
          >
            <LogoutIcon sx={{ fontSize: 22 }} />
          </IconButton>
        </Box>
      </Toolbar>
    </Box>
  );
}

export default Navbar; 