"""
conftest.py - Shared fixtures and configuration for Legal Risk Analyzer E2E tests
"""
import pytest
import time
import datetime
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager

# ─── Configuration ────────────────────────────────────────────────────────────
BASE_URL = "https://legal-risk-analyzer.up.railway.app"

# Test credentials (use a dedicated test account)
TEST_EMAIL = "testuser_e2e@legalrisk.dev"
TEST_PASSWORD = "TestPass@123"
TEST_NAME = "E2E Test User"
TEST_DOB = "1995-06-15"
TEST_SECURITY = "testfriend"

# ─── Shared Driver Fixture ────────────────────────────────────────────────────
@pytest.fixture(scope="session")
def driver():
    """
    Session-scoped Chrome WebDriver.
    One browser instance for the entire test session.
    """
    options = Options()
    options.add_argument("--start-maximized")
    options.add_argument("--disable-notifications")
    options.add_argument("--disable-popup-blocking")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    # Uncomment for headless CI:
    # options.add_argument("--headless=new")

    service = Service(ChromeDriverManager().install())
    drv = webdriver.Chrome(service=service, options=options)
    drv.set_page_load_timeout(30)
    drv.implicitly_wait(8)

    yield drv
    drv.quit()


@pytest.fixture(scope="module")
def fresh_driver():
    """
    Module-scoped Chrome WebDriver — a fresh browser per test module.
    Useful when isolation between test groups is needed.
    """
    options = Options()
    options.add_argument("--start-maximized")
    options.add_argument("--disable-notifications")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")

    service = Service(ChromeDriverManager().install())
    drv = webdriver.Chrome(service=service, options=options)
    drv.set_page_load_timeout(30)
    drv.implicitly_wait(8)

    yield drv
    drv.quit()


# ─── Helpers ──────────────────────────────────────────────────────────────────
def get_timestamp():
    return datetime.datetime.utcnow().strftime("%Y-%m-%dT%H-%M-%S")
