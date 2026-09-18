@echo off
echo Starting Darukaa.Earth Application...
echo.
echo Launching FastAPI Backend on http://127.0.0.1:8001 ...
start "Darukaa Backend" cmd /k "cd backend && venv\Scripts\uvicorn app.main:app --reload --port 8001"

echo Launching Next.js Frontend on http://localhost:3000 ...
start "Darukaa Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo Both servers started!
echo Frontend: http://localhost:3000
echo Backend:  http://127.0.0.1:8001
