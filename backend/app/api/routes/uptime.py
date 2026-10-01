from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from db.session import get_db
from model.device import Device
from model.measurement import SinglePhaseMeasurement, ThreePhaseMeasurement
from model.environment_measurement import EnvironmentMeasurement

router = APIRouter(prefix="/uptime", tags=["uptime"])

GAP_THRESHOLD = timedelta(minutes=5)

@router.get("/{device_id}")
def get_uptime(
    device_id: int,
    start: str = Query(..., description="YYYY-MM-DD, 조회 시작일"),
    end: str = Query(..., description="YYYY-MM-DD, 조회 종료일 (포함)"),
    db: Session = Depends(get_db),
):
    device = db.query(Device).filter(Device.id == device_id).first()
    if device is None:
        raise HTTPException(status_code=404, detail="장비를 찾을 수 없습니다")
    
    try:
        start_dt = datetime.strptime(start, "%Y-%m-%d")
        end_dt = datetime.strptime(end, "%Y-%m-%d") + timedelta(days=1)
    except ValueError:
        raise HTTPException(status_code=400, detail="start/end는 YYYY-MM-DD 형식이어야 합니다")
    
    if device.device_type == "single_phase":
        model = SinglePhaseMeasurement
    elif device.device_type == "three_phase":
        model = ThreePhaseMeasurement
    elif device.device_type == "environment":
        model = EnvironmentMeasurement
    else:
        raise HTTPException(status_code=500, detail="알 수 없는 device_type입니다")
    
    timestamps =(
        db.query(model.timestamp)
        .filter(model.device_id == device_id, model.timestamp >= start_dt, model.timestamp < end_dt)
        .order_by(model.timestamp.asc())
        .all()
    )
    timestamps = [t[0] for t in timestamps]
    
    if not timestamps:
        return {"segments": []}
    
    segments = []
    segments_start = timestamps[0]
    prev = timestamps[0]
    
    for ts in timestamps[1:]:
        if ts - prev > GAP_THRESHOLD:
            segments.append({
                "status": "up",
                "start": segments_start.isoformat(),
                "end": prev.isoformat(),
            })
            segments.append({
                "status": "down",
                "start": prev.isoformat(),
                "end": ts.isoformat(),
            })
            segments_start = ts
        prev = ts
        
    segments.append({
        "status": "up",
        "start": segments_start.isoformat(),
        "end": prev.isoformat(),
    })
    
    return {"segments": segments}