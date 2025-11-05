from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List
import uuid

from dependencies import get_db
from auth import get_current_user
from models import DroneBase, Drone
from schemas import BaseCreate, BaseUpdate, BaseResponse

router = APIRouter()

@router.get("/bases", response_model=List[BaseResponse])
def get_bases(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all bases"""
    bases = db.query(DroneBase).all()
    return bases

@router.get("/bases/{base_id}", response_model=BaseResponse)
def get_base(
    base_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a single base by ID"""
    try:
        base_uuid = uuid.UUID(base_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid base ID format"
        )
    
    base = db.query(DroneBase).filter(DroneBase.id == base_uuid).first()
    
    if not base:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Base not found"
        )
    
    return base

@router.post("/bases", response_model=BaseResponse, status_code=status.HTTP_201_CREATED)
def create_base(
    base_data: BaseCreate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new base"""
    try:
        base = DroneBase(
            name=base_data.name,
            lat=base_data.lat,
            lng=base_data.lng
        )
        db.add(base)
        db.commit()
        db.refresh(base)
        return base
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

@router.put("/bases/{base_id}", response_model=BaseResponse)
def update_base(
    base_id: str,
    base_data: BaseUpdate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a base"""
    try:
        base_uuid = uuid.UUID(base_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid base ID format"
        )
    
    base = db.query(DroneBase).filter(DroneBase.id == base_uuid).first()
    
    if not base:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Base not found"
        )
    
    # Update fields
    if base_data.name is not None:
        base.name = base_data.name
    
    if base_data.lat is not None or base_data.lng is not None:
        lat = base_data.lat if base_data.lat is not None else base.lat
        lng = base_data.lng if base_data.lng is not None else base.lng
        
        base.lat = lat
        base.lng = lng
    
    db.commit()
    db.refresh(base)
    return base

@router.delete("/bases/{base_id}")
def delete_base(
    base_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a base"""
    try:
        base_uuid = uuid.UUID(base_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid base ID format"
        )
    
    base = db.query(DroneBase).filter(DroneBase.id == base_uuid).first()
    
    if not base:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Base not found"
        )
    
    # Check if base has drones assigned
    drone_count = db.query(Drone).filter(Drone.base_id == base_uuid).count()
    if drone_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete base: {drone_count} drone(s) are assigned to it"
        )
    
    db.delete(base)
    db.commit()
    return {"message": "Base deleted successfully"}
