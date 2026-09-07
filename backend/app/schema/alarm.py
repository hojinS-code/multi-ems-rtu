import uuid
from datetime import datetime
from pydantic import BaseModel, Field
from typing import Optional

ALARM_TYPE_PATTERN = "^(over_voltage|under_voltage|onver_current|over_power|phase_imbalance)$"
SEVERITY_PATTERN = "^(waring|critical)$"

class AlarmResponse(BaseModel):
    id: uuid.UUID
    device_id: uuid.UUID
    alarm_type: str = Field(..., pattern=ALARM_TYPE_PATTERN)
    severity: str = Field(..., pattern=SEVERITY_PATTERN)
    message: str
    occurred_at: datetime
    resolved_at: Optional[datetime] = None 
    