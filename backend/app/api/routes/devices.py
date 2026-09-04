import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from db.session import get_db
from model.device import Device
from model.device_error import DeviceError
from schema.device import DeviceCreate, DeviceResponse

router = APIRouter(prefix="/devices", tags=["devices"])

def compute_status(device: Device, db: Session) -> str:
    if not device.is_active:
        return "정지"
    
    has_unresolved_error = (
        db.query(DeviceError)
        .filter(DeviceError.device_id == device.id, DeviceError.resolved_at.is_(None))
        .first()
        is not None
    )
    if has_unresolved_error:
        return "이상"
    
    return "정상"

@router.post("", response_model=DeviceResponse)
def create_device(device: DeviceCreate, db: Session = Depends(get_db)):
    db_device = Device(**device.model_dump())
    db.add(db_device)
    db.commit()
    db.refresh(db_device)
    return db_device

@router.get("", response_model=list[DeviceResponse])
def list_devices(db: Session = Depends(get_db)):
    return db.query(Device).all()

@router.get("/{device_id}", response_model=DeviceResponse)
def get_device(device_id: uuid.UUID, db: Session = Depends(get_db)):
    device = db.query(Device).filter(Device.id == device_id).first()
    if device is None:
        raise HTTPException(status_code=404, detail="장비를 찾을 수 없습니다")
    return device

@router.get("/{device_id}/status")
def get_device_status(device_id: uuid.UUID, db: Session = Depends(get_db)):
    device = db.query(Device).filter(Device.id == device_id).first()
    if device is None:
        raise HTTPException(status_code=404, detail="장비를 찾을 수 없습니다")
    
    return {
        "device_id": device.id,
        "is_active": device.is_active,
        "status": compute_status(device, db),
    }