"""
dast_02_authn_bypass.py â€” Category 1: Authentication Bypass
Tests every protected endpoint with:
  (a) no token
  (b) malformed token
  (c) expired/fake token
2xx on any = FINDING
"""
import sys, os, time, json
sys.path.insert(0, os.path.dirname(__file__))
from dast_config import (BASE_URL, ENDPOINTS, safe_get, safe_post,
                          auth_header, now_iso, masked)

PROTECTED = [(m, p, r) for m, p, r in ENDPOINTS if r == "requires-auth"]

# A structurally valid but unsigned/tampered JWT
FAKE_TOKEN = (
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"
    ".eyJzdWIiOiJoYWNrZXJAZXZpbC5jb20iLCJleHAiOjE3MDAwMDAwMDB9"
    ".invalidsignatureXXXXXXXXXXXXXXXXXXXXXXXX"
)

EMPTY_TOKEN   = ""
MALFORMED_TOK = "not.a.jwt"
EXPIRED_TOK   = (          # valid structure, past exp
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"
    ".eyJzdWIiOiJ0ZXN0QHRlc3QuY29tIiwiZXhwIjoxNjAwMDAwMDAwfQ"
    ".SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
)

def probe(method, path, token_label, token, extra_body=None):
    url = BASE_URL + path.replace("{id}", "1")
    headers = {}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    headers["Content-Type"] = "application/json"

    body = extra_body or {}
    if method == "GET":
        r, ms = safe_get(url, headers=headers)
    else:
        r, ms = safe_post(url, headers=headers, json_body=body)

    status = r.status_code if r is not None else "ERR"
    is_finding = isinstance(status, int) and status < 300
    return {
        "endpoint": path,
        "method": method,
        "role": f"no-auth:{token_label}",
        "status": status,
        "expected_status": 401,
        "finding": is_finding,
        "severity": "CRITICAL" if is_finding else "INFO",
        "response_time_ms": ms,
        "test_category": "authn_bypass",
        "note": f"Token type={token_label}; got {status}; finding={is_finding}",
        "timestamp": now_iso(),
    }

def run(savepoint=None):
    records = []
    print("\n" + "=" * 65)
    print("  DAST â€” Category 1: AuthN Bypass")
    print("=" * 65)
    print(f"  Protected endpoints: {len(PROTECTED)}")
    print(f"  Token scenarios    : no-token, malformed, expired/fake\n")

    cases = [
        ("no_token",   None),
        ("malformed",  MALFORMED_TOK),
        ("expired",    EXPIRED_TOK),
        ("wrong_sig",  FAKE_TOKEN),
    ]

    for method, path, rule in PROTECTED:
        for tok_label, tok in cases:
            body = _default_body(path, method)
            rec = probe(method, path, tok_label, tok, body)
            records.append(rec)
            flag = "âœ— FINDING" if rec["finding"] else "  âœ“ blocked"
            print(f"  {flag}  {method:<6} {path:<30} [{tok_label}] â†’ {rec['status']}  {rec['response_time_ms']}ms")
            time.sleep(0.25)

    total   = len(records)
    findings = [r for r in records if r["finding"]]
    print(f"\n  Results: {total} probes, {len(findings)} FINDINGS")
    if findings:
        print("  FINDINGS:")
        for f in findings:
            print(f"    âœ— {f['method']} {f['endpoint']} [{f['role']}] â†’ {f['status']}")
    return records


def _default_body(path, method):
    """Return a minimal valid body so the server doesn't 422 before auth check."""
    if method == "GET":
        return None
    bodies = {
        "/analyze":       {"text": "test clause"},
        "/analyze-pdf":   None,
        "/chat":          {"message": "hello"},
        "/translate":     {"text": "clause", "language": "French"},
        "/update-profile": {"name": "x"},
    }
    return bodies.get(path, {})


if __name__ == "__main__":
    run()

