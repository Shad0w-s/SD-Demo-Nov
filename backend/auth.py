"""
Authentication dependencies for FastAPI
"""
import jwt
from fastapi import Depends, HTTPException, status, Header
from typing import Optional, Dict, Any
import os

SUPABASE_URL = os.getenv('SUPABASE_PROJECT_URL', '')
SUPABASE_JWT_SECRET = os.getenv('SUPABASE_JWT_SECRET', '')

def verify_token(token: str) -> Dict[str, Any]:
    """Verify JWT token from Supabase"""
    try:
        # Decode without verification first to check structure
        unverified = jwt.decode(token, options={"verify_signature": False})
        
        # Verify issuer matches Supabase
        if unverified.get('iss') != 'supabase':
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token issuer"
            )
        
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
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token verification failed: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token verification error: {str(e)}"
        )

def get_current_user(authorization: str = Header(...)) -> Dict[str, Any]:
    """Dependency to get current authenticated user"""
    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header format"
        )
    
    token = authorization.split(" ", 1)[1]
    payload = verify_token(token)
    return payload

def require_auth(roles: Optional[list] = None):
    """Dependency factory for role-based access control"""
    def get_authenticated_user(
        current_user: Dict[str, Any] = Depends(get_current_user)
    ) -> Dict[str, Any]:
        if roles:
            user_role = current_user.get("user_metadata", {}).get("role", "user")
            if user_role not in roles:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Insufficient permissions"
                )
        return current_user
    
    return get_authenticated_user
