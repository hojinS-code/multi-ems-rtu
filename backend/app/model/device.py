import uuid
from sqlalchemy import Column, String, Boolean, Integer, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID
from db.session import Base

class Device(Base):
    __tablename__ = "devices"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    device_type = Column(String, nullable=False)            #"single_phase" or "three_phase"
    protocol = Column(String, nullable=False)               #"TCU" or "RTU"
    
    serial_port = Column(String, nullable=True)             #RTU용
    baudrate = Column(Integer, nullable=True)               #RTU용
    host = Column(String, nullable=True)                    #TCP용
    port = Column(Integer, nullable=True)                   #TCP용
    
    slave_id = Column(Integer, nullable=False)
    is_active = Column(Boolean, default=True)
    
    __table_args__ = (
        CheckConstraint("device_type IN ('single_phase', 'three_phase')",name="ck_device_type"),
        CheckConstraint("protocol IN ('TCP', 'RTU')", name="ck_protocol"),
        CheckConstraint("slave_id BETWEEN 1 AND 247", name="ck_slave_id_range"),
    )