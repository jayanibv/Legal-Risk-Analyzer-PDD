"""
dast_05_injection.py â€” Category 6: Injection Detection (SQLi / NoSQLi)
Detection only â€” NOT exploitation.
Probes login, signup, analyze, chat with injection payloads.
Flags: HTTP 500, anomalous error body, timing delta > 3s vs baseline.
"""
import sys, os, time, json
sys.path.insert(0, os.path.dirname(__file__))
from dast_config import (BASE_URL, safe_get, safe_post, auth_header,
                          signup_and_login, now_iso, masked)

# â”€â”€â”€ Payloads (detection only, no actual data extraction) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
SQLI_PAYLOADS = [
    "' OR '1'='1",
    "' OR 1=1--",
    "'; DROP TABLE users;--",
    "\" OR \"1\"=\"1",
    "1' AND SLEEP(3)--",           # time-based blind
    "' UNION SELECT NULL--",
    "admin'--",
    "' OR 'x'='x",
]

NOSQLI_PAYLOADS = [
    '{"$gt": ""}',
    '{"$ne": null}',
    '{"$where": "1==1"}',
]

GENERIC_SPECIAL = [
    "<script>alert(1)</script>",   # XSS in body fields
    "{{7*7}}",                     # SSTI probe
    "%00null",                     # null byte
    "A" * 5000,                    # oversized input
]

ALL_PAYLOADS = (
    [(p, "sqli")    for p in SQLI_PAYLOADS]
    + [(p, "nosqli") for p in NOSQLI_PAYLOADS]
    + [(p, "special") for p in GENERIC_SPECIAL]
)


def time_baseline(url, headers, method="POST", body=None):
    """Measure median of 3 clean requests."""
    times = []
    for _ in range(3):
        r, ms = safe_post(url, headers=headers, json_body=body) \
                if method == "POST" else safe_get(url, headers=headers)
        if r is not None:
            times.append(ms)
        time.sleep(0.2)
    return sum(times) / len(times) if times else 1000


def probe_inject(endpoint_label, url, method, headers, field, payload, ptype, baseline_ms):
    if method == "POST":
        body = {field: payload}
        r, ms = safe_post(url, headers=headers, json_body=body)
    else:
        r, ms = safe_get(url + f"?{field}={payload}", headers=headers)

    status = r.status_code if r is not None else "ERR"

    # Detection signals
    is_500    = isinstance(status, int) and status == 500
    is_timing = ms > baseline_ms + 2500   # > baseline + 2.5s suggests SLEEP-based
    body_text = (r.text[:300] if r is not None else "").lower()
    is_error_leak = any(kw in body_text for kw in [
        "syntax error", "sql", "sqlite", "traceback", "exception",
        "psycopg", "operationalerror", "uncaught", "stacktrace"
    ])

    is_finding = is_500 or is_timing or is_error_leak
    severity   = "HIGH" if is_finding else "INFO"

    note_parts = []
    if is_500:      note_parts.append("HTTP 500")
    if is_timing:   note_parts.append(f"timing anomaly: {ms}ms vs baseline {baseline_ms:.0f}ms")
    if is_error_leak: note_parts.append("error/stack info in response")
    note = "; ".join(note_parts) if note_parts else f"clean {status}"

    return {
        "endpoint": endpoint_label, "method": method,
        "role": f"inject:{ptype}", "status": status,
        "expected_status": "!500 no-leak",
        "finding": is_finding, "severity": severity,
        "response_time_ms": ms, "test_category": "injection",
        "note": f"field={field} payload_type={ptype}: {note}",
        "timestamp": now_iso(),
    }


def run(tokens: dict):
    records = []
    tok = tokens.get("valid_user")
    print("\n" + "=" * 65)
    print("  DAST â€” Category 6: Injection Detection")
    print("=" * 65)

    if not tok:
        tok = signup_and_login("_inj")

    hdrs = auth_header(tok) if tok else {"Content-Type": "application/json"}
    noauth_hdrs = {"Content-Type": "application/json"}

    # â”€â”€ LOGIN endpoint (no auth) â€” username/password fields â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    print("\n  [*] Probing POST /login (username field)...")
    login_url  = f"{BASE_URL}/login"
    login_hdrs = {"Content-Type": "application/x-www-form-urlencoded"}

    # baseline â€” intentionally wrong creds
    base_r, base_ms = safe_post(login_url, headers=login_hdrs,
                                data="username=baseline@test.com&password=wrong")
    baseline_login = base_ms or 500

    for payload, ptype in ALL_PAYLOADS[:12]:   # limit to first 12 payloads
        r, ms = safe_post(login_url, headers=login_hdrs,
                          data=f"username={payload}&password=wrong")
        status = r.status_code if r is not None else "ERR"
        is_500 = isinstance(status, int) and status == 500
        is_timing = ms > baseline_login + 2500
        body_text = (r.text[:200] if r is not None else "").lower()
        is_error  = any(k in body_text for k in ["traceback", "sql", "syntax", "psycopg"])
        is_finding = is_500 or is_timing or is_error
        flag = "âœ— FINDING" if is_finding else "  âœ“ ok"
        print(f"  {flag}  POST /login [username] [{ptype}] â†’ {status}  {ms}ms")
        records.append({
            "endpoint": "/login", "method": "POST",
            "role": f"no-auth:inject:{ptype}", "status": status,
            "expected_status": 401, "finding": is_finding,
            "severity": "HIGH" if is_finding else "INFO",
            "response_time_ms": ms, "test_category": "injection",
            "note": f"SQLi/inject in username field; type={ptype}; status={status}",
            "timestamp": now_iso(),
        })
        time.sleep(0.3)

    # â”€â”€ SIGNUP endpoint â€” name / email fields â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    print("\n  [*] Probing POST /signup (email field)...")
    signup_url = f"{BASE_URL}/signup"
    for payload in SQLI_PAYLOADS[:5]:
        ptype = "sqli"
        body = {
            "name": "InjectionTest",
            "email": payload + "@test.com",
            "password": "InjTest@1",
            "dob": "1990-01-01",
            "is_major": True,
            "security_answer": "x"
        }
        r, ms = safe_post(signup_url, json_body=body)
        status = r.status_code if r is not None else "ERR"
        is_500 = isinstance(status, int) and status == 500
        body_text = (r.text[:200] if r is not None else "").lower()
        is_error  = any(k in body_text for k in ["traceback", "sql", "syntax"])
        is_finding = is_500 or is_error
        flag = "âœ— FINDING" if is_finding else "  âœ“ ok"
        print(f"  {flag}  POST /signup [email] [{ptype}] â†’ {status}  {ms}ms")
        records.append({
            "endpoint": "/signup", "method": "POST",
            "role": f"no-auth:inject:{ptype}", "status": status,
            "expected_status": "422/400", "finding": is_finding,
            "severity": "HIGH" if is_finding else "INFO",
            "response_time_ms": ms, "test_category": "injection",
            "note": f"Inject in email field; type={ptype}; status={status}",
            "timestamp": now_iso(),
        })
        time.sleep(0.3)

    # â”€â”€ /analyze endpoint (authenticated) â€” text field â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    if tok:
        print("\n  [*] Probing POST /analyze (text field)...")
        analyze_url = f"{BASE_URL}/analyze"
        payloads_to_test = [(p, "sqli") for p in SQLI_PAYLOADS[:4]] + [(p, "special") for p in GENERIC_SPECIAL[:2]]
        for payload, ptype in payloads_to_test:
            r, ms = safe_post(analyze_url, headers=hdrs,
                              json_body={"text": payload})
            status = r.status_code if r is not None else "ERR"
            is_500 = isinstance(status, int) and status == 500
            body_text = (r.text[:200] if r is not None else "").lower()
            is_error  = any(k in body_text for k in ["traceback", "sql", "syntax"])
            is_finding = is_500 or is_error
            flag = "âœ— FINDING" if is_finding else "  âœ“ ok"
            print(f"  {flag}  POST /analyze [text] [{ptype}] â†’ {status}  {ms}ms")
            records.append({
                "endpoint": "/analyze", "method": "POST",
                "role": f"user:inject:{ptype}", "status": status,
                "expected_status": 200, "finding": is_finding,
                "severity": "MEDIUM" if is_finding else "INFO",
                "response_time_ms": ms, "test_category": "injection",
                "note": f"Inject in analyze text field; type={ptype}; status={status}",
                "timestamp": now_iso(),
            })
            time.sleep(0.4)

    findings = [r for r in records if r["finding"]]
    print(f"\n  Results: {len(records)} probes, {len(findings)} FINDINGS")
    return records


if __name__ == "__main__":
    t = signup_and_login("_inj_main")
    run({"valid_user": t})

