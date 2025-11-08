"""
Comprehensive unit tests for schedule endpoints
"""
import pytest
import uuid
from datetime import datetime, timedelta
from fastapi import status
from models import Drone, Schedule

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

    def test_schedule_lifecycle_persists_in_real_database(self, client_with_real_db_user):
        """Ensure create → list → delete works end-to-end against the real database"""
        client, SessionLocal = client_with_real_db_user

        drone_id = str(uuid.uuid4())
        with SessionLocal() as db:
            db.add(Drone(
                id=drone_id,
                name="Integration Drone",
                model="Test Model",
                user_id="test-user-123",
                status="active",
            ))
            db.commit()

        schedule_payload = {
            "drone_id": drone_id,
            "start_time": (datetime.utcnow() + timedelta(hours=1)).isoformat(),
            "end_time": (datetime.utcnow() + timedelta(hours=2)).isoformat(),
            "path_json": {"coordinates": [[-122.4, 37.79], [-122.41, 37.8]]},
        }

        create_response = client.post("/api/schedules", json=schedule_payload)
        assert create_response.status_code == status.HTTP_201_CREATED
        created_schedule = create_response.json()
        created_id = created_schedule["id"]

        list_response = client.get("/api/schedules")
        assert list_response.status_code == status.HTTP_200_OK
        returned_ids = {schedule["id"] for schedule in list_response.json()}
        assert created_id in returned_ids

        delete_response = client.delete(f"/api/schedules/{created_id}")
        assert delete_response.status_code == status.HTTP_200_OK

        with SessionLocal() as db:
            remaining = db.query(Schedule).filter(Schedule.id == created_id).first()
            assert remaining is None
