# 🚁 Drone Management System (MVP)

A web-based Drone Management System for internal testing, built with Next.js, FastAPI, and SQLite.

## 🐳 Quick Start with Docker (Recommended)

The easiest way to run the application is with Docker:

```bash
# 1. Set your ArcGIS API key
echo "NEXT_PUBLIC_ARCGIS_API_KEY=your_key_here" > .env

# 2. Build and run
docker-compose up --build

# 3. Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

**📖 For detailed Docker instructions, see [DOCKER.md](./DOCKER.md)**

---

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

## 🚀 Local Development Setup

### Prerequisites
- Node.js 18+ and npm
- Python 3.9+
- (Optional) Supabase account for production authentication

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
   - `NEXT_PUBLIC_ARCGIS_API_KEY` - Your ArcGIS API key (required)
   - `NEXT_PUBLIC_API_BASE_URL` - Backend API URL (default: http://127.0.0.1:8000)
   - `NEXT_PUBLIC_SUPABASE_URL` - (Optional) Your Supabase project URL for production
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - (Optional) Your Supabase anonymous key for production

**Note:** In development mode, the app uses demo authentication without Supabase. ArcGIS is the only map provider (OSM fallback removed).

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

3. (Optional) Set environment variables for production:
```bash
cp env.example .env
```

4. Initialize the database with demo data:
```bash
python init_db.py
```

This creates a SQLite database with:
- 3 drone bases (San Francisco, Austin, New York)
- 10 drones with various statuses
- 2 pre-scheduled flights

## 🎯 Running the Application

### Option 1: Run Both Simultaneously (Recommended)

**Using npm script (requires concurrently):**
```bash
npm run dev:all
```

**First time setup:**
```bash
# Install concurrently if not already installed
npm install --save-dev concurrently

# Initialize database in backend
cd backend
python init_db.py
cd ..

# Run both frontend and backend
npm run dev:all
```

**Using shell script:**
```bash
./start.sh
```

### Option 2: Using Docker (No Installation Required)

See [DOCKER.md](./DOCKER.md) for complete Docker deployment guide.

**Quick Start:**
```bash
# Set ArcGIS API key
echo "NEXT_PUBLIC_ARCGIS_API_KEY=your_key" > .env

# Run with Docker
docker-compose up --build

# Access at http://localhost:3000
```

### Option 3: Run Separately

**Terminal 1 - Backend:**
```bash
cd backend
python init_db.py  # First time only
source venv/bin/activate
python app.py
# Or use the script:
./start_backend.sh
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

## 📍 Access Points

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000 (changed from 5000 to avoid macOS AirPlay conflict)
- **API Documentation**: http://localhost:8000/docs
- **Alternative API Docs**: http://localhost:8000/redoc

## 📚 Documentation

- **[DOCKER.md](./DOCKER.md)** - Complete Docker deployment guide
- **[env.example](./env.example)** - Frontend environment variables
- **[backend/env.example](./backend/env.example)** - Backend environment variables
- **API Docs** - Visit http://localhost:8000/docs when backend is running

## ✨ Key Features

### Schedule Management
- ✅ Create flight schedules with custom waypoints
- ✅ Visual path drawing on interactive map
- ✅ Automatic schedule display in sidebar
- ✅ Minimum 1 waypoint validation
- ✅ Detailed console logging for debugging
- ✅ Auto-clear waypoints after schedule creation
- ✅ Sidebar merges preloaded demo schedules with database-backed updates
- ✅ Delete icon removes schedules (demo schedules return on page reload; saved schedules persist)

### Map Features
- ✅ ArcGIS Maps SDK integration (satellite view)
- ✅ Interactive waypoint placement
- ✅ Real-time drone tracking
- ✅ Path visualization
- ✅ Base markers

### Demo Mode
- ✅ SQLite database (no server required)
- ✅ Demo authentication (no Supabase needed)
- ✅ Pre-seeded with 10 drones and 3 bases
- ✅ Skip user ownership checks in development

## 🔧 Troubleshooting

### Port 8000 Already in Use (macOS AirPlay)

On macOS, port 5000 is used by AirPlay Receiver. This app uses port 8000 instead. If port 8000 is in use:

1. Change the port in `backend/app.py` (line with `uvicorn.run`)
2. Update `NEXT_PUBLIC_API_BASE_URL` in `.env.local`
3. Restart both frontend and backend

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
