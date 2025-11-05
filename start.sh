#!/bin/bash

# Start script for Drone Management System
# Runs both frontend and backend simultaneously

echo "🚁 Starting Drone Management System..."
echo ""

# Check if backend venv exists
if [ ! -d "backend/venv" ]; then
    echo "⚠️  Backend virtual environment not found. Creating..."
    cd backend
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    cd ..
    echo "✅ Backend environment created"
fi

# Start both services
echo "📦 Starting backend (FastAPI)..."
cd backend
source venv/bin/activate
uvicorn app:app --reload --port 5000 &
BACKEND_PID=$!
cd ..

echo "🌐 Starting frontend (Next.js)..."
npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ Both services started!"
echo "📡 Backend API: http://localhost:5000"
echo "📚 API Docs: http://localhost:5000/docs"
echo "🌐 Frontend: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop both services"

# Wait for user interrupt
trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT TERM
wait

