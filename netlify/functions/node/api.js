const express = require('express');
const serverless = require('serverless-http');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const { OpenAI } = require('openai');
const crypto = require('crypto');
const Razorpay = require('razorpay');
const sgMail = require('@sendgrid/mail');
const twilio = require('twilio');

const app = express();

const router = express.Router();
app.use(cors());
app.use(express.json());

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
  console.error("Error: Missing Supabase environment variables (URL, ANON_KEY, SERVICE_ROLE_KEY)");
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

const openaiApiKey = process.env.OPENAI_API_KEY;
if (!openaiApiKey) {
  console.warn("Warning: Missing OPENAI_API_KEY environment variable. Chat functionality may be limited.");
}
const openai = new OpenAI({ apiKey: openaiApiKey });

if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  console.warn("Warning: Missing Razorpay environment variables. Payment routes will likely fail.");
}
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

if (!process.env.SENDGRID_API_KEY || !process.env.SENDGRID_FROM_EMAIL) {
    console.warn("Warning: Missing SendGrid environment variables. Email notifications will fail.");
} else {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

const twilioClient = (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) 
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN) 
  : null;

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return res.status(401).json({ error: 'No token provided' });

    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) return res.status(403).json({ error: 'Invalid token' });
    
    req.user = { id: user.id, email: user.email, ...user.user_metadata };
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};

router.get('/health', (req, res) => res.status(200).json({ status: 'OK' }));

router.post('/chat', authenticateToken, async (req, res) => {
    try {
        const { message } = req.body;
        const userId = req.user.id;
        
        const { data: conv, error: findConvError } = await supabaseAdmin.from('conversations').select('id').eq('user_id', userId).single();
        if (findConvError && findConvError.code !== 'PGRST116') throw findConvError;

        let conversationId = conv?.id;
        if (!conversationId) {
            const { data: newConversation, error: createConvError } = await supabaseAdmin.from('conversations').insert({ user_id: userId }).select('id').single();
            if (createConvError) throw createConvError;
            conversationId = newConversation.id;
        }

        const { data: history, error: historyError } = await supabaseAdmin.from('messages').select('sender, content').eq('conversation_id', conversationId).order('created_at', { ascending: true }).limit(20);
        if (historyError) throw historyError;

        const messages = [
            { role: 'system', content: `You are a helpful amusement park booking assistant. Use the [ACTION] tag to perform actions like showing parks or attractions. Do not list them in text. Format: [ACTION]{"action": "action_name", "param": "value"}[/ACTION].`},
            ...(history?.map(msg => ({ role: msg.sender === 'bot' ? 'assistant' : 'user', content: msg.content })) || []),
            { role: 'user', content: message }
        ];

        const completion = await openai.chat.completions.create({ model: 'gpt-4', messages, temperature: 0.7 });
        const responseContent = completion.choices[0].message.content;
        
        let botResponse = responseContent.replace(/\[(ACTION|BOOKING_DETAILS)\].*?\[\/\1\]/g, '').trim();
        let action = null;
        let paymentDetails = null;

        const actionMatch = responseContent.match(/\[ACTION\](.*?)\[\/ACTION\]/);
        if (actionMatch?.[1]) action = JSON.parse(actionMatch[1]);
        
        const bookingMatch = responseContent.match(/\[BOOKING_DETAILS\](.*?)\[\/BOOKING_DETAILS\]/);
        if (bookingMatch?.[1]) {
            const bookingData = JSON.parse(bookingMatch[1]);
            const { data: pBooking, error: bError } = await supabaseAdmin.from('bookings').insert({ user_id: userId, conversation_id: conversationId, status: 'pending', ...bookingData }).select('id').single();
            if (bError) throw bError;
            paymentDetails = { bookingId: pBooking.id, amount: bookingData.total_price, currency: 'USD' };
        }

        await supabaseAdmin.from('messages').insert([{ conversation_id: conversationId, sender: 'user', content: message }, { conversation_id: conversationId, sender: 'bot', content: botResponse }]);
        
        res.json({ reply: botResponse, action, paymentDetails });
    } catch (error) {
        console.error('Chat endpoint error:', error);
        res.status(500).json({ error: 'An error occurred.', details: error.message });
    }
});

router.post('/create-order', authenticateToken, async (req, res) => {
    try {
        const { bookingId, amount } = req.body;
        const order = await razorpay.orders.create({ amount: Math.round(amount * 100), currency: 'INR', receipt: `rcpt_${bookingId}`, payment_capture: 1 });
        await supabaseAdmin.from('bookings').update({ razorpay_order_id: order.id }).eq('id', bookingId);
        res.json({ order });
    } catch (error) {
        res.status(500).json({ message: 'Failed to create order' });
    }
});

router.post('/verify-payment', authenticateToken, async (req, res) => {
    try {
        const { razorpay_payment_id, razorpay_order_id, razorpay_signature, bookingId } = req.body;
        const generated_signature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update(razorpay_order_id + '|' + razorpay_payment_id).digest('hex');
        if (generated_signature !== razorpay_signature) return res.status(400).json({ message: 'Invalid payment signature' });

        const { data: booking, error: bError } = await supabaseAdmin.from('bookings').update({ status: 'confirmed', payment_id: razorpay_payment_id }).eq('id', bookingId).select(`*, users(email, full_name, phone), parks(name), tickets(ticket_type)`).single();
        if (bError || !booking) throw bError || new Error("Booking not found");

        await supabase.rpc('increment_booked_count', { p_park_id: booking.park_id, p_ticket_type_id: booking.ticket_type_id, p_date: booking.booking_date, p_time_slot: booking.time_slot, p_quantity: booking.quantity });
        
        await Promise.all([sendConfirmationEmail(booking), sendConfirmationSms(booking)]);
        res.json({ success: true, message: 'Payment verified.' });
    } catch (error) {
        res.status(500).json({ message: error.message || 'Payment verification failed' });
    }
});

async function sendConfirmationEmail(booking) {
    if (!sgMail.apiKey) return console.warn('SendGrid not configured.');
    try {
        await sgMail.send({ to: booking.users.email, from: process.env.SENDGRID_FROM_EMAIL, subject: `Booking for ${booking.parks.name} confirmed`, html: `<p>Dear ${booking.users.full_name}, Your booking is confirmed.</p>`});
    } catch (error) { console.error('Email sending error:', error.response?.body); }
}

async function sendConfirmationSms(booking) {
    if (!twilioClient || !booking.users?.phone) return console.warn('Twilio not configured or user has no phone.');
    try {
        await twilioClient.messages.create({ body: `Booking Confirmed for ${booking.parks.name}. ID: ${booking.id}.`, from: process.env.TWILIO_PHONE_NUMBER, to: booking.users.phone });
    } catch (error) { console.error(`SMS sending error:`, error.message); }
}

router.post('/signup', async (req, res) => {
    try {
        const { email, password, fullName, phone } = req.body;
        const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName, phone } } });
        if (error) throw error;
        res.status(201).json({ user: data.user });
    } catch (error) { res.status(400).json({ error: error.message }); }
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        res.json({ user: data.user, session: data.session });
    } catch (error) { res.status(400).json({ error: error.message }); }
});

router.get('/parks', authenticateToken, async (req, res) => {
    try {
        const { data, error } = await supabase.from('parks').select('*');
        if (error) throw error;
        res.json(data);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

router.get('/parks/:parkId/availability', authenticateToken, async (req, res) => {
    try {
        const { parkId } = req.params;
        const { date } = req.query;
        const { data, error } = await supabase.from('availability').select('*').eq('park_id', parkId).eq('date', date);
        if (error) throw error;
        res.json(data);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

router.get('/tickets', authenticateToken, async (req, res) => {
    try {
      let query = supabase.from('tickets').select('*, ticket_types(*)');
      if (req.query.parkId) query = query.eq('park_id', req.query.parkId);
      const { data, error } = await query;
      if (error) throw error;
      res.json(data);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

router.post('/bookings', authenticateToken, async (req, res) => {
    try {
      const { data: booking, error } = await supabaseAdmin.from('bookings').insert({ user_id: req.user.id, status: 'pending', ...req.body }).select().single();
      if (error) throw error;
      res.status(201).json(booking);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

router.get('/booking-history', authenticateToken, async (req, res) => {
    try {
      const { data, error } = await supabase.from('bookings').select(`id, created_at, booking_date, time_slot, quantity, total_amount, status, parks (name), tickets (ticket_type)`).eq('user_id', req.user.id).order('created_at', { ascending: false });
      if (error) throw error;
      res.json(data);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.use('/.netlify/functions/node', router);

module.exports.handler = serverless(app); 