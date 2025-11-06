#!/bin/bash
set -e

# Start backend in background
cd /app/backend && uvicorn app:app --host 0.0.0.0 --port 5000 &
BACKEND_PID=$!

# Start frontend in background
cd /app && npm start &
FRONTEND_PID=$!

# Function to cleanup on exit
cleanup() {
  echo "Shutting down services..."
  kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
  wait
  exit 0
}

trap cleanup SIGTERM SIGINT

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID
