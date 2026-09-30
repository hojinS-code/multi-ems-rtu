from pathlib import Path
from fastapi import APIRouter, Query

router = APIRouter(prefix="/logs", tags=["logs"])

LOG_FILE_PATH =Path("C:/multi-ems-rtu-deploy/logs/stderr.log")

@router.get("")
def get_logs(lines: int = Query(200, ge=1, le=2000, description="가져올 최근 줄 수")):
    if not LOG_FILE_PATH.exists():
        return {"lines": []}
    
    with open(LOG_FILE_PATH, "r", encoding="cp949", errors="replace") as f:
        all_lines = f.readlines()
        
    recent = all_lines[-lines:]
    return {"lines": [line.rstrip("\n") for line in recent]}