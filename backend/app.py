from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, JSONResponse
from fastapi.exceptions import RequestValidationError
from dotenv import load_dotenv
import os

load_dotenv()

app = FastAPI(
    title="Drone Management System API",
    description="API for managing drones, bases, and schedules",
    version="1.0.0"
)

# Custom exception handler for validation errors
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle validation errors with detailed logging"""
    print(f"[VALIDATION] ❌ Request validation failed for {request.method} {request.url.path}")
    print(f"[VALIDATION] Errors: {exc.errors()}")
    
    # Try to log body, but don't fail if already consumed
    try:
        body = await request.body()
        print(f"[VALIDATION] Body: {body.decode('utf-8')}")
    except Exception:
        print("[VALIDATION] Body: (already consumed or unavailable)")
    
    # Return a more helpful error message
    errors = exc.errors()
    return JSONResponse(
        status_code=422,
        content={
            "detail": errors,
            "message": "Request validation failed. Check the data types and required fields."
        }
    )

# CORS middleware - MUST be added before routes
# This should automatically handle OPTIONS preflight requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",  # Allow both localhost and 127.0.0.1
    ],
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods including OPTIONS
    allow_headers=["*"],  # Allow all headers
)

# Explicit OPTIONS handler for all API routes - bypasses all dependencies
# This ensures OPTIONS requests succeed even if CORS middleware doesn't catch them
@app.options("/api/{full_path:path}")
async def options_handler(request: Request, full_path: str):
    """Handle OPTIONS requests for CORS preflight - no authentication required"""
    origin = request.headers.get("origin", "*")
    # Check if origin is allowed
    allowed_origins = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
    ]
    
    if origin in allowed_origins:
        return Response(
            status_code=200,
            headers={
                "Access-Control-Allow-Origin": origin,
                "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
                "Access-Control-Allow-Headers": "*",
                "Access-Control-Allow-Credentials": "true",
                "Access-Control-Max-Age": "3600",
            }
        )
    else:
        return Response(status_code=403)

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
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
