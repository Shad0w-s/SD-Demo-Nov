from sqlalchemy import create_engine, Column, String, DateTime, ForeignKey, Text, Double, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import sessionmaker, relationship
import uuid
from datetime import datetime
import os

DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql://user:password@localhost/dronedb')

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
BaseModel = declarative_base()

class Drone(BaseModel):
    __tablename__ = 'drones'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(Text, nullable=False)
    model = Column(Text)
    user_id = Column(UUID(as_uuid=True), nullable=False)
    base_id = Column(UUID(as_uuid=True), ForeignKey('bases.id'))
    status = Column(Text, default='simulated')
    last_check_in = Column(DateTime(timezone=True))
    
    base = relationship("DroneBase", back_populates="drones")

class DroneBase(BaseModel):
    __tablename__ = 'bases'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(Text, nullable=False)
    lat = Column(Double)
    lng = Column(Double)
    
    drones = relationship("Drone", back_populates="base")

class Schedule(Base):
    __tablename__ = 'schedules'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    drone_id = Column(UUID(as_uuid=True), ForeignKey('drones.id', ondelete='CASCADE'))
    start_time = Column(DateTime(timezone=True))
    end_time = Column(DateTime(timezone=True))
    path_json = Column(JSON)

def init_db():
    """Initialize database tables"""
    BaseModel.metadata.create_all(bind=engine)

