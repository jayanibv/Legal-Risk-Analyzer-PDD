# Legal Risk Analyzer — Appium Mobile E2E Test Suite

## Overview

**350 automated E2E test cases** covering every screen of the Legal Risk Analyzer Android app using **Appium + Python + pytest**.

---

## Folder Structure

```
frontend/appium-tests/
├── conftest.py                    # Shared fixtures, helpers, Excel report generator
├── pytest.ini                     # pytest config
├── requirements.txt               # Python dependencies
├── run_appium_tests.bat           # One-click test runner (Windows)
│
├── test_01_login_screen.py        # TC001–TC040  (40 tests)  Login
├── test_02_signup_screen.py       # TC041–TC080  (40 tests)  Signup
├── test_03_home_dashboard.py      # TC081–TC120  (40 tests)  Home/Dashboard
├── test_04_upload_scanning.py     # TC121–TC160  (40 tests)  Upload & Scanning
├── test_05_analysis_results.py    # TC161–TC200  (40 tests)  Summary/Clauses/Details/Export
├── test_06_history_chat_translator.py  # TC201–TC260  (60 tests)  History, Chat, Translator
├── test_07_settings_templates.py  # TC261–TC310  (50 tests)  Settings & Templates
└── test_08_app_wide_e2e.py        # TC311–TC350  (40 tests)  App-wide E2E & Edge Cases
```

**Total: 350 test cases across 8 modules**

---

## Prerequisites

### 1. Java & Android SDK
```
JAVA_HOME must be set
ANDROID_HOME must be set
Android Emulator or physical device connected via ADB
```

### 2. Node.js & Appium Server
```powershell
npm install -g appium
appium driver install uiautomator2
```

### 3. Python dependencies
```powershell
pip install -r requirements.txt
```

### 4. Start Android Emulator
Open Android Studio → Device Manager → Launch emulator (or connect physical device).

### 5. Verify ADB connection
```powershell
adb devices
# Should show: emulator-5554   device
```

---

## Running the Tests

### Option A: One-click (Windows)
```
Double-click run_appium_tests.bat
```

### Option B: Manual
```powershell
# Terminal 1 - Start Appium server
appium --port 4723

# Terminal 2 - Run tests
cd frontend/appium-tests
pytest . -v
```

### Run specific module
```powershell
pytest test_01_login_screen.py -v
```

### Run specific test case
```powershell
pytest -k "TC019" -v
```

---

## Excel Report

After every run, an Excel report is auto-generated:
```
Appium_Test_Report_YYYY-MM-DDThh-mm-ss.xlsx
```

| Sheet | Contents |
|-------|---------|
| **Summary** | Overall stats, pass rate, module breakdown table |
| **Detailed Results** | Row-per-test with TC ID, status, duration, notes, timestamp |

Status color coding:
- 🟢 Green = PASS
- 🔴 Red = FAIL  
- 🟡 Yellow = SKIP

---

## Test Coverage (by module)

| Module | TC Range | Tests | What's Covered |
|--------|----------|-------|----------------|
| Login | TC001-TC040 | 40 | UI elements, validation, auth flow, edge cases |
| Signup | TC041-TC080 | 40 | Registration form, all field validations |
| Home/Dashboard | TC081-TC120 | 40 | Navigation drawer, all menu items, screen loads |
| Upload/Scanning | TC121-TC160 | 40 | File picker, camera scan, validation, progress |
| Analysis Results | TC161-TC200 | 40 | Summary, Clauses, Details, Export screens |
| History + Chat + Translator | TC201-TC260 | 60 | List, search, send messages, translate text |
| Settings + Templates | TC261-TC310 | 50 | Profile edit, theme, template list |
| App-wide E2E | TC311-TC350 | 40 | Full journeys, accessibility, performance, security |
| **TOTAL** | TC001-TC350 | **350** | |

---

## APK Configuration
```python
APK_PATH    = "../../LegalRiskAnalyzer.apk"
APP_PACKAGE = "com.jayani.legalriskanalyzer"
APPIUM_HOST = "http://127.0.0.1:4723"
```

Edit `conftest.py` to change these settings.
