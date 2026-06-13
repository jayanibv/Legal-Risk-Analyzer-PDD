"""
dast_config.py
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
Central config loaded by all DAST test modules.
Base URL is read from input.json (sourced from api.js / frontend/.env).
Tokens are obtained at runtime â€” never printed in full, never written to disk.
"""

import json, os, datetime, time, uuid, requests

# â”€â”€â”€ Load config â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
_cfg_path = os.path.join(os.path.dirname(__file__), "input.json")
with open(_cfg_path) as f:
    _cfg = json.load(f)

BASE_URL = _cfg["baseUrl"].rstrip("/")

# â”€â”€â”€ Endpoint inventory (discovered from main.py + api.js) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
# Format: (method, path, access_rule, skip_from_destructive)
ENDPOINTS = [
    # PUBLIC â€” no auth needed
    ("GET",  "/",                "public"),
    ("POST", "/signup",          "public"),
    ("POST", "/login",           "public"),
    ("POST", "/reset-password",  "public"),

    # FastAPI auto-generated docs (public by default in FastAPI)
    ("GET",  "/docs",            "public"),
    ("GET",  "/openapi.json",    "public"),
    ("GET",  "/redoc",           "public"),

    # PROTECTED â€” requires valid JWT
    ("GET",  "/me",              "requires-auth"),
    ("POST", "/update-profile",  "requires-auth"),
    ("POST", "/analyze",         "requires-auth"),
    ("POST", "/analyze-pdf",     "requires-auth"),
    ("GET",  "/history",         "requires-auth"),
    ("GET",  "/analysis/{id}",   "requires-auth"),
    ("POST", "/chat",            "requires-auth"),
    ("POST", "/translate",       "requires-auth"),
]

# â”€â”€â”€ Runtime token store (populated by dast_01_discovery.py) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
# Tokens live in memory only; never written to disk.
TOKENS = {
    "valid_user":   None,   # legitimate signed-in user
    "other_user":   None,   # second user for IDOR probing
}

# â”€â”€â”€ Shared helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
UNIQUE = str(uuid.uuid4())[:8]

def masked(token: str) -> str:
    """Return a safe partial view of a token (first 10 chars + ...) for logging."""
    if not token:
        return "<none>"
    return token[:10] + "..." + token[-4:]

def now_iso() -> str:
    return datetime.datetime.utcnow().isoformat() + "Z"

def safe_get(url, headers=None, timeout=12):
    try:
        t0 = time.time()
        r = requests.get(url, headers=headers or {}, timeout=timeout)
        ms = round((time.time() - t0) * 1000)
        return r, ms
    except Exception as e:
        return None, 0

def safe_post(url, headers=None, json_body=None, data=None, files=None, timeout=12):
    try:
        t0 = time.time()
        r = requests.post(url, headers=headers or {}, json=json_body,
                          data=data, files=files, timeout=timeout)
        ms = round((time.time() - t0) * 1000)
        return r, ms
    except Exception as e:
        return None, 0

def auth_header(token: str) -> dict:
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

def signup_and_login(suffix="") -> str | None:
    """Create a throwaway user and return its JWT. Returns None on failure."""
    uid = str(uuid.uuid4())[:8]
    email = f"dast_{uid}{suffix}@sectest.dev"
    pw    = "DastSec@777"
    r, _ = safe_post(f"{BASE_URL}/signup", json_body={
        "name": f"DAST Tester {uid}",
        "email": email,
        "password": pw,
        "dob": "1992-05-10",
        "is_major": True,
        "security_answer": "dasttester"
    })
    if r and r.status_code == 200:
        return r.json().get("access_token")
    # Fall back to login if already exists
    r2, _ = safe_post(f"{BASE_URL}/login",
        data=f"username={email}&password={pw}",
        headers={"Content-Type": "application/x-www-form-urlencoded"})
    if r2 and r2.status_code == 200:
        return r2.json().get("access_token")
    return None

