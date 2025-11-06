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

3. Update `.env.local` with your credentials:
   - `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key
   - `NEXT_PUBLIC_ARCGIS_API_KEY` - Your ArcGIS API key (optional, will use OSM fallback if not set)
   - `NEXT_PUBLIC_API_BASE_URL` - Backend API URL (default: http://localhost:5000)

**Note:** If `NEXT_PUBLIC_ARCGIS_API_KEY` is not set, the map will automatically fall back to OpenStreetMap/Leaflet. The application will work with either map provider.

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

## 🔧 Troubleshooting

### ArcGIS Map Not Displaying

If the ArcGIS map is not displaying or updating, check the following:

1. **Environment Variable Setup**
   - Ensure `.env.local` exists in the project root
   - Verify `NEXT_PUBLIC_ARCGIS_API_KEY` is set correctly
   - **Important**: Restart the Next.js dev server after adding/changing environment variables
   - Check browser console for warnings about missing API key

2. **Browser Console Logging**
   - Open browser DevTools (F12) and check the Console tab
   - Look for logs prefixed with `[Map]`, `[ArcGIS]`, or `[DroneMap]`
   - These logs will indicate:
     - Whether the API key is present
     - If ArcGIS modules are loading
     - Container dimensions
     - Initialization errors

3. **Common Issues**
   - **Map shows OSM/Leaflet instead of ArcGIS**: API key is missing or invalid
   - **Map container has zero dimensions**: Check parent container CSS (needs explicit height)
   - **Network errors**: Check if ArcGIS CDN is accessible (may be blocked by firewall/proxy)
   - **Timeout errors**: ArcGIS modules taking too long to load (check network connection)

4. **Debugging Steps**
   ```bash
   # 1. Verify .env.local exists and has the key
   cat .env.local | grep ARCGIS
   
   # 2. Restart dev server after env changes
   npm run dev
   
   # 3. Check browser console for detailed logs
   # Look for: [Map], [ArcGIS], [DroneMap] prefixes
   ```

5. **Fallback Behavior**
   - If ArcGIS fails to load, the app automatically falls back to OpenStreetMap/Leaflet
   - The app will work with either map provider
   - Check console for: `✅ OSM/Leaflet map initialized as fallback`

6. **API Key Validation**
   - ArcGIS API keys are typically 32-40 characters
   - Verify the key is active in your ArcGIS Developer account
   - Ensure the key has proper permissions for Maps SDK

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router), Material UI, ArcGIS Maps SDK
- **Backend**: FastAPI, SQLAlchemy, PostgreSQL
- **Auth**: Supabase Auth (JWT)
- **State Management**: Zustand
- **Mapping**: ArcGIS Maps SDK for JavaScript (with OSM/Leaflet fallback)
- **API Docs**: FastAPI automatically generates OpenAPI/Swagger documentation at `/docs`

## 📝 License

Internal use only
