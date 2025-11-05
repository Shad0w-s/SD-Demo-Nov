"""
API Endpoint Structure Tests for FastAPI
Tests that verify endpoint structure and registration

Run with: pytest backend/__tests__/test_api_endpoints.py -v
"""
import pytest
import sys
import os

# Add backend directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import app
from fastapi.testclient import TestClient

client = TestClient(app)

class TestEndpointStructure:
    """Test that endpoints are properly registered"""
    
    def test_app_exists(self):
        """Verify FastAPI app exists"""
        assert app is not None
    
    def test_health_endpoint(self):
        """Test health check endpoint"""
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
    
    def test_drones_router_registered(self):
        """Verify drones router is registered"""
        from routes import drones
        assert hasattr(drones, 'router')
        assert drones.router is not None
    
    def test_bases_router_registered(self):
        """Verify bases router is registered"""
        from routes import bases
        assert hasattr(bases, 'router')
        assert bases.router is not None
    
    def test_schedules_router_registered(self):
        """Verify schedules router is registered"""
        from routes import schedules
        assert hasattr(schedules, 'router')
        assert schedules.router is not None
    
    def test_admin_router_registered(self):
        """Verify admin router is registered"""
        from routes import admin
        assert hasattr(admin, 'router')
        assert admin.router is not None
    
    def test_drones_endpoints_exist(self):
        """Verify drone endpoints require authentication"""
        # FastAPI validates request format first (422), then auth (401)
        response = client.get("/api/drones")
        assert response.status_code in [401, 422]  # 422 for missing auth header format
    
    def test_bases_endpoints_exist(self):
        """Verify base endpoints require authentication"""
        response = client.get("/api/bases")
        assert response.status_code in [401, 422]
    
    def test_schedules_endpoints_exist(self):
        """Verify schedule endpoints require authentication"""
        response = client.get("/api/schedules")
        assert response.status_code in [401, 422]
    
    def test_admin_endpoints_exist(self):
        """Verify admin endpoints require authentication"""
        response = client.get("/api/admin/users")
        assert response.status_code in [401, 422]
