from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

load_dotenv()

app = FastAPI(
    title="Drone Management System API",
    description="API for managing drones, bases, and schedules",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Import and register routers
from routes import drones, bases, admin, schedules

app.include_router(drones.router, prefix="/api", tags=["drones"])
app.include_router(bases.router, prefix="/api", tags=["bases"])
app.include_router(schedules.router, prefix="/api", tags=["schedules"])
app.include_router(admin.router, prefix="/api", tags=["admin"])

@app.get("/")
def health():
    return {"status": "ok", "message": "Drone Management System API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000, reload=True)
