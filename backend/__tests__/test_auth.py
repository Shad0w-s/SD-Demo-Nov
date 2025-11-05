"""
FastAPI Authentication Tests
Tests for JWT token verification and role-based access control

Run with: pytest backend/__tests__/backend-auth.test.py -v
"""
import pytest
import jwt
from unittest.mock import patch, Mock
from fastapi import HTTPException

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from auth import verify_token, get_current_user, require_auth

class TestTokenVerification:
    """Test JWT token verification"""
    
    def test_verify_valid_token(self):
        """Test verification of valid Supabase JWT token"""
        # Create a mock token with Supabase structure
        mock_token = "mock-token"
        
        with patch('auth.jwt.decode') as mock_decode:
            mock_decode.return_value = {
                'iss': 'supabase',
                'sub': 'user-123',
                'user_metadata': {'role': 'user'}
            }
            
            with patch('auth.SUPABASE_JWT_SECRET', ''):
                result = verify_token(mock_token)
                assert result['iss'] == 'supabase'
                assert result['sub'] == 'user-123'
    
    def test_verify_token_wrong_issuer(self):
        """Test rejection of token with wrong issuer"""
        mock_token = "mock-token"
        
        with patch('auth.jwt.decode') as mock_decode:
            mock_decode.return_value = {
                'iss': 'not-supabase',
                'sub': 'user-123'
            }
            
            with patch('auth.SUPABASE_JWT_SECRET', ''):
                with pytest.raises(HTTPException) as exc_info:
                    verify_token(mock_token)
                assert exc_info.value.status_code == 401
    
    def test_verify_malformed_token(self):
        """Test handling of malformed tokens"""
        with patch('auth.jwt.decode') as mock_decode:
            mock_decode.side_effect = jwt.InvalidTokenError('Invalid token')
            
            with pytest.raises(HTTPException) as exc_info:
                verify_token('malformed-token')
            assert exc_info.value.status_code == 401

class TestAuthDependencies:
    """Test authentication dependencies"""
    
    def test_get_current_user_valid_header(self):
        """Test get_current_user with valid authorization header"""
        with patch('auth.verify_token') as mock_verify:
            mock_verify.return_value = {
                'sub': 'user-123',
                'user_metadata': {'role': 'user'}
            }
            
            result = get_current_user(authorization="Bearer valid-token")
            assert result['sub'] == 'user-123'
    
    def test_get_current_user_invalid_header(self):
        """Test get_current_user with invalid header format"""
        with pytest.raises(HTTPException) as exc_info:
            get_current_user(authorization="InvalidFormat token")
        assert exc_info.value.status_code == 401
    
    def test_get_current_user_missing_header(self):
        """Test get_current_user raises error without header"""
        with pytest.raises(Exception):  # FastAPI will raise validation error
            get_current_user(authorization="")

class TestRoleBasedAccess:
    """Test role-based access control"""
    
    def test_require_auth_user_role(self):
        """Test require_auth with user role"""
        user_payload = {
            'sub': 'user-123',
            'user_metadata': {'role': 'user'}
        }
        
        auth_dep = require_auth(roles=['user'])
        result = auth_dep(user_payload)
        assert result == user_payload
    
    def test_require_auth_admin_role(self):
        """Test require_auth with admin role"""
        admin_payload = {
            'sub': 'admin-123',
            'user_metadata': {'role': 'admin'}
        }
        
        auth_dep = require_auth(roles=['admin'])
        result = auth_dep(admin_payload)
        assert result == admin_payload
    
    def test_require_auth_insufficient_permissions(self):
        """Test require_auth denies user accessing admin endpoint"""
        user_payload = {
            'sub': 'user-123',
            'user_metadata': {'role': 'user'}
        }
        
        auth_dep = require_auth(roles=['admin'])
        with pytest.raises(HTTPException) as exc_info:
            auth_dep(user_payload)
        assert exc_info.value.status_code == 403
    
    def test_require_auth_no_roles(self):
        """Test require_auth without role restrictions"""
        user_payload = {
            'sub': 'user-123',
            'user_metadata': {'role': 'user'}
        }
        
        auth_dep = require_auth()
        result = auth_dep(user_payload)
        assert result == user_payload

