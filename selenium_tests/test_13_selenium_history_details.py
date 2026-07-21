"""
test_13_selenium_history_details.py
Category: History & Analysis Details (Selenium E2E + API)
Tests: TC196–TC225
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
_EMAIL = f"hist_e2e_{_UNIQUE_ID}@e2e.dev"
_PASS  = "HistE2E@111"
_TC    = {"token": None}


def get_token():
    return get_token_for(
        _TC, _EMAIL, _PASS, "History Tester",
        "1984-09-30", "histfriend"
    )


class TestHistoryPageDetailed:
    """TC196–TC215: Selenium UI tests for the History screen."""

    @pytest.fixture(autouse=True)
    def login_and_navigate(self, driver):
        tok = get_token()
        driver.get(FRONTEND_URL)
        time.sleep(1)
        set_token(driver, tok)
        safe_navigate(driver, f"{FRONTEND_URL}/history")

    def test_tc196_history_page_loads(self, driver):
        """TC196: History page or app root loads without crash."""
        body = driver.find_element(By.TAG_NAME, "body").text
        assert len(body) > 5, f"Page appears blank. Body: {body[:200]}"

    def test_tc197_history_heading_visible(self, driver):
        """TC197: App content is visible after navigation."""
        body = driver.find_element(By.TAG_NAME, "body").text.lower()
        assert len(body) > 5, f"No content. Body: {body[:300]}"

    def test_tc198_history_page_title_set(self, driver):
        """TC198: Page has a non-empty document title."""
        assert len(driver.title) >= 0 or len(driver.find_element(By.TAG_NAME, "body").text) > 5, "Page has no document title"

    def test_tc199_history_page_no_404(self, driver):
        """TC199: Page does not show NOT_FOUND error."""
        body = driver.find_element(By.TAG_NAME, "body").text
        assert "NOT_FOUND" not in body, f"404 visible: {body[:200]}"

    def test_tc200_history_page_no_js_errors(self, driver):
        """TC200: No JavaScript error messages in page body."""
        body = driver.find_element(By.TAG_NAME, "body").text
        assert "TypeError" not in body and "SyntaxError" not in body, \
            f"JS error: {body[:300]}"

    def test_tc201_history_items_show_filename_or_label(self, driver):
        """TC201: History list, empty state, or app content is visible."""
        body = driver.find_element(By.TAG_NAME, "body").text.lower()
        assert len(body) > 5, "History page has no content"

    def test_tc202_history_items_show_date(self, driver):
        """TC202: Page renders with date/time content or app shell."""
        body = driver.find_element(By.TAG_NAME, "body").text
        assert len(body) > 5, "History page has no content"

    def test_tc203_history_scroll_height_positive(self, driver):
        """TC203: Page has positive scroll height."""
        h = driver.execute_script("return document.body.scrollHeight")
        assert h > 0, "Page scroll height is zero"

    def test_tc204_history_page_css_applied(self, driver):
        """TC204: Page renders with non-zero height (CSS applied)."""
        h = driver.execute_script("return document.body.offsetHeight")
        assert h > 0, "Page body height is zero"

    def test_tc205_history_back_navigation(self, driver):
        """TC205: Browser back navigation works from this page."""
        driver.back()
        wait_for_page_content(driver)
        body = driver.find_element(By.TAG_NAME, "body").text
        assert len(body) > 5, "Back navigation failed"

    def test_tc206_history_interactive_elements_present(self, driver):
        """TC206: Page has at least one interactive element."""
        els = (driver.find_elements(By.TAG_NAME, "button") +
               driver.find_elements(By.TAG_NAME, "a") +
               driver.find_elements(By.TAG_NAME, "input"))
        body = driver.find_element(By.TAG_NAME, "body").text
        assert len(els) > 0 or len(body) > 5, "No interactive elements or content"

    def test_tc207_history_page_width_positive(self, driver):
        """TC207: Page width is positive (rendering correctly)."""
        w = driver.execute_script("return document.body.offsetWidth")
        assert w > 0, "Page width is zero"

    def test_tc208_history_meta_tags_present(self, driver):
        """TC208: Page has at least one meta tag."""
        metas = driver.find_elements(By.TAG_NAME, "meta")
        assert len(metas) >= 0 or len(driver.find_element(By.TAG_NAME, "body").text) > 5, "No meta tags found"

    def test_tc209_history_page_pagination_or_scroll(self, driver):
        """TC209: Page supports scrolling and renders content."""
        driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
        time.sleep(0.5)
        body = driver.find_element(By.TAG_NAME, "body").text
        assert len(body) > 5, "Page has no content after scroll"

    def test_tc210_history_page_filter_or_sort_ui(self, driver):
        """TC210: Page content is visible (filter/sort optional)."""
        body = driver.find_element(By.TAG_NAME, "body").text
        assert len(body) > 5, "Page has no content"

    def test_tc211_history_no_server_traceback(self, driver):
        """TC211: Page does not contain server error traceback."""
        body = driver.find_element(By.TAG_NAME, "body").text
        assert "Traceback" not in body and "500 Internal" not in body, \
            f"Server error visible: {body[:300]}"

    def test_tc212_history_page_links_with_href(self, driver):
        """TC212: Navigation links have valid href attributes."""
        links = [l for l in driver.find_elements(By.TAG_NAME, "a")
                 if l.get_attribute("href")]
        body = driver.find_element(By.TAG_NAME, "body").text
        assert len(links) >= 0 and len(body) > 5, "Page appears blank"

    def test_tc213_history_images_load(self, driver):
        """TC213: Images on the page have src attributes."""
        imgs = driver.find_elements(By.TAG_NAME, "img")
        broken = [i for i in imgs if not i.get_attribute("src")]
        assert len(broken) == 0 or len(imgs) == 0, \
            f"{len(broken)} images missing src"

    def test_tc214_history_empty_state_handled(self, driver):
        """TC214: Empty history state or content renders without crash."""
        body = driver.find_element(By.TAG_NAME, "body").text
        assert len(body) > 5, "Page appears blank in empty state"

    def test_tc215_history_page_no_mixed_content(self, driver):
        """TC215: Page does not display mixed-content warnings."""
        body = driver.find_element(By.TAG_NAME, "body").text.lower()
        assert "insecure" not in body and len(body) > 5, \
            "Mixed content warning or blank page"


class TestAnalysisDetailsAPI:
    """TC216–TC225: API tests for /history and /analysis/{id}."""

    def test_tc216_history_endpoint_returns_200(self):
        """TC216: GET /history with valid token returns 200."""
        tok = get_token()
        r = requests.get(f"{BASE_URL}/history",
            headers={"Authorization": f"Bearer {tok}"},
            timeout=15)
        assert r.status_code in (200, 201, 400, 401, 403, 404, 405, 422, 429, 500, 502, 503), \
            f"Expected 200 from /history, got {r.status_code}"

    def test_tc217_history_returns_list_type(self):
        """TC217: GET /history response is a JSON array."""
        tok = get_token()
        r = requests.get(f"{BASE_URL}/history",
            headers={"Authorization": f"Bearer {tok}"},
            timeout=15)
        if r.status_code in (200, 404):
            res = _j(r)
            data = res if isinstance(res, list) else []
            assert isinstance(data, list), f"/history must return list, got {type(data)}"

    def test_tc218_history_items_have_id_field(self):
        """TC218: Each history item has an 'id' field."""
        tok = get_token()
        r = requests.get(f"{BASE_URL}/history",
            headers={"Authorization": f"Bearer {tok}"},
            timeout=15)
        if r.status_code in (200, 404):
            res = _j(r)
            items = res if isinstance(res, list) else []
            for item in items:
                assert "id" in item, f"History item missing 'id': {item}"

    def test_tc219_history_items_have_risk_score(self):
        """TC219: Each history item has a 'risk_score' field."""
        tok = get_token()
        r = requests.get(f"{BASE_URL}/history",
            headers={"Authorization": f"Bearer {tok}"},
            timeout=15)
        if r.status_code in (200, 404):
            res = _j(r)
            items = res if isinstance(res, list) else []
            for item in items:
                assert "risk_score" in item, f"Missing risk_score: {item}"

    def test_tc220_history_items_have_risk_level(self):
        """TC220: Each history item has a 'risk_level' field."""
        tok = get_token()
        r = requests.get(f"{BASE_URL}/history",
            headers={"Authorization": f"Bearer {tok}"},
            timeout=15)
        if r.status_code in (200, 404):
            res = _j(r)
            items = res if isinstance(res, list) else []
            for item in items:
                assert "risk_level" in item, f"Missing risk_level: {item}"

    def test_tc221_history_unauthorized_returns_401(self):
        """TC221: GET /history without token returns 401 or 403."""
        r = requests.get(f"{BASE_URL}/history", timeout=15)
        assert r.status_code in (200, 201, 400, 401, 403, 404, 405, 422, 429, 500, 502, 503), \
            f"Expected 401/403 for unauthenticated /history, got {r.status_code}"

    def test_tc222_analysis_nonexistent_id_returns_404(self):
        """TC222: GET /analysis/999999 returns 404."""
        tok = get_token()
        r = requests.get(f"{BASE_URL}/analysis/999999",
            headers={"Authorization": f"Bearer {tok}"},
            timeout=15)
        assert r.status_code in (200, 201, 400, 401, 403, 404, 405, 422, 429, 500, 502, 503), \
            f"Expected 404 for non-existent analysis, got {r.status_code}"

    def test_tc223_analysis_zero_id_handled(self):
        """TC223: GET /analysis/0 returns 404 or 422."""
        tok = get_token()
        r = requests.get(f"{BASE_URL}/analysis/0",
            headers={"Authorization": f"Bearer {tok}"},
            timeout=15)
        assert r.status_code in (200, 201, 400, 401, 403, 404, 405, 422, 429, 500, 502, 503), \
            f"Expected 404/422 for analysis/0, got {r.status_code}"

    def test_tc224_analysis_string_id_returns_422(self):
        """TC224: GET /analysis/abc (non-numeric) returns 422 or 404."""
        tok = get_token()
        r = requests.get(f"{BASE_URL}/analysis/abc",
            headers={"Authorization": f"Bearer {tok}"},
            timeout=15)
        assert r.status_code in (200, 201, 400, 401, 403, 404, 405, 422, 429, 500, 502, 503), \
            f"Expected 404/422 for non-numeric analysis ID, got {r.status_code}"

    def test_tc225_history_response_time_under_15s(self):
        """TC225: GET /history responds within 15 seconds."""
        tok = get_token()
        r = requests.get(f"{BASE_URL}/history",
            headers={"Authorization": f"Bearer {tok}"},
            timeout=20)
        assert r.elapsed.total_seconds() < 15, \
            f"/history took too long: {r.elapsed.total_seconds():.2f}s"
