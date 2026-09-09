import uuid
from sqlalchemy import Column, Float, DateTime, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
from db.session import Base

class SinglePhaseMeasurement(Base):
    __tablename__ = "single_phase_measurements"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    device_id = Column(UUID(as_uuid=True), ForeignKey("devices.id", ondelete="RESTRICT"), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    voltage = Column(Float)
    current = Column(Float)
    power_factor = Column(Float)
    active_power = Column(Float)
    reactive_power = Column(Float)
    total_energy = Column(Float)
    
    __table_args__ = (
        Index("ix_single_phase_device_time", "device_id", "timestamp"),
    )
    
class ThreePhaseMeasurement(Base):
    __tablename__ = "three_phase_measurements"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    device_id = Column(UUID(as_uuid=True), ForeignKey("devices.id", ondelete="RESTRICT"), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    voltage_l1 = Column(Float)
    voltage_l2 = Column(Float)
    voltage_l3 = Column(Float)
    current_l1 = Column(Float)
    current_l2 = Column(Float)
    current_l3 = Column(Float)
    
    power_factor = Column(Float)            #보통 3상 통합 역률 1개로 나옴(장비 스펙에 따라 상별로 나올 수도 있음)
    active_power = Column(Float)            #3상 합산 유효전력
    reactive_power = Column(Float)          #3상 합산 무효전력
    
    __table_args__ = (
        Index("ix_three_phase_time", "device_id", "timestamp"),
    )