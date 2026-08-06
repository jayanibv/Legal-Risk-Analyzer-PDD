@echo off
REM ============================================================
REM  run_appium_tests.bat
REM  Legal Risk Analyzer - Appium Mobile E2E Test Runner
REM ============================================================
REM  Prerequisites:
REM    1. Node.js installed
REM    2. Appium server installed: npm install -g appium
REM    3. UiAutomator2 driver: appium driver install uiautomator2
REM    4. Android emulator/device running (ADB connected)
REM    5. Python venv with requirements installed
REM ============================================================

cd /d "%~dp0"

echo.
echo ============================================================
echo   Legal Risk Analyzer - Appium Mobile E2E Test Suite
echo ============================================================
echo.

REM -- Step 1: Install Python requirements ----------------------
echo [1/4] Installing Python requirements...
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo ERROR: Failed to install requirements.
    pause
    exit /b 1
)
echo       Done.
echo.

REM -- Step 2: Start Appium server in background ----------------
echo [2/4] Starting Appium server (port 4723)...
start "Appium Server" cmd /k "appium --port 4723 --log-level info"
echo       Waiting 8 seconds for Appium to start...
timeout /t 8 /nobreak > nul
echo       Done.
echo.

REM -- Step 3: Check ADB device ---------------------------------
echo [3/4] Checking Android device connection...
adb devices
echo.

REM -- Step 4: Run tests ----------------------------------------
echo [4/4] Running Appium E2E tests (350 test cases)...
echo.
pytest . -v --tb=short 2>&1
echo.

echo ============================================================
echo   Test run complete! Check for Excel report above.
echo ============================================================
pause
