import logging
from sqlalchemy.orm import Session
from model.alarm import Alarm
from model.measurement import SinglePhaseMeasurement, ThreePhaseMeasurement

logger = logging.getLogger(__name__)

OVER_VOLTAGE_THRESHOLD = 242.0
UNDER_VOLTAGE_THRESHOLD = 198.0
OVER_CURRENT_THRESHOLD = 100.0
OVER_POWER_THRESHOLD = 20.0
PHASE_IMBALANCE_RATIO = 0.10

def _upsert_alarm(db: Session, device_id, alarm_type: str, severity: str, message: str) -> None:
    existing = (
        db.query(Alarm)
        .filter(Alarm.device_id == device_id, Alarm.alarm_type == alarm_type, Alarm.resolved_at.is_(None))
        .first()
    )
    if existing is None:
        alarm = Alarm(device_id=device_id, alarm_type=alarm_type, severity=severity, message=message)
        db.add(alarm)
        db.commit()
        logger.warning(f"알람 발생: device_id={device_id} type={alarm_type} msg={message}")
        
def _resolve_alarm(db: Session, device_id, alarm_type: str) -> None:
    from datetime import datetime
    existing = (
        db.query(Alarm)
        .filter(Alarm.device_id == device_id, Alarm.alarm_type == alarm_type, Alarm.resolved_at.is_(None))
        .first()
    )
    if existing is not None:
        existing.resolved_at = datetime.utcnow()
        db.commit()
        logger.info(f"알람 자동 해제: device_id={device_id} type={alarm_type}")
        
def check_alarms(db: Session, device_id, record) -> None:
    if isinstance(record, SinglePhaseMeasurement):
        _check_voltage(db, device_id, record.voltage)
        _check_current(db, device_id, record.current)
        _check_power(db, device_id, record.active_power)
    elif isinstance(record, ThreePhaseMeasurement):
        _check_voltage(db, device_id, record.voltage_r)
        _check_current(db, device_id, record.current_r)
        _check_power(db, device_id, record.active_power)
        _check_phase_imbalance(db, device_id, record.voltage_r, record.voltage_s, record.voltage_t)
        
def _check_voltage(db: Session, device_id, voltage) -> None:
    if voltage is None:
        return
    if voltage >= OVER_VOLTAGE_THRESHOLD:
        _upsert_alarm(db, device_id, "over_voltage", "warning", f"과전압 감지: {voltage}V")
    else:
        _resolve_alarm(db, device_id,"over_voltage")
    
    if voltage <= UNDER_VOLTAGE_THRESHOLD:
        _upsert_alarm(db, device_id, "under_voltage", "warning", f"저전압 감지: {voltage}V")
    else:
        _resolve_alarm(db, device_id, "under_voltage")
        
def _check_current(db: Session, device_id, current) -> None:
    if current is None:
        return
    if current >= OVER_CURRENT_THRESHOLD:
        _upsert_alarm(db, device_id, "over_current", "warning", f"과전류 감지: {current}A")
    else:
        _resolve_alarm(db, device_id, "over_current")
        
def _check_power(db: Session, device_id, active_power) -> None:
    if active_power is None:
        return
    if active_power >= OVER_POWER_THRESHOLD:
        _upsert_alarm(db, device_id, "over_power", "warning", f"과전력 감지: {active_power}kW")
    else:
        _resolve_alarm(db, device_id, "over_power")
        
def _check_phase_imbalance(db: Session, device_id, v_r, v_s, v_t) -> None:
    if v_r is None or v_s is None or v_t is None:
        return
    values = [v_r, v_s, v_t]
    avg = sum(values) / 3
    if avg == 0:
        return
    max_deviation = max(abs(v - avg) for v in values)
    ratio = max_deviation / avg
    if ratio > PHASE_IMBALANCE_RATIO:
        _upsert_alarm(db, device_id, "phase_imbalance", "critical", f"상간 불평형 감지: 편차율 {ratio:.1%}")
    else:
        _resolve_alarm(db, device_id, "phase_imbalance")