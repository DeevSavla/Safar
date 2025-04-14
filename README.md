# Safar - AI-Powered Travel Itinerary Planner

## Overview

Safar is a comprehensive travel itinerary planning application that leverages AI to help users create, manage, and share travel plans. The application consists of a Flutter mobile app, a React.js web frontend, a Node.js backend, and a FastAPI-based AI service powered by Google's Gemini AI.

👉 [A hosted link, some features require a paid api key so may not work :(](https://safar-swart.vercel.app)

## Features

### Core Features

- **AI-Powered Itinerary Planning**: Generate and customize travel itineraries using natural language instructions
- **Collaborative Planning**: Invite friends and family to collaborate on trip planning
- **Day-by-Day Planning**: Organize activities with detailed scheduling
- **Budget Management**: Track and manage travel expenses
- **Location Search**: Find and add points of interest to your itinerary
- **Weather Forecasting**: View historical weather data for better planning
- **Influencer Itineraries**: Explore and use itineraries created by travel influencers
- **SOS Button**: Quick access to emergency services while traveling

### Platform-Specific Features

#### Mobile App (Flutter)
- Offline access to itineraries
- Location-based services
- Interactive maps
- Photo scrapbook for memories

#### Web Application (React)
- Detailed itinerary management
- Advanced AI editing capabilities
- Collaborative real-time editing
- Public itinerary sharing

## Project Structure

The project is organized into four main components:

### 1. Mobile App (Flutter)
```
app/
├── lib/
│   ├── core/         # Core utilities and theme
│   ├── features/     # Feature modules (auth, home, itineraries, etc.)
│   ├── models/       # Data models
│   ├── services/     # API and local services
│   ├── utils/        # Utility functions
│   └── widgets/      # Reusable UI components
└── assets/          # Images and data files
```

### 2. Web Frontend (React)
```
frontend/
├── src/
│   ├── components/   # Reusable UI components
│   ├── layouts/      # Page layouts
│   ├── pages/        # Application pages
│   ├── services/     # API and service integrations
│   └── store/        # Redux state management
```

### 3. Backend (Node.js)
```
backend/
├── src/
│   ├── config/       # Configuration files
│   ├── controllers/  # API controllers
│   ├── middleware/   # Express middleware
│   ├── models/       # Database models
│   ├── routes/       # API routes
│   ├── services/     # Business logic
│   └── utils/        # Utility functions
```

### 4. AI Service (FastAPI)
```
ai/
├── ai-service/
│   ├── main.py       # FastAPI application
│   └── requirements.txt # Python dependencies
```

## Technologies Used

### Mobile App
- Flutter/Dart
- Provider for state management
- Google Maps for location services
- HTTP for API communication

### Web Frontend
- React.js
- Redux for state management
- Tailwind CSS for styling
- Socket.io for real-time collaboration
- Google Genai for AI integration

### Backend
- Node.js with Express
- MongoDB with Mongoose
- JWT for authentication
- Socket.io for real-time updates
- Nodemailer for email notifications

### AI Service
- FastAPI (Python)
- Google Genai for AI capabilities
- Geopy for geocoding

## Setup Instructions

### Prerequisites
- Node.js (v16+)
- Flutter SDK
- Python 3.8+
- MongoDB

### Backend Setup
1. Navigate to the backend directory:
   ```
   cd backend
   ```
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file with the following variables:
   ```
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/safar
   JWT_SECRET=your_jwt_secret
   JWT_REFRESH_SECRET=your_refresh_secret
   GMAIL_USERNAME=your_email@gmail.com
   GMAIL_PASSWORD=your_app_password
   ```
4. Start the server:
   ```
   npm start
   ```

### Frontend Setup
1. Navigate to the frontend directory:
   ```
   cd frontend
   ```
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file with:
   ```
   VITE_API_URL=http://localhost:5000/api
   ```
4. Start the development server:
   ```
   npm run dev
   ```

### AI Service Setup
1. Navigate to the AI service directory:
   ```
   cd ai/ai-service
   ```
2. Install dependencies:
   ```
   pip install -r requirements.txt
   ```
3. Create a `.env` file with:
   ```
   GEMINI_KEY=your_gemini_api_key
   ```
4. Start the service:
   ```
   uvicorn main:app --reload --port 8000
   ```

### Mobile App Setup
1. Navigate to the app directory:
   ```
   cd app
   ```
2. Install dependencies:
   ```
   flutter pub get
   ```
3. Run the app:
   ```
   flutter run
   ```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- Google Gemini AI for powering the AI features
- OpenMeteo for historical weather data
- All contributors and team members who have helped build Safar
