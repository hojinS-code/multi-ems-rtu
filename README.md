# Multi-EMS_RTU

전력 모니터링 시스템 (Modbus RTU 기반 실시간 전력 데이터 수집 및 시각화)

## 기술 스택
- BE: FastAPI, PostgreSQL, SQLAlchemy, pymodbus, APScheduler
- FE: Next.js (App Router), TypeScript, Tailwind CSS, Recharts

## 실행 방법

### 백엔드
cd backend/app
pip install -r requirements.txt
cp .env.example .env
uvicorn main:app --reload

### 프론트엔드
cd frontend
npm install
cp .env.local.example .env.local
npm run dev

### 접속
- 대시보드: http://localhost:3000
- API 문서: http://127.0.0.1:8000/docs