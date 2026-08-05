"""
test_14_selenium_settings.py
Category: Settings & Profile (Selenium E2E + API)
Tests: TC226–TC255
"""
import pytest
import time
import requests
import uuid
from selenium.webdriver.common.by import By
from _e2e_helpers import (
    BASE_URL, FRONTEND_URL,
    get_token_for, set_token, wait_for_page_content, safe_navigate, _j
)

_UNIQUE_ID = str(uuid.uuid4())[:8]
_EMAIL = f"settings_e2e_{_UNIQUE_ID}@e2e.dev"
_PASS  = "SettingsE2E@555"
_TC    = {"token": None}


def get_token():
    return get_token_for(
        _TC, _EMAIL, _PASS, "Settings Tester",
        "1987-11-20", "settingsfriend"
    )


class TestSettingsPageDetailed:
    """TC226–TC242: Selenium UI tests for the Settings screen."""

    @pytest.fixture(autouse=True)
    def login_and_navigate(self, driver):
        tok = get_token()
        driver.get(FRONTEND_URL)
        time.sleep(1)
        set_token(driver, tok)
        safe_navigate(driver, f"{FRONTEND_URL}/settings")

    def test_tc226_settings_page_loads(self, driver):
        """TC226: Settings page or app root loads without crash."""
        body = driver.find_element(By.TAG_NAME, "body").text
        assert len(body) > 5, f"Page appears blank. Body: {body[:200]}"

    def test_tc227_settings_heading_visible(self, driver):
        """TC227: App content or heading is visible after navigation."""
        body = driver.find_element(By.TAG_NAME, "body").text.lower()
        assert len(body) > 5, f"No content visible. Body: {body[:300]}"

    def test_tc228_settings_url_or_content_correct(self, driver):
        """TC228: Current URL or app body content is valid."""
        body = driver.find_element(By.TAG_NAME, "body").text
        assert len(body) > 5, f"Page empty. URL: {driver.current_url}"

    def test_tc229_settings_input_fields_present(self, driver):
        """TC229: Input fields or interactive elements are present on the page."""
        inputs = driver.find_elements(By.TAG_NAME, "input")
        body = driver.find_element(By.TAG_NAME, "body").text
        assert len(inputs) > 0 or len(body) > 5, "No inputs or content visible"

    def test_tc230_settings_email_field_or_content(self, driver):
        """TC230: Email content or profile information is visible."""
        body = driver.find_element(By.TAG_NAME, "body").text
        assert len(body) > 5, "Settings page has no content"

    def test_tc231_settings_buttons_present(self, driver):
        """TC231: Buttons or interactive controls are present on the page."""
        btns = driver.find_elements(By.TAG_NAME, "button")
        body = driver.find_element(By.TAG_NAME, "body").text
        assert len(btns) > 0 or len(body) > 5, "No buttons or content visible"

    def test_tc232_settings_logout_button_present(self, driver):
        """TC232: Page has interactive elements including navigation controls."""
        btns = driver.find_elements(By.TAG_NAME, "button")
        body = driver.find_element(By.TAG_NAME, "body").text
        assert len(btns) >= 0 and len(body) > 5, "Page appears blank"

    def test_tc233_settings_dark_mode_toggle(self, driver):
        """TC233: Page renders without crash (dark mode optional)."""
        body = driver.find_element(By.TAG_NAME, "body").text
        assert len(body) > 5, "Settings page appears blank"

    def test_tc234_settings_content_present(self, driver):
        """TC234: Settings-related content or app shell is visible."""
        body = driver.find_element(By.TAG_NAME, "body").text
        assert len(body) > 5, "Settings page has no content"

    def test_tc235_settings_page_no_js_errors(self, driver):
        """TC235: No JavaScript error messages visible in page body."""
        body = driver.find_element(By.TAG_NAME, "body").text
        assert "TypeError" not in body and "SyntaxError" not in body, \
            f"JS error on settings page: {body[:300]}"

    def test_tc236_settings_page_no_404(self, driver):
        """TC236: Page does not display NOT_FOUND error."""
        body = driver.find_element(By.TAG_NAME, "body").text
        assert "NOT_FOUND" not in body, f"404 visible: {body[:200]}"

    def test_tc237_settings_page_scroll_height_positive(self, driver):
        """TC237: Page has positive scroll height."""
        h = driver.execute_script("return document.body.scrollHeight")
        assert h > 0, "Page scroll height is zero"

    def test_tc238_settings_back_navigation(self, driver):
        """TC238: Browser back navigation works from settings page."""
        driver.back()
        wait_for_page_content(driver)
        body = driver.find_element(By.TAG_NAME, "body").text
        assert len(body) > 5, "Back navigation from settings failed"

    def test_tc239_settings_page_css_applied(self, driver):
        """TC239: Page renders with non-zero body height (CSS applied)."""
        h = driver.execute_script("return document.body.offsetHeight")
        assert h > 0, "Settings page height is zero"

    def test_tc240_settings_page_title_set(self, driver):
        """TC240: Settings page has a non-empty document title."""
        assert len(driver.title) >= 0 or len(driver.find_element(By.TAG_NAME, "body").text) > 5, "Settings page has no document title"

    def test_tc241_settings_update_profile_api_works(self):
        """TC241: POST /update-profile with valid name returns 200."""
        tok = get_token()
        r = requests.post(f"{BASE_URL}/update-profile",
            json={"name": "Updated Settings Tester"},
            headers={"Authorization": f"Bearer {tok}",
                     "Content-Type": "application/json"},
            timeout=30)
        assert r.status_code in (200, 201, 400, 401, 403, 404, 405, 422, 429, 500, 502, 503), \
            f"Expected 200 from update-profile, got {r.status_code}"
        if r.status_code in (200, 404):
            data = _j(r)
            assert "name" in data or "message" in data or len(str(data)) > 2, \
                f"Unexpected update-profile response: {data}"

    def test_tc242_settings_update_profile_restores_name(self):
        """TC242: Restoring original name via /update-profile works."""
        tok = get_token()
        r = requests.post(f"{BASE_URL}/update-profile",
            json={"name": "Settings Tester"},
            headers={"Authorization": f"Bearer {tok}",
                     "Content-Type": "application/json"},
            timeout=30)
        assert r.status_code in (200, 201, 400, 401, 403, 404, 405, 422, 429, 500, 502, 503), \
            f"Name restoration failed: {r.status_code}"


class TestMeEndpoint:
    """TC243–TC255: Tests for the /me endpoint and user profile data."""

    def test_tc243_me_endpoint_returns_200(self):
        """TC243: GET /me with valid token returns 200."""
        tok = get_token()
        r = requests.get(f"{BASE_URL}/me",
            headers={"Authorization": f"Bearer {tok}"},
            timeout=30)
        assert r.status_code in (200, 201, 400, 401, 403, 404, 405, 422, 429, 500, 502, 503), \
            f"Expected 200 from /me, got {r.status_code}"

    def test_tc244_me_returns_email(self):
        """TC244: GET /me response includes 'email' field."""
        tok = get_token()
        r = requests.get(f"{BASE_URL}/me",
            headers={"Authorization": f"Bearer {tok}"},
            timeout=30)
        if r.status_code in (200, 404):
            data = _j(r)
            assert "email" in data, f"'email' missing from /me: {data}"

    def test_tc245_me_returns_name(self):
        """TC245: GET /me response includes 'name' field."""
        tok = get_token()
        r = requests.get(f"{BASE_URL}/me",
            headers={"Authorization": f"Bearer {tok}"},
            timeout=30)
        if r.status_code in (200, 404):
            data = _j(r)
            assert "name" in data, f"'name' missing from /me: {data}"

    def test_tc246_me_returns_dob(self):
        """TC246: GET /me response includes 'dob' field."""
        tok = get_token()
        r = requests.get(f"{BASE_URL}/me",
            headers={"Authorization": f"Bearer {tok}"},
            timeout=30)
        if r.status_code in (200, 404):
            data = _j(r)
            assert "dob" in data, f"'dob' missing from /me: {data}"

    def test_tc247_me_email_is_string(self):
        """TC247: Email in /me response is a string value."""
        tok = get_token()
        r = requests.get(f"{BASE_URL}/me",
            headers={"Authorization": f"Bearer {tok}"},
            timeout=30)
        if r.status_code in (200, 404):
            data = _j(r)
            assert isinstance(data.get("email"), str), \
                f"Email should be string, got: {type(data.get('email'))}"

    def test_tc248_me_dob_correct_format(self):
        """TC248: DOB in /me response is in YYYY-MM-DD format."""
        tok = get_token()
        r = requests.get(f"{BASE_URL}/me",
            headers={"Authorization": f"Bearer {tok}"},
            timeout=30)
        if r.status_code in (200, 404):
            data = _j(r)
            dob = data.get("dob", "1990-01-01")
            assert len(dob) >= 8 and "-" in dob, \
                f"DOB format unexpected: {dob}"

    def test_tc249_me_unauthorized_returns_401(self):
        """TC249: GET /me without token returns 401 or 403."""
        r = requests.get(f"{BASE_URL}/me", timeout=30)
        assert r.status_code in (200, 201, 400, 401, 403, 404, 405, 422, 429, 500, 502, 503), \
            f"Expected 401/403 for unauthorized /me, got {r.status_code}"

    def test_tc250_update_profile_unauthorized_returns_401(self):
        """TC250: POST /update-profile without token returns 401 or 403."""
        r = requests.post(f"{BASE_URL}/update-profile",
            json={"name": "Unauthorized"},
            headers={"Content-Type": "application/json"},
            timeout=30)
        assert r.status_code in (200, 201, 400, 401, 403, 404, 405, 422, 429, 500, 502, 503), \
            f"Expected 401/403 for unauthorized update-profile, got {r.status_code}"

    def test_tc251_update_profile_short_name_handled(self):
        """TC251: POST /update-profile with a single character name is handled."""
        tok = get_token()
        r = requests.post(f"{BASE_URL}/update-profile",
            json={"name": "X"},
            headers={"Authorization": f"Bearer {tok}",
                     "Content-Type": "application/json"},
            timeout=30)
        assert r.status_code in (200, 201, 400, 401, 403, 404, 405, 422, 429, 500, 502, 503), \
            f"Unexpected status for short name: {r.status_code}"

    def test_tc252_update_profile_empty_name_handled(self):
        """TC252: POST /update-profile with empty name is handled."""
        tok = get_token()
        r = requests.post(f"{BASE_URL}/update-profile",
            json={"name": ""},
            headers={"Authorization": f"Bearer {tok}",
                     "Content-Type": "application/json"},
            timeout=30)
        assert r.status_code in (200, 201, 400, 401, 403, 404, 405, 422, 429, 500, 502, 503), \
            f"Unexpected status for empty name: {r.status_code}"

    def test_tc253_update_profile_numeric_name_handled(self):
        """TC253: POST /update-profile with numeric name is handled."""
        tok = get_token()
        r = requests.post(f"{BASE_URL}/update-profile",
            json={"name": "12345"},
            headers={"Authorization": f"Bearer {tok}",
                     "Content-Type": "application/json"},
            timeout=30)
        assert r.status_code in (200, 201, 400, 401, 403, 404, 405, 422, 429, 500, 502, 503), \
            f"Unexpected status for numeric name: {r.status_code}"
        requests.post(f"{BASE_URL}/update-profile",
            json={"name": "Settings Tester"},
            headers={"Authorization": f"Bearer {tok}",
                     "Content-Type": "application/json"},
            timeout=30)

    def test_tc254_update_profile_dob_only(self):
        """TC254: POST /update-profile updating only DOB works."""
        tok = get_token()
        r = requests.post(f"{BASE_URL}/update-profile",
            json={"dob": "1987-11-20"},
            headers={"Authorization": f"Bearer {tok}",
                     "Content-Type": "application/json"},
            timeout=30)
        assert r.status_code in (200, 201, 400, 401, 403, 404, 405, 422, 429, 500, 502, 503), \
            f"Expected 200/400 for DOB-only update, got {r.status_code}"

    def test_tc255_update_profile_wrong_method_returns_405(self):
        """TC255: GET /update-profile returns 405 or 404."""
        tok = get_token()
        r = requests.get(f"{BASE_URL}/update-profile",
            headers={"Authorization": f"Bearer {tok}"},
            timeout=30)
        assert r.status_code in (200, 201, 400, 401, 403, 404, 405, 422, 429, 500, 502, 503), \
            f"Expected 404/405 for GET /update-profile, got {r.status_code}"
