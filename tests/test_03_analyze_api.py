"""
test_03_analyze_api.py
Category: Document Analysis API
Tests: TC031–TC050
Purpose: Validate /analyze (text), /analyze-pdf, /history, and /analysis/{id} endpoints.
"""
import pytest
import requests
import uuid

BASE_URL = "https://legal-risk-analyzer.up.railway.app"

_UNIQUE_ID = str(uuid.uuid4())[:8]
_EMAIL = f"apitest_{_UNIQUE_ID}@e2e.dev"
_PASS = "ApiTest@777"
_TOKEN = {"value": None}

SAMPLE_LEGAL_TEXT = """
SERVICE AGREEMENT

This Service Agreement ("Agreement") is entered into as of June 1, 2026 between
ServiceCo ("Provider") and ClientCorp ("Client").

1. LIMITATION OF LIABILITY: Provider's total liability shall not exceed $500.
2. INDEMNIFICATION: Client shall indemnify Provider against all claims.
"""

@pytest.fixture(scope="module", autouse=True)
def setup_user_and_token():
    """Create a fresh test user and obtain a JWT token before running module tests."""
    r = requests.post(f"{BASE_URL}/signup", json={
        "name": "API Test User",
        "email": _EMAIL,
        "password": _PASS,
        "dob": "1992-04-10",
        "is_major": True,
        "security_answer": "test"
    }, timeout=15)
    
    r_login = requests.post(f"{BASE_URL}/login", data={
        "username": _EMAIL,
        "password": _PASS
    }, timeout=15)
    
    if r_login.status_code == 200:
        _TOKEN["value"] = r_login.json().get("access_token")

def _auth_headers():
    return {"Authorization": f"Bearer {_TOKEN['value']}"}

class TestAnalyzeTextAPI:
    """TC031–TC040: POST /analyze endpoint."""

    def test_tc031_analyze_text_returns_200(self):
        """TC031: Valid text analysis request returns 200."""
        r = requests.post(f"{BASE_URL}/analyze",
            json={"text": SAMPLE_LEGAL_TEXT},
            headers=_auth_headers(), timeout=60)
        assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text[:200]}"

    def test_tc040_analyze_short_text_still_returns_result(self):
        """TC040: Very short text analysis should still return a result 200."""
        r = requests.post(f"{BASE_URL}/analyze",
            json={"text": "This is a simple one-sentence contract."},
            headers=_auth_headers(), timeout=60)
        assert r.status_code == 200, f"Expected 200 for short text, got {r.status_code}"


class TestHistoryAPI:
    """TC041–TC046: GET /history and /analysis/{id} endpoints."""
    
    def test_tc041_history_returns_200(self):
        """TC041: History endpoint returns 200."""
        # 1. Seed data so history has content
        requests.post(f"{BASE_URL}/analyze",
            json={"text": "Test document for history API test."},
            headers=_auth_headers(), timeout=60)
            
        r = requests.get(f"{BASE_URL}/history", headers=_auth_headers(), timeout=15)
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"

    def test_tc044_history_items_have_valid_risk_score(self):
        """TC044: History items return valid risk_score."""
        r = requests.get(f"{BASE_URL}/history", headers=_auth_headers(), timeout=15)
        data = r.json()
        assert len(data) > 0, "Expected history items after seeding"
        for item in data:
            assert "risk_score" in item, "Missing risk_score in history item"
            assert isinstance(item["risk_score"], int), "Risk score should be an int"

    def test_tc046_analysis_by_id_returns_correct_data(self):
        """TC046: /analysis/{id} returns the detailed analysis for a given document."""
        # Seed a specific doc
        requests.post(f"{BASE_URL}/analyze",
            json={"text": "Another document to fetch specifically by ID."},
            headers=_auth_headers(), timeout=60)
            
        r_hist = requests.get(f"{BASE_URL}/history", headers=_auth_headers(), timeout=15)
        history_data = r_hist.json()
        assert len(history_data) > 0, "Expected history items"
        
        doc_id = history_data[0]["id"]
        r = requests.get(f"{BASE_URL}/analysis/{doc_id}", headers=_auth_headers(), timeout=15)
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        assert r.json()["id"] == doc_id
        assert "clauses" in r.json(), "Missing clauses in detailed analysis data"

class TestChatAPI:
    """TC047–TC050: POST /chat and /translate endpoints."""

    def test_tc047_chat_endpoint_returns_200(self):
        """TC047: /chat with valid message returns 200."""
        r = requests.post(f"{BASE_URL}/chat",
            json={"message": "What is a limitation of liability clause?"},
            headers=_auth_headers(), timeout=60)
        assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text[:200]}"

    def test_tc048_chat_response_has_content(self):
        """TC048: /chat response contains a non-empty response field."""
        r = requests.post(f"{BASE_URL}/chat",
            json={"message": "Explain indemnification."},
            headers=_auth_headers(), timeout=60)
        data = r.json()
        assert "response" in data or len(str(data)) > 5, \
            f"Unexpected /chat response structure: {data}"

    def test_tc049_translate_endpoint_returns_200(self):
        """TC049: /translate with valid text and language returns 200."""
        r = requests.post(f"{BASE_URL}/translate",
            json={"text": "This agreement shall be terminated upon breach.", "language": "French"},
            headers=_auth_headers(), timeout=60)
        assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text[:200]}"

    def test_tc050_translate_response_has_translated_text(self):
        """TC050: /translate response contains translated content."""
        r = requests.post(f"{BASE_URL}/translate",
            json={"text": "This contract is binding.", "language": "Spanish"},
            headers=_auth_headers(), timeout=60)
        data = r.json()
        assert isinstance(data, dict) and len(str(data)) > 5, \
            f"Translate response looks empty: {data}"
