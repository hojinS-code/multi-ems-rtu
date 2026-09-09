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
    total_energy: Optional[float] = Field(None, ge=0)
    
class SinglePhaseMeasurementCreate(SinglePhaseMeasurementBase):
    pass

class SinglePhaseMeasurementResponse(SinglePhaseMeasurementBase):
    id: uuid.UUID
    
    class Config:
        from_attributes = True
        
class ThreePhaseMeasurementBase(BaseModel):
    device_id: uuid.UUID
    timestamp: datetime
    
    voltage_l1: Optional[float] = Field(None, ge=0)
    voltage_l2: Optional[float] = Field(None, ge=0)
    voltage_l3: Optional[float] = Field(None, ge=0)
    current_l1: Optional[float] = Field(None, ge=0)
    current_l2: Optional[float] = Field(None, ge=0)
    current_l3: Optional[float] = Field(None, ge=0)
    
    power_factor: Optional[float] = Field(None, ge=-1, le=1)
    active_power: Optional[float] = None
    reactive_power: Optional[float] = None
    
class ThreePhaseMeasurementCreate(ThreePhaseMeasurementBase):
    pass

class ThreePhaseMeasurementResponse(ThreePhaseMeasurementBase):
    id: uuid.UUID
    
    class Config:
        from_attributes = True
        
class EnvironmentMeasurementBase(BaseModel):
    device_id: uuid.UUID
    timestamp: datetime
    
    temperature: Optional[float] = None
    humidity: Optional[float] = Field(None, ge=0, le=100)
    illuminance: Optional[float] = Field(None,ge=0)
    
class EnvironmentMeasurementCreate(EnvironmentMeasurementBase):
    pass

class EnvironmentMeasurementResponse(EnvironmentMeasurementBase):
    id: uuid.UUID
    
    class Config:
        from_attributes = True