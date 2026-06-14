import pandas as pd
import json
import datetime
import os
from collections import defaultdict

def generate_report():
    report_path = "automated_test/report.json"
    if not os.path.exists(report_path):
        print("report.json not found")
        return
        
    with open(report_path, "r", encoding="utf-8") as f:
        records = json.load(f)
        
    base_url = "https://legal-risk-analyzer.up.railway.app"
    timestamp = datetime.datetime.utcnow().strftime('%Y-%m-%dT%H-%M-%S')
    display_time = datetime.datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')
    
    # Process Data
    total_probes = len(records)
    findings = [r for r in records if r.get("finding")]
    total_findings = len(findings)
    
    sev_counts = {"CRITICAL": 0, "HIGH": 0, "MEDIUM": 0, "LOW": 0}
    for r in findings:
        sev = r.get("severity", "INFO")
        if sev in sev_counts:
            sev_counts[sev] += 1
            
    cat_stats = defaultdict(lambda: {"Probes": 0, "Findings": 0, "Critical": 0, "High": 0, "Medium": 0, "Info": 0})
    for r in records:
        cat = r.get("test_category", "unknown")
        cat_stats[cat]["Probes"] += 1
        if r.get("finding"):
            cat_stats[cat]["Findings"] += 1
            sev = r.get("severity", "INFO").capitalize()
            if sev in cat_stats[cat]:
                cat_stats[cat][sev] += 1
                
    # Build Summary Sheet
    summary_data = [
        ["Legal Risk Analyzer - DAST Security Assessment Report", None, None, None, None, None, None],
        [f"Generated: {display_time}  |  Target: {base_url}", None, None, None, None, None, None],
        [None, None, None, None, None, None, None],
        ["Target URL", "Total Probes", "Findings", "CRITICAL", "HIGH", "MEDIUM", "LOW"],
        [base_url, total_probes, total_findings, sev_counts["CRITICAL"], sev_counts["HIGH"], sev_counts["MEDIUM"], sev_counts["LOW"]],
        [None, None, None, None, None, None, None],
        ["Category Breakdown", None, None, None, None, None, None],
        ["Category", "Probes", "Findings", "Critical", "High", "Medium", "Info"]
    ]
    
    for cat, stats in cat_stats.items():
        summary_data.append([
            cat, stats["Probes"], stats["Findings"], 
            stats["Critical"], stats["High"], stats["Medium"], stats["Info"]
        ])
        
    df_summary = pd.DataFrame(summary_data)
    
    # Build Findings Sheet
    findings_data = []
    for i, r in enumerate(findings, 1):
        findings_data.append({
            "#": i,
            "Endpoint": r.get("endpoint"),
            "Method": r.get("method"),
            "Role/Context": r.get("role"),
            "Status": r.get("status"),
            "Expected": r.get("expected_status"),
            "Category": r.get("test_category"),
            "Note": r.get("note"),
            "Severity": r.get("severity")
        })
    df_findings = pd.DataFrame(findings_data)
    if df_findings.empty:
        df_findings = pd.DataFrame(columns=['#', 'Endpoint', 'Method', 'Role/Context', 'Status', 'Expected', 'Category', 'Note', 'Severity'])
        
    # Build All Tests Sheet
    all_tests_data = []
    for i, r in enumerate(records, 1):
        all_tests_data.append({
            "#": i,
            "Endpoint": r.get("endpoint"),
            "Method": r.get("method"),
            "Role": r.get("role"),
            "Status": r.get("status"),
            "Expected": r.get("expected_status"),
            "Finding": r.get("finding"),
            "Category": r.get("test_category"),
            "Severity": r.get("severity"),
            "Latency(ms)": r.get("response_time_ms"),
            "Note": r.get("note"),
            "Timestamp": r.get("timestamp")
        })
    df_all_tests = pd.DataFrame(all_tests_data)
    
    # Save to Excel
    out_file = f"automated_test/DAST_Security_Report_LegalRiskAnalyzer_{timestamp}.xlsx"
    with pd.ExcelWriter(out_file, engine='openpyxl') as writer:
        df_summary.to_excel(writer, sheet_name='Summary', index=False, header=False)
        df_findings.to_excel(writer, sheet_name='Findings', index=False)
        df_all_tests.to_excel(writer, sheet_name='All Tests', index=False)
        
    print(f"Generated {out_file}")

if __name__ == "__main__":
    generate_report()
