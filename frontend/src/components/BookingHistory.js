import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  CircularProgress,
  Tabs,
  Tab,
  Dialog,
  DialogContent,
} from '@mui/material';
import { getMyBookings, generateQR } from '../utils/api';

function BookingHistory({ session }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [qrCode, setQrCode] = useState(null);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, [session]);

  const fetchBookings = async () => {
    try {
      const data = await getMyBookings(session.access_token);
      setBookings(data);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateQR = async (bookingId) => {
    try {
      const data = await generateQR(session.access_token, bookingId);
      setQrCode(data.qr_code);
      setQrDialogOpen(true);
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const renderTicketBookings = () => {
    const ticketBookings = bookings.filter(booking => !booking.accommodation_id && !booking.transport_id);
    return (
      <Grid container spacing={2}>
        {ticketBookings.map((booking) => (
          <Grid item xs={12} md={6} key={booking.id}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {booking.park_name || 'Park Visit'}
                </Typography>
                <Typography color="textSecondary">
                  Date: {new Date(booking.date).toLocaleDateString()}
                </Typography>
                <Typography color="textSecondary">
                  Time: {booking.time_slot}
                </Typography>
                <Typography>
                  Guests: {booking.adults} Adults, {booking.kids} Kids, {booking.seniors} Seniors
                </Typography>
                <Box mt={1}>
                  <Chip 
                    label={booking.status} 
                    color={getStatusColor(booking.status)}
                    size="small"
                  />
                </Box>
                {booking.status === 'confirmed' && (
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => handleGenerateQR(booking.id)}
                    sx={{ mt: 1 }}
                  >
                    View QR Code
                  </Button>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  };

  const renderAccommodationBookings = () => {
    const accommodationBookings = bookings.filter(booking => booking.accommodation_id);
    return (
      <Grid container spacing={2}>
        {accommodationBookings.map((booking) => (
          <Grid item xs={12} md={6} key={booking.id}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {booking.accommodation_name || 'Hotel Booking'}
                </Typography>
                <Typography color="textSecondary">
                  Check-in: {new Date(booking.check_in).toLocaleDateString()}
                </Typography>
                <Typography color="textSecondary">
                  Check-out: {new Date(booking.check_out).toLocaleDateString()}
                </Typography>
                <Typography>
                  Guests: {booking.guests}
                </Typography>
                <Box mt={1}>
                  <Chip 
                    label={booking.status} 
                    color={getStatusColor(booking.status)}
                    size="small"
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  };

  const renderTransportBookings = () => {
    const transportBookings = bookings.filter(booking => booking.transport_id);
    return (
      <Grid container spacing={2}>
        {transportBookings.map((booking) => (
          <Grid item xs={12} md={6} key={booking.id}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {booking.transport_name || 'Transport Booking'}
                </Typography>
                <Typography color="textSecondary">
                  Date: {new Date(booking.date).toLocaleDateString()}
                </Typography>
                <Typography color="textSecondary">
                  Time: {booking.time}
                </Typography>
                <Typography>
                  Passengers: {booking.passengers}
                </Typography>
                <Box mt={1}>
                  <Chip 
                    label={booking.status} 
                    color={getStatusColor(booking.status)}
                    size="small"
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Typography variant="h5" gutterBottom>
        My Bookings
      </Typography>
      
      <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 3 }}>
        <Tab label="Park Tickets" />
        <Tab label="Accommodation" />
        <Tab label="Transport" />
      </Tabs>

      {tabValue === 0 && renderTicketBookings()}
      {tabValue === 1 && renderAccommodationBookings()}
      {tabValue === 2 && renderTransportBookings()}

      <Dialog open={qrDialogOpen} onClose={() => setQrDialogOpen(false)}>
        <DialogContent>
          {qrCode && (
            <Box display="flex" flexDirection="column" alignItems="center">
              <img 
                src={`data:image/png;base64,${qrCode}`} 
                alt="Booking QR Code"
                style={{ maxWidth: '100%', height: 'auto' }}
              />
              <Typography variant="caption" sx={{ mt: 1 }}>
                Show this QR code at the park entrance
              </Typography>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}

export default BookingHistory; 