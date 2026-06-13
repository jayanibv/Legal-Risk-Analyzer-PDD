"""
dast_01_discovery.py â€” STEP 1 + 2: Endpoint Discovery & Expectation Model
Targets: BASE_URL read from input.json (frontend/services/api.js source)
"""
import sys, os, time, json
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
sys.path.insert(0, os.path.dirname(__file__))
from dast_config import (BASE_URL, ENDPOINTS, safe_get, safe_post,
                          signup_and_login, masked, now_iso, TOKENS)

SAVEPOINT = os.path.join(os.path.dirname(__file__), "savepoint.json")

def probe_endpoint(method, path, label="no-auth"):
    """Issue a single probe request with NO credentials; return status code."""
    url = BASE_URL + path.replace("{id}", "1")
    if method == "GET":
        r, ms = safe_get(url)
    else:
        r, ms = safe_post(url, json_body={})
    status = r.status_code if r is not None else "ERR"
    return status, ms

def run():
    print("=" * 65)
    print(f"  DAST â€” Step 1: Endpoint Discovery")
    print(f"  Target : {BASE_URL}")
    print(f"  Source : frontend/services/api.js + backend/main.py")
    print(f"  Time   : {now_iso()}")
    print("=" * 65)

    # â”€â”€ Also try FastAPI /openapi.json for server-side spec â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    print("\n[*] Checking /openapi.json for server-side spec...")
    r, ms = safe_get(f"{BASE_URL}/openapi.json")
    extra_paths = []
    if r and r.status_code == 200:
        spec = r.json()
        extra_paths = list(spec.get("paths", {}).keys())
        print(f"    âœ“ OpenAPI spec found â€” {len(extra_paths)} paths in spec")
        # Merge spec paths into ENDPOINTS if any are missing
        known = {p for _, p, _ in ENDPOINTS}
        new_found = [p for p in extra_paths if p not in known]
        if new_found:
            print(f"    âš  NEW paths found in spec not in our inventory: {new_found}")
        else:
            print(f"    âœ“ All spec paths are in our inventory â€” no hidden endpoints")
    else:
        print(f"    - /openapi.json status: {r.status_code if r is not None else 'ERR'} (spec not public or error)")

    # â”€â”€ Full endpoint list â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    print(f"\n[*] Full Endpoint Inventory ({len(ENDPOINTS)} endpoints):\n")
    print(f"  {'#':<4} {'METHOD':<8} {'PATH':<35} {'ACCESS RULE':<20} {'NO-AUTH STATUS'}")
    print(f"  {'-'*4} {'-'*8} {'-'*35} {'-'*20} {'-'*15}")

    results = []
    for idx, (method, path, rule) in enumerate(ENDPOINTS, 1):
        status, ms = probe_endpoint(method, path)
        flag = ""
        # Flag unexpected status
        if rule == "public" and status not in (200, 201, 307, 422):
            flag = " âš  unexpected"
        if rule == "requires-auth" and status == 200:
            flag = " âœ— UNPROTECTED"
        elif rule == "requires-auth" and status in (401, 403):
            flag = " âœ“"
        print(f"  {idx:<4} {method:<8} {path:<35} {rule:<20} {status}  {ms}ms{flag}")
        results.append({
            "idx": idx, "method": method, "path": path,
            "access_rule": rule, "no_auth_status": status, "latency_ms": ms
        })
        time.sleep(0.3)

    # â”€â”€ Obtain runtime tokens â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    print(f"\n[*] Obtaining runtime JWT tokens (throwaway test accounts)...")
    tok1 = signup_and_login("_u1")
    tok2 = signup_and_login("_u2")

    if tok1:
        TOKENS["valid_user"] = tok1
        print(f"    valid_user  token: {masked(tok1)}")
    else:
        print("    âœ— Could not obtain valid_user token â€” auth tests may fail")

    if tok2:
        TOKENS["other_user"] = tok2
        print(f"    other_user  token: {masked(tok2)}")
    else:
        print("    âœ— Could not obtain other_user token â€” IDOR tests may be limited")

    # â”€â”€ Save savepoint for subsequent modules â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    savepoint = {
        "base_url": BASE_URL,
        "tokens": {k: v for k, v in TOKENS.items()},  # runtime only
        "endpoints": results,
        "generated_at": now_iso()
    }
    with open(SAVEPOINT, "w") as f:
        json.dump(savepoint, f, indent=2)
    print(f"\n    Savepoint written â†’ {SAVEPOINT}")

    print("\n" + "=" * 65)
    print("  STEP 2 â€” Expectation Model")
    print("=" * 65)
    print("""
  ACCESS RULES (from main.py + FastAPI OAuth2PasswordBearer):
  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
  â”‚ PUBLIC  (no auth needed):                               â”‚
  â”‚   GET  /                    â†’ 200                       â”‚
  â”‚   POST /signup              â†’ 200 on valid body         â”‚
  â”‚   POST /login               â†’ 200 on valid creds        â”‚
  â”‚   POST /reset-password      â†’ 200 on valid identity     â”‚
  â”‚   GET  /docs                â†’ 200 (FastAPI UI)          â”‚
  â”‚   GET  /openapi.json        â†’ 200 (spec)                â”‚
  â”‚   GET  /redoc               â†’ 200 (ReDoc)               â”‚
  â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
  â”‚ REQUIRES-AUTH (JWT Bearer, any valid user):             â”‚
  â”‚   GET  /me                  â†’ 200 with token            â”‚
  â”‚   POST /update-profile      â†’ 200 with token            â”‚
  â”‚   POST /analyze             â†’ 200 with token            â”‚
  â”‚   POST /analyze-pdf         â†’ 200 with token            â”‚
  â”‚   GET  /history             â†’ 200 with token            â”‚
  â”‚   GET  /analysis/{id}       â†’ 200 (own docs only)       â”‚
  â”‚   POST /chat                â†’ 200 with token            â”‚
  â”‚   POST /translate           â†’ 200 with token            â”‚
  â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
  â”‚ RBAC: Single-role flat model â€” no admin/super roles.    â”‚
  â”‚   No privilege hierarchy to test beyond auth/no-auth.   â”‚
  â”‚   IDOR is the relevant cross-user vector.               â”‚
  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜

  FINDINGS DEFINITION:
    â€¢ 2xx on requires-auth endpoint with NO token    â†’ AuthN Bypass
    â€¢ 2xx on /analysis/{id} with DIFFERENT user tok  â†’ IDOR
    â€¢ 2xx on any endpoint with tampered JWT          â†’ Token Tampering
    â€¢ 500 / anomalous timing on injection probe      â†’ Injection signal
    â€¢ No 429 after burst                             â†’ Rate limit absent
  """)

    print(f"\n[âœ“] Discovery complete. {len(ENDPOINTS)} endpoints inventoried.")
    print(f"[âœ“] Savepoint ready for test modules.")
    return savepoint

if __name__ == "__main__":
    run()

