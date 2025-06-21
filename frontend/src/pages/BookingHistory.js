import React, { useState, useEffect } from 'react';
// Remove context imports
// import { useAuth } from '../contexts/AuthContext';
// import { useTheme } from '../contexts/ThemeContext';
import '../styles/BookingHistory.css';

// Accept session as a prop from App.js
const BookingHistory = ({ session }) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // Remove context hooks
  // const { user } = useAuth();
  // const { darkMode } = useTheme();

  // Extract user and access token from session prop
  const user = session?.user;
  const access_token = session?.access_token;

  useEffect(() => {
    const fetchBookings = async () => {
      if (!access_token) {
        setError('Not authenticated');
        setLoading(false);
        return;
      }

      try {
        // Use access_token from the session prop
        const response = await fetch(`${process.env.REACT_APP_NODE_API_URL}/bookings`, {
          headers: {
            'Authorization': `Bearer ${access_token}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to fetch bookings');
        }

        const data = await response.json();
        setBookings(data);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    // Trigger fetch if user and access_token exist
    if (user && access_token) {
      fetchBookings();
    } else {
        setLoading(false);
        // Optionally set an error if session is expected but not available
        // setError('Session not found');
    }
  }, [user, access_token]); // Depend on user and access_token from session

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (timeString) => {
    return new Date(timeString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      // Remove darkMode class, rely on ThemeProvider/CSS
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading your bookings...</p>
      </div>
    );
  }

  if (error) {
    return (
      // Remove darkMode class
      <div className="error-container">
        <p className="error-message">{error}</p>
      </div>
    );
  }

  return (
    // Remove darkMode class
    <div className="booking-history">
      <h1>Your Bookings</h1>
      
      {bookings.length === 0 ? (
        <div className="no-bookings">
          <p>You haven't made any bookings yet.</p>
          <p>Start chatting with our assistant to book your amusement park experience!</p>
        </div>
      ) : (
        <div className="bookings-grid">
          {bookings.map((booking) => (
            <div key={booking.id} className="booking-card">
              <div className="booking-header">
                <h2>{booking.attraction_name}</h2>
                <span className={`status ${booking.status.toLowerCase()}`}>
                  {booking.status}
                </span>
              </div>
              
              <div className="booking-details">
                <div className="detail">
                  <span className="label">Date:</span>
                  <span className="value">{formatDate(booking.booking_date)}</span>
                </div>
                
                <div className="detail">
                  <span className="label">Time:</span>
                  <span className="value">{formatTime(booking.booking_time)}</span>
                </div>
                
                <div className="detail">
                  <span className="label">Tickets:</span>
                  <span className="value">{booking.ticket_count}</span>
                </div>
                
                <div className="detail">
                  <span className="label">Total Price:</span>
                  <span className="value">
                    {typeof booking.total_price === 'number' 
                      ? `₹${booking.total_price.toFixed(2)}`
                      : 'N/A'} 
                  </span>
                </div>
              </div>
              
              <div className="booking-footer">
                <button
                  className="cancel-button"
                  disabled={booking.status !== 'CONFIRMED'}
                >
                  Cancel Booking
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BookingHistory; 