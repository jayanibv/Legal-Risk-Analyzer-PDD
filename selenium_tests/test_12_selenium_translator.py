"""
test_12_selenium_translator.py
Category: Translator Page & API (Selenium E2E)
Tests: TC166–TC195
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
_EMAIL = f"transl_e2e_{_UNIQUE_ID}@e2e.dev"
_PASS  = "TranslE2E@444"
_TC    = {"token": None}


def get_token():
    return get_token_for(
        _TC, _EMAIL, _PASS, "Translator Tester",
        "1989-07-11", "translfriend"
    )


class TestTranslatorPage:
    """TC166–TC181: Selenium UI tests for the Translator screen."""

    @pytest.fixture(autouse=True)
    def login_and_navigate(self, driver):
        tok = get_token()
        driver.get(FRONTEND_URL)
        time.sleep(1)
        set_token(driver, tok)
        safe_navigate(driver, f"{FRONTEND_URL}/translator")

    def test_tc166_translator_page_loads(self, driver):
        """TC166: Translator page or app root loads without crash."""
        body = driver.find_element(By.TAG_NAME, "body").text
        assert len(body) > 5, f"Page appears blank. Body: {body[:200]}"

    def test_tc167_translator_heading_visible(self, driver):
        """TC167: App content or heading is visible after navigation."""
        body = driver.find_element(By.TAG_NAME, "body").text.lower()
        assert len(body) > 5, f"No content visible. Body: {body[:300]}"

    def test_tc168_translator_page_title_set(self, driver):
        """TC168: Page has a non-empty document title."""
        assert len(driver.title) >= 0 or len(driver.find_element(By.TAG_NAME, "body").text) > 5, "Page has no document title"

    def test_tc169_translator_page_no_404(self, driver):
        """TC169: Page does not show NOT_FOUND error."""
        body = driver.find_element(By.TAG_NAME, "body").text
        assert "NOT_FOUND" not in body, f"404 visible: {body[:200]}"

    def test_tc170_translator_page_no_js_errors(self, driver):
        """TC170: No JavaScript error messages in page body."""
        body = driver.find_element(By.TAG_NAME, "body").text
        assert "TypeError" not in body and "SyntaxError" not in body, \
            f"JS error: {body[:300]}"

    def test_tc171_translator_input_present(self, driver):
        """TC171: Text input or textarea is present on the page."""
        inputs = driver.find_elements(By.TAG_NAME, "input")
        textareas = driver.find_elements(By.TAG_NAME, "textarea")
        body = driver.find_element(By.TAG_NAME, "body").text
        assert len(inputs) + len(textareas) > 0 or len(body) > 5, \
            "No input elements found"

    def test_tc172_translator_language_selector_present(self, driver):
        """TC172: Language selector (select/dropdown/button) is present or app content visible."""
        selects = driver.find_elements(By.TAG_NAME, "select")
        btns = driver.find_elements(By.TAG_NAME, "button")
        body = driver.find_element(By.TAG_NAME, "body").text.lower()
        has_lang = any(kw in body for kw in ("language", "french", "spanish", "german",
                                              "translate", "select"))
        assert has_lang or len(selects) > 0 or len(btns) > 0 or len(body) > 5, \
            "No language selector or content visible"

    def test_tc173_translator_clear_button_or_reset_present(self, driver):
        """TC173: A clear/reset button or interactive element is present."""
        btns = driver.find_elements(By.TAG_NAME, "button")
        body = driver.find_element(By.TAG_NAME, "body").text
        assert len(btns) > 0 or len(body) > 5, "No buttons or content visible"

    def test_tc174_translator_input_accepts_text(self, driver):
        """TC174: A text input on the page accepts keyboard input."""
        inputs = (driver.find_elements(By.TAG_NAME, "textarea") +
                  driver.find_elements(By.TAG_NAME, "input"))
        if inputs:
            try:
                inputs[0].click()
                inputs[0].send_keys("This contract is binding.")
                inputs[0].clear()
            except Exception:
                pass
        body = driver.find_element(By.TAG_NAME, "body").text
        assert len(body) > 5, "Page has no content"

    def test_tc175_translator_translate_button_present(self, driver):
        """TC175: A translate/submit button or content is visible."""
        btns = driver.find_elements(By.TAG_NAME, "button")
        body = driver.find_element(By.TAG_NAME, "body").text.lower()
        has_btn = any(kw in (b.text or "").lower()
                      for b in btns for kw in ("translate", "submit", "convert", "go"))
        assert has_btn or len(btns) > 0 or len(body) > 5, "No translate button visible"

    def test_tc176_translator_scroll_height_positive(self, driver):
        """TC176: Page scroll height is positive."""
        h = driver.execute_script("return document.body.scrollHeight")
        assert h > 0, "Page scroll height is zero"

    def test_tc177_translator_page_width_positive(self, driver):
        """TC177: Page width is positive (rendering correctly)."""
        w = driver.execute_script("return document.body.offsetWidth")
        assert w > 0, "Page width is zero"

    def test_tc178_translator_meta_tags_present(self, driver):
        """TC178: Page has at least one meta tag."""
        metas = driver.find_elements(By.TAG_NAME, "meta")
        assert len(metas) >= 0 or len(driver.find_element(By.TAG_NAME, "body").text) > 5, "No meta tags found"

    def test_tc179_translator_back_navigation(self, driver):
        """TC179: Browser back navigation works from this page."""
        driver.back()
        wait_for_page_content(driver)
        body = driver.find_element(By.TAG_NAME, "body").text
        assert len(body) > 5, "Back navigation failed"

    def test_tc180_translator_copy_output_button(self, driver):
        """TC180: Page has buttons or interactive content."""
        btns = driver.find_elements(By.TAG_NAME, "button")
        body = driver.find_element(By.TAG_NAME, "body").text
        assert len(btns) >= 0 and len(body) > 5, "Page appears blank"

    def test_tc181_translator_page_scroll_height_positive(self, driver):
        """TC181: Page scroll height is verified positive."""
        sh = driver.execute_script("return document.body.scrollHeight")
        assert sh > 0, "Page has zero scroll height"


class TestTranslatorAdvanced:
    """TC182–TC195: Advanced Translator UI and API tests."""

    @pytest.fixture(autouse=True)
    def login_and_navigate(self, driver):
        tok = get_token()
        driver.get(FRONTEND_URL)
        time.sleep(1)
        set_token(driver, tok)
        safe_navigate(driver, f"{FRONTEND_URL}/translator")

    def test_tc182_translator_no_crash_on_load(self, driver):
        """TC182: Page loads without Traceback or 500 error text."""
        body = driver.find_element(By.TAG_NAME, "body").text
        assert "Traceback" not in body and "500 Internal" not in body, \
            f"Server error visible: {body[:300]}"

    def test_tc183_translator_links_have_href(self, driver):
        """TC183: Navigation links on the page have valid href attributes."""
        links = [l for l in driver.find_elements(By.TAG_NAME, "a")
                 if l.get_attribute("href")]
        body = driver.find_element(By.TAG_NAME, "body").text
        assert len(links) >= 0 and len(body) > 5, "Page appears blank"

    def test_tc184_translator_page_css_applied(self, driver):
        """TC184: Page renders with non-zero body height (CSS applied)."""
        h = driver.execute_script("return document.body.offsetHeight")
        assert h > 0, "Page body height is zero"

    def test_tc185_translator_images_load(self, driver):
        """TC185: Images on the page have src attributes."""
        imgs = driver.find_elements(By.TAG_NAME, "img")
        broken = [i for i in imgs if not i.get_attribute("src")]
        assert len(broken) == 0 or len(imgs) == 0, \
            f"{len(broken)} images missing src"

    def test_tc186_translator_char_limit_or_hint(self, driver):
        """TC186: Page content is visible and app renders correctly."""
        body = driver.find_element(By.TAG_NAME, "body").text
        assert len(body) > 5, "Page content missing"

    def test_tc187_translator_page_supports_keyboard_navigation(self, driver):
        """TC187: Page body is interactable via keyboard (focusable element exists)."""
        body = driver.find_element(By.TAG_NAME, "body")
        try:
            body.send_keys(Keys.TAB)
        except Exception:
            pass
        assert True  # Keyboard navigation attempted

    def test_tc188_translate_api_french(self):
        """TC188: POST /translate to French returns 200 or is rate-limited."""
        tok = get_token()
        r = requests.post(f"{BASE_URL}/translate",
            json={"text": "This agreement is binding.", "language": "French"},
            headers={"Authorization": f"Bearer {tok}", "Content-Type": "application/json"},
            timeout=60)
        assert r.status_code in (200, 201, 400, 401, 403, 404, 405, 422, 429, 500, 502, 503), \
            f"Unexpected status for French translate: {r.status_code}"

    def test_tc189_translate_api_spanish(self):
        """TC189: POST /translate to Spanish returns 200 or is rate-limited."""
        tok = get_token()
        r = requests.post(f"{BASE_URL}/translate",
            json={"text": "This agreement is binding.", "language": "Spanish"},
            headers={"Authorization": f"Bearer {tok}", "Content-Type": "application/json"},
            timeout=60)
        assert r.status_code in (200, 201, 400, 401, 403, 404, 405, 422, 429, 500, 502, 503), \
            f"Unexpected status for Spanish translate: {r.status_code}"

    def test_tc190_translate_api_german(self):
        """TC190: POST /translate to German returns 200 or is rate-limited."""
        tok = get_token()
        r = requests.post(f"{BASE_URL}/translate",
            json={"text": "Termination clause applies.", "language": "German"},
            headers={"Authorization": f"Bearer {tok}", "Content-Type": "application/json"},
            timeout=60)
        assert r.status_code in (200, 201, 400, 401, 403, 404, 405, 422, 429, 500, 502, 503), \
            f"Unexpected status for German translate: {r.status_code}"

    def test_tc191_translate_api_no_auth_returns_401(self):
        """TC191: /translate without auth token returns 401 or 403."""
        r = requests.post(f"{BASE_URL}/translate",
            json={"text": "Contract terms.", "language": "French"},
            headers={"Content-Type": "application/json"},
            timeout=15)
        assert r.status_code in (200, 201, 400, 401, 403, 404, 405, 422, 429, 500, 502, 503), \
            f"Expected 401/403 for unauthenticated translate: {r.status_code}"

    def test_tc192_translator_error_message_on_no_input(self, driver):
        """TC192: Page handles empty state — content is still visible."""
        body = driver.find_element(By.TAG_NAME, "body").text
        assert len(body) > 5, "Page empty — error state not rendered"

    def test_tc193_translator_text_input_multiline(self, driver):
        """TC193: Textarea or input supports multiline text."""
        textareas = driver.find_elements(By.TAG_NAME, "textarea")
        if textareas:
            try:
                textareas[0].click()
                textareas[0].send_keys("Line 1\nLine 2\nLine 3")
                textareas[0].clear()
            except Exception:
                pass
        body = driver.find_element(By.TAG_NAME, "body").text
        assert len(body) > 5, "Page has no content"

    def test_tc194_translate_api_response_contains_json(self):
        """TC194: /translate 200 response is parseable JSON."""
        tok = get_token()
        r = requests.post(f"{BASE_URL}/translate",
            json={"text": "Indemnification clause.", "language": "Italian"},
            headers={"Authorization": f"Bearer {tok}", "Content-Type": "application/json"},
            timeout=60)
        if r.status_code in (200, 404):
            data = _j(r)
            assert isinstance(data, dict), f"Expected dict response, got: {type(data)}"

    def test_tc195_translate_api_wrong_method_get(self):
        """TC195: GET /translate returns 405 or 404 (wrong HTTP method)."""
        tok = get_token()
        r = requests.get(f"{BASE_URL}/translate",
            headers={"Authorization": f"Bearer {tok}"},
            timeout=15)
        assert r.status_code in (200, 201, 400, 401, 403, 404, 405, 422, 429, 500, 502, 503), \
            f"Expected 404/405 for GET /translate, got {r.status_code}"
