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
        # Get schedules for user's drones
        schedules = db.query(Schedule).join(Drone).filter(
            Drone.user_id == uuid.UUID(user_id)
        ).all()
    
    return schedules

@router.get("/schedules/{schedule_id}", response_model=ScheduleResponse)
def get_schedule(
    schedule_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a single schedule by ID"""
    try:
        schedule_uuid = uuid.UUID(schedule_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid schedule ID format"
        )
    
    user_id = current_user.get('sub')
    role = current_user.get('user_metadata', {}).get('role', 'user')
    
    schedule = db.query(Schedule).filter(Schedule.id == schedule_uuid).first()
    
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
    try:
        # Check authorization
        user_id = current_user.get('sub')
        role = current_user.get('user_metadata', {}).get('role', 'user')
        drone = db.query(Drone).filter(Drone.id == schedule_data.drone_id).first()
        
        if not drone:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Drone not found"
            )
        
        if role != 'admin' and str(drone.user_id) != user_id:
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
        return schedule
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Database integrity error"
        )
    except Exception as e:
        db.rollback()
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
    try:
        schedule_uuid = uuid.UUID(schedule_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid schedule ID format"
        )
    
    user_id = current_user.get('sub')
    role = current_user.get('user_metadata', {}).get('role', 'user')
    
    schedule = db.query(Schedule).filter(Schedule.id == schedule_uuid).first()
    
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
    try:
        schedule_uuid = uuid.UUID(schedule_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid schedule ID format"
        )
    
    user_id = current_user.get('sub')
    role = current_user.get('user_metadata', {}).get('role', 'user')
    
    schedule = db.query(Schedule).filter(Schedule.id == schedule_uuid).first()
    
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
