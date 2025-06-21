# Amusement Park Chatbot Booking System

A modern web application that allows users to book amusement park tickets through an AI-powered chatbot interface.

## Features

- User authentication with email/password and Google OAuth
- AI-powered chatbot for ticket booking assistance
- Real-time availability checking
- Booking history management
- Dark mode support
- Responsive design

## Tech Stack

### Frontend
- React.js
- Supabase for authentication and database
- OpenAI API for chatbot functionality
- CSS for styling

### Backend
- Node.js Express server for chat and booking management
- Flask server for additional functionality
- Supabase for data storage
- OpenAI API integration

## Prerequisites

- Node.js (v14 or higher)
- Python (v3.8 or higher)
- Supabase account
- OpenAI API key

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/amusement-park-chatbot.git
cd amusement-park-chatbot
```

2. Install frontend dependencies:
```bash
cd frontend
npm install
```

3. Install Node.js backend dependencies:
```bash
cd ../backend/node_server
npm install
```

4. Install Flask backend dependencies:
```bash
cd ../flask_server
pip install -r requirements.txt
```

5. Create a `.env.local` file in the frontend directory with the following variables:
```
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
REACT_APP_OPENAI_API_KEY=your_openai_api_key
REACT_APP_API_URL=http://localhost:5000
REACT_APP_NODE_API_URL=http://localhost:3001
```

## Running the Application

1. Start the Flask backend server:
```bash
cd backend/flask_server
python app.py
```

2. Start the Node.js backend server:
```bash
cd ../node_server
npm start
```

3. Start the frontend development server:
```bash
cd ../../frontend
npm start
```

The application will be available at `http://localhost:3000`.

## Project Structure

```
amusement-park-chatbot/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── contexts/
│   │   ├── pages/
│   │   ├── styles/
│   │   └── utils/
│   └── package.json
├── backend/
│   ├── node_server/
│   │   ├── server.js
│   │   └── package.json
│   └── flask_server/
│       ├── app.py
│       └── requirements.txt
└── README.md
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 