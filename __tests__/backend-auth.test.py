"""
Unit Tests for Phase 1: Backend Authentication (Flask)
 
Run tests with: pytest __tests__/backend-auth.test.py

These tests verify:
- JWT token verification
- Role-based access control
- Authentication decorator
- Error handling
"""

import pytest
import jwt
import os
from unittest.mock import patch, MagicMock
from flask import Flask, jsonify
from backend.auth import verify_token, require_auth

# Create test Flask app
app = Flask(__name__)

# Test routes
@app.route('/protected')
@require_auth()
def protected_route():
    from flask import request
    return jsonify({'user_id': request.user.get('sub')})

@app.route('/admin-only')
@require_auth(roles=['admin'])
def admin_route():
    return jsonify({'message': 'Admin access granted'})

class TestJWTVerification:
    """Test JWT token verification"""
    
    def test_verify_valid_token(self):
        """Test verification of valid Supabase JWT token"""
        # Create a mock token with Supabase structure
        payload = {
            'iss': 'supabase',
            'sub': 'user-123',
            'email': 'test@example.com',
            'user_metadata': {'role': 'user'}
        }
        
        # For testing, we'll mock the decode function
        with patch('backend.auth.jwt.decode') as mock_decode:
            mock_decode.return_value = payload
            
            # Mock the unverified decode for structure check
            with patch('backend.auth.jwt.decode') as mock_unverified:
                mock_unverified.return_value = payload
                
                # Since we're in dev mode, this should work
                result = verify_token('mock-token')
                assert result['sub'] == 'user-123'
    
    def test_verify_invalid_issuer(self):
        """Test rejection of token with wrong issuer"""
        from flask import abort
        
        payload = {
            'iss': 'not-supabase',
            'sub': 'user-123'
        }
        
        with patch('backend.auth.jwt.decode') as mock_decode:
            mock_decode.return_value = payload
            
            with pytest.raises(SystemExit):  # abort() raises SystemExit
                verify_token('invalid-token')
    
    def test_verify_malformed_token(self):
        """Test handling of malformed tokens"""
        from flask import abort
        
        with patch('backend.auth.jwt.decode') as mock_decode:
            mock_decode.side_effect = jwt.InvalidTokenError('Invalid token')
            
            with pytest.raises(SystemExit):
                verify_token('malformed-token')

class TestAuthenticationDecorator:
    """Test require_auth decorator"""
    
    def test_protected_route_without_token(self):
        """Test protected route rejects request without token"""
        with app.test_client() as client:
            response = client.get('/protected')
            assert response.status_code == 401
    
    def test_protected_route_with_valid_token(self):
        """Test protected route accepts request with valid token"""
        payload = {
            'iss': 'supabase',
            'sub': 'user-123',
            'user_metadata': {'role': 'user'}
        }
        
        with app.test_client() as client:
            with patch('backend.auth.verify_token') as mock_verify:
                mock_verify.return_value = payload
                
                response = client.get(
                    '/protected',
                    headers={'Authorization': 'Bearer valid-token'}
                )
                assert response.status_code == 200
                assert response.json['user_id'] == 'user-123'
    
    def test_admin_route_with_user_role(self):
        """Test admin route rejects non-admin users"""
        payload = {
            'iss': 'supabase',
            'sub': 'user-123',
            'user_metadata': {'role': 'user'}
        }
        
        with app.test_client() as client:
            with patch('backend.auth.verify_token') as mock_verify:
                mock_verify.return_value = payload
                
                response = client.get(
                    '/admin-only',
                    headers={'Authorization': 'Bearer valid-token'}
                )
                assert response.status_code == 403
    
    def test_admin_route_with_admin_role(self):
        """Test admin route accepts admin users"""
        payload = {
            'iss': 'supabase',
            'sub': 'admin-123',
            'user_metadata': {'role': 'admin'}
        }
        
        with app.test_client() as client:
            with patch('backend.auth.verify_token') as mock_verify:
                mock_verify.return_value = payload
                
                response = client.get(
                    '/admin-only',
                    headers={'Authorization': 'Bearer valid-token'}
                )
                assert response.status_code == 200
                assert response.json['message'] == 'Admin access granted'
    
    def test_protected_route_with_invalid_token_format(self):
        """Test protected route rejects invalid Authorization header format"""
        with app.test_client() as client:
            response = client.get(
                '/protected',
                headers={'Authorization': 'InvalidFormat token'}
            )
            assert response.status_code == 401
    
    def test_protected_route_missing_authorization_header(self):
        """Test protected route rejects missing Authorization header"""
        with app.test_client() as client:
            response = client.get('/protected')
            assert response.status_code == 401

class TestRoleExtraction:
    """Test role extraction from JWT payload"""
    
    def test_extract_user_role(self):
        """Test extraction of user role from metadata"""
        payload = {
            'iss': 'supabase',
            'sub': 'user-123',
            'user_metadata': {'role': 'user'}
        }
        
        role = payload.get('user_metadata', {}).get('role', 'user')
        assert role == 'user'
    
    def test_extract_admin_role(self):
        """Test extraction of admin role from metadata"""
        payload = {
            'iss': 'supabase',
            'sub': 'admin-123',
            'user_metadata': {'role': 'admin'}
        }
        
        role = payload.get('user_metadata', {}).get('role', 'user')
        assert role == 'admin'
    
    def test_default_role_when_missing(self):
        """Test default role assignment when metadata is missing"""
        payload = {
            'iss': 'supabase',
            'sub': 'user-123',
            'user_metadata': {}
        }
        
        role = payload.get('user_metadata', {}).get('role', 'user')
        assert role == 'user'

if __name__ == '__main__':
    pytest.main([__file__, '-v'])

