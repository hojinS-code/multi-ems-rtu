from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Text, Index
from datetime import datetime
from db.session import Base

class Alarm(Base):
    __tablename__ = "alarms"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    device_id = Column(Integer, ForeignKey("devices.id", ondelete="CASCADE"), nullable=False)
    
    alarm_type = Column(String, nullable=False)
    severity = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    
    occurred_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    resolved_at = Column(DateTime, nullable=True)
    
    __table_args__ = (
        Index("ix_alarms_device_time", "device_id", "occurred_at"),
    )