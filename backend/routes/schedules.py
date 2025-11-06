from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List
import uuid

from dependencies import get_db
from auth import get_current_user
from models import Schedule, Drone
from schemas import ScheduleCreate, ScheduleUpdate, ScheduleResponse

router = APIRouter()

@router.get("/schedules", response_model=List[ScheduleResponse])
def get_schedules(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all schedules (user sees own, admin sees all)"""
    user_id = current_user.get('sub')
    role = current_user.get('user_metadata', {}).get('role', 'user')
    
    if role == 'admin':
        schedules = db.query(Schedule).all()
    else:
        # Get schedules for user's drones (user_id is now a string)
        schedules = db.query(Schedule).join(Drone).filter(
            Drone.user_id == user_id
        ).all()
    
    return schedules

@router.get("/schedules/{schedule_id}", response_model=ScheduleResponse)
def get_schedule(
    schedule_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a single schedule by ID"""
    user_id = current_user.get('sub')
    role = current_user.get('user_metadata', {}).get('role', 'user')
    
    # IDs are now strings, no UUID parsing needed
    schedule = db.query(Schedule).filter(Schedule.id == schedule_id).first()
    
    if not schedule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Schedule not found"
        )
    
    # Check authorization
    drone = db.query(Drone).filter(Drone.id == schedule.drone_id).first()
    if role != 'admin' and str(drone.user_id) != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    return schedule

@router.post("/schedules", response_model=ScheduleResponse, status_code=status.HTTP_201_CREATED)
def create_schedule(
    schedule_data: ScheduleCreate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new schedule"""
    print("[SCHEDULES] Received schedule creation request")
    print(f"[SCHEDULES] Drone ID: {schedule_data.drone_id}")
    print(f"[SCHEDULES] Start Time: {schedule_data.start_time}")
    print(f"[SCHEDULES] End Time: {schedule_data.end_time}")
    print(f"[SCHEDULES] Path JSON: {schedule_data.path_json}")
    
    try:
        # Check authorization
        user_id = current_user.get('sub')
        role = current_user.get('user_metadata', {}).get('role', 'user')
        
        print(f"[SCHEDULES] User ID from token: {user_id}")
        print(f"[SCHEDULES] User role: {role}")
        
        drone = db.query(Drone).filter(Drone.id == schedule_data.drone_id).first()
        
        if not drone:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Drone not found"
            )
        
        print(f"[SCHEDULES] Drone user_id: {drone.user_id}")
        print(f"[SCHEDULES] Comparing: str('{drone.user_id}') != '{user_id}'")
        
        # In development mode (no Supabase configured), allow all users to access any drone
        import os
        is_dev_mode = not os.getenv('SUPABASE_JWT_SECRET', '')
        
        if is_dev_mode:
            print(f"[SCHEDULES] Development mode - skipping ownership check")
        elif role != 'admin' and str(drone.user_id) != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
        
        schedule = Schedule(
            drone_id=schedule_data.drone_id,
            start_time=schedule_data.start_time,
            end_time=schedule_data.end_time,
            path_json=schedule_data.path_json
        )
        db.add(schedule)
        db.commit()
        db.refresh(schedule)
        
        # Log schedule creation to terminal
        print("=" * 50)
        print("=== Schedule Created ===")
        print(f"Schedule ID: {schedule.id}")
        print(f"Drone ID: {schedule.drone_id}")
        print(f"Drone Name: {drone.name}")
        print(f"Start Time: {schedule.start_time}")
        print(f"End Time: {schedule.end_time}")
        
        # Calculate duration
        if schedule.start_time and schedule.end_time:
            duration_seconds = (schedule.end_time - schedule.start_time).total_seconds()
            duration_minutes = int(duration_seconds / 60)
            print(f"Duration: {duration_minutes} minutes")
        
        # Log base information if available
        if drone.base_id:
            from models import DroneBase
            base = db.query(DroneBase).filter(DroneBase.id == drone.base_id).first()
            if base:
                print(f"Base: {base.name} (ID: {base.id})")
                print(f"Base Location: Latitude={base.lat}, Longitude={base.lng}")
        
        # Log waypoints
        if schedule.path_json and 'coordinates' in schedule.path_json:
            waypoints = schedule.path_json['coordinates']
            print(f"Waypoints: {len(waypoints)}")
            for i, wp in enumerate(waypoints, 1):
                if isinstance(wp, (list, tuple)) and len(wp) >= 2:
                    print(f"  Waypoint {i}: Longitude={wp[0]}, Latitude={wp[1]}")
                else:
                    print(f"  Waypoint {i}: {wp}")
        else:
            print("Waypoints: Using default patrol route")
        
        print("=" * 50)
        
        return schedule
    except IntegrityError as e:
        db.rollback()
        print(f"[SCHEDULES] ❌ Database integrity error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Database integrity error"
        )
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        db.rollback()
        print(f"[SCHEDULES] ❌ Unexpected error: {str(e)}")
        print(f"[SCHEDULES] Error type: {type(e).__name__}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.put("/schedules/{schedule_id}", response_model=ScheduleResponse)
def update_schedule(
    schedule_id: str,
    schedule_data: ScheduleUpdate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a schedule"""
    user_id = current_user.get('sub')
    role = current_user.get('user_metadata', {}).get('role', 'user')
    
    # IDs are now strings, no UUID parsing needed
    schedule = db.query(Schedule).filter(Schedule.id == schedule_id).first()
    
    if not schedule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Schedule not found"
        )
    
    # Check authorization
    drone = db.query(Drone).filter(Drone.id == schedule.drone_id).first()
    if role != 'admin' and str(drone.user_id) != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    # Update fields
    if schedule_data.start_time is not None:
        schedule.start_time = schedule_data.start_time
    
    if schedule_data.end_time is not None:
        schedule.end_time = schedule_data.end_time
    
    if schedule_data.path_json is not None:
        schedule.path_json = schedule_data.path_json
    
    db.commit()
    db.refresh(schedule)
    return schedule

@router.delete("/schedules/{schedule_id}")
def delete_schedule(
    schedule_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a schedule"""
    user_id = current_user.get('sub')
    role = current_user.get('user_metadata', {}).get('role', 'user')
    
    # IDs are now strings, no UUID parsing needed
    schedule = db.query(Schedule).filter(Schedule.id == schedule_id).first()
    
    if not schedule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Schedule not found"
        )
    
    # Check authorization
    drone = db.query(Drone).filter(Drone.id == schedule.drone_id).first()
    if role != 'admin' and str(drone.user_id) != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    db.delete(schedule)
    db.commit()
    return {"message": "Schedule deleted successfully"}
