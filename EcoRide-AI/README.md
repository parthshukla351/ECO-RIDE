# EcoRide AI 🌱

Smart Eco-Friendly Ride Sharing Platform

## Tech Stack
- Frontend: React + Vite + Tailwind CSS
- Backend: Node.js + Express + MongoDB
- AI: Python + FastAPI + Scikit-learn
- Real-time: Socket.io
- Maps: Google Maps API / Leaflet

## Setup Instructions

### 1. Clone the repository
git clone https://github.com/yourusername/EcoRide-AI.git
cd EcoRide-AI

### 2. Backend Setup
cd server
npm install
cp .env.example .env
# Fill in your .env values
npm run dev

### 3. Frontend Setup
cd client
npm install
cp .env.example .env
npm run dev

### 4. AI Setup
cd ai
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app:app --reload --port 8000

## Features
- Smart AI ride matching
- Carbon footprint tracking
- Live GPS tracking
- Real-time chat
- Dynamic pricing
- Eco rewards system