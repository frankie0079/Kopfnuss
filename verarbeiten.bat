@echo off
chcp 65001 >nul 2>&1
cd /d "%~dp0"

echo === Kopfnuss Karten verarbeiten ===
echo.

REM Pruefen ob Python verfuegbar ist
python --version >nul 2>&1
if errorlevel 1 (
  echo FEHLER: Python wurde nicht gefunden.
  echo Bitte Python installieren und zum PATH hinzufuegen.
  pause
  exit /b 1
)

REM Pruefen ob Foto-Ordner existiert
if not exist "Kartenfotos" (
  echo FEHLER: Ordner "Kartenfotos" nicht gefunden.
  echo Bitte lege deine Kartenfotos in den Ordner "Kartenfotos" ab.
  pause
  exit /b 1
)

REM API-Key aus .env laden
set "GEMINI_API_KEY="
if exist ".env" (
  for /f "tokens=1,* delims==" %%a in (.env) do (
    if "%%a"=="GEMINI_API_KEY" set "GEMINI_API_KEY=%%b"
  )
)

if "%GEMINI_API_KEY%"=="" (
  echo FEHLER: Kein Gemini API-Key gefunden.
  echo Bitte in der Datei .env eintragen:
  echo   GEMINI_API_KEY=AIza...
  pause
  exit /b 1
)

echo Eingabe:  Kartenfotos\
echo Ausgabe:  Kartenfotos_ergebnis\
echo API-Key:  %GEMINI_API_KEY:~0,10%...
echo.

python batch_import.py Kartenfotos/ --output Kartenfotos_ergebnis --api-key %GEMINI_API_KEY%

echo.
echo === Fertig! ===
echo Naechster Schritt: start doppelklicken, dann im Browser
echo Batch-Import oeffnen und batch_results.json aus Kartenfotos_ergebnis\ laden.
echo.
pause
