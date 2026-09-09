import uuid
import logging
import time
from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session

from domain.ports import ModbusReader
from adapters.modbus_rtu import ModbusRtuReader
from adapters.modbus_tcp import ModbusTcpReader
from model.device import Device
from model.measurement import SinglePhaseMeasurement, ThreePhaseMeasurement
from model.device_error import DeviceError
from config import settings
from services.alarm_service import check_alarms
from model.environment_measurement import EnvironmentMeasurement
from pymodbus.client.mixin import ModbusClientMixin

logger = logging.getLogger(__name__)

KST = timezone(timedelta(hours=9))

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

def poll_with_retry(reader: ModbusReader, address: int, count: int, input_register: bool = False) -> list [int] | None:
    for attempt in range(1, settings.max_retries + 1):
        try:
            with reader:
                if input_register:
                    return reader.read_input_registers(address, count)
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
    
def _decode_float32(registers: list[int]) -> float:
    return ModbusClientMixin.convert_from_registers(
        registers, ModbusClientMixin.DATATYPE.FLOAT32
    )

def poll_and_save(device: Device, db: Session) -> None:
    try:
        reader = create_reader(device)
    except ValueError as e:
        logger.error(str(e))
        _record_error(db, device.id, "unknown_device_type", str(e))
        return

    if device.device_type == "three_phase":
        raw = None
    elif device.device_type == "single_phase":
        raw = None
    elif device.device_type == "environment":
        raw = poll_with_retry(reader, address=0, count=10)
    else:
        message = f"알 수 없는 device_type: {device.device_type}"
        logger.error(message)
        _record_error(db, device.id, "unknown_device_type", message)
        return

    if device.device_type not in ("three_phase", "single_phase"):
        if raw is None:
            message = f"최대 재시도({settings.max_retries}회) 초과"
            logger.error(f"device_id={device.id} {message}")
            _record_error(db, device.id, "connection_failed", message)
            return
    
    now = datetime.now(KST).replace(tzinfo=None)
    
    try:
        if device.device_type == "single_phase":
            energy_regs = poll_with_retry(reader, address=0, count=2)
            if energy_regs is None:
                message = f"최대 재시도({settings. max_retries}회) 초과"
                logger.error(f"device_id={device.id} {message}")
                _record_error(db, device.id, "connection_failed", message)
                return
            
            time.sleep(0.1)
            
            main_regs = poll_with_retry(reader, address=12, count=5)
            if main_regs is None:
                message = f"최대 재시도({settings.max_retries}회) 초과"
                logger.error(f"device_id={device.id} {message}")
                _record_error(db, device.id, "connection_failed", message)
                return
            total_energy = ((energy_regs[0] << 16) | energy_regs[1]) / 100
            
            active_power_raw = main_regs[2]
            if active_power_raw > 32767:
                active_power_raw -= 65536

            record = SinglePhaseMeasurement(
                device_id=device.id,
                timestamp=now,
                voltage=main_regs[0] / 10,
                current=main_regs[1] / 100,
                active_power=active_power_raw,
                reactive_power=main_regs[3],
                power_factor=main_regs[4] / 1000,
                total_energy=total_energy,
            )

        elif device.device_type == "three_phase":
            vi_regs = poll_with_retry(reader, address=0, count=12, input_register=True)
            if vi_regs is None:
                message = f"최대 재시도({settings.max_retries}회) 초과"
                logger.error(f"device_id={device.id} {message}")
                _record_error(db, device.id, "connection_failed", message)
                return

            power_regs = poll_with_retry(reader, address=0x0032, count=8, input_register=True)
            if power_regs is None:
                message = f"최대 재시도({settings.max_retries}회) 초과"
                logger.error(f"device_id={device.id} {message}")
                _record_error(db, device.id, "connection_failed", message)
                return

            record = ThreePhaseMeasurement(
                device_id=device.id,
                timestamp=now,
                voltage_l1=_decode_float32(vi_regs[0:2]),
                voltage_l2=_decode_float32(vi_regs[2:4]),
                voltage_l3=_decode_float32(vi_regs[4:6]),
                current_l1=_decode_float32(vi_regs[6:8]),
                current_l2=_decode_float32(vi_regs[8:10]),
                current_l3=_decode_float32(vi_regs[10:12]),
                active_power=_decode_float32(power_regs[0:2]),
                reactive_power=_decode_float32(power_regs[2:4]),
                power_factor=_decode_float32(power_regs[6:8]),
            )

        elif device.device_type == "environment":
            record = EnvironmentMeasurement(
                device_id=device.id,
                timestamp=now,
                temperature=raw[0] / 10,
                humidity=raw[1] / 10,
                illuminance=raw[2],
            )

        else:
            message = f"알 수 없는 device_type: {device.device_type}"
            logger.error(message)
            _record_error(db, device.id, "unknown_device_type", message)
            return
    except IndexError as e:
        message = f"레지스터 데이터 길이 부족: {e}"
        logger.error(f"device_id={device.id} {message}")
        _record_error(db, device.id, "read_failed", message)
        return

    db.add(record)
    db.commit()
    logger.info(f"device_id={device.id} 저장 완료")

    check_alarms(db, device.id, record)