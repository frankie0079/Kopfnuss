@echo off
cd /d "%~dp0"
start /B python server.py
timeout /t 2 /nobreak >nul
start http://localhost:8080
echo.
echo Spiel geoeffnet. Fenster offen lassen!
pause
