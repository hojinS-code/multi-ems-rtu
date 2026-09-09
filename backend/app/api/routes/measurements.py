import uuid
from datetime import datetime, timedelta, timezone
from collections import defaultdict
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, literal_column


from db.session import get_db
from model.device import Device
from model.measurement import SinglePhaseMeasurement, ThreePhaseMeasurement
from schema.measurement import SinglePhaseMeasurementResponse, ThreePhaseMeasurementResponse
from model.environment_measurement import EnvironmentMeasurement
from schema.measurement import EnvironmentMeasurementResponse

router = APIRouter(prefix="/measurements", tags=["measurements"])

VALID_METRICS = {"voltage", "current", "power_factor", "active_power", "reactive_power", "power" }
VALID_GRANULARITIES = {'day', "hour", "minute" }
METRIC_ALIASES = {"power": "active_power"}
ENV_METRICS = {"temperature", "humidity", "illuminance"}

KST = timezone(timedelta(hours=9))

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
    
    since = datetime.now(KST).replace(tzinfo=None) - timedelta(minutes=minutes)
    
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
    
    def _sanitize(record):
        for field in ("voltage", "current", "voltage_r", "voltage_s","voltage_t", "current_r", "current_s", "current_t"):
            if hasattr(record, field):
                value = getattr(record, field)
                if value is not None:
                    value = float(value)
                    if value < 0:
                        setattr(record, field, None)
                    else:
                        setattr(record, field, value)
        return record
    
    return [response_schema.model_validate(_sanitize(r)) for r in records]

#월별 조회 API추가
@router.get("/monthly/{device_id}")
def get_monthly_measurements(
    device_id: uuid.UUID,
    metric: str = Query(..., description="voltage, current, power_factor, active_power, reactive_power 중 하나"),
    year: int = Query(..., ge=2000, le=2100),
    month: int = Query(..., ge=1, le=12),
    granularity: str = Query("day", description="'day', 'hour', 'minute' 중 하나"),
    date: str | None = Query(None,description="YYYY-MM-DD, granularity가 hour/minute일 때 필수"),
    db: Session = Depends(get_db),
):
    device = db.query(Device).filter(Device.id == device_id).first()
    if device is None:
        raise HTTPException(status_code=404, detail="장비를 찾을 수 없습니다")

    if metric not in VALID_METRICS:
        raise HTTPException(status_code=400, detail=f"지원하지 않는 metric입니다: {metric}")
    
    if granularity not in VALID_GRANULARITIES:
        raise HTTPException(status_code=400, detail=f"지원하지 않는 granularity입니다: {granularity}")
    
    if granularity in ("hour", "minute"):
        if not date:
            raise HTTPException(status_code=400, detail="granularity가 hour/minute일 때는 date가 필요합니다 ")
        try:
            start =datetime.strptime(date, "%Y-%m-%d")
        except ValueError:
            raise HTTPException(status_code=400, detail="date는 YYYY-MM-DD 형식이어야 합니다")
        end = start + timedelta(days=1)
    else:
        start = datetime(year, month, 1)
        end = datetime(year + 1, 1, 1) if month == 12 else datetime(year, month + 1, 1)
    
    granularity_literal = literal_column(f"'{granularity}'")

    if device.device_type == "single_phase":
        model = SinglePhaseMeasurement
        column_name = METRIC_ALIASES.get(metric, metric)
        metric_column = getattr(model, column_name)
        bucket = func.date_trunc(granularity_literal, model.timestamp).label("bucket")

        results = (
            db.query(bucket, func.avg(metric_column).label("avg_value"))
            .filter(model.device_id == device_id, model.timestamp >= start, model.timestamp < end)
            .group_by(bucket)
            .order_by(bucket.asc())
            .all()
        )

        return [
            {"date": r.bucket.isoformat(), "value": round(float(r.avg_value), 2) if r.avg_value is not None else None}
            for r in results
        ]

    elif device.device_type == "three_phase":
        model = ThreePhaseMeasurement
        bucket = func.date_trunc(granularity_literal, model.timestamp).label("bucket")

        if metric in ("voltage", "current"):
            col_r = getattr(model, f"{metric}_l1")
            col_s = getattr(model, f"{metric}_l2")
            col_t = getattr(model, f"{metric}_l3")

            results = (
                db.query(
                    bucket,
                    func.avg(col_r).label("val_l1"),
                    func.avg(col_s).label("val_l2"),
                    func.avg(col_t).label("val_l3"),
                )
                .filter(model.device_id == device_id, model.timestamp >= start, model.timestamp < end)
                .group_by(bucket)
                .order_by(bucket.asc())
                .all()
            )

            return [
                {
                    "date": r.bucket.isoformat(),
                    "l1": round(float(r.val_l1), 2) if r.val_l1 is not None else None,
                    "l2": round(float(r.val_l2), 2) if r.val_l2 is not None else None,
                    "l3": round(float(r.val_l3), 2) if r.val_l3 is not None else None,
                }
                for r in results
            ]
        else:
            column_name = METRIC_ALIASES.get(metric, metric)
            metric_column = getattr(model, column_name)
            results = (
                db.query(bucket, func.avg(metric_column).label("avg_value"))
                .filter(model.device_id == device_id, model.timestamp >= start, model.timestamp < end)
                .group_by(bucket)
                .order_by(bucket.asc())
                .all()
            )
            return [
                {"date": r.bucket.isoformat(), "value": round(float (r.avg_value), 2) if r.avg_value is not None else None}
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
        {"time": r.bucket.strftime("%H:%M"), "value": round(float (r.peak_value), 2) if r.peak_value is not None else None}
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

@router.get("/environment/realtime/{device_id}", response_model=list[EnvironmentMeasurementResponse])
def get_environment_realtime(
    device_id: uuid.UUID,
    minutes: int = Query(30, ge=1, le=1440),
    db: Session = Depends(get_db),  
):
    device = db.query(Device).filter(Device.id == device_id).first()
    if device is None:
        raise HTTPException(status_code=404, detail="장비를 찾을 수 없습니다")
    if device.device_type != "enviroment":
        raise HTTPException(status_code=400, detail="온습도조도계 장비가 아닙니다")
    
    since = datetime.now(KST).replace(tzinfo=None) - timedelta(minutes=minutes)
    
    records = (
        db.query(EnvironmentMeasurement)
        .filter(EnvironmentMeasurement.device_id == device_id, EnvironmentMeasurement.timestamp >= since)
        .order_by(EnvironmentMeasurement.timestamp.asc())
        .all()
    )
    
    return records

@router.get("/environment/monthly/{device_id}")
def get_environment_monthly(
    device_id: uuid.UUID,
    metric: str = Query(..., description="temperature, humidity, illuminance 중 하나"),
    year: int = Query(..., ge=2000, le=2100),
    month: int = Query(..., ge=1, le=12),
    granularity: str = Query("day", description="'day' , 'hour', 'minute' 중 하나"),
    date: str | None = Query(None, description="granularity가 hour/minute일 때 필수"),
    db: Session = Depends(get_db),
):
    device = db.query(Device).filter(Device.id == device_id).first()
    if device is None:
        raise HTTPException(status_code=404, detail="장비를 찾을 수 없습니다")
    if device.device_type != "environment":
        raise HTTPException(status_code=400, detail="온습도조도계 장비가 아닙니다")
    
    if metric not in ENV_METRICS:
        raise HTTPException(status_code=400, detail=f"지원하지 않는 granularity입니다: {granularity}")
    
    if granularity in ("hour", "minute"):
        if not date:
            raise HTTPException(status_code=400, detail="granularity가 hour/minute일 때는 date가 필요합니다")
        try:
            start = datetime.strptime(date, "%Y-%m-%d")
        except ValueError:
            raise HTTPException(status_code=400, detail="date는 YYYY-MM-DD 형식이어야 합니다")
        end = start + timedelta(days=1)
    else:
        start = datetime(year, month, 1)
        end = datetime(year + 1, 1, 1) if month == 12 else datetime(year, month +1, 1)
        
    granularity_literal = literal_column(f"'{granularity}'")
    metric_column = getattr(EnvironmentMeasurement, metric)
    bucket = func.date_trunc(granularity_literal, EnvironmentMeasurement.timestamp).label("bucket")
    
    results = (
        db.query(bucket, func.avg(metric_column).label("avg_value"))
        .filter(EnvironmentMeasurement.device_id == device_id, EnvironmentMeasurement.timestamp >= start, EnvironmentMeasurement.timestamp < end)
        .group_by(bucket)
        .order_by(bucket.asc())
        .all()
    )
    
    return [
        {"date": r.bucket.isoformat(), "value": round(float(r.avg_value), 2) if r.avg_value is not None else None}
        for r in results
    ]