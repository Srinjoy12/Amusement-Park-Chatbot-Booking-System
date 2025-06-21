from flask import Flask, request, jsonify
from flask_cors import CORS
from supabase import create_client, Client
import os
from dotenv import load_dotenv
from datetime import datetime, timedelta
import json
import qrcode
from io import BytesIO
import base64

# Load environment variables
load_dotenv()

app = Flask(__name__)
# Enable CORS for all routes
CORS(app, resources={r"/*": {"origins": "*"}})

# Test endpoint
@app.route('/test', methods=['GET'])
def test():
    return jsonify({"message": "Server is working!"})

# Initialize Supabase client
supabase_url = os.getenv('SUPABASE_URL')
supabase_key = os.getenv('SUPABASE_ANON_KEY')

print(f"Supabase URL: {supabase_url}")
print(f"Supabase Key exists: {bool(supabase_key)}")

supabase: Client = create_client(supabase_url, supabase_key)

# Authentication middleware
def authenticate_token():
    auth_header = request.headers.get('Authorization')
    print(f"Received auth header: {auth_header}")
    
    if not auth_header:
        return None, jsonify({'error': 'No token provided'}), 401

    token = auth_header.split(' ')[1]
    try:
        print("Attempting to verify token...")
        user = supabase.auth.get_user(token)
        print(f"Token verified for user: {user}")
        return user, None, None
    except Exception as e:
        print(f"Token verification failed: {str(e)}")
        return None, jsonify({'error': 'Invalid token'}), 403

# Ticket Booking Endpoints
@app.route('/parks', methods=['GET'])
def get_parks():
    try:
        print("Received request for parks")
        
        # Return static data for testing
        parks_data = [
            {
                "id": 1,
                "name": "VGP Universal Kingdom",
                "location": "East Coast Road (ECR), Injambakkam, Chennai",
                "description": "One of the oldest and most popular amusement parks featuring thrilling rides, water parks, and entertainment shows."
            },
            {
                "id": 2,
                "name": "Queensland Amusement Park",
                "location": "Poonamallee High Road, Chennai",
                "description": "A family-friendly amusement park with exciting rides, water slides, and entertainment options for all ages."
            },
            {
                "id": 3,
                "name": "MGM Dizzee World",
                "location": "East Coast Road, Muttukadu, Chennai",
                "description": "A modern amusement park featuring high-thrill rides, family attractions, and a water park section."
            },
            {
                "id": 4,
                "name": "Wonderla Chennai",
                "location": "Chennai-Bengaluru Highway, Nehru Nagar, Kelambakkam",
                "description": "South India's largest theme park chain featuring state-of-the-art rides, water attractions, and virtual reality experiences."
            }
        ]
        
        print("Returning parks data:", parks_data)
        return jsonify(parks_data)
            
    except Exception as e:
        print(f"Error in get_parks: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/ticket-types', methods=['GET'])
def get_ticket_types():
    try:
        user, error_response, status_code = authenticate_token()
        if error_response:
            return error_response, status_code

        park_id = request.args.get('park_id')
        response = supabase.table('ticket_types').select('*').eq('park_id', park_id).execute()
        return jsonify(response.data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/time-slots', methods=['GET'])
def get_time_slots():
    try:
        user, error_response, status_code = authenticate_token()
        if error_response:
            return error_response, status_code

        park_id = request.args.get('park_id')
        date = request.args.get('date')
        response = supabase.table('time_slots').select('*').eq('park_id', park_id).eq('date', date).execute()
        return jsonify(response.data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/book-ticket', methods=['POST'])
def book_ticket():
    try:
        user, error_response, status_code = authenticate_token()
        if error_response:
            return error_response, status_code

        data = request.json
        booking_data = {
            'user_id': user.id,
            'park_id': data['park_id'],
            'ticket_type': data['ticket_type'],
            'date': data['date'],
            'time_slot': data['time_slot'],
            'adults': data['adults'],
            'kids': data.get('kids', 0),
            'seniors': data.get('seniors', 0),
            'total_price': data['total_price'],
            'status': 'pending'
        }

        response = supabase.table('bookings').insert(booking_data).execute()
        return jsonify(response.data[0])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Attractions Endpoints
@app.route('/attractions', methods=['GET'])
def get_attractions():
    try:
        user, error_response, status_code = authenticate_token()
        if error_response:
            return error_response, status_code

        park_id = request.args.get('park_id')
        response = supabase.table('attractions').select('*').eq('park_id', park_id).execute()
        return jsonify(response.data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/attractions/<int:attraction_id>', methods=['GET'])
def get_attraction_details(attraction_id):
    try:
        user, error_response, status_code = authenticate_token()
        if error_response:
            return error_response, status_code

        response = supabase.table('attractions').select('*').eq('id', attraction_id).execute()
        return jsonify(response.data[0] if response.data else {})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Add-ons Endpoints
@app.route('/add-ons', methods=['GET'])
def get_add_ons():
    try:
        user, error_response, status_code = authenticate_token()
        if error_response:
            return error_response, status_code

        park_id = request.args.get('park_id')
        response = supabase.table('add_ons').select('*').eq('park_id', park_id).execute()
        return jsonify(response.data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/book-add-on', methods=['POST'])
def book_add_on():
    try:
        user, error_response, status_code = authenticate_token()
        if error_response:
            return error_response, status_code

        data = request.json
        booking_data = {
            'user_id': user.id,
            'booking_id': data['booking_id'],
            'add_on_id': data['add_on_id'],
            'quantity': data['quantity'],
            'total_price': data['total_price']
        }

        response = supabase.table('add_on_bookings').insert(booking_data).execute()
        return jsonify(response.data[0])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Accommodation Endpoints
@app.route('/accommodations', methods=['GET'])
def get_accommodations():
    try:
        user, error_response, status_code = authenticate_token()
        if error_response:
            return error_response, status_code

        park_id = request.args.get('park_id')
        response = supabase.table('accommodations').select('*').eq('park_id', park_id).execute()
        return jsonify(response.data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/book-accommodation', methods=['POST'])
def book_accommodation():
    try:
        user, error_response, status_code = authenticate_token()
        if error_response:
            return error_response, status_code

        data = request.json
        booking_data = {
            'user_id': user.id,
            'accommodation_id': data['accommodation_id'],
            'check_in': data['check_in'],
            'check_out': data['check_out'],
            'guests': data['guests'],
            'total_price': data['total_price'],
            'status': 'pending'
        }

        response = supabase.table('accommodation_bookings').insert(booking_data).execute()
        return jsonify(response.data[0])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Transportation Endpoints
@app.route('/transport-options', methods=['GET'])
def get_transport_options():
    try:
        user, error_response, status_code = authenticate_token()
        if error_response:
            return error_response, status_code

        park_id = request.args.get('park_id')
        response = supabase.table('transport_options').select('*').eq('park_id', park_id).execute()
        return jsonify(response.data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/book-transport', methods=['POST'])
def book_transport():
    try:
        user, error_response, status_code = authenticate_token()
        if error_response:
            return error_response, status_code

        data = request.json
        booking_data = {
            'user_id': user.id,
            'transport_id': data['transport_id'],
            'date': data['date'],
            'time': data['time'],
            'passengers': data['passengers'],
            'total_price': data['total_price'],
            'status': 'pending'
        }

        response = supabase.table('transport_bookings').insert(booking_data).execute()
        return jsonify(response.data[0])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Ticket Management Endpoints
@app.route('/my-bookings', methods=['GET'])
def get_my_bookings():
    try:
        user, error_response, status_code = authenticate_token()
        if error_response:
            return error_response, status_code

        response = supabase.table('bookings').select('*').eq('user_id', user.id).execute()
        return jsonify(response.data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/generate-qr/<int:booking_id>', methods=['GET'])
def generate_qr(booking_id):
    try:
        user, error_response, status_code = authenticate_token()
        if error_response:
            return error_response, status_code

        # Generate QR code
        qr = qrcode.QRCode(version=1, box_size=10, border=5)
        qr.add_data(f"booking_id:{booking_id}")
        qr.make(fit=True)
        img = qr.make_image(fill_color="black", back_color="white")
        
        # Convert to base64
        buffered = BytesIO()
        img.save(buffered, format="PNG")
        img_str = base64.b64encode(buffered.getvalue()).decode()
        
        return jsonify({'qr_code': img_str})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Help & Support Endpoints
@app.route('/faqs', methods=['GET'])
def get_faqs():
    try:
        user, error_response, status_code = authenticate_token()
        if error_response:
            return error_response, status_code

        response = supabase.table('faqs').select('*').execute()
        return jsonify(response.data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/park-rules', methods=['GET'])
def get_park_rules():
    try:
        user, error_response, status_code = authenticate_token()
        if error_response:
            return error_response, status_code

        park_id = request.args.get('park_id')
        response = supabase.table('park_rules').select('*').eq('park_id', park_id).execute()
        return jsonify(response.data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# AI Personalization Endpoints
@app.route('/crowd-prediction', methods=['GET'])
def get_crowd_prediction():
    try:
        user, error_response, status_code = authenticate_token()
        if error_response:
            return error_response, status_code

        park_id = request.args.get('park_id')
        date = request.args.get('date')
        # Implement crowd prediction logic here
        return jsonify({'prediction': 'medium'})  # Placeholder
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/ride-recommendations', methods=['GET'])
def get_ride_recommendations():
    try:
        user, error_response, status_code = authenticate_token()
        if error_response:
            return error_response, status_code

        age = request.args.get('age')
        interests = request.args.get('interests')
        # Implement ride recommendation logic here
        return jsonify({'recommendations': []})  # Placeholder
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Payment Endpoints
@app.route('/process-payment', methods=['POST'])
def process_payment():
    try:
        user, error_response, status_code = authenticate_token()
        if error_response:
            return error_response, status_code

        data = request.json
        # Implement payment processing logic here
        return jsonify({'status': 'success', 'transaction_id': '123456'})  # Placeholder
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/apply-promo', methods=['POST'])
def apply_promo():
    try:
        user, error_response, status_code = authenticate_token()
        if error_response:
            return error_response, status_code

        data = request.json
        promo_code = data['promo_code']
        # Implement promo code validation logic here
        return jsonify({'discount': 0.1})  # Placeholder
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5001, host='0.0.0.0')