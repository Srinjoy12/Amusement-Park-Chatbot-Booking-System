import React, { useState, useRef, useEffect } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import SendIcon from '@mui/icons-material/Send';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../App'; // Import supabase
import {
  processPayment,
  getParks,
  getAttractions,
  getTicketTypes,
  getTimeSlots,
  createBooking,
  getAddOns,
  bookAddOn,
  getAccommodations,
  bookAccommodation,
  getTransportOptions,
  bookTransport,
  generateQR,
  getFAQs,
  getParkRules,
  getCrowdPrediction,
  getRideRecommendations,
  applyPromo
} from '../utils/api';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import '../styles/ChatInterface.css'; // Add this line

// Helper function to load Razorpay script dynamically (optional, but good practice)
const loadRazorpayScript = (src) => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => {
      resolve(true);
    };
    script.onerror = () => {
      resolve(false);
    };
    document.body.appendChild(script);
  });
};

function ChatInterface({ session }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const [userName, setUserName] = useState(''); // State for user's name
  const [currentBooking, setCurrentBooking] = useState(null);
  const [selectedPark, setSelectedPark] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const [bookingStep, setBookingStep] = useState(0);
  const [selectedParkId, setSelectedParkId] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [adultCount, setAdultCount] = useState(0);
  const [childCount, setChildCount] = useState(0);
  const [seniorCount, setseniorCount] = useState(0);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Effect to scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Effect to fetch user profile for name
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', session.user.id)
          .single();

        if (error) throw error;
        if (data) {
          setUserName(data.full_name?.split(' ')[0] || 'there'); // Get first name or default
        } else {
          setUserName('there'); // Default if profile is empty
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        setUserName('there'); // Default on error
      }
    };

    if (session?.user?.id) {
      fetchProfile();
    }
  }, [session?.user?.id]); // Depend on user ID

  // --- Function to handle Payment Process ---
  const initiatePayment = async (paymentInfo) => {
    const razorpayLoaded = await loadRazorpayScript('https://checkout.razorpay.com/v1/checkout.js');
    if (!razorpayLoaded) {
      alert('Failed to load payment gateway. Please check your connection.');
      return;
    }

    // 1. Create Order via Backend
    try {
      const orderResponse = await fetch(`${process.env.REACT_APP_NODE_API_URL}/api/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          bookingId: paymentInfo.bookingId,
          amount: paymentInfo.amount,
          currency: paymentInfo.currency,
        }),
      });

      if (!orderResponse.ok) throw new Error('Failed to create payment order');

      const { order } = await orderResponse.json();

      // 2. Configure and Open Razorpay Checkout
      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY_ID,
        amount: order.amount, // Amount in paise/cents from backend order
        currency: order.currency,
        name: 'Amusement Park Booking',
        description: `Booking ID: ${paymentInfo.bookingId}`,
        order_id: order.id,
        handler: async function (response) {
          // 3. Payment Successful - Verify via Backend
          try {
            const verifyResponse = await fetch(`${process.env.REACT_APP_NODE_API_URL}/api/verify-payment`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${session.access_token}`,
              },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                bookingId: paymentInfo.bookingId,
              }),
            });

            const verifyData = await verifyResponse.json();

            if (verifyResponse.ok && verifyData.success) {
              // Add success message to chat
              setMessages((prev) => [...prev, {
                role: 'assistant',
                content: verifyData.message || 'Payment successful! Your booking is confirmed. A confirmation email has been sent.',
                created_at: new Date().toISOString(),
              }]);
            } else {
              throw new Error(verifyData.error || 'Payment verification failed.');
            }
          } catch (verifyError) {
            console.error('Payment verification error:', verifyError);
            setMessages((prev) => [...prev, {
              role: 'assistant',
              content: `Payment verification failed: ${verifyError.message}`,
              created_at: new Date().toISOString(),
            }]);
          }
        },
        prefill: {
          // Optional: Prefill user details if available
          email: session?.user?.email || '',
          // name: userName ? userName + ' ' + (lastName || '') : '', // Requires full name
          // contact: '' // Requires phone number
        },
        theme: {
          color: '#6366f1' // Use primary color (adjust if needed)
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
          console.error('Razorpay payment failed:', response.error);
          setMessages((prev) => [...prev, {
            role: 'assistant',
            content: `Payment failed: ${response.error.description} (Code: ${response.error.code})`,
            created_at: new Date().toISOString(),
          }]);
      });
      rzp.open();

    } catch (error) {
      console.error('Error initiating payment:', error);
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: `Failed to initiate payment: ${error.message}`,
        created_at: new Date().toISOString(),
      }]);
    }
  };

  // --- Submit Handler ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = {
      role: 'user',
      content: input.trim(),
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      // First, get response from chat endpoint
      const response = await fetch(`${process.env.REACT_APP_NODE_API_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ 
          message: userMessage.content,
          context: {
            currentBooking,
            selectedPark,
            selectedDate,
            selectedTimeSlot
          }
        }),
      });

      if (!response.ok) {
        let errorMsg = 'Failed to get response from server.';
        try {
          const errorData = await response.json();
          errorMsg = errorData.error || errorMsg;
        } catch (parseError) {
          // Ignore if response body is not JSON
        }
        throw new Error(errorMsg);
      }

      const data = await response.json();

      // Add bot response to chat
      const botMessage = {
        role: 'assistant',
        content: data.response,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, botMessage]);

      // Handle different types of actions from the bot
      if (data.action) {
        console.log('Received action:', data.action);
        switch (data.action.action) {
          case 'show_parks':
            try {
              console.log('Fetching parks...');
              const parks = await getParks();
              console.log('Fetched parks:', parks);
              const parksMessage = {
                role: 'assistant',
                content: 'Here are the available parks:',
                parks: parks,
                created_at: new Date().toISOString(),
              };
              setMessages((prev) => [...prev, parksMessage]);
            } catch (error) {
              console.error('Error fetching parks:', error);
              setMessages((prev) => [...prev, {
                role: 'assistant',
                content: 'Sorry, I encountered an error while fetching the parks. Please try again.',
                created_at: new Date().toISOString(),
              }]);
            }
            break;

          case 'show_attractions':
            if (data.parkId) {
              const attractions = await getAttractions(session.access_token, data.parkId);
              const attractionsMessage = {
                role: 'assistant',
                content: 'Here are the available attractions:',
                attractions: attractions,
                created_at: new Date().toISOString(),
              };
              setMessages((prev) => [...prev, attractionsMessage]);
            }
            break;

          case 'start_booking':
            if (data.parkId) {
              setSelectedPark(data.parkId);
              const ticketTypes = await getTicketTypes(session.access_token, data.parkId);
              const ticketMessage = {
                role: 'assistant',
                content: 'Please select your ticket type:',
                ticketTypes: ticketTypes,
                created_at: new Date().toISOString(),
              };
              setMessages((prev) => [...prev, ticketMessage]);
            }
            break;

          case 'show_time_slots':
            if (data.parkId && data.date) {
              setSelectedDate(data.date);
              const timeSlots = await getTimeSlots(session.access_token, data.parkId, data.date);
              const timeSlotsMessage = {
                role: 'assistant',
                content: 'Please select your preferred time slot:',
                timeSlots: timeSlots,
                created_at: new Date().toISOString(),
              };
              setMessages((prev) => [...prev, timeSlotsMessage]);
              setSelectedTimeSlot(timeSlots[0]); // Set default time slot
            }
            break;

          case 'create_booking':
            if (data.bookingDetails) {
              const booking = await createBooking(session.access_token, data.bookingDetails);
              setCurrentBooking(booking);
              
              // If there's a payment required
              if (data.paymentDetails) {
                await initiatePayment(data.paymentDetails);
              }

              // If QR code is needed
              if (booking.status === 'confirmed') {
                const qrData = await generateQR(session.access_token, booking.id);
                const qrMessage = {
                  role: 'assistant',
                  content: 'Here is your booking QR code:',
                  qrCode: qrData.qr_code,
                  created_at: new Date().toISOString(),
                };
                setMessages((prev) => [...prev, qrMessage]);
              }
            }
            break;

          case 'show_add_ons':
            if (data.parkId) {
              const addOns = await getAddOns(session.access_token, data.parkId);
              const addOnsMessage = {
                role: 'assistant',
                content: 'Would you like to add any of these to your visit?',
                addOns: addOns,
                created_at: new Date().toISOString(),
              };
              setMessages((prev) => [...prev, addOnsMessage]);
            }
            break;

          case 'show_accommodations':
            if (data.parkId) {
              const accommodations = await getAccommodations(session.access_token, data.parkId);
              const accommodationsMessage = {
                role: 'assistant',
                content: 'Here are the available accommodations:',
                accommodations: accommodations,
                created_at: new Date().toISOString(),
              };
              setMessages((prev) => [...prev, accommodationsMessage]);
            }
            break;

          case 'show_transport':
            if (data.parkId) {
              const transport = await getTransportOptions(session.access_token, data.parkId);
              const transportMessage = {
                role: 'assistant',
                content: 'Here are the available transport options:',
                transport: transport,
                created_at: new Date().toISOString(),
              };
              setMessages((prev) => [...prev, transportMessage]);
            }
            break;

          case 'show_crowd_prediction':
            if (data.parkId && data.date) {
              const prediction = await getCrowdPrediction(session.access_token, data.parkId, data.date);
              const predictionMessage = {
                role: 'assistant',
                content: `The expected crowd level is: ${prediction.prediction}`,
                created_at: new Date().toISOString(),
              };
              setMessages((prev) => [...prev, predictionMessage]);
            }
            break;

          case 'show_recommendations':
            if (data.age && data.interests) {
              const recommendations = await getRideRecommendations(session.access_token, data.age, data.interests);
              const recommendationsMessage = {
                role: 'assistant',
                content: 'Based on your preferences, here are some recommended rides:',
                recommendations: recommendations,
                created_at: new Date().toISOString(),
              };
              setMessages((prev) => [...prev, recommendationsMessage]);
            }
            break;

          case 'apply_promo':
            if (data.promoCode) {
              const promoResult = await applyPromo(session.access_token, { promo_code: data.promoCode });
              const promoMessage = {
                role: 'assistant',
                content: `Promo code applied! You get ${promoResult.discount * 100}% off.`,
                created_at: new Date().toISOString(),
              };
              setMessages((prev) => [...prev, promoMessage]);
            }
            break;

          default:
            // Handle any unrecognized actions
            console.log('Unrecognized action:', data.action);
            break;
        }
      }

    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error.message}`,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  // Add new components for different booking steps
  const ParkSelection = ({ parks, onSelect }) => (
    <Box sx={{ mt: 2 }}>
      <Grid container spacing={2}>
        {parks.map((park) => (
          <Grid item xs={12} key={park.id}>
            <Button
              fullWidth
              variant="contained"
              onClick={() => onSelect(park)}
              sx={{
                p: 2,
                background: 'rgba(183, 148, 244, 0.1)',
                borderRadius: '12px',
                textAlign: 'left',
                justifyContent: 'flex-start',
                textTransform: 'none',
                '&:hover': {
                  background: 'rgba(183, 148, 244, 0.2)',
                  transform: 'translateY(-2px)',
                },
                transition: 'all 0.3s ease',
              }}
            >
              <Box>
                <Typography variant="h6" sx={{ color: '#fff', mb: 1 }}>
                  {park.name}
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  {park.location}
                </Typography>
              </Box>
            </Button>
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  const TimeSelection = ({ times, onSelect }) => (
    <Box sx={{ mt: 2 }}>
      <Grid container spacing={2}>
        {times.map((time) => (
          <Grid item xs={6} sm={3} key={time}>
            <Button
              fullWidth
              variant="contained"
              onClick={() => onSelect(time)}
              sx={{
                background: 'rgba(183, 148, 244, 0.1)',
                '&:hover': {
                  background: 'rgba(183, 148, 244, 0.2)',
                },
              }}
            >
              {time}
            </Button>
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  const GuestCounter = ({ label, count, onIncrement, onDecrement }) => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
      <Typography sx={{ flex: 1 }}>{label}</Typography>
      <Button
        variant="outlined"
        onClick={onDecrement}
        disabled={count === 0}
        sx={{ minWidth: '40px' }}
      >
        -
      </Button>
      <Typography sx={{ minWidth: '40px', textAlign: 'center' }}>{count}</Typography>
      <Button
        variant="outlined"
        onClick={onIncrement}
        sx={{ minWidth: '40px' }}
      >
        +
      </Button>
    </Box>
  );

  // Add the handleBookingSubmit function
  const handleBookingSubmit = async (bookingDetails) => {
    try {
      setLoading(true);
      console.log('Submitting booking:', bookingDetails);

      // Create booking
      const response = await fetch(`${process.env.REACT_APP_NODE_API_URL}/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(bookingDetails)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create booking');
      }

      const data = await response.json();
      console.log('Booking response:', data);

      // Reset booking steps
      setBookingStep(0);
      setSelectedParkId(null);
      setSelectedDate(null);
      setSelectedTime(null);
      setAdultCount(0);
      setChildCount(0);
      setseniorCount(0);

      // Add confirmation message
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Great! Your booking has been confirmed.',
        created_at: new Date().toISOString()
      }]);

      // If payment is required, handle it
      if (data.paymentDetails) {
        await initiatePayment(data.paymentDetails);
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Sorry, there was an error creating your booking: ${error.message}`,
        created_at: new Date().toISOString()
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box 
      className="chat-interface"
      sx={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      width: '100vw',
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      overflow: 'hidden',
    }}>
      {/* Gradient Orbs */}
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
            width: '30%',
            height: '30%',
            background: 'radial-gradient(circle at center, rgba(183, 148, 244, 0.15) 0%, rgba(0, 0, 0, 0) 70%)',
            animation: 'float 20s ease-in-out infinite',
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            bottom: '10%',
            right: '5%',
            width: '35%',
            height: '35%',
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

      {/* Main Chat Container */}
      <Box
        className="inner-chat-container"
        sx={{
          position: 'relative',
          maxWidth: '1000px',
          width: '95%',
          height: 'calc(100vh - 40px)',
          margin: '20px auto',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '24px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
          overflow: 'hidden',
        }}
      >
        {/* Chat Messages Area */}
        <Box
          sx={{
            flexGrow: 1,
            overflowY: 'auto',
            p: 3,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            '&::-webkit-scrollbar': {
              width: '6px',
            },
            '&::-webkit-scrollbar-track': {
              background: 'rgba(0, 0, 0, 0.1)',
              borderRadius: '3px',
            },
            '&::-webkit-scrollbar-thumb': {
              background: 'rgba(183, 148, 244, 0.3)',
              borderRadius: '3px',
              '&:hover': {
                background: 'rgba(183, 148, 244, 0.5)',
              },
            },
          }}
        >
          {/* Empty State */}
          {messages.length === 0 && !loading ? (
            <Box 
              sx={{ 
                flexGrow: 1, 
                display: 'flex', 
                flexDirection: 'column', 
                justifyContent: 'center', 
                alignItems: 'center', 
                textAlign: 'center', 
                p: 3,
              }}
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                <Typography 
                  variant="h4" 
                  sx={{ 
                    mb: 2,
                    fontFamily: '"Space Grotesk", sans-serif',
                    fontWeight: 600,
                    background: 'linear-gradient(to right, #fff, rgba(183, 148, 244, 0.8))',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  Hello, {userName}!
                </Typography>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    color: 'rgba(255, 255, 255, 0.7)',
                    fontFamily: '"Space Grotesk", sans-serif',
                  }}
                >
                  How can I help you today?
                </Typography>
              </motion.div>
            </Box>
          ) : (
            <AnimatePresence initial={false}>
              {messages.map((message, index) => (
                <motion.div
                  key={message.created_at + index}
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  style={{
                    display: 'flex',
                    justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
                    marginBottom: '16px',
                  }}
                >
                  <Paper
                    elevation={0}
                    sx={{
                      p: '12px 16px',
                      maxWidth: '80%',
                      background: message.role === 'user'
                        ? 'linear-gradient(135deg, rgba(107, 70, 193, 0.8) 0%, rgba(183, 148, 244, 0.8) 100%)'
                        : 'rgba(255, 255, 255, 0.05)',
                      color: message.role === 'user'
                        ? '#fff'
                        : 'rgba(255, 255, 255, 0.9)',
                      borderRadius: message.role === 'user' ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                      border: '1px solid',
                      borderColor: message.role === 'user'
                        ? 'rgba(183, 148, 244, 0.3)'
                        : 'rgba(255, 255, 255, 0.1)',
                    }}
                  >
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        whiteSpace: 'pre-wrap',
                        fontFamily: '"Space Grotesk", sans-serif',
                      }}
                    >
                      {message.content}
                    </Typography>
                    {message.parks && (
                      <ParkSelection
                        parks={message.parks}
                        onSelect={(park) => {
                          console.log('Selected park:', park);
                          setSelectedParkId(park.id);
                          setBookingStep(1);
                          setMessages(prev => [...prev, {
                            role: 'assistant',
                            content: `Great choice! You've selected ${park.name}. Please select your preferred date:`,
                            created_at: new Date().toISOString(),
                          }]);
                        }}
                      />
                    )}
                    {bookingStep === 1 && message === messages[messages.length - 1] && (
                      <Box sx={{ mt: 2 }}>
                        <TextField
                          type="date"
                          fullWidth
                          value={selectedDate}
                          onChange={(e) => {
                            setSelectedDate(e.target.value);
                            setBookingStep(2);
                            setMessages(prev => [...prev, {
                              role: 'assistant',
                              content: 'Please select your preferred time:',
                              created_at: new Date().toISOString(),
                            }]);
                          }}
                          InputLabelProps={{
                            shrink: true,
                          }}
                          inputProps={{
                            min: new Date().toISOString().split('T')[0],
                          }}
                          sx={{
                            '& .MuiInputBase-root': {
                              color: '#fff',
                              background: 'rgba(183, 148, 244, 0.1)',
                            },
                            '& .MuiInputLabel-root': {
                              color: 'rgba(255, 255, 255, 0.7)',
                            },
                            '& .MuiOutlinedInput-notchedOutline': {
                              borderColor: 'rgba(183, 148, 244, 0.3)',
                            },
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                              borderColor: 'rgba(183, 148, 244, 0.5)',
                            },
                          }}
                        />
                      </Box>
                    )}
                    {bookingStep === 2 && message === messages[messages.length - 1] && (
                      <TimeSelection
                        times={['10:00 AM', '1:00 PM', '4:00 PM', '7:00 PM']}
                        onSelect={(time) => {
                          setSelectedTime(time);
                          setBookingStep(3);
                          setMessages(prev => [...prev, {
                            role: 'assistant',
                            content: 'How many guests will be visiting?',
                            created_at: new Date().toISOString(),
                          }]);
                        }}
                      />
                    )}
                    {bookingStep === 3 && message === messages[messages.length - 1] && (
                      <Box sx={{ mt: 2 }}>
                        <GuestCounter
                          label="Adults (₹1000 each)"
                          count={adultCount}
                          onIncrement={() => setAdultCount(prev => prev + 1)}
                          onDecrement={() => setAdultCount(prev => prev - 1)}
                        />
                        <GuestCounter
                          label="Children (₹600 each)"
                          count={childCount}
                          onIncrement={() => setChildCount(prev => prev + 1)}
                          onDecrement={() => setChildCount(prev => prev - 1)}
                        />
                        <GuestCounter
                          label="Seniors (₹800 each)"
                          count={seniorCount}
                          onIncrement={() => setseniorCount(prev => prev + 1)}
                          onDecrement={() => setseniorCount(prev => prev - 1)}
                        />
                        {(adultCount > 0 || childCount > 0 || seniorCount > 0) && (
                          <>
                            <Box sx={{ 
                              mt: 2, 
                              p: 2, 
                              borderRadius: '12px',
                              background: 'rgba(183, 148, 244, 0.1)',
                              border: '1px solid rgba(183, 148, 244, 0.2)'
                            }}>
                              <Typography sx={{ mb: 1, color: 'rgba(255, 255, 255, 0.9)' }}>
                                Price Breakdown:
                              </Typography>
                              {adultCount > 0 && (
                                <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                                  Adults: ₹{adultCount * 1000}
                                </Typography>
                              )}
                              {childCount > 0 && (
                                <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                                  Children: ₹{childCount * 600}
                                </Typography>
                              )}
                              {seniorCount > 0 && (
                                <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                                  Seniors: ₹{seniorCount * 800}
                                </Typography>
                              )}
                              <Typography sx={{ 
                                mt: 1, 
                                pt: 1, 
                                borderTop: '1px solid rgba(183, 148, 244, 0.2)',
                                color: '#fff',
                                fontWeight: 'bold'
                              }}>
                                Total: ₹{(adultCount * 1000) + (childCount * 600) + (seniorCount * 800)}
                              </Typography>
                            </Box>
                            <Button
                              fullWidth
                              variant="contained"
                              sx={{
                                mt: 2,
                                background: 'linear-gradient(135deg, rgba(107, 70, 193, 0.8) 0%, rgba(183, 148, 244, 0.8) 100%)',
                                '&:hover': {
                                  background: 'linear-gradient(135deg, rgba(107, 70, 193, 0.9) 0%, rgba(183, 148, 244, 0.9) 100%)',
                                },
                              }}
                              onClick={() => {
                                // Proceed with booking
                                const bookingDetails = {
                                  parkId: selectedParkId,
                                  date: selectedDate,
                                  time: selectedTime,
                                  adults: adultCount,
                                  children: childCount,
                                  seniors: seniorCount,
                                };
                                console.log('Submitting booking with details:', bookingDetails);
                                handleBookingSubmit(bookingDetails);
                              }}
                            >
                              Proceed with Booking
                            </Button>
                          </>
                        )}
                      </Box>
                    )}
                  </Paper>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
          <div ref={messagesEndRef} />
        </Box>

        {/* Input Area */}
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{
            p: 3,
            background: 'linear-gradient(0deg, rgba(183, 148, 244, 0.1) 0%, rgba(0, 0, 0, 0) 100%)',
            borderTop: '1px solid rgba(183, 148, 244, 0.1)',
          }}
        >
          <Paper
            elevation={0}
            sx={{
              p: '8px 16px',
              display: 'flex',
              alignItems: 'center',
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: '16px',
              border: '1px solid rgba(183, 148, 244, 0.2)',
              '&:hover': {
                borderColor: 'rgba(183, 148, 244, 0.3)',
              },
              transition: 'all 0.3s ease',
            }}
          >
            <TextField
              fullWidth
              placeholder="Type your message here..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              sx={{
                '& .MuiInputBase-root': {
                  color: 'rgba(255, 255, 255, 0.9)',
                  fontFamily: '"Space Grotesk", sans-serif',
                },
                '& .MuiOutlinedInput-notchedOutline': {
                  border: 'none',
                },
                '& .MuiInputBase-input::placeholder': {
                  color: 'rgba(255, 255, 255, 0.5)',
                  opacity: 1,
                },
              }}
              variant="standard"
              multiline
              maxRows={5}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
            <IconButton
              type="submit"
              sx={{
                ml: 1,
                background: loading || !input.trim()
                  ? 'rgba(183, 148, 244, 0.1)'
                  : 'linear-gradient(135deg, rgba(107, 70, 193, 0.8) 0%, rgba(183, 148, 244, 0.8) 100%)',
                color: loading || !input.trim()
                  ? 'rgba(255, 255, 255, 0.3)'
                  : '#fff',
                '&:hover': {
                  background: loading || !input.trim()
                    ? 'rgba(183, 148, 244, 0.1)'
                    : 'linear-gradient(135deg, rgba(107, 70, 193, 0.9) 0%, rgba(183, 148, 244, 0.9) 100%)',
                },
                transition: 'all 0.3s ease',
                width: 40,
                height: 40,
              }}
              disabled={loading || !input.trim()}
            >
              {loading ? (
                <CircularProgress size={24} sx={{ color: 'inherit' }} />
              ) : (
                <SendIcon sx={{ fontSize: 20 }} />
              )}
            </IconButton>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
}

export default ChatInterface;