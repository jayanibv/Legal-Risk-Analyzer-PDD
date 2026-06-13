import json, sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
with open(r'e:\PDD App\automated_test\report.json', encoding='utf-8') as f:
    records = json.load(f)
findings = [r for r in records if r.get('finding')]
print(f'Total probes: {len(records)}')
print(f'Total findings: {len(findings)}')
print()
for r in findings:
    print(f"[{r['severity']}] [{r['test_category']}] {r['method']} {r['endpoint']}")
    print(f"  Status={r['status']} Expected={r['expected_status']}")
    print(f"  Note: {r['note']}")
    print()
