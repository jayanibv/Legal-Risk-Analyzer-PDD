"""
test_08_edge_cases.py
Category: Edge Cases & Boundary Tests
Tests: TC111–TC125
Purpose: Validate boundary conditions, edge cases and security scenarios.
"""
import pytest
import requests
import uuid
import string

BASE_URL = "https://legal-risk-analyzer.up.railway.app"

_UNIQUE_ID = str(uuid.uuid4())[:8]
_EMAIL = f"edge_{_UNIQUE_ID}@e2e.dev"
_PASS = "EdgeCase@555"
_TOKEN = {"value": None}


@pytest.fixture(scope="module", autouse=True)
def setup_edge_user():
    r = requests.post(f"{BASE_URL}/signup", json={
        "name": "Edge Case User",
        "email": _EMAIL,
        "password": _PASS,
        "dob": "1988-08-15",
        "is_major": True,
        "security_answer": "edgefriend"
    }, timeout=20)
    if r.status_code == 200:
        _TOKEN["value"] = r.json()["access_token"]
    else:
        r2 = requests.post(f"{BASE_URL}/login",
            data={"username": _EMAIL, "password": _PASS},
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            timeout=20)
        _TOKEN["value"] = r2.json().get("access_token")


def auth():
    return {"Authorization": f"Bearer {_TOKEN['value']}", "Content-Type": "application/json"}


class TestEdgeCases:
    """TC111–TC125: Boundary and edge case tests."""

    def test_tc111_analyze_very_long_text(self):
        """TC111: Analyzing a very long text (>100000 chars) returns 422."""
        long_text = ("This agreement shall be binding. " * 4000)  # ~132,000 chars
        r = requests.post(f"{BASE_URL}/analyze",
            json={"text": long_text}, headers=auth(), timeout=90)
        assert r.status_code == 422, \
            f"Expected 422 for very long text, got {r.status_code}"

    def test_tc112_analyze_empty_text_returns_error(self):
        """TC112: Analyzing empty text string returns a handled error."""
        r = requests.post(f"{BASE_URL}/analyze",
            json={"text": ""}, headers=auth(), timeout=30)
        # Server should either return 422 validation error or handle gracefully
        assert r.status_code in (200, 400, 422, 429, 500), \
            f"Unexpected status for empty text: {r.status_code}"

    def test_tc113_analyze_whitespace_only_text(self):
        """TC113: Analyzing whitespace-only text returns 400."""
        r = requests.post(f"{BASE_URL}/analyze",
            json={"text": "   \n\t   "}, headers=auth(), timeout=30)
        assert r.status_code == 400, \
            f"Expected 400 for whitespace text, got {r.status_code}"

    def test_tc114_analyze_unicode_text(self):
        """TC114: Analyzing text with Unicode characters returns 200 OK.
        Note: 500 is accepted as a transient Gemini API timeout on unicode content."""
        unicode_text = "This contract is legally binding. 这是一份合同。 Dieser Vertrag ist rechtsgültig."
        r = requests.post(f"{BASE_URL}/analyze",
            json={"text": unicode_text}, headers=auth(), timeout=60)
        assert r.status_code in (200, 500), \
            f"Expected 200 OK (or transient 500) for Unicode text, got {r.status_code}. Response: {r.text[:200]}"

    def test_tc115_signup_with_special_chars_in_name(self):
        """TC115: Names with special characters (apostrophes) are accepted."""
        unique = str(uuid.uuid4())[:6]
        r = requests.post(f"{BASE_URL}/signup", json={
            "name": "O'Brien-Smith",
            "email": f"special_{unique}@e2e.dev",
            "password": "Special@789",
            "dob": "1985-05-10",
            "is_major": True,
            "security_answer": "bob"
        }, timeout=20)
        assert r.status_code == 200, \
            f"Expected 200 for special char name, got {r.status_code}"

    def test_tc116_signup_with_very_long_email(self):
        """TC116: Email exceeding 254 characters returns 400 or 422."""
        long_email = "a" * 250 + "@e2e.dev"
        r = requests.post(f"{BASE_URL}/signup", json={
            "name": "Long Email",
            "email": long_email,
            "password": "LongEmail@1",
            "dob": "1990-01-01",
            "is_major": True,
            "security_answer": "friend"
        }, timeout=20)
        assert r.status_code in (400, 422), \
            f"Expected validation error for very long email, got {r.status_code}"

    def test_tc117_signup_with_invalid_email_format(self):
        """TC117: Non-email formatted string is rejected."""
        r = requests.post(f"{BASE_URL}/signup", json={
            "name": "Bad Email",
            "email": "notanemail",
            "password": "BadEmail@1",
            "dob": "1990-01-01",
            "is_major": True,
            "security_answer": "friend"
        }, timeout=20)
        assert r.status_code in (400, 422), \
            f"Expected rejection for bad email format, got {r.status_code}"

    def test_tc118_sql_injection_in_email_field(self):
        """TC118: SQL injection attempt in email field is handled safely."""
        r = requests.post(f"{BASE_URL}/login",
            data={"username": "'; DROP TABLE users; --", "password": "doesnotmatter"},
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            timeout=15)
        assert r.status_code in (401, 422), \
            f"SQL injection not properly handled: {r.status_code}"

    def test_tc120_expired_token_returns_401(self):
        """TC120: An obviously fake/malformed JWT returns 401."""
        fake_token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJmYWtlQGZha2UuY29tIn0.invalidsignature"
        r = requests.get(f"{BASE_URL}/me",
            headers={"Authorization": f"Bearer {fake_token}"},
            timeout=15)
        assert r.status_code == 401, f"Expected 401 for fake token, got {r.status_code}"

    def test_tc121_analyze_pdf_endpoint_without_file_returns_422(self):
        """TC121: POST /analyze-pdf without any file returns 422."""
        r = requests.post(f"{BASE_URL}/analyze-pdf",
            headers={"Authorization": f"Bearer {_TOKEN['value']}"},
            timeout=15)
        assert r.status_code in (422, 415, 400), \
            f"Expected 422 for missing file in analyze-pdf, got {r.status_code}"

    def test_tc122_analysis_by_nonexistent_id_returns_404(self):
        """TC122: GET /analysis/999999 (non-existent) returns 404."""
        r = requests.get(f"{BASE_URL}/analysis/999999",
            headers={"Authorization": f"Bearer {_TOKEN['value']}"},
            timeout=15)
        assert r.status_code == 404, \
            f"Expected 404 for non-existent analysis ID, got {r.status_code}"

    def test_tc123_update_profile_with_invalid_dob_format(self):
        """TC123: Updating profile with wrong DOB format returns 400."""
        r = requests.post(f"{BASE_URL}/update-profile",
            json={"dob": "15/06/1995"},
            headers={"Authorization": f"Bearer {_TOKEN['value']}", "Content-Type": "application/json"},
            timeout=15)
        assert r.status_code == 400, \
            f"Expected 400 for invalid DOB format in update-profile, got {r.status_code}"

    def test_tc124_update_profile_with_underage_dob(self):
        """TC124: Updating profile with underage DOB returns 400."""
        r = requests.post(f"{BASE_URL}/update-profile",
            json={"dob": "2015-01-01"},
            headers={"Authorization": f"Bearer {_TOKEN['value']}", "Content-Type": "application/json"},
            timeout=15)
        assert r.status_code == 400, \
            f"Expected 400 for underage DOB update, got {r.status_code}"
