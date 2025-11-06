#!/bin/sh
set -e

# Initialize database if it doesn't exist
echo "Initializing database..."
python init_db.py || echo "Database initialization skipped (may already exist)"

# Use PORT environment variable if provided (for Render), otherwise default to 8000
PORT=${PORT:-8000}

# Start the application
echo "Starting uvicorn server on port $PORT..."
exec uvicorn app:app --host 0.0.0.0 --port "$PORT"

