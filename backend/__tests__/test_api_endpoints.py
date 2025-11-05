"""
Comprehensive API Endpoint Tests for Phase 2
Run with: pytest backend/__tests__/test_api_endpoints.py -v
"""
import pytest
import json
import uuid
from datetime import datetime, timedelta
from unittest.mock import patch, MagicMock
from flask import Flask
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.app import app
from backend.models import BaseModel, engine, Drone, DroneBase, Schedule, init_db

# Create test database
TEST_DB_URL = os.getenv('TEST_DATABASE_URL', 'postgresql://user:password@localhost/test_dronedb')

@pytest.fixture(scope='module')
def test_app():
    """Create test Flask app"""
    app.config['TESTING'] = True
    app.config['DATABASE_URL'] = TEST_DB_URL
    return app

@pytest.fixture(scope='module')
def test_client(test_app):
    """Create test client"""
    return test_app.test_client()

@pytest.fixture(scope='function')
def mock_auth():
    """Mock authentication"""
    def create_mock_token(user_id='test-user-123', role='user'):
        return {
            'sub': user_id,
            'email': 'test@example.com',
            'user_metadata': {'role': role}
        }
    return create_mock_token

@pytest.fixture(scope='function')
def mock_admin_token():
    """Mock admin authentication"""
    def create_mock_token():
        return {
            'sub': 'admin-user-123',
            'email': 'admin@example.com',
            'user_metadata': {'role': 'admin'}
        }
    return create_mock_token

@pytest.fixture(scope='function')
def setup_db():
    """Setup test database"""
    # Create tables
    BaseModel.metadata.create_all(bind=engine)
    yield
    # Cleanup
    BaseModel.metadata.drop_all(bind=engine)

class TestDronesEndpoints:
    """Test drone CRUD endpoints"""
    
    def test_get_drones_no_auth(self, test_client):
        """Test GET /api/drones without authentication"""
        response = test_client.get('/api/drones')
        assert response.status_code == 401
    
    @patch('backend.routes.drones.verify_token')
    def test_get_drones_empty(self, mock_verify, test_client, mock_auth, setup_db):
        """Test GET /api/drones with no drones"""
        mock_verify.return_value = mock_auth()
        with patch('backend.routes.drones.request') as mock_request:
            mock_request.user = mock_auth()
            response = test_client.get('/api/drones', headers={'Authorization': 'Bearer test-token'})
            assert response.status_code == 200
            assert response.json == []
    
    @patch('backend.routes.drones.verify_token')
    def test_create_drone(self, mock_verify, test_client, mock_auth, setup_db):
        """Test POST /api/drones"""
        mock_verify.return_value = mock_auth()
        with patch('backend.routes.drones.request') as mock_request:
            mock_request.user = mock_auth()
            mock_request.json = {'name': 'Test Drone', 'model': 'DJI Mavic'}
            
            response = test_client.post(
                '/api/drones',
                json={'name': 'Test Drone', 'model': 'DJI Mavic'},
                headers={'Authorization': 'Bearer test-token', 'Content-Type': 'application/json'}
            )
            assert response.status_code == 201
            data = response.json
            assert 'id' in data
            assert data['name'] == 'Test Drone'
            assert data['model'] == 'DJI Mavic'
    
    @patch('backend.routes.drones.verify_token')
    def test_create_drone_missing_name(self, mock_verify, test_client, mock_auth, setup_db):
        """Test POST /api/drones without name"""
        mock_verify.return_value = mock_auth()
        with patch('backend.routes.drones.request') as mock_request:
            mock_request.user = mock_auth()
            response = test_client.post(
                '/api/drones',
                json={'model': 'DJI Mavic'},
                headers={'Authorization': 'Bearer test-token', 'Content-Type': 'application/json'}
            )
            assert response.status_code == 400
    
    @patch('backend.routes.drones.verify_token')
    def test_get_drone_by_id(self, mock_verify, test_client, mock_auth, setup_db):
        """Test GET /api/drones/<id>"""
        mock_verify.return_value = mock_auth()
        with patch('backend.routes.drones.request') as mock_request:
            mock_request.user = mock_auth()
            # First create a drone
            create_resp = test_client.post(
                '/api/drones',
                json={'name': 'Test Drone'},
                headers={'Authorization': 'Bearer test-token', 'Content-Type': 'application/json'}
            )
            drone_id = create_resp.json['id']
            
            # Then get it
            response = test_client.get(
                f'/api/drones/{drone_id}',
                headers={'Authorization': 'Bearer test-token'}
            )
            assert response.status_code == 200
            assert response.json['name'] == 'Test Drone'
    
    @patch('backend.routes.drones.verify_token')
    def test_update_drone(self, mock_verify, test_client, mock_auth, setup_db):
        """Test PUT /api/drones/<id>"""
        mock_verify.return_value = mock_auth()
        with patch('backend.routes.drones.request') as mock_request:
            mock_request.user = mock_auth()
            # Create drone
            create_resp = test_client.post(
                '/api/drones',
                json={'name': 'Test Drone'},
                headers={'Authorization': 'Bearer test-token', 'Content-Type': 'application/json'}
            )
            drone_id = create_resp.json['id']
            
            # Update drone
            response = test_client.put(
                f'/api/drones/{drone_id}',
                json={'name': 'Updated Drone', 'status': 'active'},
                headers={'Authorization': 'Bearer test-token', 'Content-Type': 'application/json'}
            )
            assert response.status_code == 200
            assert response.json['name'] == 'Updated Drone'
            assert response.json['status'] == 'active'
    
    @patch('backend.routes.drones.verify_token')
    def test_delete_drone(self, mock_verify, test_client, mock_auth, setup_db):
        """Test DELETE /api/drones/<id>"""
        mock_verify.return_value = mock_auth()
        with patch('backend.routes.drones.request') as mock_request:
            mock_request.user = mock_auth()
            # Create drone
            create_resp = test_client.post(
                '/api/drones',
                json={'name': 'Test Drone'},
                headers={'Authorization': 'Bearer test-token', 'Content-Type': 'application/json'}
            )
            drone_id = create_resp.json['id']
            
            # Delete drone
            response = test_client.delete(
                f'/api/drones/{drone_id}',
                headers={'Authorization': 'Bearer test-token'}
            )
            assert response.status_code == 200
            
            # Verify deleted
            get_resp = test_client.get(
                f'/api/drones/{drone_id}',
                headers={'Authorization': 'Bearer test-token'}
            )
            assert get_resp.status_code == 404

class TestBasesEndpoints:
    """Test base CRUD endpoints"""
    
    @patch('backend.routes.bases.verify_token')
    def test_create_base(self, mock_verify, test_client, mock_auth, setup_db):
        """Test POST /api/bases"""
        mock_verify.return_value = mock_auth()
        with patch('backend.routes.bases.request') as mock_request:
            mock_request.user = mock_auth()
            response = test_client.post(
                '/api/bases',
                json={'name': 'Test Base', 'lat': 37.7749, 'lng': -122.4194},
                headers={'Authorization': 'Bearer test-token', 'Content-Type': 'application/json'}
            )
            assert response.status_code == 201
            data = response.json
            assert 'id' in data
            assert data['name'] == 'Test Base'
            assert data['lat'] == 37.7749
            assert data['lng'] == -122.4194
    
    @patch('backend.routes.bases.verify_token')
    def test_create_base_invalid_coords(self, mock_verify, test_client, mock_auth, setup_db):
        """Test POST /api/bases with invalid coordinates"""
        mock_verify.return_value = mock_auth()
        with patch('backend.routes.bases.request') as mock_request:
            mock_request.user = mock_auth()
            response = test_client.post(
                '/api/bases',
                json={'name': 'Test Base', 'lat': 200, 'lng': -122.4194},
                headers={'Authorization': 'Bearer test-token', 'Content-Type': 'application/json'}
            )
            assert response.status_code == 400
    
    @patch('backend.routes.bases.verify_token')
    def test_get_bases(self, mock_verify, test_client, mock_auth, setup_db):
        """Test GET /api/bases"""
        mock_verify.return_value = mock_auth()
        with patch('backend.routes.bases.request') as mock_request:
            mock_request.user = mock_auth()
            # Create a base
            test_client.post(
                '/api/bases',
                json={'name': 'Test Base', 'lat': 37.7749, 'lng': -122.4194},
                headers={'Authorization': 'Bearer test-token', 'Content-Type': 'application/json'}
            )
            
            # Get all bases
            response = test_client.get('/api/bases', headers={'Authorization': 'Bearer test-token'})
            assert response.status_code == 200
            assert len(response.json) > 0
    
    @patch('backend.routes.bases.verify_token')
    def test_update_base(self, mock_verify, test_client, mock_auth, setup_db):
        """Test PUT /api/bases/<id>"""
        mock_verify.return_value = mock_auth()
        with patch('backend.routes.bases.request') as mock_request:
            mock_request.user = mock_auth()
            # Create base
            create_resp = test_client.post(
                '/api/bases',
                json={'name': 'Test Base', 'lat': 37.7749, 'lng': -122.4194},
                headers={'Authorization': 'Bearer test-token', 'Content-Type': 'application/json'}
            )
            base_id = create_resp.json['id']
            
            # Update base
            response = test_client.put(
                f'/api/bases/{base_id}',
                json={'name': 'Updated Base', 'lat': 40.7128, 'lng': -74.0060},
                headers={'Authorization': 'Bearer test-token', 'Content-Type': 'application/json'}
            )
            assert response.status_code == 200
            assert response.json['name'] == 'Updated Base'
            assert response.json['lat'] == 40.7128

class TestSchedulesEndpoints:
    """Test schedule CRUD endpoints"""
    
    @patch('backend.routes.schedules.verify_token')
    def test_create_schedule(self, mock_verify, test_client, mock_auth, setup_db):
        """Test POST /api/schedules"""
        mock_verify.return_value = mock_auth()
        with patch('backend.routes.schedules.request') as mock_request:
            mock_request.user = mock_auth()
            # First create a drone
            drone_resp = test_client.post(
                '/api/drones',
                json={'name': 'Test Drone'},
                headers={'Authorization': 'Bearer test-token', 'Content-Type': 'application/json'}
            )
            drone_id = drone_resp.json['id']
            
            # Create schedule
            start_time = (datetime.utcnow() + timedelta(hours=1)).isoformat()
            response = test_client.post(
                '/api/schedules',
                json={
                    'drone_id': drone_id,
                    'start_time': start_time,
                    'path_json': {'coordinates': [[-122.4, 37.79], [-122.39, 37.78]]}
                },
                headers={'Authorization': 'Bearer test-token', 'Content-Type': 'application/json'}
            )
            assert response.status_code == 201
            assert 'id' in response.json
            assert response.json['drone_id'] == drone_id

class TestSimulationEndpoints:
    """Test simulation endpoints"""
    
    @patch('backend.routes.drones.verify_token')
    def test_simulate_path(self, mock_verify, test_client, mock_auth, setup_db):
        """Test POST /api/drones/<id>/simulate_path"""
        mock_verify.return_value = mock_auth()
        with patch('backend.routes.drones.request') as mock_request:
            mock_request.user = mock_auth()
            mock_request.json = {'path': [[-122.4, 37.79], [-122.39, 37.78]]}
            
            # Create drone
            drone_resp = test_client.post(
                '/api/drones',
                json={'name': 'Test Drone'},
                headers={'Authorization': 'Bearer test-token', 'Content-Type': 'application/json'}
            )
            drone_id = drone_resp.json['id']
            
            # Simulate path
            response = test_client.post(
                f'/api/drones/{drone_id}/simulate_path',
                json={'path': [[-122.4, 37.79], [-122.39, 37.78]]},
                headers={'Authorization': 'Bearer test-token', 'Content-Type': 'application/json'}
            )
            assert response.status_code == 200
            assert 'path' in response.json
            assert 'speed_mps' in response.json
            assert 'eta_seconds' in response.json
            assert 'telemetry' in response.json
    
    @patch('backend.routes.drones.verify_token')
    def test_drone_action(self, mock_verify, test_client, mock_auth, setup_db):
        """Test POST /api/drones/<id>/action"""
        mock_verify.return_value = mock_auth()
        with patch('backend.routes.drones.request') as mock_request:
            mock_request.user = mock_auth()
            mock_request.json = {'action': 'return_to_base'}
            
            # Create drone
            drone_resp = test_client.post(
                '/api/drones',
                json={'name': 'Test Drone'},
                headers={'Authorization': 'Bearer test-token', 'Content-Type': 'application/json'}
            )
            drone_id = drone_resp.json['id']
            
            # Execute action
            response = test_client.post(
                f'/api/drones/{drone_id}/action',
                json={'action': 'return_to_base'},
                headers={'Authorization': 'Bearer test-token', 'Content-Type': 'application/json'}
            )
            assert response.status_code == 200
            assert response.json['status'] == 'success'
            assert response.json['action'] == 'return_to_base'

class TestAdminEndpoints:
    """Test admin endpoints"""
    
    @patch('backend.routes.admin.verify_token')
    @patch('backend.routes.admin.requests.get')
    def test_get_users_admin(self, mock_get, mock_verify, test_client, mock_admin_token):
        """Test GET /api/users (admin only)"""
        mock_verify.return_value = mock_admin_token()
        mock_get.return_value.status_code = 200
        mock_get.return_value.json.return_value = {
            'users': [
                {
                    'id': 'user-123',
                    'email': 'test@example.com',
                    'user_metadata': {'role': 'user'},
                    'created_at': '2024-01-01T00:00:00Z'
                }
            ]
        }
        
        with patch('backend.routes.admin.request') as mock_request:
            mock_request.user = mock_admin_token()
            response = test_client.get('/api/users', headers={'Authorization': 'Bearer admin-token'})
            assert response.status_code == 200
            assert 'users' in response.json
    
    @patch('backend.routes.admin.verify_token')
    def test_get_stats_admin(self, mock_verify, test_client, mock_admin_token, setup_db):
        """Test GET /api/stats (admin only)"""
        mock_verify.return_value = mock_admin_token()
        with patch('backend.routes.admin.request') as mock_request:
            mock_request.user = mock_admin_token()
            response = test_client.get('/api/stats', headers={'Authorization': 'Bearer admin-token'})
            assert response.status_code == 200
            assert 'total_drones' in response.json
            assert 'total_bases' in response.json
            assert 'total_schedules' in response.json

if __name__ == '__main__':
    pytest.main([__file__, '-v'])

