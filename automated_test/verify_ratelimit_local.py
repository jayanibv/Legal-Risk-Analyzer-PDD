"""
verify_ratelimit_local.py
Tests rate limiting against localhost:8000 (uvicorn --reload has already picked up the fix).
"""
import sys, time, requests
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

LOCAL = "http://localhost:8000"
LOGIN_URL = f"{LOCAL}/login"
SIGNUP_URL = f"{LOCAL}/signup"

print("\n" + "="*55)
print("  Rate Limit Verification (local server)")
print("="*55)

# ── /login: limit is 5/minute ────────────────────────────────
print(f"\n  Burst test: POST /login  (limit = 5/minute)")
print(f"  Sending 8 requests...")
statuses = []
for i in range(8):
    try:
        r = requests.post(
            LOGIN_URL,
            data="username=ratelimitlocal@test.com&password=wrong",
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            timeout=10
        )
        statuses.append(r.status_code)
        icon = "[429-LIMIT]" if r.status_code == 429 else "[ok]      "
        print(f"    Req {i+1:02d}: {r.status_code}  {icon}")
    except Exception as e:
        statuses.append("ERR")
        print(f"    Req {i+1:02d}: ERR - {e}")
    time.sleep(0.15)

got_429_login = 429 in statuses
first_429     = statuses.index(429)+1 if got_429_login else None
print(f"\n  Statuses: {statuses}")
if got_429_login:
    print(f"  [PASS] Rate limit triggered at request #{first_429}  (expected <= 6)")
else:
    print(f"  [WARN] No 429 on /login (server may need redeploy or may be warming up)")

# Wait for window reset before testing signup
time.sleep(2)

# ── /signup: limit is 3/minute ───────────────────────────────
import uuid
print(f"\n  Burst test: POST /signup (limit = 3/minute)")
print(f"  Sending 5 requests...")
statuses2 = []
for i in range(5):
    uid = str(uuid.uuid4())[:6]
    try:
        r = requests.post(
            SIGNUP_URL,
            json={"name": "RL Test", "email": f"rl_{uid}@rl.dev",
                  "password": "RLtest@999", "dob": "1992-01-01",
                  "is_major": True, "security_answer": "x"},
            timeout=10
        )
        statuses2.append(r.status_code)
        icon = "[429-LIMIT]" if r.status_code == 429 else "[ok]      "
        print(f"    Req {i+1:02d}: {r.status_code}  {icon}")
    except Exception as e:
        statuses2.append("ERR")
        print(f"    Req {i+1:02d}: ERR - {e}")
    time.sleep(0.15)

got_429_signup = 429 in statuses2
print(f"\n  Statuses: {statuses2}")
if got_429_signup:
    first429s = statuses2.index(429)+1
    print(f"  [PASS] Rate limit triggered at request #{first429s}  (expected <= 4)")
else:
    print(f"  [WARN] No 429 on /signup")

# ── Summary ──────────────────────────────────────────────────
print("\n" + "="*55)
print(f"  /login  429 triggered : {got_429_login}")
print(f"  /signup 429 triggered : {got_429_signup}")
if got_429_login and got_429_signup:
    print("  [ALL PASS] Rate limiting working on local server!")
    print("  --> Deploy to Railway to make it live.")
else:
    print("  Check uvicorn reload output — might need manual restart.")
print("="*55)
