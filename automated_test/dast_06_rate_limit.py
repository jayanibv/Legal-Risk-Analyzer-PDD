"""
dast_06_rate_limit.py â€” Category 7: Rate Limiting
Sends a bounded burst (~30 requests) to login endpoint.
Confirms whether a 429 (Too Many Requests) is returned.
Absence of 429 = FINDING (no rate limit in place).
"""
import sys, os, time, json
sys.path.insert(0, os.path.dirname(__file__))
from dast_config import BASE_URL, safe_post, now_iso

BURST_COUNT  = 30
BURST_DELAY  = 0.1    # 100ms between requests â†’ 10 req/s burst
LOGIN_URL    = f"{BASE_URL}/login"
LOGIN_HDRS   = {"Content-Type": "application/x-www-form-urlencoded"}

def run():
    records = []
    print("\n" + "=" * 65)
    print("  DAST â€” Category 7: Rate Limiting")
    print("=" * 65)
    print(f"  Endpoint : POST /login")
    print(f"  Burst    : {BURST_COUNT} requests @ {int(1/BURST_DELAY)} req/s\n")

    statuses = []
    times    = []
    got_429  = False

    for i in range(1, BURST_COUNT + 1):
        r, ms = safe_post(LOGIN_URL, headers=LOGIN_HDRS,
                          data="username=ratelimit@test.com&password=wrong")
        status = r.status_code if r is not None else "ERR"
        statuses.append(status)
        times.append(ms)
        if status == 429:
            got_429 = True
        sys.stdout.write(f"\r  [{i:02d}/{BURST_COUNT}] latest={status}  429_seen={got_429}   ")
        sys.stdout.flush()
        time.sleep(BURST_DELAY)

    print()  # newline after progress

    count_429 = statuses.count(429)
    count_401 = statuses.count(401)
    count_5xx = sum(1 for s in statuses if isinstance(s, int) and s >= 500)
    avg_ms    = round(sum(times) / len(times)) if times else 0

    is_finding = not got_429
    severity   = "HIGH" if is_finding else "INFO"

    summary = (
        f"{BURST_COUNT} requests sent. "
        f"401={count_401} 429={count_429} 5xx={count_5xx}. "
        f"Avg latency={avg_ms}ms. "
        + ("NO rate limiting detected â€” brute-force logins are unrestricted!"
           if is_finding else "Rate limiting confirmed via 429.")
    )

    flag = "âœ— FINDING" if is_finding else "  âœ“ rate limited"
    print(f"\n  {flag}  â€” {summary}")

    rec = {
        "endpoint": "/login",
        "method": "POST",
        "role": "no-auth",
        "status": f"401Ã—{count_401} 429Ã—{count_429}",
        "expected_status": 429,
        "finding": is_finding,
        "severity": severity,
        "response_time_ms": avg_ms,
        "test_category": "rate_limiting",
        "note": summary,
        "timestamp": now_iso(),
    }
    records.append(rec)

    # Also test /signup burst (subset)
    print(f"\n  [*] Burst test on POST /signup (10 requests)...")
    signup_429 = False
    for i in range(10):
        import uuid
        uid = str(uuid.uuid4())[:6]
        body = {"name": "RL", "email": f"rl_{uid}@rl.dev",
                "password": "RL@Test123", "dob": "1990-01-01",
                "is_major": True, "security_answer": "x"}
        r, ms = safe_post(f"{BASE_URL}/signup", json_body=body)
        if r is not None and r.status_code == 429:
            signup_429 = True
        time.sleep(0.1)

    flag2 = "  âœ“ rate limited" if signup_429 else "âœ— FINDING"
    print(f"  {flag2}  POST /signup â€” 429 seen={signup_429}")
    records.append({
        "endpoint": "/signup", "method": "POST", "role": "no-auth",
        "status": f"429_seen={signup_429}", "expected_status": 429,
        "finding": not signup_429, "severity": "MEDIUM" if not signup_429 else "INFO",
        "response_time_ms": 0, "test_category": "rate_limiting",
        "note": f"Signup burst 10 reqs; 429_triggered={signup_429}",
        "timestamp": now_iso(),
    })

    findings = [r for r in records if r["finding"]]
    print(f"\n  Results: {len(records)} burst tests, {len(findings)} FINDINGS")
    return records


if __name__ == "__main__":
    run()

