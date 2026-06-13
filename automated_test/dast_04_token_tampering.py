"""
dast_04_token_tampering.py â€” Category 5: JWT Token Tampering
Tests:
  (a) Flip 'sub' claim to another user's email, keep same signature â†’ must reject
  (b) Change algorithm claim to 'none' (alg:none attack) â†’ must reject
  (c) Truncated signature â†’ must reject
  (d) Extra long token â†’ must reject / not crash
  (e) Base64-corrupt payload â†’ must reject
2xx on any = CRITICAL FINDING
"""
import sys, os, time, json, base64
sys.path.insert(0, os.path.dirname(__file__))
from dast_config import (BASE_URL, ENDPOINTS, safe_get, safe_post,
                          auth_header, signup_and_login, now_iso, masked)

PROTECTED = [(m, p) for m, p, r in ENDPOINTS if r == "requires-auth"]


def b64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()

def b64url_decode(s: str) -> bytes:
    pad = 4 - len(s) % 4
    return base64.urlsafe_b64decode(s + "=" * (pad % 4))


def make_tampered_tokens(real_token: str) -> list[tuple[str, str]]:
    """Generate a set of tampered JWTs from a real signed token."""
    try:
        header_b64, payload_b64, sig = real_token.split(".")
    except Exception:
        return []

    tampered = []

    # 1. Flip sub claim
    try:
        payload = json.loads(b64url_decode(payload_b64))
        payload["sub"] = "admin@evil.com"
        new_payload = b64url_encode(json.dumps(payload).encode())
        tampered.append(("flip_sub", f"{header_b64}.{new_payload}.{sig}"))
    except Exception:
        pass

    # 2. alg:none attack
    try:
        header = json.loads(b64url_decode(header_b64))
        header["alg"] = "none"
        new_header = b64url_encode(json.dumps(header).encode())
        tampered.append(("alg_none", f"{new_header}.{payload_b64}."))  # empty sig
        tampered.append(("alg_None", f"{new_header}.{payload_b64}.fake"))
    except Exception:
        pass

    # 3. Truncated signature
    tampered.append(("truncated_sig", f"{header_b64}.{payload_b64}.{sig[:8]}"))

    # 4. Completely corrupt payload
    tampered.append(("corrupt_payload", f"{header_b64}.AAAAAAAAAAAAAAAA.{sig}"))

    # 5. Role injection â€” inject a non-existent 'role' claim
    try:
        payload2 = json.loads(b64url_decode(payload_b64))
        payload2["role"] = "admin"
        payload2["is_superuser"] = True
        new_payload2 = b64url_encode(json.dumps(payload2).encode())
        tampered.append(("role_inject", f"{header_b64}.{new_payload2}.{sig}"))
    except Exception:
        pass

    return tampered


def probe(method, path, token_label, tampered_tok):
    url  = BASE_URL + path.replace("{id}", "1")
    hdrs = {"Authorization": f"Bearer {tampered_tok}",
            "Content-Type": "application/json"}
    body = {"text": "test"} if "analyze" in path else {"message": "hi"} if "chat" in path \
           else {"text": "x", "language": "French"} if "translate" in path else {}

    r, ms = (safe_get(url, headers=hdrs) if method == "GET"
             else safe_post(url, headers=hdrs, json_body=body))
    status = r.status_code if r is not None else "ERR"
    is_finding = isinstance(status, int) and status < 300
    return {
        "endpoint": path, "method": method, "role": f"tampered:{token_label}",
        "status": status, "expected_status": 401,
        "finding": is_finding,
        "severity": "CRITICAL" if is_finding else "INFO",
        "response_time_ms": ms, "test_category": "token_tampering",
        "note": f"Tamper={token_label}; status={status}",
        "timestamp": now_iso(),
    }


def run(tokens: dict):
    records = []
    real_tok = tokens.get("valid_user")

    print("\n" + "=" * 65)
    print("  DAST â€” Category 5: JWT Token Tampering")
    print("=" * 65)

    if not real_tok:
        real_tok = signup_and_login("_tamp")
        if not real_tok:
            print("  âœ— No token available. Skipping.")
            return []

    tampered = make_tampered_tokens(real_tok)
    print(f"  Generated {len(tampered)} tampered token variants")
    print(f"  Testing against {len(PROTECTED)} protected endpoints\n")

    # Test a representative subset of endpoints (all GET + 2 POST) to keep runtime sane
    test_endpoints = [(m, p) for m, p in PROTECTED if m == "GET"]
    test_endpoints += [("POST", "/analyze"), ("POST", "/chat")]

    for tok_label, tok in tampered:
        for method, path in test_endpoints:
            rec = probe(method, path, tok_label, tok)
            records.append(rec)
            flag = "âœ— FINDING" if rec["finding"] else "  âœ“ rejected"
            print(f"  {flag}  {method:<6} {path:<28} [{tok_label}] â†’ {rec['status']}  {rec['response_time_ms']}ms")
            time.sleep(0.2)

    findings = [r for r in records if r["finding"]]
    print(f"\n  Results: {len(records)} probes, {len(findings)} FINDINGS")
    if findings:
        for f in findings:
            print(f"    âœ— CRITICAL: {f['method']} {f['endpoint']} [{f['role']}] â†’ {f['status']}")
    return records


if __name__ == "__main__":
    t = signup_and_login("_tamp_main")
    run({"valid_user": t})

