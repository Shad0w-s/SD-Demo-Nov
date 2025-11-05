# 🚁 Drone Management System (MVP)

A web-based Drone Management System for internal testing, built with Next.js, Flask, and Supabase.

## 📋 Project Structure

```
SD-Demo-Nov/
├── src/                    # Next.js frontend
│   ├── app/               # App Router pages
│   ├── components/        # React components
│   ├── lib/              # Utilities and clients
│   └── styles/           # Global styles
├── backend/              # Flask API
│   ├── routes/           # API route handlers
│   ├── app.py           # Flask app entry
│   ├── auth.py          # JWT authentication
│   └── models.py        # SQLAlchemy models
├── PRD_Drone_Management_System.md
├── Technical_Spec_Guide.md
└── IMPLEMENTATION_PLAN.md
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

4. Run development server:
```bash
npm run dev
```

### Backend Setup

1. Create virtual environment:
```bash
cd backend
python -m venv venv
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

5. Run Flask server:
```bash
python app.py
```

## 📚 Documentation

- **PRD**: See `PRD_Drone_Management_System.md` for product requirements
- **Technical Spec**: See `Technical_Spec_Guide.md` for implementation details
- **Implementation Plan**: See `IMPLEMENTATION_PLAN.md` for step-by-step guide

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router), Material UI, Leaflet/OpenStreetMap
- **Backend**: Flask, SQLAlchemy, PostgreSQL
- **Auth**: Supabase Auth (JWT)
- **State Management**: Zustand
- **Mapping**: Leaflet with OpenStreetMap (free, no API key required)

## 📝 License

Internal use only
