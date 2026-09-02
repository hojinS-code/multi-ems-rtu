import logging
from pymodbus.client import ModbusSerialClient
from domain.ports import ModbusReader
from config import settings

logger = logging.getLogger(__name__)

class ModbusRtuReader(ModbusReader):
    def __init__(self, port: str, baudrate: int, slave_id: int):
        self.client = ModbusSerialClient(
            port=port,
            baudrate=baudrate,
            parity="N",
            stopbits=1,
            bytesize=8,
            timeout=3,
        )
        self.slave_id = slave_id
        self._connected = False
        
    def connect(self) -> None:
        if not self.client.connect():
            self._connected = False
            raise ConnectionError(f"RTU 연결 실패: port={self.client.comm_params}")
        self._connected = True
        logger.info(f"RTU 연결 성공: slave_id={self.slave_id}")
        
    def read_registers(self, address: int, count: int) -> list[int]:
        if not self._connected:
            raise ConnectionError("연결되지 않은 상태에서 읽기 시도")
        
        result = self.client.read_holding_registers(
            address, count, slave=self.slave_id
        )
        if result.isError():
            raise IOError(f"레지스터 읽기 실패: address={address}, error={result}")
        return result.registers
    
    def disconnect(self) -> None:
        self.client.close()
        self._connected = False
        logger.info(f"RTU 연결 종료: slave_id={self.slave_id}")
        
    @property
    def is_connected(self) -> bool:
        return self._connected