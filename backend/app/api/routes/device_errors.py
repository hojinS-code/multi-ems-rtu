#에러 이력조회 API
import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from db.session import get_db
from model.device import Device
from model.device_error import DeviceError
from schema.device_error import DeviceErrorResponse

router = APIRouter(prefix="/device-errors", tags=["device_errors"])

@router.get("/{device_id}", response_model=list[DeviceErrorResponse])
def list_device_errors(
    device_id: uuid.UUID,
    unresolved_only: bool = False,
    db: Session = Depends(get_db),
):
    device = db.query(Device).filter(Device.id == device_id).first()
    if device is None:
        raise HTTPException(status_code=404, detail="장비를 찾을 수 없습니다")
    
    query = db.query(DeviceError).filter(DeviceError.device_id == device_id)
    
    if unresolved_only:
        query = query.filter(DeviceError.resolved_at.is_(None))
        
    return query.order_by(DeviceError.occurred_at.desc()).all()

@router.patch("/{error_id}/resolve", response_model=DeviceErrorResponse)
def resolve_device_error(error_id: uuid.UUID, db: Session = Depends(get_db)):
    error = db.query(DeviceError).filter(DeviceError.id == error_id).first()
    if error is None:
        raise HTTPException(status_code=404, detail="에러 기록을 찾을 수 없습니다")
    
    if error.resolved_at is not None:
        raise HTTPException(status_code= 400, detail="이미 해결 처리된 에러입니다")
    
    error.resolved_at = datetime.utcnow()
    db.commit()
    db.refresh(error)
    return error