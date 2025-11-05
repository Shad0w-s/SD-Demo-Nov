from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
import os
import requests
from typing import List, Dict

from dependencies import get_db
from auth import get_current_user, require_auth
from models import Drone, DroneBase, Schedule
from schemas import UserResponse, UpdateRoleRequest, StatsResponse

router = APIRouter()

SUPABASE_URL = os.getenv('SUPABASE_PROJECT_URL', '')
SUPABASE_SERVICE_ROLE = os.getenv('SUPABASE_SERVICE_ROLE', '')

@router.get("/admin/users", response_model=Dict[str, List[UserResponse]])
def get_users(
    current_user: dict = Depends(require_auth(roles=['admin']))
):
    """Get all users (admin only)"""
    try:
        if not SUPABASE_SERVICE_ROLE:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Supabase service role not configured"
            )
        
        # Fetch users from Supabase Admin API
        headers = {
            'apikey': SUPABASE_SERVICE_ROLE,
            'Authorization': f'Bearer {SUPABASE_SERVICE_ROLE}'
        }
        
        response = requests.get(
            f'{SUPABASE_URL}/auth/v1/admin/users',
            headers=headers,
            timeout=10
        )
        
        if response.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to fetch users from Supabase"
            )
        
        users_data = response.json()
        
        # Format user data
        users = []
        for user in users_data.get('users', []):
            users.append(UserResponse(
                id=user.get('id'),
                email=user.get('email'),
                role=user.get('user_metadata', {}).get('role', 'user'),
                created_at=user.get('created_at')
            ))
        
        return {'users': users}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.put("/admin/users/{user_id}/role")
def update_user_role(
    user_id: str,
    role_data: UpdateRoleRequest,
    current_user: dict = Depends(require_auth(roles=['admin']))
):
    """Update user role (admin only)"""
    try:
        if not SUPABASE_SERVICE_ROLE:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Supabase service role not configured"
            )
        
        role = role_data.role
        if role not in ['admin', 'user']:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid role. Must be 'admin' or 'user'"
            )
        
        # Update user metadata in Supabase
        headers = {
            'apikey': SUPABASE_SERVICE_ROLE,
            'Authorization': f'Bearer {SUPABASE_SERVICE_ROLE}',
            'Content-Type': 'application/json'
        }
        
        payload = {
            'user_metadata': {'role': role}
        }
        
        response = requests.put(
            f'{SUPABASE_URL}/auth/v1/admin/users/{user_id}',
            headers=headers,
            json=payload,
            timeout=10
        )
        
        if response.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update user role"
            )
        
        return {
            'message': 'User role updated successfully',
            'user_id': user_id,
            'role': role
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/admin/stats", response_model=StatsResponse)
def get_stats(
    current_user: dict = Depends(require_auth(roles=['admin'])),
    db: Session = Depends(get_db)
):
    """Get system statistics (admin only)"""
    try:
        # Count drones by status
        status_counts = db.query(
            Drone.status,
            func.count(Drone.id)
        ).group_by(Drone.status).all()
        
        drones_by_status = {status: count for status, count in status_counts}
        
        return StatsResponse(
            total_drones=db.query(Drone).count(),
            total_bases=db.query(DroneBase).count(),
            total_schedules=db.query(Schedule).count(),
            drones_by_status=drones_by_status
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
