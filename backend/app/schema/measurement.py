import uuid
from datetime import datetime
from pydantic import BaseModel, Field
from typing import Optional

class SinglePhaseMeasurementBase(BaseModel):
    device_id: uuid.UUID
    timestamp: datetime
    
    voltage: Optional[float] = Field(None, ge=0)
    current: Optional[float] = Field(None, ge=0)
    power_factor: Optional[float] = Field(None, ge=-1, le=1)
    active_power: Optional[float] = None
    reactive_power: Optional[float] = None
    
class SinglePhaseMeasurementCreate(SinglePhaseMeasurementBase):
    pass

class SinglePhaseMeasurementResponse(SinglePhaseMeasurementBase):
    id: uuid.UUID
    
    class Config:
        from_attributes = True
        
class ThreePhaseMeasurementBase(BaseModel):
    device_id: uuid.UUID
    timestamp: datetime
    
    voltage_r: Optional[float] = Field(None, ge=0)
    voltage_s: Optional[float] = Field(None, ge=0)
    voltage_t: Optional[float] = Field(None, ge=0)
    current_r: Optional[float] = Field(None, ge=0)
    current_s: Optional[float] = Field(None, ge=0)
    current_t: Optional[float] = Field(None, ge=0)
    
    power_factor: Optional[float] = Field(None, ge=-1, le=1)
    active_power: Optional[float] = None
    reactive_power: Optional[float] = None
    
class ThreePhaseMeasurementCreate(ThreePhaseMeasurementBase):
    pass

class ThreePhaseMeasurementResponse(ThreePhaseMeasurementBase):
    id: uuid.UUID
    
    class Config:
        from_attributes = True