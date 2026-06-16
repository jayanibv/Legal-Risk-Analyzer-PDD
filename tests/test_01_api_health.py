"""
test_01_api_health.py
Category: API Health & Connectivity
Tests: TC001–TC010
Purpose: Validate that the backend API is reachable and returns correct responses.
"""
import requests
import pytest

BASE_URL = "https://legal-risk-analyzer.up.railway.app"
FRONTEND_URL = "https://legal-risk-analyzer.up.railway.app"


class TestAPIHealth:
    """TC001–TC010: Backend API connectivity and root endpoint checks."""

    def test_tc001_api_root_returns_200(self):
        """TC001: GET / returns HTTP 200."""
        r = requests.get(f"{BASE_URL}/", timeout=15)
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"

    def test_tc002_api_root_returns_json(self):
        """TC002: Root endpoint returns valid JSON body."""
        r = requests.get(f"{BASE_URL}/", timeout=15)
        data = r.json()
        assert isinstance(data, dict), "Response should be a JSON object"

    def test_tc003_api_root_status_online(self):
        """TC003: Root JSON contains status='online'."""
        r = requests.get(f"{BASE_URL}/", timeout=15)
        data = r.json()
        assert data.get("status") == "online", f"Expected status 'online', got {data.get('status')}"

    def test_tc004_api_root_message_present(self):
        """TC004: Root JSON contains a non-empty message field."""
        r = requests.get(f"{BASE_URL}/", timeout=15)
        data = r.json()
        assert "message" in data, "Root response missing 'message' key"
        assert len(data.get("message", "")) > 0, "Root message is empty"

    def test_tc005_api_root_name_reference(self):
        """TC005: Root JSON message mentions 'Legal Risk Analyzer'."""
        r = requests.get(f"{BASE_URL}/", timeout=15)
        data = r.json()
        assert "Legal Risk Analyzer" in data.get("message", ""), \
            "Root message should reference 'Legal Risk Analyzer'"

    def test_tc006_api_response_time_under_10s(self):
        """TC006: Root endpoint responds within 10 seconds (accounts for Railway cold-start)."""
        r = requests.get(f"{BASE_URL}/", timeout=15)
        assert r.elapsed.total_seconds() < 10, \
            f"Response took {r.elapsed.total_seconds():.2f}s, expected < 10s"

    def test_tc007_unauthorized_analyze_returns_401(self):
        """TC007: POST /analyze without token returns 401/403."""
        r = requests.post(
            f"{BASE_URL}/analyze",
            json={"text": "test"},
            timeout=15
        )
        assert r.status_code in (401, 403), \
            f"Expected 401/403 for unauthorized request, got {r.status_code}"



    def test_tc009_unauthorized_me_returns_401(self):
        """TC009: GET /me without token returns 401/403."""
        r = requests.get(f"{BASE_URL}/me", timeout=15)
        assert r.status_code in (401, 403), \
            f"Expected 401/403 for unauthorized /me, got {r.status_code}"

    def test_tc010_unauthorized_chat_returns_401(self):
        """TC010: POST /chat without token returns 401/403."""
        r = requests.post(
            f"{BASE_URL}/chat",
            json={"message": "hello"},
            timeout=15
        )
        assert r.status_code in (401, 403), \
            f"Expected 401/403 for unauthorized /chat, got {r.status_code}"
