require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const { OpenAI } = require('openai');
const crypto = require('crypto');
const Razorpay = require('razorpay');
const sgMail = require('@sendgrid/mail');
const twilio = require('twilio');
const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Supabase clients
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
  console.error("Error: Missing Supabase environment variables (URL, ANON_KEY, SERVICE_ROLE_KEY)");
  process.exit(1); // Exit if essential keys are missing
}

// Client for public/auth operations (using ANON key)
const supabase = createClient(supabaseUrl, supabaseAnonKey);
// Client for backend operations (using SERVICE ROLE key - bypasses RLS)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Initialize OpenAI client
const openaiApiKey = process.env.OPENAI_API_KEY;
if (!openaiApiKey) {
  console.warn("Warning: Missing OPENAI_API_KEY environment variable. Chat functionality may be limited.");
}
const openai = new OpenAI({
  apiKey: openaiApiKey
});

// Initialize Razorpay
if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  console.warn("Warning: Missing Razorpay environment variables (KEY_ID, KEY_SECRET). Payment routes will likely fail.");
}
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Initialize SendGrid
if (!process.env.SENDGRID_API_KEY || !process.env.SENDGRID_FROM_EMAIL) { // Added check for FROM_EMAIL
    console.warn("Warning: Missing SENDGRID_API_KEY or SENDGRID_FROM_EMAIL environment variable. Email notifications will fail.");
} else {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

// Initialize Twilio Client
if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER) { // Added check for PHONE_NUMBER
  console.warn("Warning: Missing Twilio environment variables (ACCOUNT_SID, AUTH_TOKEN, PHONE_NUMBER). SMS notifications will fail.");
}
const twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN) : null;

// Authentication middleware
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      console.error('Auth error:', error);
      return res.status(403).json({ error: 'Invalid token' });
    }
    
    // Add the full user object to the request
    req.user = {
      id: user.id,
      email: user.email,
      ...user.user_metadata
    };
    next();
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(403).json({ error: 'Invalid token' });
  }
};

// Chat endpoint
app.post('/chat', authenticateToken, async (req, res) => {
  try {
    const { message } = req.body;
    const userId = req.user.id;

    // --- Step 1: Get or Create Conversation ---
    let conversationId;

    // Use ADMIN client for database operations
    const { data: existingConversation, error: findConvError } = await supabaseAdmin
      .from('conversations')
      .select('id')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (findConvError) {
        console.error('Error finding conversation:', findConvError);
        throw findConvError;
    }

    if (existingConversation && existingConversation.length > 0) {
      conversationId = existingConversation[0].id;
    } else {
      // Create a new conversation if none exists
      // Use ADMIN client for database operations
      const { data: newConversation, error: createConvError } = await supabaseAdmin
        .from('conversations')
        .insert({ user_id: userId })
        .select('id')
        .single();

      if (createConvError) throw createConvError; // Throw if creation fails

      conversationId = newConversation.id;
    }

    // --- Step 2: Get Message History ---
    // Use ADMIN client for database operations
    const { data: history, error: historyError } = await supabaseAdmin
      .from('messages')
      .select('sender, content')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(20);

    if (historyError) throw historyError;

    // --- Step 3: Format conversation history for OpenAI ---
    const messages = [
      {
        role: 'system',
        content: `You are a helpful amusement park booking assistant. 
        When users want to book tickets or ask about parks, respond with:
        
        "I'll show you the available parks."
        [ACTION]{"action": "show_parks"}[/ACTION]
        
        After park selection, help users book tickets by using these actions:
        1. For showing attractions: 
        [ACTION]{"action": "show_attractions", "parkId": PARK_ID}[/ACTION]
        
        2. For starting booking: 
        [ACTION]{"action": "start_booking", "parkId": PARK_ID}[/ACTION]
        
        3. For showing time slots: 
        [ACTION]{"action": "show_time_slots", "parkId": PARK_ID, "date": "YYYY-MM-DD"}[/ACTION]
        
        Available time slots are: 10:00 AM, 1:00 PM, 4:00 PM, 7:00 PM.
        
        When a booking is confirmed, include:
        [BOOKING_DETAILS]{"attraction_name": "Example", "date": "YYYY-MM-DD", "time_slot": "HH:MM", "number_of_tickets": N, "total_price": P}[/BOOKING_DETAILS]
        
        DO NOT list the parks directly in your response. Always use the show_parks action to display the interactive park selection UI.`
      },
      ...(history?.map(msg => ({
        role: msg.sender === 'bot' ? 'assistant' : 'user',
        content: msg.content
      })) || []),
      { role: 'user', content: message }
    ];

    // --- Step 4: Get response from OpenAI ---
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages,
      temperature: 0.7,
    });

    const responseContent = completion.choices[0].message.content;
    let botResponse = responseContent;
    let paymentDetails = null;
    let action = null;

    // Check for Action in Response
    const actionMatch = responseContent.match(/\[ACTION\](.*?)\[\/ACTION\]/);
    if (actionMatch && actionMatch[1]) {
      try {
        action = JSON.parse(actionMatch[1].trim());
        // Remove the action tag from the response shown to the user
        botResponse = responseContent.replace(/\[ACTION\].*?\[\/ACTION\]/, '').trim();
      } catch (parseError) {
        console.error('Error parsing action from OpenAI:', parseError);
      }
    }

    // Check for Booking Details in Response
    const bookingMatch = responseContent.match(/\[BOOKING_DETAILS\] (.*) \[\/BOOKING_DETAILS\]/);
    if (bookingMatch && bookingMatch[1]) {
      try {
        const bookingData = JSON.parse(bookingMatch[1]);
        // Remove the details tag from the response shown to the user
        botResponse = responseContent.replace(/\[BOOKING_DETAILS\].*\[\/BOOKING_DETAILS\]/, '').trim();

        // Create PENDING booking in DB
        const { data: pendingBooking, error: bookingError } = await supabaseAdmin
          .from('bookings')
          .insert({
            user_id: userId,
            conversation_id: conversationId,
            attraction_name: bookingData.attraction_name,
            date: bookingData.date,
            time_slot: bookingData.time_slot,
            number_of_tickets: bookingData.number_of_tickets,
            status: 'pending' // Set status to pending initially
          })
          .select('id') // Select the ID of the new booking
          .single();

        if (bookingError) throw bookingError;

        // Prepare payment initiation details for frontend
        paymentDetails = {
          bookingId: pendingBooking.id,
          amount: bookingData.total_price, // Amount from OpenAI response
          currency: 'USD' // Assuming USD, change if needed
        };
      } catch (parseError) {
        console.error('Error parsing booking details from OpenAI:', parseError);
        // Proceed without payment if parsing failed
      }
    }

    // --- Step 5: Save conversation to Supabase ---
    // Use ADMIN client for database operations
    const { error: saveError } = await supabaseAdmin
      .from('messages')
      .insert([
        {
          conversation_id: conversationId,
          sender: 'user',
          content: message
        },
        {
          conversation_id: conversationId,
          sender: 'bot',
          content: botResponse
        }
      ]);

    if (saveError) throw saveError;

    // Send response along with any payment details and action
    res.json({ 
      response: botResponse.trim(), 
      paymentDetails,
      action // Include the action in the response
    });

  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Failed to process chat message' });
  }
});

// Get bookings endpoint
app.get('/bookings', authenticateToken, async (req, res) => {
  try {
    // Use ADMIN client for database operations
    const { data: bookings, error } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .eq('user_id', req.user.id)
      .order('booking_date', { ascending: false });

    if (error) throw error;

    res.json(bookings);
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// Add booking endpoint
app.post('/bookings', authenticateToken, async (req, res) => {
  try {
    const { parkId, date, time, adults, children, seniors } = req.body;
    const userId = req.user.id;

    // First, get the park name
    const { data: park, error: parkError } = await supabaseAdmin
      .from('parks')
      .select('name')
      .eq('id', parkId)
      .single();

    if (parkError) {
      console.error('Error fetching park:', parkError);
      throw new Error('Could not find park information');
    }

    // Calculate total price (you can adjust the pricing)
    const adultPrice = 1000;  // ₹1000 per adult
    const childPrice = 600;   // ₹600 per child
    const seniorPrice = 800;  // ₹800 per senior
    const totalPrice = (adults * adultPrice) + (children * childPrice) + (seniors * seniorPrice);

    // Calculate total number of tickets
    const totalTickets = (adults || 0) + (children || 0) + (seniors || 0);

    // Create booking in Supabase
    const { data: booking, error } = await supabaseAdmin
      .from('bookings')
      .insert({
        user_id: userId,
        park_id: parkId,
        booking_date: date,
        date: date,
        time_slot: time,
        adults: adults || 0,
        kids: children || 0,
        seniors: seniors || 0,
        total_price: totalPrice,
        status: 'pending',
        attraction_name: park.name,
        number_of_tickets: totalTickets
      })
      .select()
      .single();

    if (error) {
      console.error('Booking error:', error);
      throw error;
    }

    res.json({
      success: true,
      booking: booking,
      paymentDetails: {
        amount: totalPrice,
        currency: 'USD',
        bookingId: booking.id
      }
    });
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({ error: error.message || 'Failed to create booking' });
  }
});

// Cancel booking endpoint
app.put('/bookings/:id/cancel', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Only allow cancelling 'confirmed' bookings via this endpoint
    const { data: booking, error } = await supabaseAdmin
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', id)
      .eq('user_id', userId)
      .eq('status', 'confirmed') // Only cancel if confirmed
      .select('id')
      .single();

    if (error) throw error;

    if (!booking) {
      // Could be not found, not owned by user, or not in 'confirmed' state
      return res.status(404).json({ error: 'Booking not found, not cancellable, or permission denied' });
    }

    res.json({ success: true, message: 'Booking cancelled.' }); // Return simple success
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({ error: 'Failed to cancel booking' });
  }
});

// Create Razorpay order 
app.post('/api/create-order', authenticateToken, async (req, res) => { // Added authenticateToken middleware
  try {
    const { bookingId, amount } = req.body;
    const userId = req.user.id; // Use authenticated user ID

    if (!bookingId || typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ message: 'Invalid bookingId or amount' });
    }

    // Convert amount to paise (Razorpay uses smallest currency unit)
    const amountInPaise = Math.round(amount * 100);

    const options = {
      amount: amountInPaise,
      currency: 'INR', 
      receipt: bookingId, // Use just the bookingId (should be <= 40 chars)
      payment_capture: 1,
    };
    
    if (!razorpay) {
        console.error("Razorpay client not initialized. Check environment variables.");
        return res.status(500).json({ message: 'Payment gateway not configured' });
    }

    console.log(`Creating Razorpay order for booking ${bookingId} with options:`, options);
    const order = await razorpay.orders.create(options); 
    console.log(`Razorpay order created: ${order.id}`);

    // Update booking with order ID
    const { error: updateError } = await supabaseAdmin
      .from('bookings')
      .update({ razorpay_order_id: order.id })
      .eq('id', bookingId)
      .eq('user_id', userId); // Security check

    if (updateError) {
      console.error(`Error updating booking ${bookingId} with order ID ${order.id}:`, updateError);
      // Log and continue, order is created
    }

    res.json({ order });
  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({ message: 'Failed to create order', error: error.message });
  }
});

// Verify payment 
app.post('/api/verify-payment', authenticateToken, async (req, res) => { // Added authenticateToken middleware
  try {
    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      bookingId,
    } = req.body;
    const userId = req.user.id;

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature || !bookingId) {
        return res.status(400).json({ message: 'Missing payment details or bookingId' });
    }

    // Verify signature
    const generated_signature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + '|' + razorpay_payment_id)
      .digest('hex');

    if (generated_signature !== razorpay_signature) {
      console.warn(`Invalid payment signature for booking ${bookingId}`);
      return res.status(400).json({ message: 'Invalid payment signature' });
    }

    console.log(`Payment signature verified for booking ${bookingId}`);

    // Update booking status and fetch details including user phone
    const { data: booking, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .update({
        status: 'confirmed',
        payment_id: razorpay_payment_id,
      })
      .eq('id', bookingId)
      .eq('user_id', userId) // Security check
      .neq('status', 'confirmed') // Optional: prevent re-confirming
      .select(`
        *,
        users(email, full_name, phone),
        parks(name),
        tickets(ticket_type)
      `)
      .single();

    if (bookingError) {
      console.error(`Booking fetch/update error for booking ${bookingId}:`, bookingError);
      throw bookingError;
    }

    if (!booking) {
        console.warn(`Booking not found or not updatable for ID: ${bookingId}, User: ${userId}`);
        const { data: checkData } = await supabaseAdmin
            .from('bookings').select('id, status').eq('id', bookingId).eq('user_id', userId).single();
        if (checkData && checkData.status === 'confirmed') {
             console.log(`Booking ${bookingId} was already confirmed. Skipping notifications.`);
             return res.json({ success: true, message: 'Payment already verified.' });
        }
        throw new Error("Booking record not found or could not be updated.");
    }

    console.log(`Booking status updated to confirmed for ${bookingId}`);

    // Update availability (Ensure this RPC exists and works)
    try {
      console.log(`Incrementing booked count for booking ${bookingId}...`);
      // Ensure booking.quantity exists or calculate it
      const quantity = booking.quantity || (booking.adults || 0) + (booking.kids || 0) + (booking.seniors || 0); 
      const { error: availabilityError } = await supabaseAdmin.rpc('increment_booked_count', {
        p_park_id: booking.park_id,
        p_ticket_type_id: booking.ticket_type_id,
        p_date: booking.booking_date,
        p_time_slot: booking.time_slot,
        p_quantity: quantity // Use calculated/fetched quantity
      });
      if (availabilityError) throw availabilityError;
      console.log(`Booked count incremented for booking ${bookingId}.`);
    } catch(rpcError) {
        console.error(`Availability update RPC error for booking ${bookingId}:`, rpcError);
    }

    // Send confirmation email
    await sendConfirmationEmail(booking);
    
    // Send confirmation SMS
    await sendConfirmationSms(booking);

    res.json({ success: true, message: 'Payment verified. Confirmation email and SMS sent.' });
  } catch (error) {
    console.error(`Payment verification process error for booking ${req.body.bookingId || 'N/A'}:`, error);
    res.status(500).json({ message: error.message || 'Payment verification failed' });
  }
});

// Send confirmation email function
async function sendConfirmationEmail(booking) {
  if (!process.env.SENDGRID_API_KEY || !process.env.SENDGRID_FROM_EMAIL) {
      console.warn(`Email not sent for booking ${booking?.id}: SendGrid not configured in .env.`);
      return;
  }
  if (!booking?.users?.email) {
      console.warn(`Email not sent for booking ${booking?.id}: User email missing.`);
      return;
  }

  try {
    const formattedDate = new Date(booking.booking_date).toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });
    const formattedTime = booking.time_slot || new Date(booking.booking_time || Date.now()).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const quantity = booking.quantity || (booking.adults || 0) + (booking.kids || 0) + (booking.seniors || 0);

    const msg = {
      to: booking.users.email,
      from: process.env.SENDGRID_FROM_EMAIL, 
      subject: `Your booking confirmation for ${booking.parks?.name || booking.attraction_name || 'the park'} (#${booking.id})`, // Added ID to subject
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 20px auto; border: 1px solid #ddd; padding: 20px; border-radius: 8px; line-height: 1.6;">
          <h1 style="color: #3498db; text-align: center; margin-top: 0;">Booking Confirmation</h1>
          <p>Dear ${booking.users.full_name || 'Customer'},</p>
          <p>Your booking at <strong>${booking.parks?.name || booking.attraction_name || 'the park'}</strong> has been confirmed!</p>
          
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0; margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 5px;">Booking Details:</h3>
            <p><strong>Booking ID:</strong> ${booking.id}</p>
            <p><strong>Date:</strong> ${formattedDate}</p>
            <p><strong>Time:</strong> ${formattedTime}</p>
            ${booking.tickets?.ticket_type ? `<p><strong>Ticket Type:</strong> ${booking.tickets.ticket_type}</p>` : ''}
            <p><strong>Quantity:</strong> ${quantity}</p>
            <p><strong>Total Amount:</strong> ₹${typeof booking.total_price === 'number' ? booking.total_price.toFixed(2) : (booking.total_amount || 'N/A')}</p>
            ${booking.payment_id ? `<p><strong>Payment ID:</strong> ${booking.payment_id}</p>` : ''}
          </div>
          
          <p>Please present this booking ID at the entrance.</p>
          <p>We hope you have a great time!</p>
          
          <p style="margin-top: 30px; font-size: 0.9em; color: #777;">Best regards,<br>ParkChat Team</p>
        </div>
      `,
    };
    
    await sgMail.send(msg);
    console.log(`Confirmation email sent successfully to ${booking.users.email} for booking ${booking.id}`);
  } catch (error) {
    console.error(`Email sending error for booking ${booking?.id}:`, error);
     if (error.response) {
         console.error('SendGrid Response Error:', error.response.body);
     }
  }
}

// Send Confirmation SMS function
async function sendConfirmationSms(booking) {
  if (!twilioClient) { 
      console.warn(`SMS not sent for booking ${booking?.id}: Twilio client not initialized (check .env).`); 
      return; 
  }
  if (!process.env.TWILIO_PHONE_NUMBER) {
    console.warn(`SMS not sent for booking ${booking?.id}: Twilio phone number not configured in .env.`);
    return; 
  }
  if (!booking?.users?.phone) {
    console.warn(`SMS not sent for booking ${booking?.id}: User phone number missing.`);
    return;
  }

  const userPhoneNumber = booking.users.phone; 
  const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
  const formattedDate = new Date(booking.booking_date).toLocaleDateString('en-US');
  const formattedTime = booking.time_slot || new Date(booking.booking_time || Date.now()).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit'});
  const quantity = booking.quantity || (booking.adults || 0) + (booking.kids || 0) + (seniors || 0);

  const messageBody = 
`ParkChat Booking Confirmed!
Park: ${booking.parks?.name || booking.attraction_name || 'the park'}
Date: ${formattedDate}
Time: ${formattedTime}
Tickets: ${quantity} ${booking.tickets?.ticket_type ? `(${booking.tickets.ticket_type})` : ''}
Booking ID: ${booking.id}
Enjoy!`;

  try {
    const message = await twilioClient.messages.create({
      body: messageBody.substring(0, 1600), 
      from: twilioPhoneNumber,
      to: userPhoneNumber 
    });
    console.log(`SMS sent successfully to ${userPhoneNumber} (SID: ${message.sid}) for booking ${booking.id}`);
  } catch (error) {
    // Enhanced error logging
    console.error(`Error sending SMS via Twilio to ${userPhoneNumber} for booking ${booking?.id}. Error Message: ${error.message}`);
    if (error.status) {
        console.error(`Twilio Error Details - Status: ${error.status}, Code: ${error.code}, More Info: ${error.moreInfo}`);
    } else {
        // Log the whole error object if status is not available
        console.error('Full Twilio Error Object:', error);
    }
  }
}

app.listen(port, () => {
  console.log(`Node server running on port ${port}`);
}); 