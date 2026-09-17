import logging
import serial

logger = logging.getLogger(__name__)

STX = 0x02
ETX = 0x03

class FS600RReader:
    def __init__(self, port: str, baudrate: int, station_id: int):
        self.port_name = port
        self.baudrate = baudrate
        self.station_id = station_id
        self.ser: serial.Serial | None = None
        self._connected = False
        
        
    def connect(self) -> None:
        self.ser = serial.Serial(
            port=self.port_name,
            baudrate=self.baudrate,
            bytesize=8,
            parity="N",
            stopbits=1,
            timeout=3,
        )
        self._connected = True
        logger.info(f"FS-600R 연결 성공: station_id={self.station_id}")
        
    def disconnect(self) -> None:
        if self.ser:
            self.ser.close()
        self._connected = False
        logger.info(f"FS-600R 연결 종료: station_id={self.station_id}")
        
    @property
    def is_connected(self) -> bool:
        return self._connected
    
    def __enter__(self) -> "FS600RReader":
        self.connect()
        return self
    
    def __exit__(self, exc_type, exc_value, traceback) -> None:
        self.disconnect()
        
    def _calc_bcc(self, data: bytes) -> int:
        bcc = 0
        for b in data:
            bcc ^= b
        return bcc
    
    def read_all(self) -> dict:
        if not self._connected or self.ser is None:
            raise ConnectionError("연결되지 않은 상태에서 읽기 시도")
        
        id_byte = 0x30 + self.station_id
        
        frame = bytes([STX, id_byte, 0x52, 0x58, 0x5A]) + bytes([ETX])
        bcc = self._calc_bcc(frame)
        request = frame + bytes([bcc])
        
        self.ser.write(request)
        response = self.ser.read(28)
        
        if len(response) < 28:
            raise IOError(f"응답 길이 부족:  {len(response)} bytes 수신")
        
        if response[0] != STX or response[-2] != ETX:
            raise IOError("응답 프레임 형식 오루 (STX/ETX 불일치)")
        
        co2_raw = response[5:9].decode("ascii")
        sign_byte = response[9]
        temp_raw = response[10:14].decode("ascii")
        humidity_raw = response[15:19].decode("ascii")
        illuminance_raw = response[20:25].decode("ascii")
        
        co2 = int(co2_raw)
        temperature = int(temp_raw) / 10
        if sign_byte == 0x30:
            temperature = -temperature
        humidity = int(humidity_raw) / 10
        illuminance = int(illuminance_raw)
        
        return {
            "co2": co2,
            "temperature": temperature,
            "humidity": humidity,
            "illuminance": illuminance,
        }