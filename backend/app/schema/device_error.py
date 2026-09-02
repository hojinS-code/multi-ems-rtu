import uuid
from datetime import datetime
from pydantic import BaseModel, Field
from typing import Optional

ERROR_TYPE_PATTERN = "^(connection_failed|read_failed|unknown_device_type)$"

class DeviceErrorBase(BaseModel):
    device_id: uuid.UUID
    error_type: str = Field(..., pattern=ERROR_TYPE_PATTERN, description="정해진 에러 분류만 허용")
    message: str = Field(..., min_length=1)
    
class DeviceErrorCreate(DeviceErrorBase):
    pass

class DeviceErrorResponse(DeviceErrorBase):
    id: uuid.UUID
    occurred_at: datetime
    resolved_at: Optional[datetime] = None
    
    
    class Config:
        from_attributes = True
        
class DeviceErrorResolve(BaseModel):
    pass