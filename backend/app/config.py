from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

class Settings(BaseSettings):
    database_url: str
    
    rtu_port: str = Field(..., description="예: /dev/ttyUSB0")
    rtu_baudrate: int = Field(9600, gt=0)
    
    poll_interval_sec: int = Field(5, gt=0)
    max_retries: int = Field(3, ge=1)
    
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8-sig")
        
settings = Settings()