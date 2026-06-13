@echo off
REM ============================================================
REM  run_tests.bat - Legal Risk Analyzer E2E Test Runner
REM  Usage:
REM    run_tests.bat            -> Run all tests + generate report
REM    run_tests.bat api        -> Run only API tests (no browser)
REM    run_tests.bat selenium   -> Run only Selenium browser tests
REM    run_tests.bat demo       -> Generate a demo Excel report only
REM    run_tests.bat fast       -> API tests only (no Selenium)
REM ============================================================

setlocal enabledelayedexpansion
set "TESTS_DIR=%~dp0tests"
set "SCRIPT_DIR=%~dp0"

echo.
echo =========================================================
echo   Legal Risk Analyzer - E2E Test Suite
echo   Started: %DATE% %TIME%
echo =========================================================
echo.

if "%1"=="demo" (
    echo [DEMO] Generating demo Excel report without running tests...
    python "%TESTS_DIR%\generate_report.py" --demo
    goto :done
)

REM Check dependencies
python -c "import selenium" 2>nul
if errorlevel 1 (
    echo [!] selenium not installed. Installing...
    pip install selenium webdriver-manager pytest-html pytest-json-report
)

python -c "import pytest_json_report" 2>nul
if errorlevel 1 (
    echo [!] pytest-json-report not installed. Installing...
    pip install pytest-json-report
)

if "%1"=="api" (
    echo [RUN] API tests only...
    python -m pytest "%TESTS_DIR%\test_01_api_health.py" ^
                    "%TESTS_DIR%\test_02_auth_api.py" ^
                    "%TESTS_DIR%\test_03_analyze_api.py" ^
                    "%TESTS_DIR%\test_08_edge_cases.py" ^
                    -v --tb=short --color=yes ^
                    --json-report --json-report-file="%TESTS_DIR%\.results.json"
    goto :report
)

if "%1"=="selenium" (
    echo [RUN] Selenium browser tests only...
    python -m pytest "%TESTS_DIR%\test_04_selenium_login.py" ^
                    "%TESTS_DIR%\test_05_selenium_signup.py" ^
                    "%TESTS_DIR%\test_06_selenium_upload.py" ^
                    "%TESTS_DIR%\test_07_selenium_dashboard_history.py" ^
                    -v --tb=short --color=yes ^
                    --json-report --json-report-file="%TESTS_DIR%\.results.json"
    goto :report
)

if "%1"=="fast" (
    echo [RUN] Fast API-only tests (no Selenium)...
    python -m pytest "%TESTS_DIR%\test_01_api_health.py" ^
                    "%TESTS_DIR%\test_02_auth_api.py" ^
                    "%TESTS_DIR%\test_03_analyze_api.py" ^
                    "%TESTS_DIR%\test_08_edge_cases.py" ^
                    -v --tb=short --color=yes ^
                    --json-report --json-report-file="%TESTS_DIR%\.results.json"
    goto :report
)

REM Default: run ALL tests
echo [RUN] Running full test suite (API + Selenium E2E)...
python -m pytest "%TESTS_DIR%" ^
    -v --tb=short --color=yes ^
    --json-report --json-report-file="%TESTS_DIR%\.results.json" ^
    --ignore="%TESTS_DIR%\generate_report.py"

:report
echo.
echo =========================================================
echo   Generating Excel Report...
echo =========================================================
python "%TESTS_DIR%\generate_report.py"

:done
echo.
echo =========================================================
echo   Done! Check the tests\ folder for the .xlsx report.
echo   Finished: %DATE% %TIME%
echo =========================================================
pause
