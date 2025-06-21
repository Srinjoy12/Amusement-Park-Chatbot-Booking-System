import React from 'react';
import { Box, Typography, Button, Container, Grid } from '@mui/material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import PartyModeIcon from '@mui/icons-material/PartyMode';
import AttractionsIcon from '@mui/icons-material/Attractions';
import FamilyRestroomIcon from '@mui/icons-material/FamilyRestroom';
import LocalActivityIcon from '@mui/icons-material/LocalActivity';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(25, 25, 25, 0.95) 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Animated Background Orbs */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: '10%',
            left: '5%',
            width: '40%',
            height: '40%',
            background: 'radial-gradient(circle at center, rgba(183, 148, 244, 0.15) 0%, rgba(0, 0, 0, 0) 70%)',
            animation: 'float 20s ease-in-out infinite',
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            bottom: '10%',
            right: '5%',
            width: '45%',
            height: '45%',
            background: 'radial-gradient(circle at center, rgba(107, 70, 193, 0.15) 0%, rgba(0, 0, 0, 0) 70%)',
            animation: 'float 25s ease-in-out infinite reverse',
          },
          '@keyframes float': {
            '0%, 100%': {
              transform: 'translate(0, 0)',
            },
            '50%': {
              transform: 'translate(5%, 5%)',
            },
          },
        }}
      />

      {/* Main Content */}
      <Container maxWidth="lg" sx={{ position: 'relative', py: 8 }}>
        <Grid container spacing={4} alignItems="center" sx={{ minHeight: '90vh' }}>
          {/* Left Column - Text Content */}
          <Grid item xs={12} md={6}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <Typography
                variant="h1"
                sx={{
                  fontSize: { xs: '2.5rem', md: '3.5rem' },
                  fontWeight: 700,
                  mb: 3,
                  background: 'linear-gradient(to right, #fff, rgba(183, 148, 244, 0.8))',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Your Ultimate Theme Park Companion
              </Typography>

              <Typography
                variant="h2"
                sx={{
                  fontSize: { xs: '1.5rem', md: '2rem' },
                  color: 'rgba(255, 255, 255, 0.7)',
                  mb: 4,
                  fontWeight: 400,
                }}
              >
                Book tickets, plan your visit, and get personalized recommendations with our AI assistant
              </Typography>

              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => navigate('/login')}
                  sx={{
                    py: 2,
                    px: 4,
                    fontSize: '1.2rem',
                    background: 'linear-gradient(135deg, rgba(107, 70, 193, 0.8) 0%, rgba(183, 148, 244, 0.8) 100%)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, rgba(107, 70, 193, 0.9) 0%, rgba(183, 148, 244, 0.9) 100%)',
                    },
                    borderRadius: '12px',
                    boxShadow: '0 4px 15px rgba(107, 70, 193, 0.3)',
                  }}
                >
                  Get Started
                </Button>
              </motion.div>

              {/* Features List */}
              <Box sx={{ mt: 6 }}>
                <Grid container spacing={3}>
                  {[
                    'AI-Powered Recommendations',
                    'Real-time Wait Times',
                    'Easy Ticket Booking',
                    'Personalized Itineraries'
                  ].map((feature, index) => (
                    <Grid item xs={6} key={index}>
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                      >
                        <Box
                          sx={{
                            p: 2,
                            background: 'rgba(183, 148, 244, 0.1)',
                            borderRadius: '12px',
                            border: '1px solid rgba(183, 148, 244, 0.2)',
                          }}
                        >
                          <Typography
                            sx={{
                              color: 'rgba(255, 255, 255, 0.9)',
                              textAlign: 'center',
                            }}
                          >
                            {feature}
                          </Typography>
                        </Box>
                      </motion.div>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            </motion.div>
          </Grid>

          {/* Right Column - Interactive Illustration */}
          <Grid item xs={12} md={6}>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1 }}
            >
              <Box
                sx={{
                  position: 'relative',
                  height: '500px',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '100%',
                    height: '100%',
                    background: 'radial-gradient(circle at center, rgba(183, 148, 244, 0.2) 0%, rgba(0, 0, 0, 0) 70%)',
                    animation: 'pulse 3s ease-in-out infinite',
                  },
                }}
              >
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Box
                    component="img"
                    src="/ChatGPT_Image_Apr_17__2025__12_07_05_PM-removebg-preview.png"
                    alt="Theme Park AI Assistant"
                    sx={{
                      width: '100%',
                      maxWidth: '500px',
                      height: 'auto',
                      filter: 'drop-shadow(0 0 30px rgba(183, 148, 244, 0.3))',
                    }}
                  />
                </motion.div>
              </Box>
            </motion.div>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default LandingPage; 