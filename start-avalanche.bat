@echo off
echo Starting Avalanche Network in WSL...
wsl -d Ubuntu-22.04 -- /home/huynguyen/bin/avalanche network start
echo.
echo Network started! You can now use the application.
pause
