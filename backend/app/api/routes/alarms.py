import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from db.session import get_db
from model.device import Device
from model.alarm import Alarm
from schema.alarm import AlarmResponse

router = APIRouter(prefix="/alarms", tags=["alarms"])

@router.get("/{device_id}", response_model=list[AlarmResponse])
def list_alarms(
    device_id: uuid.UUID,
    unresolved_only: bool = False,
    db: Session = Depends(get_db),
):
    device = db.query(Device).filter(Device.id == device_id).first()
    if device is None:
        raise HTTPException(status_code=404, detail="device not found")
    
    query = db.query(Alarm).filter(Alarm.device_id == device_id)
    
    if unresolved_only:
        query = query.filter(Alarm.resolved_at.is_(None))
        
    return query.order_by(Alarm.occurred_at.desc()).all()
        
@router.patch("/{alarm_id}/resolve", response_model=AlarmResponse)
def resolve_alarm(alarm_id: uuid.UUID, db: Session = Depends(get_db)):
    alarm = db.query(Alarm).filter(Alarm.id == alarm_id).first()
    if alarm is None:
        raise HTTPException(status_code=404, detail="alarm not found")
    
    if alarm.resolved_at is not None:
        raise HTTPException(status_code=400, detail="already resolved")
    
    alarm.resolved_at = datetime.utcnow()
    db.commit()
    db.refresh(alarm)
    return alarm