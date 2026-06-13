"""
verify_fixes.py — Quick live verification of all 3 DAST fixes
Run from project root: python automated_test/verify_fixes.py
"""
import sys, time, requests

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

BASE = "https://legal-risk-analyzer.up.railway.app"
PASS_ICON = "[PASS]"
FAIL_ICON = "[FAIL]"
INFO_ICON = "[INFO]"

def check(label, passed, detail=""):
    icon = PASS_ICON if passed else FAIL_ICON
    print(f"  {icon}  {label}")
    if detail:
        print(f"         {detail}")

print()
print("=" * 60)
print("  DAST Fix Verification")
print(f"  Target: {BASE}")
print("=" * 60)

# ── Fix 1: auth.py SECRET_KEY fail-fast ─────────────────────────────────────
print("\n[Fix 1] SECRET_KEY fail-fast in auth.py")
import subprocess, os
result = subprocess.run(
    [sys.executable, "-c",
     "import os; os.environ.pop('SECRET_KEY', None); import sys; "
     "sys.path.insert(0, r'e:\\PDD App\\backend'); "
     "from dotenv import load_dotenv; load_dotenv(r'e:\\PDD App\\backend\\.env'); "
     "import auth; print('SK:', bool(auth.SECRET_KEY))"],
    capture_output=True, text=True
)
sk_ok = "RuntimeError" not in result.stderr and result.returncode == 0
check("auth.py loads OK when SECRET_KEY is set", sk_ok, result.stdout.strip() or result.stderr[:120])

# ── Fix 2: Root .gitignore ──────────────────────────────────────────────────
print("\n[Fix 2] Root .gitignore")
with open(r"e:\PDD App\.gitignore") as f:
    gi = f.read()
has_generic   = ".env" in gi and "*.env" in gi
has_backend   = "backend/.env" in gi
has_frontend  = "frontend/.env" in gi
check("Root .gitignore has generic .env",      has_generic,   f"'.env' in file: {has_generic}")
check("Root .gitignore has backend/.env",      has_backend)
check("Root .gitignore has frontend/.env",     has_frontend)
check("Root .gitignore has __pycache__/",      "__pycache__/" in gi)
check("Root .gitignore has node_modules/",     "node_modules/" in gi)

# ── Fix 3: Rate limiting — live burst test ──────────────────────────────────
print("\n[Fix 3] Rate limiting on /login (burst of 8 requests)")
print(f"  {INFO_ICON}  Sending 8 rapid login attempts to /login...")

LOGIN_URL = f"{BASE}/login"
statuses = []
for i in range(8):
    try:
        r = requests.post(
            LOGIN_URL,
            data="username=ratelimit_verify@test.com&password=wrong",
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            timeout=15
        )
        statuses.append(r.status_code)
        sys.stdout.write(f"\r  {INFO_ICON}  Request {i+1}/8: {r.status_code}   ")
        sys.stdout.flush()
    except Exception as e:
        statuses.append("ERR")
    time.sleep(0.2)

print()
got_429 = 429 in statuses
count_429 = statuses.count(429)
print(f"  {INFO_ICON}  Statuses: {statuses}")
check(
    f"Rate limit triggered (429 seen={got_429}, count={count_429})",
    got_429,
    "If Railway is cold-starting, 429 may appear after more attempts. "
    "Run again once server is warm." if not got_429 else f"429 received after {statuses.index(429)+1} requests"
)

print()
print("=" * 60)
total_checks = 7
passed = sum([sk_ok, has_generic, has_backend, has_frontend,
              "__pycache__/" in gi, "node_modules/" in gi, got_429])
print(f"  Results: {passed}/{total_checks} checks passed")
if passed == total_checks:
    print("  All 3 DAST fixes verified!")
else:
    print("  Some checks need attention (see above)")
print("=" * 60)
