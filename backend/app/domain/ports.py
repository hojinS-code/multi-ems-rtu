from abc import ABC, abstractmethod

class ModbusReader(ABC):
    @abstractmethod
    def connect(self) -> None:
        ...
        
    @abstractmethod
    def read_registers(self, address: int, count: int) -> list[int]:
        ...
        
    @abstractmethod
    def read_input_registers(self, address: int, count: int) -> list[int]:
        ...
        
    @abstractmethod
    def disconnect(self) -> None:
        ...
        
    @property
    @abstractmethod
    def is_connected(self) -> bool:
        ...
        
    def __enter__(self) -> "ModbusReader":
        self.connect()
        return self
    
    def __exit__(self, exc_type, exc_value, traceback) -> None:
        self.disconnect()