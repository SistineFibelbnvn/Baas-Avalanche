@echo off
REM ============================================
REM   AVXU BaaS - Stop All Services
REM ============================================

echo Stopping all AVXU services...
echo.

cd /d "%~dp0"

echo Stopping Avalanche Node...
docker compose -f infrastructure\avalanche-node\docker-compose.yml down

echo Stopping k6 stack (if running)...
docker compose -f benchmarks\k6\docker-compose.yml down 2>nul

echo.
echo All services stopped!
echo Note: Backend and Frontend terminals need to be closed manually (Ctrl+C)
echo.
pause
