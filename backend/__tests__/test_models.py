"""
Database Model Structure Tests
Tests that verify model structure without requiring database connection

Run with: pytest backend/__tests__/test_models.py -v
"""
import pytest
import sys
import os

# Add backend directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models import Drone, DroneBase, Schedule, BaseModel

class TestModelStructure:
    """Test that models have correct structure"""
    
    def test_drone_model_exists(self):
        """Verify Drone model exists"""
        assert Drone is not None
        assert issubclass(Drone, BaseModel)
    
    def test_drone_has_required_fields(self):
        """Verify Drone model has required fields"""
        assert hasattr(Drone, 'name')
        assert hasattr(Drone, 'model')
        assert hasattr(Drone, 'status')
        assert hasattr(Drone, 'user_id')
        assert hasattr(Drone, 'base_id')
        assert hasattr(Drone, 'created_at')
        assert hasattr(Drone, 'updated_at')
    
    def test_drone_has_relationships(self):
        """Verify Drone model has relationships"""
        assert hasattr(Drone, 'base')
        assert hasattr(Drone, 'schedules')
    
    def test_base_model_exists(self):
        """Verify DroneBase model exists"""
        assert DroneBase is not None
        assert issubclass(DroneBase, BaseModel)
    
    def test_base_has_required_fields(self):
        """Verify DroneBase model has required fields"""
        assert hasattr(DroneBase, 'name')
        assert hasattr(DroneBase, 'lat')
        assert hasattr(DroneBase, 'lng')
        assert hasattr(DroneBase, 'created_at')
        assert hasattr(DroneBase, 'updated_at')
    
    def test_base_has_relationships(self):
        """Verify DroneBase model has relationships"""
        assert hasattr(DroneBase, 'drones')
    
    def test_schedule_model_exists(self):
        """Verify Schedule model exists"""
        assert Schedule is not None
        assert issubclass(Schedule, BaseModel)
    
    def test_schedule_has_required_fields(self):
        """Verify Schedule model has required fields"""
        assert hasattr(Schedule, 'drone_id')
        assert hasattr(Schedule, 'start_time')
        assert hasattr(Schedule, 'end_time')
        assert hasattr(Schedule, 'path_json')
        assert hasattr(Schedule, 'created_at')
    
    def test_schedule_has_relationships(self):
        """Verify Schedule model has relationships"""
        assert hasattr(Schedule, 'drone')

class TestModelTableNames:
    """Test that models have correct table names"""
    
    def test_drone_table_name(self):
        """Verify Drone table name"""
        assert Drone.__tablename__ == 'drones'
    
    def test_base_table_name(self):
        """Verify DroneBase table name"""
        assert DroneBase.__tablename__ == 'bases'
    
    def test_schedule_table_name(self):
        """Verify Schedule table name"""
        assert Schedule.__tablename__ == 'schedules'

if __name__ == '__main__':
    pytest.main([__file__, '-v'])
