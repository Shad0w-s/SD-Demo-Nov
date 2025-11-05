# 🚁 Drone Management System (MVP)

A web-based Drone Management System for internal testing, built with Next.js, FastAPI, and Supabase.

## 📋 Project Structure

```
SD-Demo-Nov/
├── src/                    # Next.js frontend
│   ├── app/               # App Router pages
│   ├── components/        # React components
│   ├── lib/              # Utilities and clients
│   └── styles/           # Global styles
├── backend/              # FastAPI backend
│   ├── routes/           # API route handlers
│   ├── app.py           # FastAPI app entry
│   ├── auth.py          # JWT authentication
│   ├── models.py        # SQLAlchemy models
│   ├── schemas.py       # Pydantic models
│   └── dependencies.py  # Dependency injection
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Python 3.9+
- PostgreSQL database
- Supabase account

### Frontend Setup

1. Install dependencies:
```bash
npm install
```

2. Copy environment variables:
```bash
cp env.example .env.local
```

3. Update `.env.local` with your Supabase credentials

### Backend Setup

1. Create virtual environment (if not exists):
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Copy environment variables:
```bash
cp env.example .env
```

4. Update `.env` with your Supabase and database credentials

## 🎯 Running the Application

### Option 1: Run Both Simultaneously (Recommended)

**Using npm script:**
```bash
npm run dev:all
```

**Using shell script:**
```bash
./start.sh
```

### Option 2: Run Separately

**Terminal 1 - Backend:**
```bash
npm run dev:backend
# Or manually:
cd backend
source venv/bin/activate
uvicorn app:app --reload --port 5000
```

**Terminal 2 - Frontend:**
```bash
npm run dev
# Or:
npm run dev:frontend
```

## 📍 Access Points

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **API Documentation**: http://localhost:5000/docs
- **Alternative API Docs**: http://localhost:5000/redoc

## 📚 Documentation

See `env.example` and `backend/env.example` for environment variable setup.

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router), Material UI, ArcGIS Maps SDK
- **Backend**: FastAPI, SQLAlchemy, PostgreSQL
- **Auth**: Supabase Auth (JWT)
- **State Management**: Zustand
- **Mapping**: ArcGIS Maps SDK for JavaScript (with OSM/Leaflet fallback)
- **API Docs**: FastAPI automatically generates OpenAPI/Swagger documentation at `/docs`

## 📝 License

Internal use only
