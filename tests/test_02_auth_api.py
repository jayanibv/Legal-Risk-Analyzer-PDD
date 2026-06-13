"""
test_02_auth_api.py
Category: Authentication API
Tests: TC011–TC030
Purpose: Validate signup, login, reset-password API endpoints.
"""
import pytest
import requests
import uuid
import time

BASE_URL = "https://legal-risk-analyzer.up.railway.app"

# Shared test user — generated fresh per session run
_UNIQUE_ID = str(uuid.uuid4())[:8]
SIGNUP_EMAIL = f"testuser_{_UNIQUE_ID}@e2e.dev"
SIGNUP_PASSWORD = "E2ETest@999"
SIGNUP_NAME = "E2E Tester"
SIGNUP_DOB = "1995-03-20"
SIGNUP_SECURITY = "testbestfriend"

_token_holder = {"token": None}

class TestSignupAPI:
    """TC011–TC018: POST /signup endpoint validation."""

    def test_tc011_signup_success(self):
        """TC011: Valid signup returns access_token."""
        r = requests.post(f"{BASE_URL}/signup", json={
            "name": SIGNUP_NAME,
            "email": SIGNUP_EMAIL,
            "password": SIGNUP_PASSWORD,
            "dob": SIGNUP_DOB,
            "is_major": True,
            "security_answer": SIGNUP_SECURITY
        }, timeout=20)
        data = r.json()
        assert r.status_code == 200, f"Signup failed: {data}"
        assert "access_token" in data, "No access_token in signup response"
        _token_holder["token"] = data["access_token"]

    def test_tc012_signup_duplicate_email_returns_400(self):
        """TC012: Signing up with an already-registered email returns 400."""
        r = requests.post(f"{BASE_URL}/signup", json={
            "name": SIGNUP_NAME,
            "email": SIGNUP_EMAIL,
            "password": SIGNUP_PASSWORD,
            "dob": SIGNUP_DOB,
            "is_major": True,
            "security_answer": SIGNUP_SECURITY
        }, timeout=20)
        assert r.status_code == 400, "Expected 400 for duplicate email"

class TestResetPasswordAPI:
    """TC028–TC030: POST /reset-password endpoint validation."""

    def test_tc028_reset_password_success(self):
        """TC028: Valid reset-password request returns 200."""
        r = requests.post(f"{BASE_URL}/reset-password", json={
            "email": SIGNUP_EMAIL,
            "dob": SIGNUP_DOB,
            "security_answer": SIGNUP_SECURITY,
            "new_password": "NewE2E@456"
        }, timeout=20)
        data = r.json()
        assert r.status_code == 200, f"Reset failed: {data}"
        assert "Password updated" in data.get("message", ""), \
            f"Unexpected message: {data.get('message')}"
        
        # Restore password for subsequent tests
        requests.post(f"{BASE_URL}/reset-password", json={
            "email": SIGNUP_EMAIL,
            "dob": SIGNUP_DOB,
            "security_answer": SIGNUP_SECURITY,
            "new_password": SIGNUP_PASSWORD
        }, timeout=20)

    def test_tc029_reset_wrong_security_answer_rejected(self):
        """TC029: Wrong security answer returns 400."""
        r = requests.post(f"{BASE_URL}/reset-password", json={
            "email": SIGNUP_EMAIL,
            "dob": SIGNUP_DOB,
            "security_answer": "wronganswer",
            "new_password": "NewE2E@456"
        }, timeout=20)
        assert r.status_code == 400, f"Expected 400 for wrong security answer, got {r.status_code}"

    def test_tc030_reset_wrong_dob_rejected(self):
        """TC030: Wrong DOB returns 400."""
        # Ensure the test sends the expected schema key "dob" instead of "date_of_birth"
        r = requests.post(f"{BASE_URL}/reset-password", json={
            "email": SIGNUP_EMAIL,
            "dob": "2000-01-01",
            "security_answer": SIGNUP_SECURITY,
            "new_password": "NewE2E@456"
        }, timeout=20)
        assert r.status_code == 400, f"Expected 400 for wrong DOB, got {r.status_code}"
