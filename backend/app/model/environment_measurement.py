from sqlalchemy import Column, Integer, Float, DateTime, ForeignKey, Index
from datetime import datetime
from db.session import Base

class EnvironmentMeasurement(Base):
    __tablename__="environment_measurements"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    device_id = Column(Integer, ForeignKey("devices.id", ondelete="RESTRICT"), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    temperature = Column(Float)
    humidity = Column(Float)
    illuminance = Column(Float)
    
    __table_args__=(
        Index("ix_environment_device_time", "device_id", "timestamp"),
    )