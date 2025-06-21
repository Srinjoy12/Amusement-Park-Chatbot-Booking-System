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
import serverless_wsgi

# This is the handler that Netlify will use to run your function
def handler(event, context):
    return serverless_wsgi.handle(app, event, context)

# Load environment variables
load_dotenv()

app = Flask(__name__)
# Enable CORS for all routes
CORS(app, resources={r"/*": {"origins": "*"}})

# Initialize Supabase client
supabase_url = os.getenv('SUPABASE_URL')
supabase_key = os.getenv('SUPABASE_ANON_KEY')
supabase: Client = create_client(supabase_url, supabase_key)

# Test endpoint
@app.route('/test', methods=['GET'])
def test():
    return jsonify({"message": "Python server is working!"})

def authenticate_token():
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return None, jsonify({'error': 'No token provided'}), 401
    try:
        token = auth_header.split(' ')[1]
        user = supabase.auth.get_user(token)
        return user, None, None
    except Exception as e:
        return None, jsonify({'error': 'Invalid token'}), 403

# All your Flask routes go here...
@app.route('/parks', methods=['GET'])
def get_parks():
    try:
        parks_data = [
            {"id": 1, "name": "VGP Universal Kingdom", "location": "Chennai", "description": "Popular amusement park."},
            {"id": 2, "name": "Queensland Amusement Park", "location": "Chennai", "description": "Family-friendly park."},
            {"id": 3, "name": "MGM Dizzee World", "location": "Chennai", "description": "High-thrill rides."},
            {"id": 4, "name": "Wonderla Chennai", "location": "Chennai", "description": "Largest theme park chain."}
        ]
        return jsonify(parks_data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/ticket-types', methods=['GET'])
def get_ticket_types():
    user, error_response, status_code = authenticate_token()
    if error_response: return error_response, status_code
    try:
        park_id = request.args.get('park_id')
        response = supabase.table('ticket_types').select('*').eq('park_id', park_id).execute()
        return jsonify(response.data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/time-slots', methods=['GET'])
def get_time_slots():
    user, error_response, status_code = authenticate_token()
    if error_response: return error_response, status_code
    try:
        park_id = request.args.get('park_id')
        date = request.args.get('date')
        response = supabase.table('time_slots').select('*').eq('park_id', park_id).eq('date', date).execute()
        return jsonify(response.data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/chat', methods=['POST'])
def chat():
    return jsonify({"response": "This is a placeholder response from the Python chat endpoint."})

# ... (include all other routes from your original app.py)

# This is the handler that Netlify will use to run your function
def handler(event, context):
    return serverless_wsgi.handle(app, event, context) 