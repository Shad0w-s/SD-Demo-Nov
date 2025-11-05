import jwt
from flask import request, abort
from functools import wraps
import os

# Supabase uses HS256 with the JWT secret for anon key verification
# For production, we should verify against Supabase's JWKS endpoint
# For now, we'll verify the token signature and basic claims
SUPABASE_URL = os.getenv('SUPABASE_PROJECT_URL', 'https://qtbnulraotlnlgxbtfoy.supabase.co')
SUPABASE_JWT_SECRET = os.getenv('SUPABASE_JWT_SECRET', '')

def verify_token(token):
    """Verify JWT token from Supabase"""
    try:
        # Decode without verification first to check structure
        unverified = jwt.decode(token, options={"verify_signature": False})
        
        # Verify issuer matches Supabase
        if unverified.get('iss') != 'supabase':
            abort(401)
        
        # If we have JWT secret, verify signature
        if SUPABASE_JWT_SECRET:
            payload = jwt.decode(
                token,
                SUPABASE_JWT_SECRET,
                algorithms=['HS256'],
                options={"verify_aud": False}
            )
        else:
            # For development: trust the token structure (production should verify)
            # In production, use Supabase's JWKS endpoint
            payload = unverified
        
        return payload
    except jwt.InvalidTokenError as e:
        print(f"Token verification failed: {e}")
        abort(401)
    except Exception as e:
        print(f"Token verification error: {e}")
        abort(401)

def require_auth(roles=None):
    """Decorator to require authentication and optionally specific roles"""
    roles = roles or []
    
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            auth = request.headers.get("Authorization", "")
            if not auth.startswith("Bearer "):
                abort(401)
            
            token = auth.split(" ", 1)[1]
            payload = verify_token(token)
            
            # Extract role from user_metadata
            role = payload.get("user_metadata", {}).get("role", "user")
            
            if roles and role not in roles:
                abort(403)
            
            # Attach user info to request
            request.user = payload
            return fn(*args, **kwargs)
        return wrapper
    return decorator

