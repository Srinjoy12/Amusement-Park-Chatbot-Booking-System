const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const Razorpay = require('razorpay');
const { createClient } = require('@supabase/supabase-js');
const sgMail = require('@sendgrid/mail');
const crypto = require('crypto');

// Require Twilio
const twilio = require('twilio');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
app.use(express.json());
app.use(cors());

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Initialize Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Initialize Twilio Client
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// Create Razorpay order
app.post('/api/create-order', async (req, res) => {
  try {
    const { bookingId, amount } = req.body;

    // Convert amount to paise (Razorpay uses smallest currency unit)
    const amountInPaise = Math.round(amount * 100);

    const options = {
      amount: amountInPaise,
      currency: 'INR',
      receipt: `rcpt_${bookingId}`,
      payment_capture: 1,
    };

    const order = await razorpay.orders.create(options);

    // Update booking with order ID
    await supabase
      .from('bookings')
      .update({ razorpay_order_id: order.id })
      .eq('id', bookingId);

    res.json({ order });
  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({ message: 'Failed to create order' });
  }
});

// Verify payment
app.post('/api/verify-payment', async (req, res) => {
  try {
    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      bookingId,
    } = req.body;

    // Verify signature
    const generated_signature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + '|' + razorpay_payment_id)
      .digest('hex');

    if (generated_signature !== razorpay_signature) {
      return res.status(400).json({ message: 'Invalid payment signature' });
    }

    // Update booking status and fetch details including user phone
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .update({
        status: 'confirmed',
        payment_id: razorpay_payment_id,
      })
      .eq('id', bookingId)
      .select(`
        *,
        users(email, full_name, phone),
        parks(name),
        tickets(ticket_type)
      `)
      .single();

    if (bookingError) {
      console.error("Booking fetch/update error:", bookingError);
      throw bookingError;
    }

    if (!booking) {
        console.error("Booking not found after update for ID:", bookingId);
        throw new Error("Booking record not found after update.");
    }
    
    // Update availability
    const { error: availabilityError } = await supabase.rpc('increment_booked_count', {
      p_park_id: booking.park_id,
      p_ticket_type_id: booking.ticket_type_id,
      p_date: booking.booking_date,
      p_time_slot: booking.time_slot,
      p_quantity: booking.quantity
    });

    if (availabilityError) {
      throw availabilityError;
    }

    // Send confirmation email
    await sendConfirmationEmail(booking);
    
    // Send confirmation SMS
    await sendConfirmationSms(booking);

    res.json({ success: true, message: 'Payment verified. Confirmation email and SMS sent.' });
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ message: error.message || 'Payment verification failed' });
  }
});

// Send confirmation email
async function sendConfirmationEmail(booking) {
  try {
    const formattedDate = new Date(booking.booking_date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const msg = {
      to: booking.users.email,
      from: 'bookings@parkchat.example.com',
      subject: `Your booking confirmation for ${booking.parks.name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #3498db;">Booking Confirmation</h1>
          <p>Dear ${booking.users.full_name},</p>
          <p>Your booking at <strong>${booking.parks.name}</strong> has been confirmed!</p>
          
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3>Booking Details:</h3>
            <p><strong>Date:</strong> ${formattedDate}</p>
            <p><strong>Time:</strong> ${booking.time_slot}</p>
            <p><strong>Ticket Type:</strong> ${booking.tickets.ticket_type}</p>
            <p><strong>Quantity:</strong> ${booking.quantity}</p>
            <p><strong>Total Amount:</strong> ₹${booking.total_amount}</p>
            <p><strong>Booking ID:</strong> ${booking.id}</p>
            <p><strong>Payment ID:</strong> ${booking.payment_id}</p>
          </div>
          
          <p>Please present this booking ID at the entrance.</p>
          <p>We hope you have a great time!</p>
          
          <p style="margin-top: 30px;">Best regards,<br>ParkChat Team</p>
        </div>
      `,
    };
    
    await sgMail.send(msg);
  } catch (error) {
    console.error('Email sending error:', error);
  }
}

// --- New Function: Send Confirmation SMS ---
async function sendConfirmationSms(booking) {
  // Check if user data and phone number exist
  if (!booking.users || !booking.users.phone) {
    console.warn(`SMS not sent for booking ${booking.id}: User phone number missing.`);
    return; // Exit function if no phone number
  }
  if (!process.env.TWILIO_PHONE_NUMBER) {
    console.warn(`SMS not sent for booking ${booking.id}: Twilio phone number not configured in .env.`);
    return; 
  }

  const userPhoneNumber = booking.users.phone; // Assumes E.164 format (+1234567890)
  const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
  const formattedDate = new Date(booking.booking_date).toLocaleDateString('en-US');

  // Format the SMS message body
  const messageBody = 
`ParkChat Booking Confirmed!
Park: ${booking.parks.name}
Date: ${formattedDate}
Time: ${booking.time_slot}
Tickets: ${booking.quantity} (${booking.tickets.ticket_type})
Booking ID: ${booking.id}
Enjoy!`;

  try {
    const message = await twilioClient.messages.create({
      body: messageBody,
      from: twilioPhoneNumber,
      to: userPhoneNumber 
    });
    console.log(`SMS sent successfully to ${userPhoneNumber} (SID: ${message.sid}) for booking ${booking.id}`);
  } catch (error) {
    // Log Twilio-specific errors
    console.error(`Error sending SMS via Twilio for booking ${booking.id}:`, error.message);
    // Don't let SMS failure stop the whole process, just log it.
  }
}
// --- End New Function ---

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK' });
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});