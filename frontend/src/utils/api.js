import { supabase } from '../App';

const API_URL = process.env.REACT_APP_FLASK_API_URL;

// Helper function to handle API responses
const handleResponse = async (response) => {
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
  return response.json();
};

// Park Information
export const getParks = async () => {
  try {
    const { data, error } = await supabase
      .from('parks')
      .select('*');

    if (error) {
      console.error('Error fetching parks:', error);
      throw error;
    }

    console.log('Fetched parks:', data);
    return data;
  } catch (error) {
    console.error('Error in getParks:', error);
    throw error;
  }
};

export const getAttractions = async (token, parkId) => {
  const response = await fetch(`${API_URL}/attractions?park_id=${parkId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return handleResponse(response);
};

// Booking Related
export const getTicketTypes = async (token, parkId) => {
  const response = await fetch(`${API_URL}/ticket-types?park_id=${parkId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return handleResponse(response);
};

export const getTimeSlots = async (token, parkId, date) => {
  const response = await fetch(`${API_URL}/time-slots?park_id=${parkId}&date=${date}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return handleResponse(response);
};

export const createBooking = async (token, bookingData) => {
  const response = await fetch(`${API_URL}/book-ticket`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(bookingData)
  });
  return handleResponse(response);
};

// Add-ons
export const getAddOns = async (token, parkId) => {
  const response = await fetch(`${API_URL}/add-ons?park_id=${parkId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return handleResponse(response);
};

export const bookAddOn = async (token, addOnData) => {
  const response = await fetch(`${API_URL}/book-add-on`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(addOnData)
  });
  return handleResponse(response);
};

// Accommodation
export const getAccommodations = async (token, parkId) => {
  const response = await fetch(`${API_URL}/accommodations?park_id=${parkId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return handleResponse(response);
};

export const bookAccommodation = async (token, accommodationData) => {
  const response = await fetch(`${API_URL}/book-accommodation`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(accommodationData)
  });
  return handleResponse(response);
};

// Transport
export const getTransportOptions = async (token, parkId) => {
  const response = await fetch(`${API_URL}/transport-options?park_id=${parkId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return handleResponse(response);
};

export const bookTransport = async (token, transportData) => {
  const response = await fetch(`${API_URL}/book-transport`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(transportData)
  });
  return handleResponse(response);
};

// Booking Management
export const getMyBookings = async (token) => {
  const response = await fetch(`${API_URL}/my-bookings`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return handleResponse(response);
};

export const generateQR = async (token, bookingId) => {
  const response = await fetch(`${API_URL}/generate-qr/${bookingId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return handleResponse(response);
};

// Help & Support
export const getFAQs = async (token) => {
  const response = await fetch(`${API_URL}/faqs`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return handleResponse(response);
};

export const getParkRules = async (token, parkId) => {
  const response = await fetch(`${API_URL}/park-rules?park_id=${parkId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return handleResponse(response);
};

// AI Features
export const getCrowdPrediction = async (token, parkId, date) => {
  const response = await fetch(`${API_URL}/crowd-prediction?park_id=${parkId}&date=${date}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return handleResponse(response);
};

export const getRideRecommendations = async (token, age, interests) => {
  const response = await fetch(`${API_URL}/ride-recommendations?age=${age}&interests=${interests}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return handleResponse(response);
};

// Payment
export const processPayment = async (token, paymentData) => {
  const response = await fetch(`${API_URL}/process-payment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(paymentData)
  });
  return handleResponse(response);
};

export const applyPromo = async (token, promoData) => {
  const response = await fetch(`${API_URL}/apply-promo`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(promoData)
  });
  return handleResponse(response);
}; 