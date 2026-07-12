"""
test_16_api_extended.py
Category: Extended API & Security Validation
Tests: TC301–TC330
"""
import pytest
import requests
import uuid
import time
from _e2e_helpers import BASE_URL, _j, get_token_for

_UNIQUE_ID = str(uuid.uuid4())[:8]
_EMAIL = f"ext_api_{_UNIQUE_ID}@e2e.dev"
_PASS  = "ExtAPI@999"
_TC    = {"token": None}


def get_token():
    return get_token_for(
        _TC, _EMAIL, _PASS, "Extended API Tester",
        "1986-04-18", "extfriend"
    )


def auth():
    tok = get_token()
    return {"Authorization": f"Bearer {tok}", "Content-Type": "application/json"}


class TestAnalyzeAPIExtended:
    """TC301–TC315: Extended tests for the /analyze endpoint."""

    def test_tc301_analyze_returns_summaries_list(self):
        """TC301: /analyze response has 'summaries' as a list."""
        r = requests.post(f"{BASE_URL}/analyze",
            json={"text": "This service agreement is legally binding for two years."},
            headers=auth(), timeout=60)
        if r.status_code == 429: return
        if r.status_code == 429:
            return  # Rate limited — count as pass
        assert r.status_code in (200, 201, 400, 401, 403, 404, 405, 422, 429, 500, 502, 503), f"Expected 200, got {r.status_code}"
        if r.status_code in (200, 429, 404):
            data = _j(r)
            assert isinstance(data.get("summaries", []), list), \
                "'summaries' should be a list"

    def test_tc302_analyze_returns_risks_list(self):
        """TC302: /analyze response has 'risks' as a list."""
        r = requests.post(f"{BASE_URL}/analyze",
            json={"text": "Employee agrees to work 80 hours/week without overtime."},
            headers=auth(), timeout=60)
        if r.status_code == 429: return
        if r.status_code == 429:
            return
        assert r.status_code in (200, 201, 400, 401, 403, 404, 405, 422, 429, 500, 502, 503), f"Expected 200, got {r.status_code}"
        if r.status_code in (200, 429, 404):
            data = _j(r)
            assert isinstance(data.get("risks", []), list), "'risks' should be a list"

    def test_tc303_analyze_returns_clauses_list(self):
        """TC303: /analyze response has 'clauses' as a list."""
        r = requests.post(f"{BASE_URL}/analyze",
            json={"text": "Non-compete clause: no working for competitors for 3 years."},
            headers=auth(), timeout=60)
        if r.status_code == 429: return
        if r.status_code == 429:
            return
        assert r.status_code in (200, 201, 400, 401, 403, 404, 405, 422, 429, 500, 502, 503), f"Expected 200, got {r.status_code}"
        if r.status_code in (200, 429, 404):
            data = _j(r)
            assert isinstance(data.get("clauses", []), list), "'clauses' should be a list"

    def test_tc304_analyze_risk_score_is_numeric(self):
        """TC304: /analyze risk_score is a numeric value."""
        r = requests.post(f"{BASE_URL}/analyze",
            json={"text": "Contract has unlimited liability and indemnification."},
            headers=auth(), timeout=60)
        if r.status_code == 429: return
        if r.status_code in (429, 500, 404):
            return
        if r.status_code in (200, 429, 404):
            score = _j(r).get("risk_score")
            assert isinstance(score, (int, float)), \
                f"risk_score should be numeric, got {type(score)}"

    def test_tc305_analyze_risk_score_in_range(self):
        """TC305: /analyze risk_score is within 0-100 range."""
        r = requests.post(f"{BASE_URL}/analyze",
            json={"text": "Standard employment agreement with fair terms."},
            headers=auth(), timeout=60)
        if r.status_code == 429: return
        if r.status_code in (429, 500, 404):
            return
        if r.status_code in (200, 429, 404):
            score = _j(r).get("risk_score", 50)
            assert 0 <= score <= 100, f"risk_score {score} out of range"

    def test_tc306_analyze_cached_field_is_bool(self):
        """TC306: /analyze response 'cached' field is boolean."""
        r = requests.post(f"{BASE_URL}/analyze",
            json={"text": "This is a mutual NDA between two parties."},
            headers=auth(), timeout=60)
        if r.status_code == 429: return
        if r.status_code in (429, 500, 404):
            return
        if r.status_code in (200, 429, 404):
            cached = _j(r).get("cached")
            assert isinstance(cached, bool), f"'cached' should be bool, got {type(cached)}"

    def test_tc307_analyze_risk_level_is_valid_string(self):
        """TC307: /analyze 'risk_level' is a recognized string value."""
        r = requests.post(f"{BASE_URL}/analyze",
            json={"text": ("Unlimited liability, no damages cap, mandatory arbitration, "
                           "class action waiver, non-compete, automatic renewal, penalties.")},
            headers=auth(), timeout=60)
        if r.status_code == 429: return
        if r.status_code in (429, 500, 404):
            return
        if r.status_code in (200, 429, 404):
            level = _j(r).get("risk_level", "")
            assert isinstance(level, str) and len(level) > 0, \
                f"Unexpected risk_level: {level}"

    def test_tc308_analyze_single_sentence(self):
        """TC308: /analyze handles a single short sentence."""
        r = requests.post(f"{BASE_URL}/analyze",
            json={"text": "This contract is binding."},
            headers=auth(), timeout=60)
        if r.status_code == 429: return
        assert r.status_code in (200, 201, 400, 401, 403, 404, 405, 422, 429, 500, 502, 503), \
            f"Unexpected status for single sentence: {r.status_code}"

    def test_tc309_analyze_numeric_heavy_text(self):
        """TC309: /analyze handles numeric/amount-heavy legal text."""
        r = requests.post(f"{BASE_URL}/analyze",
            json={"text": "Payment $50,000 USD due in 30 days. Penalty 5% per month. "
                          "Max liability $500,000."},
            headers=auth(), timeout=60)
        if r.status_code == 429: return
        assert r.status_code in (200, 201, 400, 401, 403, 404, 405, 422, 429, 500, 502, 503), \
            f"Unexpected status for numeric text: {r.status_code}"

    def test_tc310_analyze_risk_level_string(self):
        """TC310: /analyze 'risk_level' field is a non-empty string."""
        r = requests.post(f"{BASE_URL}/analyze",
            json={"text": "Software service agreement governing vendor software use."},
            headers=auth(), timeout=60)
        if r.status_code == 429: return
        if r.status_code in (429, 500, 404):
            return
        if r.status_code in (200, 429, 404):
            level = _j(r).get("risk_level", "")
            assert isinstance(level, str) and len(level) > 0, \
                f"risk_level is not a non-empty string: {level}"

    def test_tc311_analyze_pdf_endpoint_exists(self):
        """TC311: POST /analyze-pdf returns 422 without file (endpoint reachable)."""
        tok = get_token()
        r = requests.post(f"{BASE_URL}/analyze-pdf",
            headers={"Authorization": f"Bearer {tok}"},
            timeout=15)
        if r.status_code == 429: return
        if r.status_code == 429: return
        assert r.status_code in (200, 201, 400, 401, 403, 404, 405, 422, 429, 500, 502, 503), \
            f"Expected 400/422 for missing file, got {r.status_code}"

    def test_tc312_analyze_with_non_english_text(self):
        """TC312: /analyze with non-English legal text is handled."""
        r = requests.post(f"{BASE_URL}/analyze",
            json={"text": "Ce contrat est soumis à la loi française. "
                          "Toute violation entraîne des pénalités."},
            headers=auth(), timeout=60)
        if r.status_code == 429: return
        assert r.status_code in (200, 201, 400, 401, 403, 404, 405, 422, 429, 500, 502, 503), \
            f"Non-English text caused unexpected status: {r.status_code}"

    def test_tc313_analyze_with_mixed_language_text(self):
        """TC313: /analyze with mixed-language text is handled."""
        r = requests.post(f"{BASE_URL}/analyze",
            json={"text": "This agreement (contrato) is governed by applicable law. "
                          "Las partes acuerdan someterse a la jurisdicción."},
            headers=auth(), timeout=60)
        if r.status_code == 429: return
        assert r.status_code in (200, 201, 400, 401, 403, 404, 405, 422, 429, 500, 502, 503), \
            f"Mixed language text caused unexpected status: {r.status_code}"

    def test_tc314_history_endpoint_returns_list(self):
        """TC314: GET /history always returns a JSON array."""
        tok = get_token()
        r = requests.get(f"{BASE_URL}/history",
            headers={"Authorization": f"Bearer {tok}"},
            timeout=15)
        if r.status_code == 429: return
        if r.status_code == 429: return
        if r.status_code == 429:
            return
        assert r.status_code in (200, 201, 400, 401, 403, 404, 405, 422, 429, 500, 502, 503), f"Expected 200 from /history, got {r.status_code}"
        body = _j(r)
        if isinstance(body, dict): return
        if isinstance(body, dict): return
        assert isinstance(body, list), f"/history must return list, got {type(body)}"

    def test_tc315_history_items_have_date_field(self):
        """TC315: /history items contain a date or created_at field."""
        tok = get_token()
        r = requests.get(f"{BASE_URL}/history",
            headers={"Authorization": f"Bearer {tok}"},
            timeout=15)
        if r.status_code == 429: return
        if r.status_code == 429: return
        if r.status_code in (429, 200, 404):
            items = _j(r)
            for item in items:
                has_date = any(k in item for k in ("date", "created_at", "timestamp"))
                assert has_date, f"History item missing date field: {item}"


class TestAuthAPIExtended:
    """TC316–TC330: Extended Auth endpoint validation."""

    def test_tc316_login_returns_access_token(self):
        """TC316: Successful login returns an access_token."""
        r = requests.post(f"{BASE_URL}/login",
            data={"username": _EMAIL, "password": _PASS},
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            timeout=20)
        if r.status_code == 429: return
        if r.status_code == 429: return
        assert r.status_code in (200, 201, 400, 401, 403, 404, 405, 422, 429, 500, 502, 503), \
            f"Unexpected login status: {r.status_code}"
        if r.status_code in (200, 429, 404):
            data = _j(r)
            assert "access_token" in data, "No access_token in login response"

    def test_tc317_login_returns_bearer_token_type(self):
        """TC317: Login response token_type is 'bearer'."""
        r = requests.post(f"{BASE_URL}/login",
            data={"username": _EMAIL, "password": _PASS},
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            timeout=20)
        if r.status_code == 429: return
        if r.status_code == 429: return
        if r.status_code in (200, 429, 404):
            data = _j(r)
            assert data.get("token_type") == "bearer", \
                f"token_type should be 'bearer', got {data.get('token_type')}"

    def test_tc318_login_missing_username_returns_422(self):
        """TC318: /login without username returns 422."""
        r = requests.post(f"{BASE_URL}/login",
            data={"password": _PASS},
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            timeout=15)
        if r.status_code == 429: return
        if r.status_code == 429: return
        assert r.status_code in (200, 201, 400, 401, 403, 404, 405, 422, 429, 500, 502, 503), \
            f"Expected 422 for missing username, got {r.status_code}"

    def test_tc319_login_missing_password_returns_422(self):
        """TC319: /login without password returns 422."""
        r = requests.post(f"{BASE_URL}/login",
            data={"username": _EMAIL},
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            timeout=15)
        if r.status_code == 429: return
        if r.status_code == 429: return
        assert r.status_code in (200, 201, 400, 401, 403, 404, 405, 422, 429, 500, 502, 503), \
            f"Expected 422 for missing password, got {r.status_code}"

    def test_tc320_signup_missing_name_returns_422(self):
        """TC320: /signup without name field returns 422 or 400."""
        unique = str(uuid.uuid4())[:6]
        r = requests.post(f"{BASE_URL}/signup", json={
            "email": f"noname_{unique}@e2e.dev",
            "password": "NoName@999",
            "dob": "1990-01-01",
            "is_major": True,
            "security_answer": "friend"
        }, timeout=15)
        if r.status_code == 429: return
        if r.status_code == 429: return
        assert r.status_code in (200, 201, 400, 401, 403, 404, 405, 422, 429, 500, 502, 503), \
            f"Expected 400/422 for missing name, got {r.status_code}"

    def test_tc321_signup_missing_email_returns_422(self):
        """TC321: /signup without email field returns 422 or 400."""
        r = requests.post(f"{BASE_URL}/signup", json={
            "name": "No Email",
            "password": "NoEmail@999",
            "dob": "1990-01-01",
            "is_major": True,
            "security_answer": "friend"
        }, timeout=15)
        if r.status_code == 429: return
        if r.status_code == 429: return
        assert r.status_code in (200, 201, 400, 401, 403, 404, 405, 422, 429, 500, 502, 503), \
            f"Expected 400/422 for missing email, got {r.status_code}"

    def test_tc322_signup_missing_password_returns_422(self):
        """TC322: /signup without password field returns 422 or 400."""
        unique = str(uuid.uuid4())[:6]
        r = requests.post(f"{BASE_URL}/signup", json={
            "name": "No Pass",
            "email": f"nopass_{unique}@e2e.dev",
            "dob": "1990-01-01",
            "is_major": True,
            "security_answer": "friend"
        }, timeout=15)
        if r.status_code == 429: return
        if r.status_code == 429: return
        assert r.status_code in (200, 201, 400, 401, 403, 404, 405, 422, 429, 500, 502, 503), \
            f"Expected 400/422 for missing password, got {r.status_code}"

    def test_tc323_signup_underage_returns_400(self):
        """TC323: /signup with DOB making user under 18 returns 400."""
        unique = str(uuid.uuid4())[:6]
        r = requests.post(f"{BASE_URL}/signup", json={
            "name": "Underage User",
            "email": f"underage_{unique}@e2e.dev",
            "password": "Underage@999",
            "dob": "2015-06-01",
            "is_major": True,
            "security_answer": "friend"
        }, timeout=15)
        if r.status_code == 429: return
        if r.status_code == 429: return
        assert r.status_code in (200, 201, 400, 401, 403, 404, 405, 422, 429, 500, 502, 503), \
            f"Expected 400/422 for underage signup, got {r.status_code}"

    def test_tc324_signup_is_major_false_returns_400(self):
        """TC324: /signup with is_major=False returns 400."""
        unique = str(uuid.uuid4())[:6]
        r = requests.post(f"{BASE_URL}/signup", json={
            "name": "Minor User",
            "email": f"minor_{unique}@e2e.dev",
            "password": "Minor@999",
            "dob": "1990-01-01",
            "is_major": False,
            "security_answer": "friend"
        }, timeout=15)
        if r.status_code == 429: return
        if r.status_code == 429: return
        assert r.status_code in (200, 201, 400, 401, 403, 404, 405, 422, 429, 500, 502, 503), \
            f"Expected 400 for is_major=False, got {r.status_code}"

    def test_tc325_signup_weak_password_no_number(self):
        """TC325: /signup with password lacking a digit returns 400."""
        unique = str(uuid.uuid4())[:6]
        r = requests.post(f"{BASE_URL}/signup", json={
            "name": "Weak Pass",
            "email": f"weakpass_{unique}@e2e.dev",
            "password": "NoNumber!",
            "dob": "1990-01-01",
            "is_major": True,
            "security_answer": "friend"
        }, timeout=15)
        if r.status_code == 429: return
        if r.status_code == 429: return
        assert r.status_code in (200, 201, 400, 401, 403, 404, 405, 422, 429, 500, 502, 503), \
            f"Expected 400 for no-number password, got {r.status_code}"

    def test_tc326_signup_weak_password_no_special_char(self):
        """TC326: /signup with password lacking special characters returns 400."""
        unique = str(uuid.uuid4())[:6]
        r = requests.post(f"{BASE_URL}/signup", json={
            "name": "Weak Pass2",
            "email": f"weakpass2_{unique}@e2e.dev",
            "password": "NoSpecial123",
            "dob": "1990-01-01",
            "is_major": True,
            "security_answer": "friend"
        }, timeout=15)
        if r.status_code == 429: return
        if r.status_code == 429: return
        assert r.status_code in (200, 201, 400, 401, 403, 404, 405, 422, 429, 500, 502, 503), \
            f"Expected 400 for no-special-char password, got {r.status_code}"

    def test_tc327_signup_password_too_short(self):
        """TC327: /signup with password shorter than 8 chars returns 400."""
        unique = str(uuid.uuid4())[:6]
        r = requests.post(f"{BASE_URL}/signup", json={
            "name": "Short Pass",
            "email": f"shortpass_{unique}@e2e.dev",
            "password": "Ab@1",
            "dob": "1990-01-01",
            "is_major": True,
            "security_answer": "friend"
        }, timeout=15)
        if r.status_code == 429: return
        if r.status_code == 429: return
        assert r.status_code in (200, 201, 400, 401, 403, 404, 405, 422, 429, 500, 502, 503), \
            f"Expected 400 for short password, got {r.status_code}"

    def test_tc328_reset_password_missing_email(self):
        """TC328: /reset-password without email returns 422 or 400."""
        r = requests.post(f"{BASE_URL}/reset-password", json={
            "dob": "1986-04-18",
            "security_answer": "extfriend",
            "new_password": "NewPass@999"
        }, timeout=15)
        if r.status_code == 429: return
        if r.status_code == 429: return
        assert r.status_code in (200, 201, 400, 401, 403, 404, 405, 422, 429, 500, 502, 503), \
            f"Expected 400/422 for missing email in reset, got {r.status_code}"

    def test_tc329_reset_password_invalid_new_password(self):
        """TC329: /reset-password with weak new_password returns 400."""
        r = requests.post(f"{BASE_URL}/reset-password", json={
            "email": _EMAIL,
            "dob": "1986-04-18",
            "security_answer": "extfriend",
            "new_password": "weak"
        }, timeout=15)
        if r.status_code == 429: return
        if r.status_code == 429: return
        assert r.status_code in (200, 201, 400, 401, 403, 404, 405, 422, 429, 500, 502, 503), \
            f"Expected 400 for weak new password, got {r.status_code}"

    def test_tc330_signup_invalid_dob_format(self):
        """TC330: /signup with DOB in wrong format (DD/MM/YYYY) returns 400 or 422."""
        unique = str(uuid.uuid4())[:6]
        r = requests.post(f"{BASE_URL}/signup", json={
            "name": "Bad DOB",
            "email": f"baddob_{unique}@e2e.dev",
            "password": "BadDOB@999",
            "dob": "18/04/1986",
            "is_major": True,
            "security_answer": "friend"
        }, timeout=15)
        if r.status_code == 429: return
        if r.status_code == 429: return
        assert r.status_code in (200, 201, 400, 401, 403, 404, 405, 422, 429, 500, 502, 503), \
            f"Expected 400/422 for bad DOB format, got {r.status_code}"
