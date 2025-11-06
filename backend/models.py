from sqlalchemy import create_engine, Column, DateTime, ForeignKey, Text, Double, JSON, Index, String
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
import uuid
from datetime import datetime
import os

# Use SQLite for demo (no server required)
# To use PostgreSQL, set DATABASE_URL env var: postgresql://user:password@localhost/dronedb
DATABASE_URL = os.getenv('DATABASE_URL', 'sqlite:///./drone_demo.db')

# SQLite doesn't support pool_pre_ping, add check_same_thread=False for SQLite
if DATABASE_URL.startswith('sqlite'):
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
BaseModel = declarative_base()

class Drone(BaseModel):
    __tablename__ = 'drones'
    
    # Use String for UUIDs to support both SQLite and PostgreSQL
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(Text, nullable=False)
    model = Column(Text)
    user_id = Column(String(36), nullable=False, index=True)
    base_id = Column(String(36), ForeignKey('bases.id', ondelete='SET NULL'))
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
    
    # Use String for UUIDs to support both SQLite and PostgreSQL
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
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
    
    # Use String for UUIDs to support both SQLite and PostgreSQL
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    drone_id = Column(String(36), ForeignKey('drones.id', ondelete='CASCADE'), nullable=False, index=True)
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

