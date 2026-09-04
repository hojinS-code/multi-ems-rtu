import uuid
import logging
import time
from datetime import datetime
from sqlalchemy.orm import Session

from domain.ports import ModbusReader
from adapters.modbus_rtu import ModbusRtuReader
from adapters.modbus_tcp import ModbusTcpReader
from model.device import Device
from model.measurement import SinglePhaseMeasurement, ThreePhaseMeasurement
from model.device_error import DeviceError
from config import settings

logger = logging.getLogger(__name__)

def create_reader(device: Device) -> ModbusReader:
    if device.protocol == "RTU":
        return ModbusRtuReader(
            port=device.serial_port,
            baudrate=device.baudrate,
            slave_id=device.slave_id,
        )
    elif device.protocol == "TCP":
        return ModbusTcpReader(
            host=device.host,
            port=device.port,
            slave_id=device.slave_id
        )
    raise ValueError(f"지원하지 않는 protocol: {device.protocol}")

def poll_with_retry(reader: ModbusReader, address: int, count: int) -> list [int] | None:
    for attempt in range(1, settings.max_retries + 1):
        try:
            with reader:
                return reader.read_registers(address, count)
        except (ConnectionError, IOError) as e:
            wait = 2 ** attempt
            logger.warning(
                f"폴링 실패 ({attempt}/{settings.max_retries}): {e}. {wait}초 후 재시도"
            )
            time.sleep(wait)
            
    logger.error("최대 재시도 초과 - 이번 tick 스킵")
    return None

def _record_error(db: Session, device_id: uuid.UUID, error_type: str, message: str) -> None:
    error = DeviceError(
    device_id=device_id,
    error_type=error_type,
    message=message,
    )
    db.add(error)
    db.commit()

def poll_and_save(device: Device, db: Session) -> None:
    try:
        reader = create_reader(device)
    except ValueError as e:
        logger.error(str(e))
        _record_error(db, device.id, "unknown_device_type", str(e))
        return
    
    raw = poll_with_retry(reader, address=0, count=10)
    
    if raw is None:
        message = f"최대 재시도({settings.max_retries}회) 초과"
        logger.error(f"device_id={device.id} {message}")
        _record_error(db, device.id, "connection_failed", message)
        return
    
    now = datetime.utcnow()
    
    try:
        if device.device_type == "single_phase":
            record = SinglePhaseMeasurement(
                device_id=device.id,
                timestamp=now,
                voltage=raw[0] / 10,
                current=raw[1] / 100,
                power_factor=raw[2] / 1000,
                active_power=raw[3],
                reactive_power=raw[4],
            )
        elif device.device_type == "three_phase":
            record = ThreePhaseMeasurement(
                device_id=device.id,
                timestamp=now,
                voltage_r=raw[0] / 10,
                voltage_s=raw[1] / 10,
                voltage_t=raw[2] / 10,
                current_r=raw[3] / 100,
                current_s=raw[4] / 100,
                current_t=raw[5] / 100,
                power_factor=raw[6] / 1000,
                active_power=raw[7],
                reactive_power=raw[8],
            )
        else:
            message = f"알 수 없는 device_type: {device.device_type}"
            logger.error(message)
            _record_error(db, device.id, "unknown_device_type", message)
            return
    except IndexError as e:
        message = f"레지스터 데이터 길이 부족:{e}"
        logger.error(f"device_id={device.id} {message}")
        _record_error(db, device.id, "read_failed", message)
        return
    
    db.add(record)
    db.commit()
    logger.info(f"device_id={device.id} 저장 완료")