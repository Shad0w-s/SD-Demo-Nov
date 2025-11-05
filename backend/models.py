from sqlalchemy import create_engine, Column, DateTime, ForeignKey, Text, Double, JSON, Index
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import sessionmaker, relationship
import uuid
from datetime import datetime
import os

DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql://user:password@localhost/dronedb')

engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
BaseModel = declarative_base()

class Drone(BaseModel):
    __tablename__ = 'drones'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(Text, nullable=False)
    model = Column(Text)
    user_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    base_id = Column(UUID(as_uuid=True), ForeignKey('bases.id', ondelete='SET NULL'))
    status = Column(Text, default='simulated', index=True)
    last_check_in = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    
    base = relationship("DroneBase", back_populates="drones")
    schedules = relationship("Schedule", back_populates="drone", cascade="all, delete-orphan")

    __table_args__ = (
        Index('idx_drone_user_id', 'user_id'),
        Index('idx_drone_status', 'status'),
    )

class DroneBase(BaseModel):
    __tablename__ = 'bases'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(Text, nullable=False)
    lat = Column(Double, nullable=False)
    lng = Column(Double, nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    
    drones = relationship("Drone", back_populates="base")

    __table_args__ = (
        Index('idx_base_location', 'lat', 'lng'),
    )

class Schedule(BaseModel):
    __tablename__ = 'schedules'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    drone_id = Column(UUID(as_uuid=True), ForeignKey('drones.id', ondelete='CASCADE'), nullable=False, index=True)
    start_time = Column(DateTime(timezone=True), nullable=False)
    end_time = Column(DateTime(timezone=True))
    path_json = Column(JSON)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    
    drone = relationship("Drone", back_populates="schedules")

    __table_args__ = (
        Index('idx_schedule_drone_id', 'drone_id'),
        Index('idx_schedule_start_time', 'start_time'),
    )

def init_db():
    """Initialize database tables"""
    BaseModel.metadata.create_all(bind=engine)

