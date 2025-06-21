import React, { useState } from 'react';
import { Box, TextField, Button, Typography, IconButton, Container } from '@mui/material';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import GoogleIcon from '@mui/icons-material/Google';
import GitHubIcon from '@mui/icons-material/GitHub';
import { supabase } from '../App';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetEmailSent, setResetEmailSent] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) throw error;
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;
    } catch (error) {
      setError(error.message);
    }
  };

  const handleGithubLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github'
      });
      if (error) throw error;
    } catch (error) {
      setError(error.message);
    }
  };

  const handlePasswordReset = async () => {
    if (!formData.email) {
      setError('Please enter your email address');
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(formData.email, {
        redirectTo: `${window.location.origin}/auth/callback`,
      });

      if (error) throw error;
      setResetEmailSent(true);
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <Container 
      maxWidth={false} 
      disableGutters 
      sx={{
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        p: 0,
        m: 0,
        background: '#000000',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      }}
    >
      <Box
        component={motion.div}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        sx={{
          display: 'flex',
          width: '100%',
          height: '100%',
          background: '#000000',
        }}
      >
        {/* Left Section */}
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            background: 'linear-gradient(135deg, rgba(107, 70, 193, 0.4) 0%, rgba(0, 0, 0, 0.95) 100%)',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'radial-gradient(circle at 30% 40%, rgba(183, 148, 244, 0.15) 0%, rgba(0, 0, 0, 0) 70%)',
              pointerEvents: 'none',
            },
            '&::after': {
              content: '""',
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: '120%',
              height: '120%',
              background: 'radial-gradient(circle at center, rgba(183, 148, 244, 0.1) 0%, rgba(0, 0, 0, 0) 50%)',
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'none',
              animation: 'pulse 8s ease-in-out infinite',
            },
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            style={{ position: 'relative', zIndex: 1 }}
          >
            <Typography 
              variant="h2" 
              component="h1" 
              gutterBottom 
              sx={{ 
                fontFamily: '"Space Grotesk", sans-serif',
                fontWeight: 600,
                letterSpacing: '-0.02em',
                background: 'linear-gradient(to right, #fff, rgba(183, 148, 244, 0.8))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 3
              }}
            >
              Welcome Back!
            </Typography>
            <Typography 
              variant="h6" 
              sx={{ 
                fontFamily: '"Space Grotesk", sans-serif',
                letterSpacing: '-0.01em',
                color: 'rgba(255, 255, 255, 0.7)',
                maxWidth: '400px',
                textAlign: 'center',
                lineHeight: 1.6
              }}
            >
              Log in to continue your journey with us.
            </Typography>
          </motion.div>
        </Box>

        {/* Right Section */}
        <Box
          sx={{
            flex: 1,
            bgcolor: '#000000',
            p: { xs: 3, md: 6 },
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            position: 'relative',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'radial-gradient(circle at 70% 60%, rgba(183, 148, 244, 0.08) 0%, rgba(0, 0, 0, 0) 60%)',
              pointerEvents: 'none',
            },
          }}
        >
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            style={{ maxWidth: '400px', margin: '0 auto', width: '100%' }}
          >
            <Typography 
              variant="h4" 
              color="white" 
              gutterBottom 
              sx={{
                fontFamily: '"Space Grotesk", sans-serif',
                fontWeight: 600,
                letterSpacing: '-0.02em',
                mb: 1
              }}
            >
              Login Account
            </Typography>
            <Typography 
              variant="subtitle2" 
              sx={{
                color: 'rgba(255, 255, 255, 0.6)',
                fontFamily: '"Space Grotesk", sans-serif',
                letterSpacing: '-0.01em',
                mb: 4
              }}
            >
              Enter your credentials to access your account.
            </Typography>

            <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
              <Button
                fullWidth
                variant="outlined"
                onClick={handleGoogleLogin}
                startIcon={<GoogleIcon />}
                sx={{
                  py: 1.5,
                  color: 'white',
                  borderColor: 'rgba(183, 148, 244, 0.3)',
                  '&:hover': {
                    borderColor: '#B794F4',
                    bgcolor: 'rgba(183, 148, 244, 0.08)',
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                Google
              </Button>
              <Button
                fullWidth
                variant="outlined"
                onClick={handleGithubLogin}
                startIcon={<GitHubIcon />}
                sx={{
                  py: 1.5,
                  color: 'white',
                  borderColor: 'rgba(183, 148, 244, 0.3)',
                  '&:hover': {
                    borderColor: '#B794F4',
                    bgcolor: 'rgba(183, 148, 244, 0.08)',
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                Github
              </Button>
            </Box>

            <Box 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 2, 
                my: 4,
                '&::before, &::after': {
                  content: '""',
                  flex: 1,
                  height: '1px',
                  background: 'rgba(183, 148, 244, 0.2)',
                }
              }}
            >
              <Typography 
                sx={{ 
                  color: 'rgba(255, 255, 255, 0.5)',
                  fontSize: '0.875rem',
                  fontFamily: '"Space Grotesk", sans-serif',
                }}
              >
                Or
              </Typography>
            </Box>

            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth
                name="email"
                type="email"
                label="Email"
                variant="filled"
                value={formData.email}
                onChange={handleChange}
                placeholder="eg. johnfrans@gmail.com"
                sx={{ 
                  mb: 3,
                  '& .MuiFilledInput-root': {
                    background: 'rgba(183, 148, 244, 0.05)',
                    '&:hover': {
                      background: 'rgba(183, 148, 244, 0.08)',
                    },
                    '&.Mui-focused': {
                      background: 'rgba(183, 148, 244, 0.1)',
                    },
                  }
                }}
                InputProps={{
                  sx: {
                    color: 'white',
                    '&::before': {
                      borderColor: 'rgba(183, 148, 244, 0.2)',
                    },
                    '&::after': {
                      borderColor: '#B794F4',
                    },
                  },
                }}
                InputLabelProps={{
                  sx: { 
                    color: 'rgba(255, 255, 255, 0.5)',
                    '&.Mui-focused': {
                      color: '#B794F4',
                    },
                  },
                }}
              />
              <TextField
                fullWidth
                name="password"
                label="Password"
                variant="filled"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleChange}
                sx={{ 
                  mb: 3,
                  '& .MuiFilledInput-root': {
                    background: 'rgba(183, 148, 244, 0.05)',
                    '&:hover': {
                      background: 'rgba(183, 148, 244, 0.08)',
                    },
                    '&.Mui-focused': {
                      background: 'rgba(183, 148, 244, 0.1)',
                    },
                  }
                }}
                InputProps={{
                  sx: {
                    color: 'white',
                    '&::before': {
                      borderColor: 'rgba(183, 148, 244, 0.2)',
                    },
                    '&::after': {
                      borderColor: '#B794F4',
                    },
                  },
                  endAdornment: (
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      sx={{ color: 'rgba(255, 255, 255, 0.5)' }}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  ),
                }}
                InputLabelProps={{
                  sx: { 
                    color: 'rgba(255, 255, 255, 0.5)',
                    '&.Mui-focused': {
                      color: '#B794F4',
                    },
                  },
                }}
              />

              <Button
                fullWidth
                type="submit"
                variant="contained"
                disabled={loading}
                sx={{
                  py: 1.8,
                  mt: 2,
                  mb: 3,
                  background: 'linear-gradient(45deg, rgba(107, 70, 193, 0.8) 0%, rgba(183, 148, 244, 0.8) 100%)',
                  color: 'white',
                  fontFamily: '"Space Grotesk", sans-serif',
                  fontSize: '1rem',
                  fontWeight: 500,
                  letterSpacing: '0.02em',
                  border: 'none',
                  '&:hover': {
                    background: 'linear-gradient(45deg, rgba(107, 70, 193, 0.9) 0%, rgba(183, 148, 244, 0.9) 100%)',
                    boxShadow: '0 4px 20px rgba(107, 70, 193, 0.2)',
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                {loading ? 'Logging in...' : 'Login'}
              </Button>
            </form>

            {error && (
              <Typography 
                color="error" 
                variant="body2" 
                sx={{ 
                  mb: 2,
                  textAlign: 'center',
                  fontFamily: '"Space Grotesk", sans-serif',
                }}
              >
                {error}
              </Typography>
            )}

            {resetEmailSent && (
              <Typography 
                color="success" 
                variant="body2" 
                sx={{ 
                  mb: 2,
                  textAlign: 'center',
                  fontFamily: '"Space Grotesk", sans-serif',
                }}
              >
                Password reset email has been sent!
              </Typography>
            )}

            <Typography 
              variant="body2" 
              align="center"
              sx={{
                color: 'rgba(255, 255, 255, 0.5)',
                fontFamily: '"Space Grotesk", sans-serif',
              }}
            >
              Don't have an account?{' '}
              <Link 
                to="/signup" 
                style={{ 
                  color: '#B794F4', 
                  textDecoration: 'none',
                  fontWeight: 500,
                  transition: 'color 0.3s ease',
                  '&:hover': {
                    color: '#9B6FE0',
                  },
                }}
              >
                Sign up
              </Link>
            </Typography>
          </motion.div>
        </Box>
      </Box>
    </Container>
  );
};

export default Login; 