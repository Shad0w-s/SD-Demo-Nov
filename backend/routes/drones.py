from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List
import uuid
import random
import math
from datetime import datetime

from dependencies import get_db
from auth import get_current_user
from models import Drone, DroneBase
from schemas import (
    DroneCreate, DroneUpdate, DroneResponse,
    SimulatePathRequest, SimulatePathResponse, TelemetryResponse,
    DroneActionRequest
)

router = APIRouter()

@router.get("/drones", response_model=List[DroneResponse])
def get_drones(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all drones (user sees own, admin sees all)"""
    user_id = current_user.get('sub')
    role = current_user.get('user_metadata', {}).get('role', 'user')
    
    if role == 'admin':
        drones = db.query(Drone).all()
    else:
        drones = db.query(Drone).filter(Drone.user_id == user_id).all()
    
    return drones

@router.get("/drones/{drone_id}", response_model=DroneResponse)
def get_drone(
    drone_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a single drone by ID"""
    try:
        drone_uuid = uuid.UUID(drone_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid drone ID format"
        )
    
    user_id = current_user.get('sub')
    role = current_user.get('user_metadata', {}).get('role', 'user')
    
    drone = db.query(Drone).filter(Drone.id == drone_uuid).first()
    
    if not drone:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Drone not found"
        )
    
    # Check authorization
    if role != 'admin' and str(drone.user_id) != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    return drone

@router.post("/drones", response_model=DroneResponse, status_code=status.HTTP_201_CREATED)
def create_drone(
    drone_data: DroneCreate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new drone"""
    try:
        # Validate base_id if provided
        base_id = None
        if drone_data.base_id:
            base = db.query(DroneBase).filter(DroneBase.id == drone_data.base_id).first()
            if not base:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Base not found"
                )
            base_id = drone_data.base_id
        
        drone = Drone(
            name=drone_data.name,
            model=drone_data.model,
            user_id=uuid.UUID(current_user.get('sub')),
            base_id=base_id,
            status=drone_data.status or 'simulated'
        )
        db.add(drone)
        db.commit()
        db.refresh(drone)
        return drone
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

@router.put("/drones/{drone_id}", response_model=DroneResponse)
def update_drone(
    drone_id: str,
    drone_data: DroneUpdate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a drone"""
    try:
        drone_uuid = uuid.UUID(drone_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid drone ID format"
        )
    
    user_id = current_user.get('sub')
    role = current_user.get('user_metadata', {}).get('role', 'user')
    
    drone = db.query(Drone).filter(Drone.id == drone_uuid).first()
    
    if not drone:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Drone not found"
        )
    
    # Check authorization
    if role != 'admin' and str(drone.user_id) != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    # Update fields
    if drone_data.name is not None:
        drone.name = drone_data.name
    if drone_data.model is not None:
        drone.model = drone_data.model
    if drone_data.status is not None:
        drone.status = drone_data.status
    if drone_data.base_id is not None:
        if drone_data.base_id:
            base = db.query(DroneBase).filter(DroneBase.id == drone_data.base_id).first()
            if not base:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Base not found"
                )
            drone.base_id = drone_data.base_id
        else:
            drone.base_id = None
    
    db.commit()
    db.refresh(drone)
    return drone

@router.delete("/drones/{drone_id}")
def delete_drone(
    drone_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a drone"""
    try:
        drone_uuid = uuid.UUID(drone_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid drone ID format"
        )
    
    user_id = current_user.get('sub')
    role = current_user.get('user_metadata', {}).get('role', 'user')
    
    drone = db.query(Drone).filter(Drone.id == drone_uuid).first()
    
    if not drone:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Drone not found"
        )
    
    # Check authorization
    if role != 'admin' and str(drone.user_id) != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    db.delete(drone)
    db.commit()
    return {"message": "Drone deleted successfully"}

@router.post("/drones/{drone_id}/simulate_path", response_model=SimulatePathResponse)
def simulate_path(
    drone_id: str,
    path_request: SimulatePathRequest,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Return mock drone path for simulation"""
    try:
        drone_uuid = uuid.UUID(drone_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid drone ID format"
        )
    
    drone = db.query(Drone).filter(Drone.id == drone_uuid).first()
    
    if not drone:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Drone not found"
        )
    
    # Check authorization
    user_id = current_user.get('sub')
    role = current_user.get('user_metadata', {}).get('role', 'user')
    if role != 'admin' and str(drone.user_id) != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    path_data = path_request.path or []
    
    # If no path provided, generate a default path
    if not path_data:
        base_lng, base_lat = -122.4, 37.79
        path_data = [
            [base_lng, base_lat],
            [base_lng + 0.01, base_lat],
            [base_lng + 0.01, base_lat + 0.01],
            [base_lng, base_lat + 0.01],
            [base_lng, base_lat]
        ]
    
    # Calculate distance and ETA
    total_distance = 0
    for i in range(len(path_data) - 1):
        lat1, lng1 = path_data[i][1], path_data[i][0]
        lat2, lng2 = path_data[i+1][1], path_data[i+1][0]
        # Haversine distance approximation
        distance = math.sqrt((lat2-lat1)**2 + (lng2-lng1)**2) * 111000  # meters
        total_distance += distance
    
    speed_mps = random.uniform(10, 15)  # 10-15 m/s
    eta_seconds = int(total_distance / speed_mps) if speed_mps > 0 else 0
    
    # Generate mock telemetry
    telemetry = TelemetryResponse(
        battery_level=float(random.randint(60, 100)),
        altitude_m=random.uniform(50, 150),
        heading_deg=random.uniform(0, 360),
        signal_strength=float(random.randint(70, 100))
    )
    
    return SimulatePathResponse(
        speed_mps=round(speed_mps, 2),
        eta_seconds=eta_seconds,
        distance_m=round(total_distance, 2),
        telemetry=telemetry
    )

@router.post("/drones/{drone_id}/action")
def drone_action(
    drone_id: str,
    action_request: DroneActionRequest,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Trigger simulated drone action"""
    try:
        drone_uuid = uuid.UUID(drone_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid drone ID format"
        )
    
    drone = db.query(Drone).filter(Drone.id == drone_uuid).first()
    
    if not drone:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Drone not found"
        )
    
    # Check authorization
    user_id = current_user.get('sub')
    role = current_user.get('user_metadata', {}).get('role', 'user')
    if role != 'admin' and str(drone.user_id) != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    action = action_request.action
    valid_actions = ['return_to_base', 'intercept', 'end_early', 'pause', 'resume']
    
    if action not in valid_actions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid action. Valid actions: {', '.join(valid_actions)}"
        )
    
    # Update drone status based on action
    if action == 'return_to_base':
        drone.status = 'returning'
    elif action == 'intercept':
        drone.status = 'intercepting'
    elif action == 'end_early':
        drone.status = 'completed'
    elif action == 'pause':
        drone.status = 'paused'
    elif action == 'resume':
        drone.status = 'active'
    
    drone.last_check_in = datetime.utcnow()
    db.commit()
    
    return {
        'status': 'success',
        'action': action,
        'drone_id': drone_id,
        'drone_status': drone.status,
        'message': f'Action {action} executed for drone {drone_id}'
    }
