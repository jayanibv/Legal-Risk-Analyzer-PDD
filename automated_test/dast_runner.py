"""
dast_runner.py â€” Master DAST Runner
Executes all test categories in order and writes automated_test/report.json.
Usage: python automated_test/dast_runner.py
"""
import sys, os, json, time, datetime
sys.path.insert(0, os.path.dirname(__file__))

from dast_config import BASE_URL, ENDPOINTS, TOKENS, signup_and_login, masked, now_iso

REPORT_PATH    = os.path.join(os.path.dirname(__file__), "report.json")
SAVEPOINT_PATH = os.path.join(os.path.dirname(__file__), "savepoint.json")

SEV_ORDER = {"CRITICAL": 0, "HIGH": 1, "MEDIUM": 2, "LOW": 3, "INFO": 4}

def print_banner():
    print("\n" + "â*”" + "â*" * 63 + "â*—")
    print("â*‘  Legal Risk Analyzer â€” DAST Security Assessment           â*‘")
    print(f"â*‘  Target  : {BASE_URL:<50} â*‘")
    print(f"â*‘  Started : {datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC'):<50} â*‘")
    print("â*š" + "â*" * 63 + "â*")

def run_module(name, func, *args):
    print(f"\n{'â”€'*65}")
    print(f"  RUNNING: {name}")
    print(f"{'â”€'*65}")
    t0 = time.time()
    try:
        results = func(*args) or []
    except Exception as e:
        print(f"  âœ— Module crashed: {e}")
        results = [{
            "endpoint": name, "method": "N/A", "role": "runner",
            "status": "ERROR", "expected_status": "N/A",
            "finding": False, "severity": "INFO",
            "response_time_ms": 0, "test_category": name,
            "note": f"Module error: {str(e)}", "timestamp": now_iso()
        }]
    elapsed = round((time.time() - t0), 1)
    findings = [r for r in results if r.get("finding")]
    print(f"\n  Completed in {elapsed}s | {len(results)} probes | {len(findings)} findings")
    return results

def main():
    print_banner()

    # ── Step 1+2: Discovery (returns savepoint dict, not a record list) ────────
    from dast_01_discovery import run as disc_run
    print("\n" + "-"*65)
    print("  RUNNING: Step 1+2: Discovery & Expectation Model")
    print("-"*65)
    t0 = time.time()
    try:
        disc_run()   # prints output, writes savepoint.json — return value unused
    except Exception as e:
        print(f"  [!] Discovery module error: {e}")
    elapsed = round(time.time() - t0, 1)
    print(f"\n  Completed in {elapsed}s")

    # Reload tokens from savepoint
    if os.path.exists(SAVEPOINT_PATH):
        with open(SAVEPOINT_PATH) as f:
            sp = json.load(f)
        TOKENS["valid_user"]  = sp.get("tokens", {}).get("valid_user")
        TOKENS["other_user"]  = sp.get("tokens", {}).get("other_user")

    # ── PAUSE POINT ──────────────────────────────────────────────────────────
    print("\n" + "=" * 65)
    print("  STEP 1 COMPLETE --- ENDPOINT LIST ABOVE")
    print("  Proceeding automatically to security tests...")
    print("=" * 65)
    time.sleep(1)

    all_records = []

    # â”€â”€ Category 1: AuthN Bypass â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    from dast_02_authn_bypass import run as authn_run
    all_records += run_module("Category 1: AuthN Bypass", authn_run)

    # â”€â”€ Category 3: IDOR â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    from dast_03_idor import run as idor_run
    all_records += run_module("Category 3: IDOR", idor_run, TOKENS)

    # â”€â”€ Category 5: Token Tampering â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    from dast_04_token_tampering import run as tamp_run
    all_records += run_module("Category 5: Token Tampering", tamp_run, TOKENS)

    # â”€â”€ Category 6: Injection â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    from dast_05_injection import run as inj_run
    all_records += run_module("Category 6: Injection Detection", inj_run, TOKENS)

    # â”€â”€ Category 7: Rate Limiting â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    from dast_06_rate_limit import run as rl_run
    all_records += run_module("Category 7: Rate Limiting", rl_run)

    # â”€â”€ Category 8: Hardcoded Secrets â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    from dast_07_hardcoded_secrets import run as sec_run
    all_records += run_module("Category 8: Hardcoded Secrets", sec_run)

    # â”€â”€ Write report.json â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    with open(REPORT_PATH, "w", encoding="utf-8") as f:
        json.dump(all_records, f, indent=2, default=str)
    print(f"\n  [âœ“] report.json written â†’ {REPORT_PATH}")

    # â”€â”€ Summary â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    findings = [r for r in all_records if r.get("finding")]
    by_sev   = {}
    for r in findings:
        s = r.get("severity", "INFO")
        by_sev.setdefault(s, []).append(r)

    print("\n" + "â*”" + "â*" * 63 + "â*—")
    print("â*‘  DAST SUMMARY                                             â*‘")
    print("â* " + "â*" * 63 + "â*£")
    print(f"â*‘  Target            : {BASE_URL:<41} â*‘")
    print(f"â*‘  Endpoints tested  : {len(ENDPOINTS):<41} â*‘")
    print(f"â*‘  Total probes      : {len(all_records):<41} â*‘")
    print(f"â*‘  Total FINDINGS    : {len(findings):<41} â*‘")
    print("â* " + "â*" * 63 + "â*£")
    for sev in ["CRITICAL", "HIGH", "MEDIUM", "LOW", "INFO"]:
        n = len(by_sev.get(sev, []))
        if n:
            icon = {"CRITICAL":"âœ—","HIGH":"âœ—","MEDIUM":"âš ","LOW":"âš ","INFO":"âœ“"}.get(sev,"?")
            print(f"â*‘  {icon} {sev:<10} : {n:<44} â*‘")
    print("â*š" + "â*" * 63 + "â*")

    # Top issues
    top = sorted(findings, key=lambda r: SEV_ORDER.get(r.get("severity","INFO"), 99))[:10]
    if top:
        print("\n  TOP ISSUES TO FIX FIRST:")
        print(f"  {'#':<3} {'SEV':<10} {'CATEGORY':<22} {'ENDPOINT'}")
        print(f"  {'-'*3} {'-'*10} {'-'*22} {'-'*30}")
        for i, r in enumerate(top, 1):
            ep = r.get("endpoint","")[:35]
            print(f"  {i:<3} {r.get('severity','?'):<10} {r.get('test_category','?'):<22} {ep}")

    print(f"\n  Report : {REPORT_PATH}")
    print(f"  Ended  : {datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}\n")


if __name__ == "__main__":
    main()

