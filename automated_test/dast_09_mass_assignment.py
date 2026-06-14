"""
Category 10: Mass Assignment / Privilege Escalation
"""
import sys, os, time
sys.path.insert(0, os.path.dirname(__file__))
from dast_config import BASE_URL, safe_post, auth_header, now_iso, signup_and_login

def run(tokens):
    records = []
    print("\n" + "=" * 65)
    print("  DAST - Category 10: Mass Assignment")
    print("=" * 65)

    tok = tokens.get("valid_user")
    if not tok:
        tok = signup_and_login("_mass")
        
    hdrs = auth_header(tok)
    
    payloads = [
        {"name": "test", "role": "admin"},
        {"name": "test", "is_superuser": True},
        {"name": "test", "balance": 999999}
    ]
    
    url = f"{BASE_URL}/update-profile"
    
    for p in payloads:
        r, ms = safe_post(url, headers=hdrs, json_body=p)
        status = r.status_code if r is not None else "ERR"
        
        is_500 = isinstance(status, int) and status == 500
        is_finding = is_500
        
        records.append({
            "endpoint": "/update-profile", "method": "POST",
            "role": "user:mass_assignment", "status": status,
            "expected_status": "200/422", "finding": is_finding,
            "severity": "HIGH" if is_finding else "INFO",
            "response_time_ms": ms, "test_category": "mass_assignment",
            "note": f"Injected keys: {list(p.keys())}; status={status}",
            "timestamp": now_iso(),
        })
        time.sleep(0.2)
        
    findings = [r for r in records if r["finding"]]
    print(f"\n  Results: {len(records)} probes, {len(findings)} FINDINGS")
    return records
