import uuid
from pydantic import BaseModel, Field
from typing import Optional

class DeviceBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, description="장비 이름")
    device_type: str = Field(..., pattern="^(single_phase|three_phase)$",description="single_phase 또는 three_phase만 허용")
    protocol: str = Field(..., pattern="^(TCP|RTU)$", description="TCP 또는 RTU만 허용")
    
    serial_port: Optional[str] = Field(None, description="RTU 전용, 예: /dev/ttyUSB0")
    baudrate: Optional[int] = Field(None, description="RTU 전용, 예: 9600")
    host: Optional[str] = Field(None, description="TCP 전용, 예: 192.168.0.10")
    port: Optional[int] = Field(None, ge=1, le=65535, description="TCP 전용, IP 포트 범위")
    
    slave_id: int = Field(..., ge=1,le=247, description="Modbus 표준상 1-247 범위")
    
    
class DeviceCreate(DeviceBase):
    pass

class DeviceResponse(DeviceBase):
    id: uuid.UUID
    is_active: bool
    
    class Config:
        from_attributes = True