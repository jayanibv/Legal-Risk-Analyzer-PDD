"""
dast_03_idor.py â€” Category 3+4: IDOR & Cross-User Object Access
Two legitimate users (user1, user2) are created.
user1 submits a document; user2 tries to read user1's analysis by ID.
Also tests GET /analysis/{id} with sequential IDs.
"""
import sys, os, time, json
sys.path.insert(0, os.path.dirname(__file__))
from dast_config import (BASE_URL, safe_get, safe_post, auth_header,
                          signup_and_login, now_iso, masked)

SAMPLE_TEXT = "This agreement automatically renews. Limitation of liability is $500."

def run(tokens: dict):
    records = []
    print("\n" + "=" * 65)
    print("  DAST â€” Category 3: IDOR / Cross-User Object Access")
    print("=" * 65)

    tok1 = tokens.get("valid_user")
    tok2 = tokens.get("other_user")

    if not tok1 or not tok2:
        print("  âœ— Need two valid tokens. Attempting to create...")
        tok1 = tok1 or signup_and_login("_idor1")
        tok2 = tok2 or signup_and_login("_idor2")

    if not tok1 or not tok2:
        note = "Could not obtain two user tokens; IDOR test skipped"
        print(f"  âš  {note}")
        return [{"endpoint": "/analysis/{id}", "method": "GET", "role": "user2â†’user1",
                 "status": "SKIP", "expected_status": 403, "finding": False,
                 "severity": "INFO", "response_time_ms": 0,
                 "test_category": "idor", "note": note, "timestamp": now_iso()}]

    # â”€â”€ Step A: user1 submits an analysis â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    print(f"\n  [*] user1 submitting analysis document...")
    r, ms = safe_post(f"{BASE_URL}/analyze",
                      headers=auth_header(tok1),
                      json_body={"text": SAMPLE_TEXT})

    doc_id = None
    if r is not None and r.status_code == 200:
        print(f"      âœ“ Analysis created ({ms}ms)")
        # Now get history to find the doc_id
        rh, _ = safe_get(f"{BASE_URL}/history", headers=auth_header(tok1))
        if rh is not None and rh.status_code == 200:
            hist = rh.json()
            if hist:
                doc_id = hist[0]["id"]
                print(f"      âœ“ user1 doc_id = {doc_id}")
    else:
        print(f"      âœ— Analyze call returned {r.status_code if r is not None else 'ERR'}")

    # â”€â”€ Step B: IDOR probe â€” user2 tries to access user1's doc â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    test_ids = list({doc_id, 1, 2, 3, doc_id - 1 if doc_id and doc_id > 1 else 1} - {None})

    for tid in test_ids:
        url = f"{BASE_URL}/analysis/{tid}"
        r2, ms2 = safe_get(url, headers=auth_header(tok2))
        status = r2.status_code if r2 is not None else "ERR"

        # IDOR finding: user2 gets 200 on user1's doc
        is_finding = (status == 200 and tid == doc_id)
        severity = "HIGH" if is_finding else "INFO"
        note = (
            f"user2 accessed user1 doc_id={tid}; status={status}. "
            + ("IDOR confirmed â€” cross-user data leak!" if is_finding
               else "Correctly blocked" if status in (403, 404) else f"status={status}")
        )
        flag = "âœ— IDOR FINDING" if is_finding else "  âœ“ blocked/404"
        print(f"  {flag}  user2â†’GET /analysis/{tid} â†’ {status}  {ms2}ms")
        records.append({
            "endpoint": f"/analysis/{{{tid}}}",
            "method": "GET",
            "role": "user2â†’user1_doc",
            "status": status,
            "expected_status": 403,
            "finding": is_finding,
            "severity": severity,
            "response_time_ms": ms2,
            "test_category": "idor",
            "note": note,
            "timestamp": now_iso(),
        })
        time.sleep(0.3)

    # â”€â”€ Step C: user1 tries to access user2's history â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    # (Note: /history is per-user by design but we verify it's filtered)
    print(f"\n  [*] Checking /history isolation between users...")
    rh1, _ = safe_get(f"{BASE_URL}/history", headers=auth_header(tok1))
    rh2, _ = safe_get(f"{BASE_URL}/history", headers=auth_header(tok2))

    hist1_ids = {x["id"] for x in rh1.json()} if (rh1 is not None and rh1.status_code == 200) else set()
    hist2_ids = {x["id"] for x in rh2.json()} if (rh2 is not None and rh2.status_code == 200) else set()
    overlap   = hist1_ids & hist2_ids

    is_finding = bool(overlap)
    note = (f"History overlap IDs: {overlap}" if is_finding
            else f"No history overlap â€” user1 sees {len(hist1_ids)} docs, user2 sees {len(hist2_ids)} docs")
    flag = "âœ— HISTORY IDOR" if is_finding else "  âœ“ history isolated"
    print(f"  {flag}  â€” {note}")
    records.append({
        "endpoint": "/history",
        "method": "GET",
        "role": "cross-user history",
        "status": "200/200",
        "expected_status": "isolated",
        "finding": is_finding,
        "severity": "HIGH" if is_finding else "INFO",
        "response_time_ms": 0,
        "test_category": "idor",
        "note": note,
        "timestamp": now_iso(),
    })

    findings = [r for r in records if r["finding"]]
    print(f"\n  Results: {len(records)} probes, {len(findings)} FINDINGS")
    return records


if __name__ == "__main__":
    tok1 = signup_and_login("_idor_a")
    tok2 = signup_and_login("_idor_b")
    run({"valid_user": tok1, "other_user": tok2})

