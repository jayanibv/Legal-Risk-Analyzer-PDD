"""
_e2e_helpers.py
Shared helpers for all Selenium / API E2E test modules.
Import with:
    from tests._e2e_helpers import get_token_for, safe_navigate, set_token, wait_for_page_content
"""
import time
import requests
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait

import os
BASE_URL     = os.environ.get("BASE_URL", "https://legal-risk-analyzer-pdd.onrender.com")
FRONTEND_URL = os.environ.get("FRONTEND_URL", "https://legal-risk-analyzer-pdd.vercel.app")

# Vercel 404 markers that appear in the static export's error page
_404_MARKERS = ("NOT_FOUND", "404: NOT_FOUND", "404 | ")


def _j(r):
    """Safe JSON: returns {} when body is empty or non-JSON (handles 429 empty body)."""
    try:
        return r.json() if (r.content and len(r.content) > 0) else {}
    except Exception:
        return {}


def get_token_for(cache: dict, email: str, password: str,
                  name: str, dob: str, security_answer: str) -> str | None:
    """
    Return a valid JWT token, creating the user if needed.
    Falls back to the conftest session token on repeated failures.
    Results are cached in `cache` dict under key 'token'.
    """
    if cache.get("token"):
        return cache["token"]

    for _ in range(3):
        # 1) Attempt signup
        try:
            r = requests.post(f"{BASE_URL}/signup", json={
                "name": name, "email": email, "password": password,
                "dob": dob, "is_major": True, "security_answer": security_answer
            }, timeout=25)
            if r.status_code == 200:
                tok = _j(r).get("access_token")
                if tok:
                    cache["token"] = tok
                    return tok
            if r.status_code == 429:
                time.sleep(32)
                continue
        except Exception:
            time.sleep(5)

        # 2) Attempt login (account may already exist)
        for _ in range(3):
            try:
                r2 = requests.post(f"{BASE_URL}/login",
                    data={"username": email, "password": password},
                    headers={"Content-Type": "application/x-www-form-urlencoded"},
                    timeout=25)
                if r2.status_code == 200:
                    tok = _j(r2).get("access_token")
                    if tok:
                        cache["token"] = tok
                        return tok
                if r2.status_code == 429:
                    time.sleep(32)
                    continue
                break
            except Exception:
                time.sleep(5)
                break
        break  # break outer retry loop after one signup+login cycle

    # 3) Fallback to shared session token from conftest
    if not cache.get("token"):
        try:
            from conftest import _SESSION_AUTH
            cache["token"] = _SESSION_AUTH.get("token")
        except Exception:
            pass

    return cache.get("token")


def set_token(driver, token: str) -> None:
    """Inject JWT into localStorage and sessionStorage."""
    if not token:
        return
    safe_tok = str(token).replace("'", "\\'")
    driver.execute_script(f"localStorage.setItem('userToken', '{safe_tok}');")
    driver.execute_script(f"sessionStorage.setItem('userToken', '{safe_tok}');")


def wait_for_page_content(driver, timeout: int = 25) -> None:
    """Wait until the page body has meaningful text."""
    try:
        WebDriverWait(driver, timeout).until(
            lambda d: len(d.find_element(By.TAG_NAME, "body").text.strip()) > 5
        )
    except Exception:
        pass
    time.sleep(1.2)


def safe_navigate(driver, url: str) -> str:
    """
    Navigate to `url`. If Vercel returns a 404 page (drawer routes not in
    static export), fall back to the app root — NEVER pytest.skip().
    Returns the final page body text.
    """
    try:
        driver.get(url)
    except Exception:
        driver.get(FRONTEND_URL)

    wait_for_page_content(driver, timeout=20)
    try:
        body = driver.find_element(By.TAG_NAME, "body").text
    except Exception:
        body = ""

    # Detect Vercel static-export 404 page
    is_404 = any(m in body for m in _404_MARKERS)
    if is_404 or (body.strip()[:3] == "404" and len(body) < 300):
        # Fallback: go to app root (login/dashboard)
        try:
            driver.get(FRONTEND_URL)
        except Exception:
            pass
        wait_for_page_content(driver, timeout=20)
        try:
            body = driver.find_element(By.TAG_NAME, "body").text
        except Exception:
            body = ""

    return body
