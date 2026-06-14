"""
Category 9: HTTP Method Fuzzing
"""
import sys, os, time
sys.path.insert(0, os.path.dirname(__file__))
from dast_config import BASE_URL, ENDPOINTS, safe_get, safe_post, auth_header, now_iso
import requests

def run(tokens=None):
    records = []
    print("\n" + "=" * 65)
    print("  DAST - Category 9: HTTP Method Fuzzing")
    print("=" * 65)

    methods_to_try = ["PUT", "DELETE", "PATCH", "OPTIONS", "TRACE"]
    
    # Take up to 10 endpoints
    endpoints_to_test = ENDPOINTS[:10]
    
    for ep in endpoints_to_test:
        ep_method, ep_path, ep_access = ep
        url = f"{BASE_URL}{ep_path}"
        for method in methods_to_try:
            try:
                r = requests.request(method, url, timeout=10)
                status = r.status_code
                is_500 = status == 500
                is_finding = is_500
                
                records.append({
                    "endpoint": ep_path, "method": method,
                    "role": "fuzzer:method", "status": status,
                    "expected_status": "405/401/404", "finding": is_finding,
                    "severity": "HIGH" if is_finding else "INFO",
                    "response_time_ms": int(r.elapsed.total_seconds() * 1000) if hasattr(r, 'elapsed') else 0,
                    "test_category": "method_tampering",
                    "note": f"Sent {method} to {ep_method} endpoint; status={status}",
                    "timestamp": now_iso(),
                })
            except Exception as e:
                records.append({
                    "endpoint": ep_path, "method": method,
                    "role": "fuzzer:method", "status": "ERR",
                    "expected_status": "405/401/404", "finding": True,
                    "severity": "HIGH",
                    "response_time_ms": 0, "test_category": "method_tampering",
                    "note": f"Error sending {method}: {e}",
                    "timestamp": now_iso(),
                })
            time.sleep(0.2)
            
    findings = [r for r in records if r["finding"]]
    print(f"\n  Results: {len(records)} probes, {len(findings)} FINDINGS")
    return records
