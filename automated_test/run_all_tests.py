"""
run_all_tests.py
Runs all DAST categories using the existing savepoint tokens.
Writes all_records to automated_test/report.json.
Run with: python automated_test/run_all_tests.py
"""
import sys, os, json, time
sys.path.insert(0, os.path.dirname(__file__))

if sys.stdout.encoding and sys.stdout.encoding.lower() not in ("utf-8","utf8"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

SAVEPOINT_PATH = os.path.join(os.path.dirname(__file__), "savepoint.json")
REPORT_PATH    = os.path.join(os.path.dirname(__file__), "report.json")

# Load tokens
with open(SAVEPOINT_PATH) as f:
    sp = json.load(f)
tokens = sp.get("tokens", {})
print(f"[INFO] Loaded savepoint: valid_user={bool(tokens.get('valid_user'))}, other_user={bool(tokens.get('other_user'))}")

all_records = []

def run_cat(label, func, *args):
    print(f"\n{'='*60}")
    print(f"  {label}")
    print(f"{'='*60}")
    t0 = time.time()
    try:
        results = func(*args) or []
    except Exception as e:
        print(f"  [ERROR] {e}")
        import traceback; traceback.print_exc()
        results = []
    elapsed = round(time.time()-t0, 1)
    findings = sum(1 for r in results if r.get("finding"))
    print(f"\n  [{label}] Done in {elapsed}s | {len(results)} probes | {findings} findings")
    return results

# --- Cat 1: AuthN Bypass ---
from dast_02_authn_bypass import run as authn_run
all_records += run_cat("Cat 1: AuthN Bypass", authn_run)

# --- Cat 3: IDOR ---
from dast_03_idor import run as idor_run
all_records += run_cat("Cat 3: IDOR", idor_run, tokens)

# --- Cat 5: Token Tampering ---
from dast_04_token_tampering import run as tamp_run
all_records += run_cat("Cat 5: Token Tampering", tamp_run, tokens)

# --- Cat 6: Injection ---
from dast_05_injection import run as inj_run
all_records += run_cat("Cat 6: Injection", inj_run, tokens)

# --- Cat 7: Rate Limiting ---
from dast_06_rate_limit import run as rl_run
all_records += run_cat("Cat 7: Rate Limiting", rl_run)

# --- Cat 8: Secrets ---
from dast_07_hardcoded_secrets import run as sec_run
all_records += run_cat("Cat 8: Hardcoded Secrets", sec_run)

# Write report.json
with open(REPORT_PATH, "w", encoding="utf-8") as f:
    json.dump(all_records, f, indent=2, default=str)
print(f"\n[OK] report.json written -> {REPORT_PATH}")

findings = [r for r in all_records if r.get("finding")]
sev = {}
for r in findings:
    s = r.get("severity","INFO")
    sev[s] = sev.get(s, 0) + 1

print(f"\n{'='*60}")
print(f"  DAST SUMMARY")
print(f"{'='*60}")
print(f"  Total probes : {len(all_records)}")
print(f"  Findings     : {len(findings)}")
for s in ["CRITICAL","HIGH","MEDIUM","LOW","INFO"]:
    n = sev.get(s, 0)
    if n:
        print(f"    {s:<10}: {n}")
print(f"{'='*60}")
