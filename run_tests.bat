@echo off
REM ============================================================
REM  run_tests.bat - Legal Risk Analyzer E2E Test Runner
REM  300+ Test Cases | Selenium + API | Excel Report
REM
REM  USAGE:
REM    run_tests.bat               -> Run ALL 300+ tests + Excel report
REM    run_tests.bat api           -> API tests only  (TC001-TC050, TC111-TC125)
REM    run_tests.bat selenium      -> Selenium UI tests only
REM    run_tests.bat chat          -> Chat / Translator tests
REM    run_tests.bat history       -> History / Analysis Details tests
REM    run_tests.bat settings      -> Settings / Profile tests
REM    run_tests.bat templates     -> Templates / Export / Summary tests
REM    run_tests.bat security      -> Security & Performance tests
REM    run_tests.bat fast          -> API-only (no browser, fastest)
REM    run_tests.bat install       -> Install dependencies only
REM    run_tests.bat demo          -> Generate demo Excel report only
REM ============================================================

setlocal enabledelayedexpansion
set "TESTS_DIR=%~dp0tests"
set "SCRIPT_DIR=%~dp0"

echo.
echo  =======================================================
echo    Legal Risk Analyzer - 300+ E2E Test Suite
echo    Started: %DATE% %TIME%
echo  =======================================================
echo.

REM ── Install only ──────────────────────────────────────────
if "%1"=="install" (
    echo [INSTALL] Installing test dependencies...
    pip install selenium webdriver-manager pytest pytest-json-report openpyxl requests
    echo [OK] Dependencies installed.
    goto :done
)

REM ── Demo mode ─────────────────────────────────────────────
if "%1"=="demo" (
    echo [DEMO] Generating demo Excel report...
    python "%TESTS_DIR%\generate_report.py" --demo
    goto :done
)

REM ── Auto-install missing deps ──────────────────────────────
python -c "import selenium" 2>nul
if errorlevel 1 (
    echo [!] selenium not found. Installing...
    pip install selenium webdriver-manager
)
python -c "import openpyxl" 2>nul
if errorlevel 1 (
    echo [!] openpyxl not found. Installing...
    pip install openpyxl
)
python -c "import pytest_jsonreport" 2>nul
if errorlevel 1 (
    echo [!] pytest-json-report not found. Installing...
    pip install pytest-json-report
)

REM ── API tests only ────────────────────────────────────────
if "%1"=="api" (
    echo [RUN] API Tests (TC001-TC050, TC111-TC125, TC203-TC225)...
    python -m pytest ^
        "%TESTS_DIR%\test_01_api_health.py" ^
        "%TESTS_DIR%\test_02_auth_api.py" ^
        "%TESTS_DIR%\test_03_analyze_api.py" ^
        "%TESTS_DIR%\test_08_edge_cases.py" ^
        "%TESTS_DIR%\test_13_selenium_history_details.py::TestAnalysisDetailsAPI" ^
        "%TESTS_DIR%\test_14_selenium_settings.py::TestMeEndpoint" ^
        -v --tb=short --color=yes -p no:warnings
    goto :done
)

REM ── Fast API-only (alias) ─────────────────────────────────
if "%1"=="fast" (
    echo [RUN] Fast API-only tests (no Selenium browser)...
    python -m pytest ^
        "%TESTS_DIR%\test_01_api_health.py" ^
        "%TESTS_DIR%\test_02_auth_api.py" ^
        "%TESTS_DIR%\test_03_analyze_api.py" ^
        "%TESTS_DIR%\test_08_edge_cases.py" ^
        -v --tb=short --color=yes -p no:warnings
    goto :done
)

REM ── Selenium UI tests ─────────────────────────────────────
if "%1"=="selenium" (
    echo [RUN] Selenium UI Tests (TC051-TC110, TC126-TC137)...
    python -m pytest ^
        "%TESTS_DIR%\test_04_selenium_login.py" ^
        "%TESTS_DIR%\test_05_selenium_signup.py" ^
        "%TESTS_DIR%\test_06_selenium_upload.py" ^
        "%TESTS_DIR%\test_07_selenium_dashboard_history.py" ^
        "%TESTS_DIR%\test_09_selenium_profile.py" ^
        "%TESTS_DIR%\test_10_selenium_notifications.py" ^
        -v --tb=short --color=yes -p no:warnings
    goto :done
)

REM ── Chat & Translator tests ───────────────────────────────
if "%1"=="chat" (
    echo [RUN] Chat and Translator Tests (TC138-TC195)...
    python -m pytest ^
        "%TESTS_DIR%\test_11_selenium_chat.py" ^
        "%TESTS_DIR%\test_12_selenium_translator.py" ^
        -v --tb=short --color=yes -p no:warnings
    goto :done
)

REM ── History & Analysis Details ────────────────────────────
if "%1"=="history" (
    echo [RUN] History and Analysis Detail Tests (TC196-TC225)...
    python -m pytest ^
        "%TESTS_DIR%\test_13_selenium_history_details.py" ^
        -v --tb=short --color=yes -p no:warnings
    goto :done
)

REM ── Settings & Profile ────────────────────────────────────
if "%1"=="settings" (
    echo [RUN] Settings and Profile Tests (TC226-TC255)...
    python -m pytest ^
        "%TESTS_DIR%\test_14_selenium_settings.py" ^
        -v --tb=short --color=yes -p no:warnings
    goto :done
)

REM ── Templates, Export, Summary ───────────────────────────
if "%1"=="templates" (
    echo [RUN] Templates, Export, Summary Tests (TC256-TC300)...
    python -m pytest ^
        "%TESTS_DIR%\test_15_selenium_templates_export.py" ^
        -v --tb=short --color=yes -p no:warnings
    goto :done
)

REM ── Security & Performance ────────────────────────────────
if "%1"=="security" (
    echo [RUN] Security and Performance Tests...
    python -m pytest ^
        "%TESTS_DIR%\test_08_edge_cases.py" ^
        "%TESTS_DIR%\test_15_selenium_templates_export.py::TestSecurityAndPerformance" ^
        -v --tb=short --color=yes -p no:warnings
    goto :done
)

REM ── DEFAULT: Run ALL 300+ Tests ───────────────────────────
echo [RUN] Running FULL 300+ test suite (API + Selenium E2E)...
echo [INFO] This may take 30-60 minutes. Excel report generated automatically.
echo.

python -m pytest "%TESTS_DIR%" ^
    -v --tb=short --color=yes ^
    -p no:warnings ^
    --ignore="%TESTS_DIR%\generate_report.py"

:done
echo.
echo  =======================================================
echo    Test run complete!
echo    Excel report saved to: %TESTS_DIR%\
echo    File: E2E_Test_Report_LegalRiskAnalyzer_*.xlsx
echo    Finished: %DATE% %TIME%
echo  =======================================================
echo.
pause
