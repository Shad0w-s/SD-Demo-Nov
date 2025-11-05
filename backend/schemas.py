"""
Pydantic schemas for request/response validation
"""
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime
from uuid import UUID

# Drone Schemas
class DroneBase(BaseModel):
    name: str
    model: Optional[str] = None
    base_id: Optional[UUID] = None
    status: Optional[str] = "simulated"

class DroneCreate(DroneBase):
    pass

class DroneUpdate(BaseModel):
    name: Optional[str] = None
    model: Optional[str] = None
    status: Optional[str] = None
    base_id: Optional[UUID] = None

class DroneResponse(DroneBase):
    id: UUID
    user_id: UUID
    last_check_in: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)

# Base Schemas
class BaseBase(BaseModel):
    name: str
    lat: float = Field(..., ge=-90, le=90, description="Latitude")
    lng: float = Field(..., ge=-180, le=180, description="Longitude")

class BaseCreate(BaseBase):
    pass

class BaseUpdate(BaseModel):
    name: Optional[str] = None
    lat: Optional[float] = Field(None, ge=-90, le=90)
    lng: Optional[float] = Field(None, ge=-180, le=180)

class BaseResponse(BaseBase):
    id: UUID
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)

# Schedule Schemas
class ScheduleBase(BaseModel):
    drone_id: UUID
    start_time: datetime
    end_time: Optional[datetime] = None
    path_json: Optional[Dict[str, Any]] = None

class ScheduleCreate(ScheduleBase):
    pass

class ScheduleUpdate(BaseModel):
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    path_json: Optional[Dict[str, Any]] = None

class ScheduleResponse(ScheduleBase):
    id: UUID
    created_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)

# Simulation Schemas
class SimulatePathRequest(BaseModel):
    path: Optional[List[List[float]]] = None

class TelemetryResponse(BaseModel):
    battery_level: float
    altitude_m: float
    heading_deg: float
    signal_strength: float

class SimulatePathResponse(BaseModel):
    speed_mps: float
    eta_seconds: float
    distance_m: float
    telemetry: TelemetryResponse

class DroneActionRequest(BaseModel):
    action: str = Field(..., description="Action: return_to_base, intercept, end_early, pause, resume")

# Admin Schemas
class UserResponse(BaseModel):
    id: UUID
    email: str
    role: str
    created_at: Optional[datetime] = None

class UpdateRoleRequest(BaseModel):
    role: str = Field(..., description="Role: admin or user")

class StatsResponse(BaseModel):
    total_drones: int
    total_bases: int
    total_schedules: int
    drones_by_status: Dict[str, int]

