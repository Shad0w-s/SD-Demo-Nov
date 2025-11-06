"""
Initialize SQLite database with demo data
Run this once to create tables and seed data
"""
from models import BaseModel, engine, SessionLocal, Drone, DroneBase, Schedule
from datetime import datetime, timedelta

def init_database():
    """Create all tables"""
    print("Creating database tables...")
    BaseModel.metadata.create_all(bind=engine)
    print("✅ Tables created!")

def seed_data():
    """Add demo data"""
    db = SessionLocal()
    
    try:
        # Check if data already exists
        existing_drones = db.query(Drone).count()
        if existing_drones > 0:
            print("⚠️  Database already has data. Skipping seed.")
            return
        
        print("Seeding demo data...")
        
        # Create bases (matching frontend mock data UUIDs)
        bases = [
            DroneBase(
                id='f47ac10b-58cc-4372-a567-0e02b2c3d479',
                name='San Francisco Base',
                lat=37.7749,
                lng=-122.4194
            ),
            DroneBase(
                id='6ba7b810-9dad-11d1-80b4-00c04fd430c8',
                name='Austin Base',
                lat=30.2672,
                lng=-97.7431
            ),
            DroneBase(
                id='6ba7b811-9dad-11d1-80b4-00c04fd430c8',
                name='New York Base',
                lat=40.7128,
                lng=-74.0060
            ),
        ]
        
        for base in bases:
            db.add(base)
        
        # Create drones (matching frontend mock data UUIDs)
        drones = [
            Drone(
                id='a1b2c3d4-1111-1111-1111-000000000001',
                name='Falcon-1',
                model='Perch drones V1',
                base_id='f47ac10b-58cc-4372-a567-0e02b2c3d479',
                status='active',
                user_id='demo-user-1',
                last_check_in=datetime.utcnow() - timedelta(minutes=3)
            ),
            Drone(
                id='a1b2c3d4-2222-2222-2222-000000000002',
                name='Eagle-2',
                model='Perch drones V1',
                base_id='f47ac10b-58cc-4372-a567-0e02b2c3d479',
                status='active',
                user_id='demo-user-1',
                last_check_in=datetime.utcnow() - timedelta(minutes=5)
            ),
            Drone(
                id='a1b2c3d4-3333-3333-3333-000000000003',
                name='Hawk-3',
                model='Perch drones V1',
                base_id='6ba7b810-9dad-11d1-80b4-00c04fd430c8',
                status='active',
                user_id='demo-user-2',
                last_check_in=datetime.utcnow() - timedelta(minutes=2)
            ),
            Drone(
                id='a1b2c3d4-4444-4444-4444-000000000004',
                name='Raven-4',
                model='Perch drones V1',
                base_id='6ba7b810-9dad-11d1-80b4-00c04fd430c8',
                status='active',
                user_id='demo-user-2',
                last_check_in=datetime.utcnow() - timedelta(minutes=1)
            ),
            Drone(
                id='a1b2c3d4-5555-5555-5555-000000000005',
                name='Phoenix-5',
                model='Perch drones V1',
                base_id='f47ac10b-58cc-4372-a567-0e02b2c3d479',
                status='patrolling',
                user_id='demo-user-1',
                last_check_in=datetime.utcnow() - timedelta(minutes=10)
            ),
            Drone(
                id='a1b2c3d4-6666-6666-6666-000000000006',
                name='Griffin-6',
                model='Perch drones V1',
                base_id='6ba7b811-9dad-11d1-80b4-00c04fd430c8',
                status='patrolling',
                user_id='demo-user-3',
                last_check_in=datetime.utcnow() - timedelta(minutes=15)
            ),
            Drone(
                id='a1b2c3d4-7777-7777-7777-000000000007',
                name='Sparrow-7',
                model='Perch drones V1',
                base_id='6ba7b811-9dad-11d1-80b4-00c04fd430c8',
                status='charging',
                user_id='demo-user-3',
                last_check_in=datetime.utcnow() - timedelta(minutes=8)
            ),
            Drone(
                id='a1b2c3d4-8888-8888-8888-000000000008',
                name='Swift-8',
                model='Perch drones V1',
                base_id='6ba7b810-9dad-11d1-80b4-00c04fd430c8',
                status='charging',
                user_id='demo-user-2',
                last_check_in=datetime.utcnow() - timedelta(minutes=12)
            ),
            Drone(
                id='a1b2c3d4-9999-9999-9999-000000000009',
                name='Dove-9',
                model='Perch drones V1',
                base_id='f47ac10b-58cc-4372-a567-0e02b2c3d479',
                status='not charging',
                user_id='demo-user-1',
                last_check_in=datetime.utcnow() - timedelta(hours=1)
            ),
            Drone(
                id='a1b2c3d4-aaaa-aaaa-aaaa-00000000000a',
                name='Crow-10',
                model='Perch drones V1',
                base_id='6ba7b811-9dad-11d1-80b4-00c04fd430c8',
                status='not charging',
                user_id='demo-user-3',
                last_check_in=datetime.utcnow() - timedelta(hours=1, minutes=30)
            ),
        ]
        
        for drone in drones:
            db.add(drone)
        
        # Create some schedules
        now = datetime.utcnow()
        schedules = [
            Schedule(
                id='11111111-1111-1111-1111-000000000001',
                drone_id='a1b2c3d4-1111-1111-1111-000000000001',
                start_time=now + timedelta(hours=2),
                end_time=now + timedelta(hours=3),
                path_json={
                    'coordinates': [
                        [-122.4194, 37.7749],
                        [-122.4094, 37.7849],
                        [-122.3994, 37.7749],
                        [-122.4094, 37.7649],
                        [-122.4194, 37.7749],
                    ]
                }
            ),
            Schedule(
                id='22222222-2222-2222-2222-000000000002',
                drone_id='a1b2c3d4-5555-5555-5555-000000000005',
                start_time=now + timedelta(hours=5),
                end_time=now + timedelta(hours=6),
                path_json={
                    'coordinates': [
                        [-122.4194, 37.7749],
                        [-122.4294, 37.7649],
                        [-122.4394, 37.7549],
                        [-122.4194, 37.7749],
                    ]
                }
            ),
        ]
        
        for schedule in schedules:
            db.add(schedule)
        
        db.commit()
        print("✅ Demo data seeded!")
        print(f"   - {len(bases)} bases")
        print(f"   - {len(drones)} drones")
        print(f"   - {len(schedules)} schedules")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error seeding data: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    print("=" * 50)
    print("🚀 Initializing Drone Demo Database")
    print("=" * 50)
    init_database()
    seed_data()
    print("=" * 50)
    print("✅ Done! Start the backend with: python app.py")
    print("=" * 50)

