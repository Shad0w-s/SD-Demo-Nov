"""
Authentication dependencies for FastAPI
"""
import jwt
from fastapi import Depends, HTTPException, status, Header, Request
from typing import Optional, Dict, Any
import os

SUPABASE_URL = os.getenv('SUPABASE_PROJECT_URL', '')
SUPABASE_JWT_SECRET = os.getenv('SUPABASE_JWT_SECRET', '')

def verify_token(token: str) -> Dict[str, Any]:
    """Verify JWT token from Supabase"""
    try:
        # Check for demo token (format: "demo.{base64_payload}.demo")
        if token.startswith('demo.') and token.endswith('.demo'):
            print("[AUTH] Using demo token for local development")
            # Extract and decode the payload
            import base64
            import json
            payload_b64 = token.split('.')[1]
            payload_json = base64.b64decode(payload_b64).decode('utf-8')
            payload = json.loads(payload_json)
            if 'sub' in payload:
                return payload
            else:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid demo token structure"
                )
        
        # Decode without verification first to check structure
        unverified = jwt.decode(token, options={"verify_signature": False})
        
        # Development mode: if no JWT secret is configured, trust the token structure
        # This allows the demo to work without full Supabase backend configuration
        if not SUPABASE_JWT_SECRET:
            print("[AUTH] Running in development mode - trusting token structure without signature verification")
            # Basic validation: check if it looks like a Supabase token
            if 'sub' in unverified:  # sub (subject) is required in JWT
                return unverified
            else:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid token structure"
                )
        
        # Production mode: verify issuer matches Supabase
        if unverified.get('iss') != 'supabase':
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token issuer"
            )
        
        # Verify signature with JWT secret
        payload = jwt.decode(
            token,
            SUPABASE_JWT_SECRET,
            algorithms=['HS256'],
            options={"verify_aud": False}
        )
        
        return payload
    except jwt.InvalidTokenError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token verification failed: {str(e)}"
        )
    except HTTPException:
        # Re-raise HTTPException as-is
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token verification error: {str(e)}"
        )

def get_current_user(
    request: Request,
    authorization: Optional[str] = Header(None)
) -> Dict[str, Any]:
    """Dependency to get current authenticated user"""
    # Skip authentication for OPTIONS requests (CORS preflight)
    if request.method == "OPTIONS":
        # Return a dummy user dict for OPTIONS requests
        # The actual request will be authenticated
        return {}
    
    # For all other requests, authorization is required
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header is required"
        )
    
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
        # Skip role check for OPTIONS requests
        if not current_user:
            return current_user
        
        if roles:
            user_role = current_user.get("user_metadata", {}).get("role", "user")
            if user_role not in roles:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Insufficient permissions"
                )
        return current_user
    
    return get_authenticated_user
