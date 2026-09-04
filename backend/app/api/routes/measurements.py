import uuid
from datetime import datetime, timedelta
from collections import defaultdict
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, literal_column


from db.session import get_db
from model.device import Device
from model.measurement import SinglePhaseMeasurement, ThreePhaseMeasurement
from schema.measurement import SinglePhaseMeasurementResponse, ThreePhaseMeasurementResponse

router = APIRouter(prefix="/measurements", tags=["measurements"])

VALID_METRICS = {"voltage", "current", "power_factor", "active_power", "reactive_power" }
VALID_GRANULARITIES = {'day', "hour", "minute" }

#실시간 측정값 조회 API
@router.get("/realtime/{device_id}")
def get_realtime_measurements(
    device_id: uuid.UUID,
    metric: str = Query(..., description="voltage, current, power_factor, active_power, reactive_power 중 하나"),
    minutes: int = Query(30, ge=1, le=1440, description="최근 몇 분간 데이터를 가져올지"),
    db: Session = Depends(get_db),
):
    device = db.query(Device).filter(Device.id == device_id).first()
    if device is None:
        raise HTTPException(status_code=404, detail="장비를 찾을 수 없습니다")
    
    if metric not in VALID_METRICS:
        raise HTTPException(status_code=400, detail=f"지원하지 않는 metric입니다: {metric}")
    
    since = datetime.utcnow() - timedelta(minutes=minutes)
    
    if device.device_type == "single_phase":
        model = SinglePhaseMeasurement
        response_schema = SinglePhaseMeasurementResponse
    elif device.device_type == "three_phase":
        model = ThreePhaseMeasurement
        response_schema = ThreePhaseMeasurementResponse
    else:
        raise HTTPException(status_code=500, detail="알 수 없는 device_type입니다")
    
    records = (
        db.query(model)
        .filter(model.device_id == device_id, model.timestamp >= since)
        .order_by(model.timestamp.asc())
        .all()
    )
    
    return [response_schema.model_validate(r) for r in records]

#월별 조회 API추가
@router.get("/monthly/{device_id}")
def get_monthly_measurements(
    device_id: uuid.UUID,
    metric: str = Query(..., description="voltage, current, power_factor, active_power, reactive_power 중 하나"),
    year: int = Query(..., ge=2000, le=2100),
    month: int = Query(..., ge=1, le=12),
    granularity: str = Query("day", description="'day', 'hour', 'minute' 중 하나"),
    db: Session = Depends(get_db),
):
    device = db.query(Device).filter(Device.id == device_id).first()
    if device is None:
        raise HTTPException(status_code=404, detail="장비를 찾을 수 없습니다")

    if metric not in VALID_METRICS:
        raise HTTPException(status_code=400, detail=f"지원하지 않는 metric입니다: {metric}")
    
    if granularity not in VALID_GRANULARITIES:
        raise HTTPException(status_code=400, detail=f"지원하지 않는 granularity입니다: {granularity}")

    start = datetime(year, month, 1)
    end = datetime(year + 1, 1, 1) if month == 12 else datetime(year, month + 1, 1)
    
    granularity_literal = literal_column(f"'{granularity}'")

    if device.device_type == "single_phase":
        model = SinglePhaseMeasurement
        metric_column = getattr(model, metric)
        bucket = func.date_trunc(granularity_literal, model.timestamp).label("bucket")

        results = (
            db.query(bucket, func.avg(metric_column).label("avg_value"))
            .filter(model.device_id == device_id, model.timestamp >= start, model.timestamp < end)
            .group_by(bucket)
            .order_by(bucket.asc())
            .all()
        )

        return [
            {"date": r.bucket.isoformat(), "value": round(r.avg_value, 2) if r.avg_value is not None else None}
            for r in results
        ]

    elif device.device_type == "three_phase":
        model = ThreePhaseMeasurement
        bucket = func.date_trunc(granularity_literal, model.timestamp).label("bucket")

        if metric in ("voltage", "current"):
            col_r = getattr(model, f"{metric}_r")
            col_s = getattr(model, f"{metric}_s")
            col_t = getattr(model, f"{metric}_t")

            results = (
                db.query(
                    bucket,
                    func.avg(col_r).label("r"),
                    func.avg(col_s).label("s"),
                    func.avg(col_t).label("t"),
                )
                .filter(model.device_id == device_id, model.timestamp >= start, model.timestamp < end)
                .group_by(bucket)
                .order_by(bucket.asc())
                .all()
            )

            return [
                {
                    "date": r.bucket.isoformat(),
                    "r": round(r.r, 2) if r.r is not None else None,
                    "s": round(r.s, 2) if r.s is not None else None,
                    "t": round(r.t, 2) if r.t is not None else None,
                }
                for r in results
            ]
        else:
            metric_column = getattr(model, metric)
            results = (
                db.query(bucket, func.avg(metric_column).label("avg_value"))
                .filter(model.device_id == device_id, model.timestamp >= start, model.timestamp < end)
                .group_by(bucket)
                .order_by(bucket.asc())
                .all()
            )
            return [
                {"date": r.bucket.isoformat(), "value": round(r.avg_value, 2) if r.avg_value is not None else None}
                for r in results
            ]
    else:
        raise HTTPException(status_code=500, detail="알 수 없는 device_type입니다")


#15min-peak 전력량 API 
@router.get("/peak-15min/{device_id}")
def get_peak_15min(
    device_id: uuid.UUID,
    date: str = Query(..., description="YYYY-MM-DD 형식"),
    db: Session = Depends(get_db),
):
    device = db.query(Device).filter(Device.id == device_id).first()
    if device is None:
        raise HTTPException(status_code=404, detail="장비를 찾을 수 없습니다")
    
    if device.device_type == "single_phase":
        model = SinglePhaseMeasurement
    elif device.device_type == "three_phase":
        model = ThreePhaseMeasurement
    else:
        raise HTTPException(status_code=500, detail="알 수 없는 device_type입니다")
    
    try:
        target_date = datetime.strptime(date, "%Y-%m-%d")
    except ValueError:
        raise HTTPException(status_code=400, detail="date는 YYYY-MM-DD 형식이어야 합니다")
    
    start = target_date
    end = start + timedelta(days=1)
    
    # PostgreSQL EXTRACT(EPOCH FROM ...)로 15분(900초) 단위 구간 경계를 계산
    bucket = func.to_timestamp(
        
        func.floor(func.extract("epoch", model.timestamp) / literal_column("900")) * literal_column("900")
    ).label("bucket")
    
    results = (
        db.query(bucket, func.max(model.active_power).label("peak_value"))
        .filter(model.device_id == device_id, model.timestamp >= start, model.timestamp < end)
        .group_by(bucket)
        .order_by(bucket.asc())
        .all()
    )
    
    return [
        {"time": r.bucket.strftime("%H:%M"), "value": round(r.peak_value, 2) if r.peak_value is not None else None}
        for r in results
    ]
    
@router.get("/energy/{device_id}")
def get_energy(
    device_id:uuid.UUID,
    year: int = Query(..., ge=2000, le=2100),
    month: int = Query(..., ge=1, le=12),
    db: Session = Depends(get_db),
):
    device = db.query(Device).filter(Device.id == device_id).first()
    if device is None:
        raise HTTPException(status_code=404, detail="장비를 찾을 수 없습니다")
    if device.device_type == "single_phase":
        model = SinglePhaseMeasurement
    elif device.device_type == "three_phase":
        model = ThreePhaseMeasurement
    else:
        raise HTTPException(status_code=500, detail="알 수 없는 device_type입니다")
    
    start = datetime(year, month, 1)
    end = datetime(year + 1,1,1) if month == 12 else datetime(year, month + 1, 1)
    
    records = (
        db.query(model.timestamp, model.active_power)
        .filter(model.device_id == device_id, model.timestamp >= start, model.timestamp < end)
        .order_by(model.timestamp.asc())
        .all()
    )
    
    daily_kwh: dict = defaultdict(float)
    MAX_GAP_HOURS = 1.0
    
    for i in range(len(records) - 1):
        t1, p1 = records[i]
        t2, p2 = records[i + 1]
        if p1 is None or p2 is None:
            continue
        dt_hours = (t2 - t1).total_seconds() /3600
        if dt_hours <= 0 or dt_hours > MAX_GAP_HOURS:
            continue
        avg_power = (p1 + p2) / 2
        daily_kwh[t1.date()] += avg_power * dt_hours
        
    daily = [
        {"date": day, "kwh": round(kwh, 3)}
        for day, kwh in sorted(daily_kwh.items())
    ]
    total_kwh = round(sum(daily_kwh.values()), 3)
    
    return {"daily": daily, "total_kwh": total_kwh}