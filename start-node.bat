@echo off
REM ============================================
REM   AVXU BaaS - Start Avalanche Node
REM ============================================
REM This script starts the local Avalanche node
REM The node will run in background and restart automatically

echo ============================================
echo   Starting Avalanche Local Node...
echo ============================================
echo.

cd /d "%~dp0infrastructure\avalanche-node"

REM Check if Docker is running
docker info > nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker is not running!
    echo Please start Docker Desktop first.
    pause
    exit /b 1
)

REM Start the node
docker compose up -d

if errorlevel 1 (
    echo.
    echo ERROR: Failed to start Avalanche node!
    pause
    exit /b 1
)

echo.
echo ============================================
echo   Avalanche Node Started Successfully!
echo ============================================
echo.
echo Node RPC: http://127.0.0.1:9650
echo C-Chain RPC: http://127.0.0.1:9650/ext/bc/C/rpc
echo.
echo The node will continue running in background.
echo To stop: docker compose -f infrastructure\avalanche-node\docker-compose.yml down
echo.
echo Waiting for node to be ready...

REM Wait for node to be healthy
:wait_loop
timeout /t 5 /nobreak > nul
curl -s http://127.0.0.1:9650/ext/health > nul 2>&1
if errorlevel 1 (
    echo Still starting...
    goto wait_loop
)

echo.
echo Node is ready!
echo You can now use the BaaS platform.
echo.
pause
