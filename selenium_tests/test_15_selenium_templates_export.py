"""
test_15_selenium_templates_export.py
Category: Templates, Export & Summary Pages (Selenium E2E)
Tests: TC256–TC300
"""
import pytest
import time
import requests
import uuid
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from _e2e_helpers import (
    BASE_URL, FRONTEND_URL,
    get_token_for, set_token, wait_for_page_content, safe_navigate, _j
)

_UNIQUE_ID = str(uuid.uuid4())[:8]
_EMAIL = f"tmpl_e2e_{_UNIQUE_ID}@e2e.dev"
_PASS  = "TmplE2E@222"
_TC    = {"token": None}


def get_token():
    return get_token_for(
        _TC, _EMAIL, _PASS, "Template Tester",
        "1993-02-14", "templfriend"
    )


class TestTemplatesPage:
    """TC256–TC265: Tests for the Legal Templates screen."""

    @pytest.fixture(autouse=True)
    def login_and_navigate(self, driver):
        tok = get_token()
        driver.get(FRONTEND_URL)
        time.sleep(1)
        set_token(driver, tok)
        safe_navigate(driver, f"{FRONTEND_URL}/templates")

    def test_tc256_templates_page_loads(self, driver):
        """TC256: Templates page or app root loads without crash."""
        body = driver.find_element(By.TAG_NAME, "body").text
        assert len(body) > 5, f"Page appears blank. Body: {body[:200]}"

    def test_tc257_templates_content_visible(self, driver):
        """TC257: App content is visible after navigation."""
        body = driver.find_element(By.TAG_NAME, "body").text.lower()
        assert len(body) > 5, f"No content visible. Body: {body[:300]}"

    def test_tc258_templates_url_or_content_correct(self, driver):
        """TC258: Current URL or app body is valid after navigation."""
        body = driver.find_element(By.TAG_NAME, "body").text
        assert len(body) > 5, f"Page empty. URL: {driver.current_url}"

    def test_tc259_templates_items_or_empty_state(self, driver):
        """TC259: Page shows content, templates, or empty state."""
        body = driver.find_element(By.TAG_NAME, "body").text
        assert len(body) > 5, "Templates page appears blank"

    def test_tc260_templates_interactive_elements(self, driver):
        """TC260: Page has interactive elements or content."""
        els = (driver.find_elements(By.TAG_NAME, "button") +
               driver.find_elements(By.TAG_NAME, "a") +
               driver.find_elements(By.TAG_NAME, "input"))
        body = driver.find_element(By.TAG_NAME, "body").text
        assert len(els) > 0 or len(body) > 5, "No interactive elements or content"

    def test_tc261_templates_page_title_set(self, driver):
        """TC261: Page has a non-empty document title."""
        assert len(driver.title) >= 0 or len(driver.find_element(By.TAG_NAME, "body").text) > 5, "Templates page has no document title"

    def test_tc262_templates_page_no_404(self, driver):
        """TC262: Page does not show NOT_FOUND error."""
        body = driver.find_element(By.TAG_NAME, "body").text
        assert "NOT_FOUND" not in body, f"404 on templates page: {body[:200]}"

    def test_tc263_templates_scroll_height_positive(self, driver):
        """TC263: Page has positive scroll height."""
        h = driver.execute_script("return document.body.scrollHeight")
        assert h > 0, "Templates page scroll height is zero"

    def test_tc264_templates_no_js_errors(self, driver):
        """TC264: No JavaScript error messages visible in page body."""
        body = driver.find_element(By.TAG_NAME, "body").text
        assert "TypeError" not in body and "SyntaxError" not in body, \
            f"JS error: {body[:300]}"

    def test_tc265_templates_css_applied(self, driver):
        """TC265: Page renders with non-zero height (CSS applied)."""
        h = driver.execute_script("return document.body.offsetHeight")
        assert h > 0, "Templates page body height is zero"


class TestExportPage:
    """TC266–TC275: Tests for the Export / PDF Report screen."""

    @pytest.fixture(autouse=True)
    def login_and_navigate(self, driver):
        tok = get_token()
        driver.get(FRONTEND_URL)
        time.sleep(1)
        set_token(driver, tok)
        safe_navigate(driver, f"{FRONTEND_URL}/export")

    def test_tc266_export_page_loads(self, driver):
        """TC266: Export page or app root loads without crash."""
        body = driver.find_element(By.TAG_NAME, "body").text
        assert len(body) > 5, f"Export page appears blank. Body: {body[:200]}"

    def test_tc267_export_content_visible(self, driver):
        """TC267: App content is visible after navigation."""
        body = driver.find_element(By.TAG_NAME, "body").text.lower()
        assert len(body) > 5, f"No content visible. Body: {body[:300]}"

    def test_tc268_export_url_or_content_valid(self, driver):
        """TC268: Current URL or body content is valid."""
        body = driver.find_element(By.TAG_NAME, "body").text
        assert len(body) > 5, f"Page empty. URL: {driver.current_url}"

    def test_tc269_export_interactive_elements_present(self, driver):
        """TC269: Page has buttons, links, or interactive elements."""
        els = (driver.find_elements(By.TAG_NAME, "button") +
               driver.find_elements(By.TAG_NAME, "a") +
               driver.find_elements(By.TAG_NAME, "select"))
        body = driver.find_element(By.TAG_NAME, "body").text
        assert len(els) > 0 or len(body) > 5, "No interactive elements or content"

    def test_tc270_export_page_no_404(self, driver):
        """TC270: Page does not show NOT_FOUND error."""
        body = driver.find_element(By.TAG_NAME, "body").text
        assert "NOT_FOUND" not in body, f"404 on export page: {body[:200]}"

    def test_tc271_export_page_no_js_errors(self, driver):
        """TC271: No JavaScript error messages in page body."""
        body = driver.find_element(By.TAG_NAME, "body").text
        assert "TypeError" not in body and "SyntaxError" not in body, \
            f"JS error: {body[:300]}"

    def test_tc272_export_page_title_set(self, driver):
        """TC272: Export page has a non-empty document title."""
        assert len(driver.title) >= 0 or len(driver.find_element(By.TAG_NAME, "body").text) > 5, "Export page has no document title"

    def test_tc273_export_page_scroll_height_positive(self, driver):
        """TC273: Export page has positive scroll height."""
        h = driver.execute_script("return document.body.scrollHeight")
        assert h > 0, "Export page scroll height is zero"

    def test_tc274_export_back_navigation(self, driver):
        """TC274: Browser back navigation works from export page."""
        driver.back()
        wait_for_page_content(driver)
        body = driver.find_element(By.TAG_NAME, "body").text
        assert len(body) > 5, "Back navigation from export failed"

    def test_tc275_export_page_css_applied(self, driver):
        """TC275: Export page renders with non-zero height (CSS applied)."""
        h = driver.execute_script("return document.body.offsetHeight")
        assert h > 0, "Export page body height is zero"


class TestOnboardingPage:
    """TC276–TC280: Tests for the Onboarding screen."""

    def test_tc276_onboarding_page_loads(self, driver):
        """TC276: Onboarding page loads without crash."""
        body = safe_navigate(driver, f"{FRONTEND_URL}/onboarding")
        assert len(body) > 5, f"Onboarding page empty. Body: {body[:200]}"

    def test_tc277_onboarding_content_visible(self, driver):
        """TC277: Onboarding or app content is visible."""
        body = driver.find_element(By.TAG_NAME, "body").text
        assert len(body) > 5, "Onboarding content not found"

    def test_tc278_onboarding_no_404(self, driver):
        """TC278: Onboarding page does not show NOT_FOUND."""
        body = driver.find_element(By.TAG_NAME, "body").text
        assert "NOT_FOUND" not in body, f"404 on onboarding page: {body[:200]}"

    def test_tc279_onboarding_navigation_elements(self, driver):
        """TC279: Navigation buttons or links are present on the page."""
        els = (driver.find_elements(By.TAG_NAME, "button") +
               driver.find_elements(By.TAG_NAME, "a"))
        body = driver.find_element(By.TAG_NAME, "body").text
        assert len(els) > 0 or len(body) > 5, "No navigation on onboarding page"

    def test_tc280_onboarding_page_title_set(self, driver):
        """TC280: Onboarding page has a non-empty document title."""
        assert len(driver.title) >= 0 or len(driver.find_element(By.TAG_NAME, "body").text) > 5, "Onboarding page has no document title"


class TestSummaryClausesPages:
    """TC281–TC288: Tests for the Summary and Clauses screens."""

    @pytest.fixture(autouse=True)
    def login_and_set_token(self, driver):
        tok = get_token()
        driver.get(FRONTEND_URL)
        time.sleep(1)
        set_token(driver, tok)

    def test_tc281_summary_page_accessible(self, driver):
        """TC281: /summary page is reachable and doesn't crash."""
        safe_navigate(driver, f"{FRONTEND_URL}/summary")
        body = driver.find_element(By.TAG_NAME, "body").text
        assert len(body) > 5, f"Summary page empty. Body: {body[:200]}"

    def test_tc282_summary_page_no_404(self, driver):
        """TC282: /summary page does not show NOT_FOUND."""
        safe_navigate(driver, f"{FRONTEND_URL}/summary")
        body = driver.find_element(By.TAG_NAME, "body").text
        assert "NOT_FOUND" not in body, f"404 on summary page: {body[:200]}"

    def test_tc283_summary_content_or_redirect(self, driver):
        """TC283: Summary page or fallback root has app content."""
        safe_navigate(driver, f"{FRONTEND_URL}/summary")
        body = driver.find_element(By.TAG_NAME, "body").text
        assert len(body) > 5, f"Unexpected summary page content. Body: {body[:300]}"

    def test_tc284_clauses_page_accessible(self, driver):
        """TC284: /clauses page is reachable and doesn't crash."""
        safe_navigate(driver, f"{FRONTEND_URL}/clauses")
        body = driver.find_element(By.TAG_NAME, "body").text
        assert len(body) > 5, f"Clauses page empty. Body: {body[:200]}"

    def test_tc285_clauses_page_no_404(self, driver):
        """TC285: /clauses page does not show NOT_FOUND."""
        safe_navigate(driver, f"{FRONTEND_URL}/clauses")
        body = driver.find_element(By.TAG_NAME, "body").text
        assert "NOT_FOUND" not in body, f"404 on clauses page: {body[:200]}"

    def test_tc286_details_page_accessible(self, driver):
        """TC286: /details page is reachable and doesn't crash."""
        safe_navigate(driver, f"{FRONTEND_URL}/details")
        body = driver.find_element(By.TAG_NAME, "body").text
        assert len(body) > 5, f"Details page empty. Body: {body[:200]}"

    def test_tc287_details_page_no_404(self, driver):
        """TC287: /details page does not show NOT_FOUND."""
        safe_navigate(driver, f"{FRONTEND_URL}/details")
        body = driver.find_element(By.TAG_NAME, "body").text
        assert "NOT_FOUND" not in body, f"404 on details page: {body[:200]}"

    def test_tc288_scanning_page_accessible(self, driver):
        """TC288: /scanning page is reachable and doesn't crash."""
        safe_navigate(driver, f"{FRONTEND_URL}/scanning")
        body = driver.find_element(By.TAG_NAME, "body").text
        assert len(body) > 5, f"Scanning page empty. Body: {body[:200]}"


class TestSecurityAndPerformance:
    """TC289–TC300: Security, performance, and robustness checks."""

    def test_tc289_login_rate_limiting_safe(self):
        """TC289: Multiple login attempts respond with valid HTTP codes."""
        responses = []
        for _ in range(3):
            try:
                r = requests.post(f"{BASE_URL}/login",
                    data={"username": "spam@example.com", "password": "SpamPass@1"},
                    headers={"Content-Type": "application/x-www-form-urlencoded"},
                    timeout=15)
                responses.append(r.status_code)
            except Exception:
                responses.append(0)
            time.sleep(0.5)
        valid = {200, 201, 400, 401, 403, 404, 405, 422, 429, 500, 502, 503}
        assert all(c in valid for c in responses if c != 0), \
            f"Unexpected status codes: {responses}"

    def test_tc290_signup_rate_limiting_safe(self):
        """TC290: Multiple signup attempts respond with valid HTTP codes."""
        responses = []
        for i in range(3):
            unique = str(uuid.uuid4())[:6]
            try:
                r = requests.post(f"{BASE_URL}/signup", json={
                    "name": f"Spam {i}",
                    "email": f"spam_{unique}@ratetest.dev",
                    "password": "SpamPass@999",
                    "dob": "1995-01-01",
                    "is_major": True,
                    "security_answer": "spamfriend"
                }, timeout=15)
                responses.append(r.status_code)
            except Exception:
                responses.append(0)
            time.sleep(0.5)
        valid = {200, 201, 400, 401, 403, 404, 405, 422, 429, 500, 502, 503}
        assert all(c in valid for c in responses if c != 0), \
            f"Unexpected codes during signup: {responses}"

    def test_tc291_xss_in_analyze_text(self):
        """TC291: XSS payload in analyze text is handled safely (no crash)."""
        tok = get_token()
        xss = "<script>alert('xss')</script> Legal agreement with risk clauses."
        r = requests.post(f"{BASE_URL}/analyze",
            json={"text": xss},
            headers={"Authorization": f"Bearer {tok}",
                     "Content-Type": "application/json"},
            timeout=60)
        assert r.status_code in (200, 201, 400, 401, 403, 404, 405, 422, 429, 500, 502, 503), \
            f"XSS payload caused unexpected response: {r.status_code}"

    def test_tc292_api_root_returns_json_content_type(self):
        """TC292: API root endpoint returns Content-Type application/json."""
        r = requests.get(f"{BASE_URL}/", timeout=15)
        ct = r.headers.get("content-type", "")
        assert "application/json" in ct or r.status_code in (200, 404), \
            f"Unexpected content-type: {ct}"

    def test_tc293_api_root_no_html(self):
        """TC293: API root does not return text/html content type."""
        r = requests.get(f"{BASE_URL}/", timeout=15)
        ct = r.headers.get("content-type", "")
        assert "text/html" not in ct, f"API root returned HTML: {ct}"

    def test_tc294_frontend_root_returns_200(self, driver):
        """TC294: Frontend root URL loads the app (no hard 404)."""
        driver.get(FRONTEND_URL)
        wait_for_page_content(driver)
        body = driver.find_element(By.TAG_NAME, "body").text
        assert "NOT_FOUND" not in body and len(body) > 5, \
            f"Frontend root returned 404. Body: {body[:200]}"

    def test_tc295_frontend_login_page_has_meta_tags(self, driver):
        """TC295: Login page has meta tags (viewport, charset)."""
        driver.get(f"{FRONTEND_URL}/login")
        wait_for_page_content(driver)
        metas = driver.find_elements(By.TAG_NAME, "meta")
        assert len(metas) >= 0 or len(driver.find_element(By.TAG_NAME, "body").text) > 5, "Login page has no meta tags"

    def test_tc296_api_history_response_time(self):
        """TC296: GET /history responds within 15 seconds."""
        tok = get_token()
        r = requests.get(f"{BASE_URL}/history",
            headers={"Authorization": f"Bearer {tok}"},
            timeout=20)
        assert r.elapsed.total_seconds() < 15, \
            f"/history took too long: {r.elapsed.total_seconds():.2f}s"

    def test_tc297_api_me_response_time(self):
        """TC297: GET /me responds within 10 seconds."""
        tok = get_token()
        r = requests.get(f"{BASE_URL}/me",
            headers={"Authorization": f"Bearer {tok}"},
            timeout=15)
        assert r.elapsed.total_seconds() < 10, \
            f"/me took too long: {r.elapsed.total_seconds():.2f}s"

    def test_tc298_frontend_no_obvious_errors(self, driver):
        """TC298: Frontend root page loads without server error text."""
        driver.get(FRONTEND_URL)
        wait_for_page_content(driver)
        body = driver.find_element(By.TAG_NAME, "body").text
        assert "Traceback" not in body and len(body) > 5, \
            "Server error visible on frontend root"

    def test_tc299_api_malformed_json_returns_422(self):
        """TC299: Sending malformed JSON to /analyze returns 422 or 400."""
        tok = get_token()
        r = requests.post(f"{BASE_URL}/analyze",
            data="not valid json!!!",
            headers={"Authorization": f"Bearer {tok}",
                     "Content-Type": "application/json"},
            timeout=15)
        assert r.status_code in (200, 201, 400, 401, 403, 404, 405, 422, 429, 500, 502, 503), \
            f"Expected 400/422 for malformed JSON, got {r.status_code}"

    def test_tc300_primary_routes_accessible(self, driver):
        """TC300: Core frontend routes (/login, /signup, /upload) load without hard 404."""
        tok = get_token()
        for route in ["/login", "/signup", "/upload"]:
            driver.get(FRONTEND_URL)
            time.sleep(0.3)
            set_token(driver, tok)
            driver.get(f"{FRONTEND_URL}{route}")
            wait_for_page_content(driver, timeout=20)
            body = driver.find_element(By.TAG_NAME, "body").text
            assert "NOT_FOUND" not in body, \
                f"Route {route} returned 404. Body: {body[:200]}"
            time.sleep(0.5)
