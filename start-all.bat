@echo off
REM ============================================
REM   AVXU BaaS - Full Stack Startup
REM ============================================
REM Starts everything: Node, Backend, Frontend

echo ============================================
echo   AVXU BaaS Platform - Full Stack Start
echo ============================================
echo.

cd /d "%~dp0"

REM Check Docker
docker info > nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker is not running!
    echo Please start Docker Desktop first.
    pause
    exit /b 1
)

echo [1/4] Starting Avalanche Node...
cd infrastructure\avalanche-node
docker compose up -d
cd ..\..

echo [2/4] Waiting for node to be ready...
:wait_node
timeout /t 3 /nobreak > nul
curl -s http://127.0.0.1:9650/ext/health > nul 2>&1
if errorlevel 1 goto wait_node
echo Node is ready!

echo [3/4] Starting Backend...
start "AVXU Backend" cmd /k "cd backend && npm run start:dev"

timeout /t 5 /nobreak > nul

echo [4/4] Starting Frontend...
start "AVXU Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ============================================
echo   All services started!
echo ============================================
echo.
echo   Avalanche Node: http://127.0.0.1:9650
echo   Backend API:    http://localhost:4000
echo   Frontend:       http://localhost:3000
echo.
echo   To stop everything:
echo   - Close the Backend and Frontend terminal windows
echo   - Run: docker compose -f infrastructure\avalanche-node\docker-compose.yml down
echo.
pause
