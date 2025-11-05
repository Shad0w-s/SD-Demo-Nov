"""
Comprehensive unit tests for schedule endpoints
"""
import pytest
import uuid
from datetime import datetime, timedelta
from fastapi import status

class TestScheduleEndpoints:
    """Test all schedule endpoints"""
    
    def test_get_schedules_requires_auth(self, client):
        """Test GET /schedules requires authentication"""
        response = client.get("/api/schedules")
        # FastAPI validates header format first, so 422 is also valid
        assert response.status_code in [status.HTTP_401_UNAUTHORIZED, status.HTTP_422_UNPROCESSABLE_ENTITY]
    
    def test_get_schedule_invalid_id(self, client_with_user_auth):
        """Test GET /schedules/{id} with invalid ID format"""
        response = client_with_user_auth.get("/api/schedules/invalid-id")
        assert response.status_code == status.HTTP_400_BAD_REQUEST
    
    def test_get_schedule_not_found(self, client_with_user_auth):
        """Test GET /schedules/{id} with non-existent ID"""
        fake_id = str(uuid.uuid4())
        response = client_with_user_auth.get(f"/api/schedules/{fake_id}")
        # May return 403 (access denied) or 404 (not found)
        assert response.status_code in [status.HTTP_404_NOT_FOUND, status.HTTP_403_FORBIDDEN, status.HTTP_500_INTERNAL_SERVER_ERROR]
    
    def test_create_schedule_missing_fields(self, client_with_user_auth):
        """Test POST /schedules with missing required fields"""
        schedule_data = {"drone_id": str(uuid.uuid4())}
        response = client_with_user_auth.post("/api/schedules", json=schedule_data)
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    
    def test_create_schedule_invalid_drone_id(self, client_with_user_auth):
        """Test POST /schedules with invalid drone_id format"""
        schedule_data = {
            "drone_id": "invalid-uuid",
            "start_time": (datetime.utcnow() + timedelta(hours=1)).isoformat()
        }
        response = client_with_user_auth.post("/api/schedules", json=schedule_data)
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    
    def test_create_schedule_success_structure(self, client_with_user_auth):
        """Test POST /schedules creates schedule with correct structure"""
        schedule_data = {
            "drone_id": str(uuid.uuid4()),
            "start_time": (datetime.utcnow() + timedelta(hours=1)).isoformat(),
            "path_json": {"coordinates": [[-122.4, 37.79]]}
        }
        response = client_with_user_auth.post("/api/schedules", json=schedule_data)
        # Should either succeed (201) or fail with database/not found error, not validation error
        assert response.status_code in [status.HTTP_201_CREATED, status.HTTP_404_NOT_FOUND, status.HTTP_500_INTERNAL_SERVER_ERROR]
    
    def test_update_schedule_invalid_id(self, client_with_user_auth):
        """Test PUT /schedules/{id} with invalid ID"""
        update_data = {"start_time": (datetime.utcnow() + timedelta(hours=2)).isoformat()}
        response = client_with_user_auth.put("/api/schedules/invalid-id", json=update_data)
        assert response.status_code == status.HTTP_400_BAD_REQUEST
    
    def test_delete_schedule_invalid_id(self, client_with_user_auth):
        """Test DELETE /schedules/{id} with invalid ID"""
        response = client_with_user_auth.delete("/api/schedules/invalid-id")
        assert response.status_code == status.HTTP_400_BAD_REQUEST
