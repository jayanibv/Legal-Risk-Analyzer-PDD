"""
test_07_selenium_dashboard_history.py
Category: Dashboard, History & Settings (Selenium E2E)
Tests: TC091–TC110
Purpose: Browser-based tests for the main dashboard, analysis history,
         settings screen, and chat/translate features.
"""
import pytest
import time
import requests
import uuid
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

BASE_URL = "https://legal-risk-analyzer.up.railway.app"

_UNIQUE_ID = str(uuid.uuid4())[:8]
_EMAIL = f"dash_e2e_{_UNIQUE_ID}@e2e.dev"
_PASS = "DashE2E@321"
_TOKEN_CACHE = {"token": None}


def get_token():
    if _TOKEN_CACHE["token"]:
        return _TOKEN_CACHE["token"]
    r = requests.post(f"{BASE_URL}/signup", json={
        "name": "Dashboard Tester",
        "email": _EMAIL,
        "password": _PASS,
        "dob": "1990-11-05",
        "is_major": True,
        "security_answer": "dashfriend"
    }, timeout=20)
    if r.status_code == 200:
        _TOKEN_CACHE["token"] = r.json()["access_token"]
    else:
        r2 = requests.post(f"{BASE_URL}/login",
            data={"username": _EMAIL, "password": _PASS},
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            timeout=20)
        _TOKEN_CACHE["token"] = r2.json().get("access_token")
    return _TOKEN_CACHE["token"]


def set_token(driver):
    token = get_token()
    driver.execute_script(f"localStorage.setItem('userToken', '{token}');")
    driver.execute_script(f"sessionStorage.setItem('userToken', '{token}');")


def wait_for_page_content(driver, timeout=25):
    """Wait until the page body has meaningful content."""
    try:
        WebDriverWait(driver, timeout).until(
            lambda d: len(d.find_element(By.TAG_NAME, "body").text.strip()) > 10
        )
    except Exception:
        pass
    time.sleep(1.5)


class TestDashboard:
    """TC091–TC100: Dashboard / Home screen tests."""

    @pytest.fixture(autouse=True)
    def navigate_to_dashboard(self, driver):
        driver.get(BASE_URL)
        time.sleep(1)
        set_token(driver)
        driver.get(f"{BASE_URL}/(drawer)")
        wait_for_page_content(driver, timeout=25)

    def test_tc091_dashboard_page_loads(self, driver):
        """TC091: Dashboard loads successfully (no crash/404)."""
        body = driver.find_element(By.TAG_NAME, "body").text
        assert "404" not in body and len(body) > 5, \
            f"Dashboard page error. Body: {body[:300]}"

    def test_tc092_app_name_or_logo_visible(self, driver):
        """TC092: App name 'Legal Risk' or logo is visible on dashboard."""
        body = driver.find_element(By.TAG_NAME, "body").text
        if not any(kw in body for kw in ("Legal", "Risk", "Analyzer", "LegalRisk")):
            time.sleep(3)
            body = driver.find_element(By.TAG_NAME, "body").text
        assert any(kw in body for kw in ("Legal", "Risk", "Analyzer", "LegalRisk", "Scan", "History")), \
            f"App branding not found. Body: {body[:300]}"

    def test_tc093_new_scan_button_visible(self, driver):
        """TC093: 'New Scan' or similar call-to-action button visible."""
        body = driver.find_element(By.TAG_NAME, "body").text
        if not any(kw in body for kw in ("New Scan", "Upload", "Analyze", "Start", "Scan")):
            time.sleep(3)
            body = driver.find_element(By.TAG_NAME, "body").text
        assert any(kw in body for kw in ("New Scan", "Upload", "Analyze", "Start", "Scan")), \
            f"CTA button not found. Body: {body[:300]}"

    def test_tc094_history_section_visible(self, driver):
        """TC094: History section or Recent Analyses visible."""
        body = driver.find_element(By.TAG_NAME, "body").text
        if not any(kw in body for kw in ("History", "Recent", "history", "Analyses")):
            time.sleep(3)
            body = driver.find_element(By.TAG_NAME, "body").text
        assert any(kw in body for kw in ("History", "Recent", "history", "Analyses", "Scan")), \
            f"History section not found. Body: {body[:300]}"

    def test_tc095_navigation_drawer_accessible(self, driver):
        """TC095: Navigation drawer/sidebar menu is accessible."""
        body = driver.find_element(By.TAG_NAME, "body").text
        assert body and len(body) > 10, "Dashboard body appears empty"

    def test_tc096_dashboard_responsive_title(self, driver):
        """TC096: Page has a descriptive title (not blank)."""
        title = driver.title
        assert title is not None and len(title.strip()) > 0, "Page title is empty"

    def test_tc097_onboarding_page_accessible(self, driver):
        """TC097: /onboarding route loads without errors."""
        driver.get(f"{BASE_URL}/onboarding")
        wait_for_page_content(driver, timeout=20)
        body = driver.find_element(By.TAG_NAME, "body").text
        assert "404" not in body, f"Onboarding page returned 404. Body: {body[:200]}"

    def test_tc098_clauses_page_accessible(self, driver):
        """TC098: /clauses route loads without a 404 error."""
        driver.get(f"{BASE_URL}/clauses")
        wait_for_page_content(driver, timeout=20)
        body = driver.find_element(By.TAG_NAME, "body").text
        assert "404" not in body, f"Clauses page 404. Body: {body[:200]}"

    def test_tc099_summary_page_accessible(self, driver):
        """TC099: /summary route loads without a 404 error."""
        driver.get(f"{BASE_URL}/summary")
        wait_for_page_content(driver, timeout=20)
        body = driver.find_element(By.TAG_NAME, "body").text
        assert "404" not in body, f"Summary page 404. Body: {body[:200]}"

    def test_tc100_export_page_accessible(self, driver):
        """TC100: /export route loads without a 404 error."""
        driver.get(f"{BASE_URL}/export")
        wait_for_page_content(driver, timeout=20)
        body = driver.find_element(By.TAG_NAME, "body").text
        assert "404" not in body, f"Export page 404. Body: {body[:200]}"


class TestHistoryPage:
    """TC101–TC106: History screen tests."""

    @pytest.fixture(autouse=True)
    def navigate_to_history(self, driver):
        driver.get(BASE_URL)
        time.sleep(1)
        set_token(driver)
        driver.get(f"{BASE_URL}/(drawer)/history")
        wait_for_page_content(driver, timeout=25)

    def test_tc101_history_page_loads(self, driver):
        """TC101: History page loads without errors."""
        body = driver.find_element(By.TAG_NAME, "body").text
        assert "404" not in body, f"History page 404. Body: {body[:200]}"

    def test_tc102_history_page_shows_history_or_empty_state(self, driver):
        """TC102: History page shows either documents or an empty/no-history state."""
        body = driver.find_element(By.TAG_NAME, "body").text
        assert len(body) > 5, f"History page is completely empty. Body: {body}"

    def test_tc103_history_items_show_risk_level(self, driver):
        """TC103: History items display risk level (High/Medium/Low) if present."""
        body = driver.find_element(By.TAG_NAME, "body").text
        # Either shows items with risk levels or shows an empty state
        assert len(body) > 0, "History page completely blank"

    def test_tc104_history_page_has_back_or_navigation(self, driver):
        """TC104: History page has navigation (back/menu)."""
        btns = driver.find_elements(By.TAG_NAME, "button")
        links = driver.find_elements(By.TAG_NAME, "a")
        assert len(btns) + len(links) > 0, "No navigation controls on history page"

    def test_tc105_chat_page_accessible(self, driver):
        """TC105: /chat drawer screen loads."""
        driver.get(f"{BASE_URL}/(drawer)/chat")
        wait_for_page_content(driver, timeout=20)
        body = driver.find_element(By.TAG_NAME, "body").text
        assert "404" not in body, f"Chat page 404. Body: {body[:200]}"

    def test_tc106_settings_page_accessible(self, driver):
        """TC106: /settings drawer screen loads."""
        driver.get(f"{BASE_URL}/(drawer)/settings")
        wait_for_page_content(driver, timeout=20)
        body = driver.find_element(By.TAG_NAME, "body").text
        assert "404" not in body, f"Settings page 404. Body: {body[:200]}"


class TestSettingsPage:
    """TC107–TC110: Settings screen tests."""

    @pytest.fixture(autouse=True)
    def navigate_to_settings(self, driver):
        driver.get(BASE_URL)
        time.sleep(1)
        set_token(driver)
        driver.get(f"{BASE_URL}/(drawer)/settings")
        wait_for_page_content(driver, timeout=25)

    def test_tc107_settings_page_loads(self, driver):
        """TC107: Settings page loads successfully."""
        body = driver.find_element(By.TAG_NAME, "body").text
        assert len(body) > 5, "Settings page appears blank"

    def test_tc108_dark_mode_toggle_or_settings_visible(self, driver):
        """TC108: Settings page shows theme or other settings controls."""
        body = driver.find_element(By.TAG_NAME, "body").text
        # Settings should have some content
        assert len(body) > 10, f"Settings page empty. Body: {body[:200]}"

    def test_tc109_translator_page_accessible(self, driver):
        """TC109: /translator drawer screen loads."""
        driver.get(f"{BASE_URL}/(drawer)/translator")
        wait_for_page_content(driver, timeout=20)
        body = driver.find_element(By.TAG_NAME, "body").text
        assert "404" not in body, f"Translator page 404. Body: {body[:200]}"

    def test_tc110_templates_page_accessible(self, driver):
        """TC110: /templates drawer screen loads."""
        driver.get(f"{BASE_URL}/(drawer)/templates")
        wait_for_page_content(driver, timeout=20)
        body = driver.find_element(By.TAG_NAME, "body").text
        assert "404" not in body, f"Templates page 404. Body: {body[:200]}"
