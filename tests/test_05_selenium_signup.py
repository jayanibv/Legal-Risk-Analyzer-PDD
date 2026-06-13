"""
test_05_selenium_signup.py
Category: Signup Page (Selenium E2E)
Tests: TC066–TC075
Purpose: Browser-based tests for the Signup screen.
"""
import pytest
import time
import uuid
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait

BASE_URL = "https://legal-risk-analyzer.up.railway.app"


def wait_for_page_content(driver, timeout=25):
    """Wait until the page body has meaningful content."""
    try:
        WebDriverWait(driver, timeout).until(
            lambda d: len(d.find_element(By.TAG_NAME, "body").text.strip()) > 10
        )
    except Exception:
        pass
    time.sleep(1)


class TestSignupPage:
    """TC066–TC075: Selenium tests for the signup screen."""

    @pytest.fixture(autouse=True)
    def navigate_to_signup(self, driver):
        driver.get(f"{BASE_URL}/signup")
        wait_for_page_content(driver, timeout=25)

    def test_tc066_signup_page_loads(self, driver):
        """TC066: Signup page loads and URL contains '/signup'."""
        assert "signup" in driver.current_url.lower(), \
            f"Not on signup page. URL: {driver.current_url}"

    def test_tc067_create_account_heading_visible(self, driver):
        """TC067: 'Create Account' heading visible on signup page."""
        body = driver.find_element(By.TAG_NAME, "body").text
        if "Create Account" not in body:
            time.sleep(3)
            body = driver.find_element(By.TAG_NAME, "body").text
        assert "Create Account" in body, f"'Create Account' not in body: {body[:300]}"

    def test_tc068_all_input_fields_present(self, driver):
        """TC068: All required input fields are present (Name, Email, Security, Password, Confirm)."""
        try:
            WebDriverWait(driver, 15).until(
                lambda d: len(d.find_elements(By.TAG_NAME, "input")) >= 4
            )
        except Exception:
            time.sleep(3)
        inputs = driver.find_elements(By.TAG_NAME, "input")
        assert len(inputs) >= 4, \
            f"Expected at least 4 inputs on signup, found {len(inputs)}"

    def test_tc069_dob_picker_trigger_present(self, driver):
        """TC069: Date of Birth picker element is present."""
        body = driver.find_element(By.TAG_NAME, "body").text
        if "Date of Birth" not in body and "Birth" not in body:
            time.sleep(3)
            body = driver.find_element(By.TAG_NAME, "body").text
        assert "Date of Birth" in body or "Birth" in body, \
            "Date of Birth selector not found on signup page"

    def test_tc070_age_checkbox_present(self, driver):
        """TC070: '18 years or older' checkbox/confirmation is visible."""
        body = driver.find_element(By.TAG_NAME, "body").text
        if "18" not in body:
            time.sleep(3)
            body = driver.find_element(By.TAG_NAME, "body").text
        assert "18" in body and ("older" in body.lower() or "legal age" in body.lower() or "major" in body.lower()), \
            f"Age confirmation checkbox text not found. Body: {body[:300]}"

    def test_tc071_password_strength_indicator_present(self, driver):
        """TC071: Password strength indicator appears when typing a password."""
        try:
            WebDriverWait(driver, 15).until(
                lambda d: len(d.find_elements(By.TAG_NAME, "input")) > 0
            )
        except Exception:
            time.sleep(3)
        inputs = driver.find_elements(By.TAG_NAME, "input")
        pass_inputs = [i for i in inputs if i.get_attribute("type") == "password"]
        if pass_inputs:
            pass_inputs[0].click()
            pass_inputs[0].send_keys("Abc@123")
            time.sleep(2)
        body = driver.find_element(By.TAG_NAME, "body").text
        assert any(kw in body for kw in ("Weak", "Fair", "Good", "Strong", "weak", "fair", "good", "strong")), \
            f"Password strength indicator not found. Body: {body[:300]}"

    def test_tc072_login_link_on_signup_page(self, driver):
        """TC072: 'Login' link is visible on signup page for existing users."""
        login_link = WebDriverWait(driver, 15).until(
            EC.visibility_of_element_located((By.XPATH, "//*[text()='Login']"))
        )
        assert login_link.is_displayed(), "Login link not found on signup page"

    def test_tc073_signup_with_missing_fields_shows_error(self, driver):
        """TC073: Submitting empty signup form shows an error."""
        btns = driver.find_elements(By.TAG_NAME, "button")
        # Find the Sign Up button specifically
        sign_up_btn = None
        for btn in btns:
            if "Sign Up" in (btn.text or "") or "Create" in (btn.text or ""):
                sign_up_btn = btn
                break
        if sign_up_btn:
            sign_up_btn.click()
        elif btns:
            btns[0].click()
        time.sleep(2)
        body = driver.find_element(By.TAG_NAME, "body").text
        assert any(kw in body.lower() for kw in ("fill", "required", "error", "all fields")), \
            f"No error shown for empty signup form. Body: {body[:300]}"

    def test_tc074_security_question_field_present(self, driver):
        """TC074: Security question field for 'Best friend's name' is present."""
        body = driver.find_element(By.TAG_NAME, "body").text
        if "Security" not in body and "friend" not in body.lower():
            time.sleep(3)
            body = driver.find_element(By.TAG_NAME, "body").text
        assert "Security" in body or "friend" in body.lower() or "security" in body.lower(), \
            f"Security question field not visible. Body: {body[:300]}"

    def test_tc075_sign_up_button_present_on_page(self, driver):
        """TC075: 'Sign Up' submit button is present."""
        body = driver.find_element(By.TAG_NAME, "body").text
        if "Sign Up" not in body:
            time.sleep(3)
            body = driver.find_element(By.TAG_NAME, "body").text
        btns = driver.find_elements(By.TAG_NAME, "button")
        assert len(btns) > 0 and ("Sign Up" in body or "Create" in body), \
            f"Sign Up button not found. Body: {body[:200]}"
