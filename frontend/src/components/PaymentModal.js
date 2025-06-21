import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';

const PaymentModal = ({ bookingDetails, onClose, onPaymentComplete }) => {
  const { darkMode } = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [razorpay, setRazorpay] = useState(null);

  useEffect(() => {
    // Load Razorpay script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => {
      setRazorpay(window.Razorpay);
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handlePayment = async () => {
    setLoading(true);
    setError('');

    try {
      // Create order on backend
      const response = await fetch('http://localhost:3001/api/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingDetails),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create order');
      }

      // Initialize Razorpay payment
      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY_ID,
        amount: data.order.amount,
        currency: data.order.currency,
        name: 'ParkChat Bookings',
        description: `Booking for ${bookingDetails.parkName}`,
        order_id: data.order.id,
        handler: function(response) {
          // Verify payment on backend
          verifyPayment(response);
        },
        prefill: {
          name: bookingDetails.userName,
          email: bookingDetails.userEmail,
          contact: bookingDetails.userPhone || '',
        },
        theme: {
          color: '#3498db',
        },
      };

      const paymentObject = new razorpay(options);
      paymentObject.open();
    } catch (error) {
      console.error('Payment error:', error);
      setError(error.message || 'Payment initialization failed');
    } finally {
      setLoading(false);
    }
  };

  const verifyPayment = async (paymentResponse) => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/verify-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...paymentResponse,
          bookingId: bookingDetails.bookingId,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Payment verification failed');
      }

      // Call the onPaymentComplete callback with payment ID
      onPaymentComplete(paymentResponse.razorpay_payment_id);
    } catch (error) {
      console.error('Verification error:', error);
      setError(error.message || 'Payment verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className={`w-full max-w-md p-6 rounded-lg shadow-xl ${
          darkMode ? 'bg-gray-800' : 'bg-white'
        }`}
      >
        <h2 className="text-2xl font-bold mb-4">Confirm Your Booking</h2>
        
        <div className={`p-4 mb-4 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
          <div className="mb-2">
            <span className="font-medium">Park:</span> {bookingDetails.parkName}
          </div>
          <div className="mb-2">
            <span className="font-medium">Date:</span> {new Date(bookingDetails.date).toLocaleDateString()}
          </div>
          <div className="mb-2">
            <span className="font-medium">Time:</span> {bookingDetails.timeSlot}
          </div>
          <div className="mb-2">
            <span className="font-medium">Tickets:</span> {bookingDetails.quantity}
          </div>
          <div className="mb-2">
            <span className="font-medium">Ticket Type:</span> {bookingDetails.ticketType}
          </div>
          <div className="text-xl font-bold mt-2">
            <span>Total:</span> ₹{bookingDetails.amount}
          </div>
        </div>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        <div className="flex justify-end space-x-4">
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-lg ${
              darkMode
                ? 'bg-gray-700 hover:bg-gray-600 text-white'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
            }`}
          >
            Cancel
          </button>
          
          <button
            onClick={handlePayment}
            disabled={loading || !razorpay}
            className={`px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white ${
              (loading || !razorpay) && 'opacity-50 cursor-not-allowed'
            }`}
          >
            {loading ? 'Processing...' : 'Pay Now'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default PaymentModal;