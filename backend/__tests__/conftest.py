"""
Pytest fixtures for FastAPI testing
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, Column, String, DateTime, ForeignKey, Text, Double, JSON
from sqlalchemy.orm import sessionmaker
from unittest.mock import patch
import os
import sys
import uuid

# Add backend directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import app
from models import BaseModel
from dependencies import get_db
from auth import get_current_user

# Use in-memory SQLite for testing
TEST_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="function")
def db_session():
    """Create a test database session"""
    # For tests that don't need actual database operations, we'll use a mock session
    # Tests focus on request validation and endpoint structure rather than full DB integration
    from unittest.mock import MagicMock
    db = MagicMock()
    yield db

@pytest.fixture(scope="function")
def client(db_session):
    """Create a test client with database override"""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
    
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()

@pytest.fixture
def mock_user():
    """Mock user payload"""
    return {
        'sub': 'test-user-123',
        'email': 'test@example.com',
        'user_metadata': {'role': 'user'}
    }

@pytest.fixture
def mock_admin():
    """Mock admin payload"""
    return {
        'sub': 'admin-user-123',
        'email': 'admin@example.com',
        'user_metadata': {'role': 'admin'}
    }

@pytest.fixture
def client_with_user_auth(client, mock_user):
    """Test client with user authentication mocked"""
    # Override get_current_user to return mock user
    app.dependency_overrides[get_current_user] = lambda: mock_user
    yield client
    app.dependency_overrides.clear()

@pytest.fixture
def client_with_admin_auth(client, mock_admin):
    """Test client with admin authentication mocked"""
    # Override get_current_user to return mock admin
    app.dependency_overrides[get_current_user] = lambda: mock_admin
    yield client
    app.dependency_overrides.clear()

