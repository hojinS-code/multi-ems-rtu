import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Index
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
from db.session import Base

class DeviceError(Base):
    __tablename__="device_errors"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    device_id = Column(UUID(as_uuid=True), ForeignKey("devices.id", ondelete="CASCADE"), nullable=False)
    
    error_type = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    
    occurred_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    resolved_at = Column(DateTime, nullable=True)
    
    __table_args__ = (
        Index("ix_device_errors_device_time", "device_id", "occurred_at"),
    )