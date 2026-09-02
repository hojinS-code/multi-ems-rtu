import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI

from db.session import Base, engine
from services.scheduler import start_scheduler, stop_scheduler
from api.routes import devices, measurements, device_errors
from fastapi.middleware.cors import CORSMiddleware

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)

logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    logger.info("DB 테이블 초기화 완료")
    
    start_scheduler()
    logger.info("애플리케이션 시작")
    
    yield
    
    stop_scheduler()
    logger.info("애플리케이션 종료")
    
app = FastAPI(title="Multi-EMS_RTU", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(devices.router)
app.include_router(measurements.router)
app.include_router(device_errors.router)

@app.get("/health")
def health_check():
    return {"status": "ok"}