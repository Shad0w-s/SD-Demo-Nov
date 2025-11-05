import jwt
import requests
from flask import request, abort
from functools import wraps
import os

SUPABASE_URL = os.getenv('SUPABASE_PROJECT_URL', 'https://<PROJECT>.supabase.co')

# Cache JWKS
_jwks_cache = None

def get_jwks():
    global _jwks_cache
    if _jwks_cache is None:
        try:
            response = requests.get(f"{SUPABASE_URL}/auth/v1/keys", timeout=10)
            response.raise_for_status()
            _jwks_cache = response.json()
        except Exception as e:
            print(f"Error fetching JWKS: {e}")
            abort(500)
    return _jwks_cache

def verify_token(token):
    """Verify JWT token from Supabase"""
    try:
        header = jwt.get_unverified_header(token)
        jwks = get_jwks()
        
        key = next((k for k in jwks.get("keys", []) if k["kid"] == header["kid"]), None)
        if not key:
            abort(401)
        
        public_key = jwt.algorithms.RSAAlgorithm.from_jwk(key)
        payload = jwt.decode(
            token,
            public_key,
            algorithms=[header["alg"]],
            options={"verify_aud": False}
        )
        return payload
    except jwt.InvalidTokenError as e:
        print(f"Token verification failed: {e}")
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

