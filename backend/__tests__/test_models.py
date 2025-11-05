"""
Test database models
Run with: pytest backend/__tests__/test_models.py -v
"""
import pytest
import uuid
from datetime import datetime
from backend.models import Drone, DroneBase, Schedule, SessionLocal, BaseModel, engine, init_db

@pytest.fixture(scope='function')
def db_session():
    """Create database session for testing"""
    init_db()
    session = SessionLocal()
    yield session
    session.close()
    BaseModel.metadata.drop_all(bind=engine)

def test_create_drone(db_session):
    """Test creating a drone"""
    drone = Drone(
        name='Test Drone',
        model='DJI Mavic',
        user_id=uuid.uuid4(),
        status='active'
    )
    db_session.add(drone)
    db_session.commit()
    
    assert drone.id is not None
    assert drone.name == 'Test Drone'
    assert drone.created_at is not None

def test_create_base(db_session):
    """Test creating a base"""
    base = DroneBase(
        name='Test Base',
        lat=37.7749,
        lng=-122.4194
    )
    db_session.add(base)
    db_session.commit()
    
    assert base.id is not None
    assert base.name == 'Test Base'
    assert base.lat == 37.7749

def test_create_schedule(db_session):
    """Test creating a schedule"""
    # Create drone first
    drone = Drone(
        name='Test Drone',
        user_id=uuid.uuid4()
    )
    db_session.add(drone)
    db_session.commit()
    
    # Create schedule
    schedule = Schedule(
        drone_id=drone.id,
        start_time=datetime.utcnow(),
        path_json={'coordinates': [[-122.4, 37.79]]}
    )
    db_session.add(schedule)
    db_session.commit()
    
    assert schedule.id is not None
    assert schedule.drone_id == drone.id

def test_drone_base_relationship(db_session):
    """Test drone-base relationship"""
    base = DroneBase(
        name='Test Base',
        lat=37.7749,
        lng=-122.4194
    )
    db_session.add(base)
    db_session.commit()
    
    drone = Drone(
        name='Test Drone',
        user_id=uuid.uuid4(),
        base_id=base.id
    )
    db_session.add(drone)
    db_session.commit()
    
    assert drone.base_id == base.id
    assert drone.base.name == 'Test Base'
    assert len(base.drones) == 1

def test_drone_schedule_relationship(db_session):
    """Test drone-schedule relationship"""
    drone = Drone(
        name='Test Drone',
        user_id=uuid.uuid4()
    )
    db_session.add(drone)
    db_session.commit()
    
    schedule = Schedule(
        drone_id=drone.id,
        start_time=datetime.utcnow()
    )
    db_session.add(schedule)
    db_session.commit()
    
    assert len(drone.schedules) == 1
    assert schedule.drone.name == 'Test Drone'

def test_cascade_delete(db_session):
    """Test cascade delete when drone is deleted"""
    drone = Drone(
        name='Test Drone',
        user_id=uuid.uuid4()
    )
    db_session.add(drone)
    db_session.commit()
    
    schedule = Schedule(
        drone_id=drone.id,
        start_time=datetime.utcnow()
    )
    db_session.add(schedule)
    db_session.commit()
    
    schedule_id = schedule.id
    
    # Delete drone
    db_session.delete(drone)
    db_session.commit()
    
    # Schedule should be deleted
    deleted_schedule = db_session.query(Schedule).filter(Schedule.id == schedule_id).first()
    assert deleted_schedule is None

if __name__ == '__main__':
    pytest.main([__file__, '-v'])

