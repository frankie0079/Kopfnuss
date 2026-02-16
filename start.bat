@echo off
cd /d "%~dp0"
start /B python server.py
timeout /t 2 /nobreak >nul
start http://localhost:8081
echo.
echo Kopfnuss! Server laeuft auf Port 8081
echo Fenster offen lassen!
pause
