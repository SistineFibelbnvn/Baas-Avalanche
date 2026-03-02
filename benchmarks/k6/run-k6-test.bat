@echo off
REM k6 Load Test Runner for Avalanche RPC
REM Usage: run-k6-test.bat [test-file] [rpc-url]

SET K6_PATH="C:\Program Files\k6\k6.exe"
SET INFLUXDB=http://localhost:8086/k6

REM Default test file
SET TEST_FILE=rpc-load-test.js
IF NOT "%~1"=="" SET TEST_FILE=%~1

REM Default RPC URL
SET RPC_URL=http://127.0.0.1:9650/ext/bc/C/rpc
IF NOT "%~2"=="" SET RPC_URL=%~2

echo ============================================
echo k6 Avalanche RPC Load Test
echo ============================================
echo Test File: %TEST_FILE%
echo RPC URL: %RPC_URL%
echo InfluxDB: %INFLUXDB%
echo ============================================
echo.
echo Starting test...
echo View results at: http://localhost:3001 (Grafana)
echo.

%K6_PATH% run --out influxdb=%INFLUXDB% -e RPC_URL=%RPC_URL% %TEST_FILE%

IF %ERRORLEVEL% NEQ 0 (
    echo.
    echo ============================================
    echo Test failed! Make sure:
    echo 1. Avalanche node is running on port 9650
    echo 2. InfluxDB is running (docker compose up -d)
    echo ============================================
)

pause
