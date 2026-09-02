import logging
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.events import EVENT_JOB_ERROR
from sqlalchemy.orm import Session

from db.session import SessionLocal
from model.device import Device
from services.polling_service import poll_and_save
from config import settings

logger = logging.getLogger(__name__)

scheduler = BackgroundScheduler()

def poll_all_devices() -> None:
    db: Session = SessionLocal()
    try:
        devices = db.query(Device).filter(Device.is_active == True).all()
        for device in devices:
            poll_and_save(device, db)
    except Exception as e:
        logger.error(f"폴링 사이클 전체 실패 (DB 조회 등): {e}")
    finally:
        db.close()
        
def _job_error_listener(event) -> None:
    logger.error(f"스케줄러 작업 실행 중 처리되지 않은 예외 발생: {event.exception}")
        
def start_scheduler() -> None:
    scheduler.add_listener(_job_error_listener, EVENT_JOB_ERROR)
    scheduler.add_job(
        poll_all_devices,
        "interval",
        seconds=settings.poll_interval_sec,
        id="poll_all_devices",
        max_instances=1,
        coalesce=True,
    )
    scheduler.start()
    logger.info(f"스케줄러 시작 - {settings.poll_interval_sec}초 간격")
    
def stop_scheduler() -> None:
    scheduler.shutdown()
    logger.info("스케줄러 종료")    