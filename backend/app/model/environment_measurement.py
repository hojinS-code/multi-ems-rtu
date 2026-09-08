import uuid
from sqlalchemy import Column, Float, DateTime, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
from db.session import Base

class EnvironmentMeasurement(Base):
    __tablename__="environment_measurements"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    device_id = Column(UUID(as_uuid=True), ForeignKey("devices.id", ondelete="RESTRICT"), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    temperature = Column(Float)
    humidity = Column(Float)
    illuminance = Column(Float)
    
    __table_args__=(
        Index("ix_environment_device_time", "device_id", "timestamp"),
    )