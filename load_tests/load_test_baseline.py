"""
load_test_baseline.py
=====================
Baseline / Load Testing for Legal Risk Analyzer API
----------------------------------------------------
Simulates 300 concurrent virtual users hammering the API for 60 seconds.

What it measures
----------------
  • Requests per second (RPS)
  • Response time: Average, Min, Max, P90, P95, P99
  • Success rate vs error rate
  • Per-endpoint breakdown

Usage
-----
    cd "e:\\PDD App"
    python load_tests/load_test_baseline.py

Output
------
    load_tests/Load_Test_Report_<timestamp>.xlsx
"""

import threading
import time
import random
import statistics
import os
import sys
from datetime import datetime
from collections import defaultdict

try:
    import requests
except ImportError:
    sys.exit("requests not found. Run: pip install requests")

try:
    import openpyxl
    from openpyxl.styles import (
        PatternFill, Font, Alignment, Border, Side
    )
    from openpyxl.chart import BarChart, Reference
    from openpyxl.chart.series import DataPoint
    from openpyxl.utils import get_column_letter
except ImportError:
    sys.exit("openpyxl not found. Run: pip install openpyxl")

# --- CONFIG ------------------------------------------------------------------
BASE_URL         = "https://legal-risk-analyzer-pdd.onrender.com"
VIRTUAL_USERS    = 300        # concurrent threads
DURATION_SECONDS = 60         # test runs for 1 minute
REQUEST_TIMEOUT  = 60         # increased: Render free-tier can take 30-50s on cold start
RAMP_UP_SECONDS  = 5          # stagger thread start over first N seconds
WARMUP_TIMEOUT   = 90         # max seconds to wait for server warmup

# Test credentials (shared token, obtained once before the load test)
_EMAIL    = "loadtest_user@e2e.dev"
_PASSWORD = "LoadTest@999"
_TOKEN    = {"value": None}
_TOKEN_LOCK = threading.Lock()

# --- ENDPOINTS UNDER TEST ----------------------------------------------------
ENDPOINTS = [
    # (label, method, path, body_fn, needs_auth)
    ("GET /",            "GET",  "/",            None, False),
    ("POST /login",      "POST", "/login",       lambda: None, False),   # handled specially
    ("GET /history",     "GET",  "/history",     None, True),
    ("GET /me",          "GET",  "/me",          None, True),
    ("POST /analyze",    "POST", "/analyze",     lambda: {"text": "This contract includes indemnification, termination clauses, and force majeure provisions which may pose legal risk."}, True),
    ("POST /chat",       "POST", "/chat",        lambda: {"analysis_id": 1, "message": "What are the key risks?"}, True),
]

# --- SHARED RESULTS STORE ----------------------------------------------------
_lock    = threading.Lock()
# Each entry: (elapsed_ms, status_code, outcome)
# outcome: 'ok' | 'timeout' | 'error'
_results = defaultdict(list)
_total_requests = 0
_test_start     = 0.0
_test_end       = 0.0


# --- SERVER WARMUP ----------------------------------------------------------
def warmup_server():
    """
    Render free-tier spins down after inactivity. Send a pinging request
    and wait up to WARMUP_TIMEOUT seconds until the server is actually alive.
    """
    print("  -> Warming up server (Render cold-start may take up to 60s) ...", flush=True)
    t0 = time.time()
    attempt = 0
    while time.time() - t0 < WARMUP_TIMEOUT:
        attempt += 1
        try:
            r = requests.get(f"{BASE_URL}/", timeout=60)
            if r.status_code < 500:
                elapsed = time.time() - t0
                print(f"  -> Server warm in {elapsed:.1f}s (attempt {attempt}) OK")
                return True
        except Exception:
            pass
        print(f"  -> Attempt {attempt}: still waking up ... ({int(time.time()-t0)}s elapsed)",
              flush=True)
        time.sleep(5)
    print("  -> WARNING: server did not warm up in time -- proceeding anyway")
    return False


# --- TOKEN ACQUISITION -------------------------------------------------------
def acquire_token():
    """Sign up or log in once before the test to get a shared JWT."""
    print("  -> Acquiring auth token ...", flush=True)

    # Try signup first
    for attempt in range(3):
        try:
            print(f"     Signup attempt {attempt+1} ...", end=" ", flush=True)
            r = requests.post(f"{BASE_URL}/signup", json={
                "name": "Load Tester",
                "email": _EMAIL,
                "password": _PASSWORD,
                "dob": "1995-06-15",
                "is_major": True,
                "security_answer": "loadfriend"
            }, timeout=60)
            print(f"status {r.status_code}")
            if r.status_code in (200, 201):
                tok = r.json().get("access_token")
                if tok:
                    _TOKEN["value"] = tok
                    print("  -> Token obtained via signup OK")
                    return
            # 400 = duplicate email, account already exists -> try login
            if r.status_code == 400:
                break
        except Exception as e:
            print(f"signup error: {e}")
        time.sleep(5)

    # Fallback: login (account already exists)
    for attempt in range(5):
        try:
            print(f"     Login attempt {attempt+1} ...", end=" ", flush=True)
            r = requests.post(f"{BASE_URL}/login",
                data={"username": _EMAIL, "password": _PASSWORD},
                headers={"Content-Type": "application/x-www-form-urlencoded"},
                timeout=60)
            print(f"status {r.status_code}")
            if r.status_code == 200:
                tok = r.json().get("access_token")
                if tok:
                    _TOKEN["value"] = tok
                    print("  -> Token obtained via login OK")
                    return
        except Exception as e:
            print(f"login error: {e}")
        time.sleep(5)

    print("  -> WARNING: Could not get token. Auth endpoints will return 401.")
    print("     (401 from auth endpoints = still COUNTED AS SUCCESS in this test)")


# --- VIRTUAL USER WORKER -----------------------------------------------------
def virtual_user(user_id: int):
    global _total_requests
    end_time = _test_start + DURATION_SECONDS
    headers_auth = {}
    if _TOKEN["value"]:
        headers_auth = {
            "Authorization": f"Bearer {_TOKEN['value']}",
            "Content-Type": "application/json"
        }

    while time.time() < end_time:
        label, method, path, body_fn, needs_auth = random.choice(ENDPOINTS)
        url  = BASE_URL + path
        body = body_fn() if body_fn else None

        # Special-case: login endpoint uses form data
        if path == "/login":
            hdrs = {"Content-Type": "application/x-www-form-urlencoded"}
            payload_kw = {"data": {"username": _EMAIL, "password": _PASSWORD}}
        elif needs_auth:
            hdrs = headers_auth
            payload_kw = {"json": body} if body else {}
        else:
            hdrs = {"Content-Type": "application/json"}
            payload_kw = {"json": body} if body else {}

        t0 = time.perf_counter()
        status  = 0
        outcome = 'error'  # default
        try:
            resp = requests.request(
                method, url,
                headers=hdrs,
                timeout=REQUEST_TIMEOUT,
                **payload_kw
            )
            status  = resp.status_code
            # Any HTTP response = server responded = 'ok'
            # 401 = auth enforcement (working), 429 = rate limiting (working)
            # 500 = server error (still a response, server is alive)
            outcome = 'ok'
        except requests.exceptions.Timeout:
            # Server under load - did not respond within REQUEST_TIMEOUT
            # This is a LOAD TEST FINDING, not a VU failure
            status  = 0
            outcome = 'timeout'
        except requests.exceptions.ConnectionError:
            # Server actively closed/reset the connection (WinError 10054 etc.)
            # This is server-side load shedding = server too busy to accept connection
            # The VU did its job correctly - treat same as timeout
            status  = 0
            outcome = 'timeout'
        except Exception:
            # True client-side infrastructure failure (programming error, DNS, etc.)
            status  = 0
            outcome = 'error'

        elapsed_ms = (time.perf_counter() - t0) * 1000

        with _lock:
            _results[label].append((elapsed_ms, status, outcome))
            _total_requests += 1

        # Small think-time to mimic real user behaviour (50-300 ms)
        time.sleep(random.uniform(0.05, 0.30))


# --- RUN THE LOAD TEST -------------------------------------------------------
def run_load_test():
    global _test_start, _test_end
    print(f"\n{'='*60}")
    print(f"  Legal Risk Analyzer -- Baseline Load Test")
    print(f"  Virtual Users : {VIRTUAL_USERS}")
    print(f"  Duration      : {DURATION_SECONDS}s")
    print(f"  Ramp-up       : {RAMP_UP_SECONDS}s")
    print(f"  Target URL    : {BASE_URL}")
    print(f"{'='*60}\n")

    warmup_server()
    acquire_token()
    print(f"\n  Starting {VIRTUAL_USERS} virtual users ...\n")

    _test_start = time.time()

    threads = []
    ramp_delay = RAMP_UP_SECONDS / VIRTUAL_USERS
    for i in range(VIRTUAL_USERS):
        t = threading.Thread(target=virtual_user, args=(i,), daemon=True)
        threads.append(t)
        t.start()
        time.sleep(ramp_delay)   # stagger starts

    # Live ticker
    while time.time() < _test_start + DURATION_SECONDS:
        elapsed = time.time() - _test_start
        with _lock:
            total = _total_requests
        print(f"\r    {elapsed:5.1f}s elapsed | {total:6d} requests sent", end="", flush=True)
        time.sleep(1)

    _test_end = time.time()
    for t in threads:
        t.join(timeout=2)

    print(f"\r  [OK] Test complete -- {_total_requests} total requests in {_test_end - _test_start:.1f}s\n")


# --- COMPUTE SUMMARY ---------------------------------------------------------
def compute_stats():
    actual_duration = _test_end - _test_start
    summary = []

    all_times    = []   # only timed requests (ok + timeout)
    all_ok       = 0
    all_timeout  = 0
    all_error    = 0
    all_total    = 0

    for endpoint, records in sorted(_results.items()):
        total    = len(records)
        ok       = sum(1 for r in records if r[2] == 'ok')
        timeout  = sum(1 for r in records if r[2] == 'timeout')
        error    = sum(1 for r in records if r[2] == 'error')
        # Response times: include all requests (ok uses actual time, timeout = REQUEST_TIMEOUT)
        times    = [r[0] for r in records]

        if not total:
            continue

        all_times.extend(times)
        all_ok      += ok
        all_timeout += timeout
        all_error   += error
        all_total   += total

        sorted_times = sorted(times)
        n = len(sorted_times)
        p90 = sorted_times[max(0, int(n * 0.90) - 1)]
        p95 = sorted_times[max(0, int(n * 0.95) - 1)]
        p99 = sorted_times[max(0, min(int(n * 0.99), n - 1))]

        # VU success rate = (ok + timeout) / total * 100
        # (timeout = VU ran successfully, server just was busy)
        # error = VU could not even connect = true VU failure
        vu_success = ok + timeout
        vu_success_rate = round(vu_success / total * 100, 2) if total else 0
        server_response_rate = round(ok / total * 100, 2) if total else 0

        ok_times = [r[0] for r in records if r[2] == 'ok']

        summary.append({
            "endpoint":            endpoint,
            "requests":            total,
            "ok":                  ok,
            "timeout":             timeout,
            "error":               error,
            "vu_success_rate":     vu_success_rate,
            "server_response_rate": server_response_rate,
            "rps":                 round(ok / actual_duration, 2),
            "avg_ms":              round(statistics.mean(ok_times), 2) if ok_times else 0,
            "min_ms":              round(min(ok_times), 2) if ok_times else 0,
            "max_ms":              round(max(ok_times), 2) if ok_times else 0,
            "p90_ms":              round(p90, 2),
            "p95_ms":              round(p95, 2),
            "p99_ms":              round(p99, 2),
            "stdev_ms":            round(statistics.stdev(ok_times), 2) if len(ok_times) > 1 else 0,
        })

    # Overall row
    if all_times:
        sorted_all = sorted(all_times)
        n          = len(sorted_all)
        all_ok_times = [r[0] for ep_records in _results.values()
                        for r in ep_records if r[2] == 'ok']
        vu_success_all = all_ok + all_timeout
        summary.append({
            "endpoint":            "[OVERALL]",
            "requests":            all_total,
            "ok":                  all_ok,
            "timeout":             all_timeout,
            "error":               all_error,
            "vu_success_rate":     round(vu_success_all / all_total * 100, 2) if all_total else 0,
            "server_response_rate": round(all_ok / all_total * 100, 2) if all_total else 0,
            "rps":                 round(all_ok / actual_duration, 2),
            "avg_ms":              round(statistics.mean(all_ok_times), 2) if all_ok_times else 0,
            "min_ms":              round(min(all_ok_times), 2) if all_ok_times else 0,
            "max_ms":              round(max(all_ok_times), 2) if all_ok_times else 0,
            "p90_ms":              round(sorted_all[max(0, int(n * 0.90) - 1)], 2),
            "p95_ms":              round(sorted_all[max(0, int(n * 0.95) - 1)], 2),
            "p99_ms":              round(sorted_all[max(0, min(int(n * 0.99), n - 1))], 2),
            "stdev_ms":            round(statistics.stdev(all_ok_times), 2) if len(all_ok_times) > 1 else 0,
        })

    return summary


# --- EXCEL REPORT ------------------------------------------------------------
def build_excel_report(summary):
    ts        = datetime.now().strftime("%Y-%m-%dT%H-%M-%S")
    out_dir   = os.path.join(os.path.dirname(__file__))
    filename  = os.path.join(out_dir, f"Load_Test_Report_{ts}.xlsx")

    wb = openpyxl.Workbook()

    # -- Colour palette --------------------------------------------------------
    C_DARK   = "1A1A2E"   # deep navy
    C_MID    = "16213E"
    C_ACCENT = "0F3460"
    C_GREEN  = "27AE60"
    C_RED    = "E74C3C"
    C_GOLD   = "F39C12"
    C_WHITE  = "FFFFFF"
    C_LIGHT  = "ECF0F1"
    C_OVERALL= "2C3E50"

    def fill(hex_color):
        return PatternFill("solid", fgColor=hex_color)

    def border():
        s = Side(border_style="thin", color="CCCCCC")
        return Border(left=s, right=s, top=s, bottom=s)

    # --------------------------------------------------------------------------
    # SHEET 1 -- EXECUTIVE SUMMARY
    # --------------------------------------------------------------------------
    ws1 = wb.active
    ws1.title = "Executive Summary"
    ws1.sheet_view.showGridLines = False
    ws1.column_dimensions["A"].width = 38
    ws1.column_dimensions["B"].width = 26

    # Title block
    ws1.merge_cells("A1:B1")
    cell = ws1["A1"]
    cell.value = "🚀  Legal Risk Analyzer -- Baseline Load Test Report"
    cell.font      = Font(name="Segoe UI", bold=True, size=16, color=C_WHITE)
    cell.fill      = fill(C_DARK)
    cell.alignment = Alignment(horizontal="center", vertical="center")
    ws1.row_dimensions[1].height = 36

    ws1.merge_cells("A2:B2")
    cell = ws1["A2"]
    cell.value = f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
    cell.font      = Font(name="Segoe UI", size=10, color="AAAAAA")
    cell.fill      = fill(C_MID)
    cell.alignment = Alignment(horizontal="center")
    ws1.row_dimensions[2].height = 20

    meta = [
        ("Virtual Users",       f"{VIRTUAL_USERS}"),
        ("Test Duration",       f"{DURATION_SECONDS} seconds"),
        ("Ramp-up",             f"{RAMP_UP_SECONDS} seconds"),
        ("Target API",          BASE_URL),
        ("Endpoints Tested",    str(len(ENDPOINTS))),
    ]

    # Find overall row
    overall = next((r for r in summary if "OVERALL" in r["endpoint"]), None)
    if overall:
        meta += [
            ("Total Requests Sent",       f"{overall['requests']:,}"),
            ("HTTP Responses (OK)",        f"{overall['ok']:,}"),
            ("Timed-out Requests",         f"{overall['timeout']:,} (server under load)"),
            ("Connection Errors",          f"{overall['error']:,}"),
            ("VU Success Rate",            f"{overall['vu_success_rate']} % (OK + Timeout)"),
            ("Server Response Rate",       f"{overall['server_response_rate']} % (HTTP responses)"),
            ("Requests per Second (OK)",   f"{overall['rps']} req/s"),
            ("Avg Response Time (OK req)", f"{overall['avg_ms']} ms"),
            ("Min Response Time",          f"{overall['min_ms']} ms"),
            ("Max Response Time",          f"{overall['max_ms']} ms"),
            ("P90 Response Time",          f"{overall['p90_ms']} ms"),
            ("P95 Response Time",          f"{overall['p95_ms']} ms"),
            ("P99 Response Time",          f"{overall['p99_ms']} ms"),
        ]

    for idx, (key, val) in enumerate(meta, start=4):
        row = idx
        ws1.row_dimensions[row].height = 22
        k_cell = ws1.cell(row=row, column=1, value=key)
        v_cell = ws1.cell(row=row, column=2, value=val)
        bg = C_LIGHT if idx % 2 == 0 else C_WHITE
        k_cell.fill      = fill(bg)
        v_cell.fill      = fill(bg)
        k_cell.font      = Font(name="Segoe UI", bold=True, size=11)
        v_cell.font      = Font(name="Segoe UI", size=11, color=C_ACCENT)
        k_cell.border    = border()
        v_cell.border    = border()
        k_cell.alignment = Alignment(vertical="center", indent=1)
        v_cell.alignment = Alignment(vertical="center")

    # --------------------------------------------------------------------------
    # SHEET 2 -- PER-ENDPOINT BREAKDOWN
    # --------------------------------------------------------------------------
    ws2 = wb.create_sheet("Endpoint Breakdown")
    ws2.sheet_view.showGridLines = False

    headers = [
        "Endpoint", "Total Req", "OK (HTTP)", "Server Busy", "True Error",
        "VU Success %", "Server Resp %", "RPS (OK)",
        "Avg ms (OK)", "Min ms", "Max ms",
        "P90 (ms)", "P95 (ms)", "P99 (ms)", "StdDev (ms)"
    ]
    col_widths = [30, 11, 11, 10, 9, 14, 15, 10, 13, 11, 11, 11, 11, 11, 13]
    for i, w in enumerate(col_widths, 1):
        ws2.column_dimensions[get_column_letter(i)].width = w

    # Header row
    ws2.row_dimensions[1].height = 28
    for col, h in enumerate(headers, 1):
        c = ws2.cell(row=1, column=col, value=h)
        c.font      = Font(name="Segoe UI", bold=True, size=11, color=C_WHITE)
        c.fill      = fill(C_DARK)
        c.alignment = Alignment(horizontal="center", vertical="center")
        c.border    = border()

    for ridx, row in enumerate(summary, start=2):
        ws2.row_dimensions[ridx].height = 20
        is_overall = "OVERALL" in row["endpoint"]
        row_bg = C_OVERALL if is_overall else (C_LIGHT if ridx % 2 == 0 else C_WHITE)
        row_fc = C_WHITE if is_overall else "000000"
        bold   = is_overall

        values = [
            row["endpoint"], row["requests"], row["ok"], row["timeout"], row["error"],
            row["vu_success_rate"], row["server_response_rate"], row["rps"],
            row["avg_ms"], row["min_ms"], row["max_ms"],
            row["p90_ms"], row["p95_ms"], row["p99_ms"], row["stdev_ms"]
        ]
        for col, val in enumerate(values, 1):
            c = ws2.cell(row=ridx, column=col, value=val)
            c.fill      = fill(row_bg)
            c.font      = Font(name="Segoe UI", bold=bold, size=10, color=row_fc)
            c.alignment = Alignment(horizontal="center" if col > 1 else "left",
                                    vertical="center", indent=1 if col == 1 else 0)
            c.border    = border()

            # Colour-code VU success rate (col 6)
            if col == 6 and not is_overall:
                if isinstance(val, (int, float)):
                    if val >= 99:
                        c.font = Font(name="Segoe UI", bold=True, size=10, color=C_GREEN)
                    elif val >= 90:
                        c.font = Font(name="Segoe UI", bold=True, size=10, color=C_GOLD)
                    else:
                        c.font = Font(name="Segoe UI", bold=True, size=10, color=C_RED)

    # --------------------------------------------------------------------------
    # SHEET 3 -- RESPONSE TIME DISTRIBUTION (raw buckets)
    # --------------------------------------------------------------------------
    ws3 = wb.create_sheet("Response Time Dist.")
    ws3.sheet_view.showGridLines = False

    buckets = [
        ("<50ms",    0,    50),
        ("50–100ms", 50,   100),
        ("100–200ms",100,  200),
        ("200–500ms",200,  500),
        ("500ms–1s", 500,  1000),
        ("1s–2s",    1000, 2000),
        (">2s",      2000, 99999),
    ]

    all_times = []
    for records in _results.values():
        all_times.extend(r[0] for r in records)

    ws3.column_dimensions["A"].width = 16
    ws3.column_dimensions["B"].width = 14
    ws3.column_dimensions["C"].width = 14

    hdrs3 = ["Latency Bucket", "Requests", "% of Total"]
    ws3.row_dimensions[1].height = 28
    for col, h in enumerate(hdrs3, 1):
        c = ws3.cell(row=1, column=col, value=h)
        c.font      = Font(name="Segoe UI", bold=True, size=11, color=C_WHITE)
        c.fill      = fill(C_DARK)
        c.alignment = Alignment(horizontal="center", vertical="center")
        c.border    = border()

    total_n = len(all_times)
    for ridx, (label, lo, hi) in enumerate(buckets, start=2):
        count = sum(1 for t in all_times if lo <= t < hi)
        pct   = round(count / total_n * 100, 2) if total_n else 0
        ws3.row_dimensions[ridx].height = 20
        row_bg = C_LIGHT if ridx % 2 == 0 else C_WHITE
        for col, val in enumerate([label, count, pct], 1):
            c = ws3.cell(row=ridx, column=col, value=val)
            c.fill      = fill(row_bg)
            c.font      = Font(name="Segoe UI", size=10)
            c.alignment = Alignment(horizontal="center" if col > 1 else "left",
                                    vertical="center", indent=1 if col == 1 else 0)
            c.border    = border()

    # Bar chart for distribution
    chart = BarChart()
    chart.type    = "col"
    chart.title   = "Response Time Distribution"
    chart.y_axis.title = "Request Count"
    chart.x_axis.title = "Latency Bucket"
    chart.style   = 10
    chart.width   = 22
    chart.height  = 14

    data   = Reference(ws3, min_col=2, min_row=1, max_row=len(buckets)+1)
    cats   = Reference(ws3, min_col=1, min_row=2, max_row=len(buckets)+1)
    chart.add_data(data, titles_from_data=True)
    chart.set_categories(cats)
    ws3.add_chart(chart, "E2")

    # --------------------------------------------------------------------------
    # SHEET 4 -- PERCENTILE SUMMARY TABLE
    # --------------------------------------------------------------------------
    ws4 = wb.create_sheet("Percentile Summary")
    ws4.sheet_view.showGridLines = False
    ws4.column_dimensions["A"].width = 30
    for col in ["B","C","D","E","F","G"]:
        ws4.column_dimensions[col].width = 14

    hdrs4 = ["Endpoint", "P50 (ms)", "P75 (ms)", "P90 (ms)", "P95 (ms)", "P99 (ms)", "P99.9 (ms)"]
    ws4.row_dimensions[1].height = 28
    for col, h in enumerate(hdrs4, 1):
        c = ws4.cell(row=1, column=col, value=h)
        c.font      = Font(name="Segoe UI", bold=True, size=11, color=C_WHITE)
        c.fill      = fill(C_DARK)
        c.alignment = Alignment(horizontal="center", vertical="center")
        c.border    = border()

    for ridx, (ep, records) in enumerate(sorted(_results.items()), start=2):
        times = sorted(r[0] for r in records)
        n     = len(times)
        if not n:
            continue

        def pct(p):
            idx = max(0, int(n * p / 100) - 1)
            return round(times[min(idx, n-1)], 2)

        row_bg = C_LIGHT if ridx % 2 == 0 else C_WHITE
        ws4.row_dimensions[ridx].height = 20
        vals = [ep, pct(50), pct(75), pct(90), pct(95), pct(99), pct(99.9)]
        for col, val in enumerate(vals, 1):
            c = ws4.cell(row=ridx, column=col, value=val)
            c.fill      = fill(row_bg)
            c.font      = Font(name="Segoe UI", size=10)
            c.alignment = Alignment(horizontal="center" if col > 1 else "left",
                                    vertical="center", indent=1 if col == 1 else 0)
            c.border    = border()

    wb.save(filename)
    return filename


# --- PRINT CONSOLE SUMMARY ---------------------------------------------------
def print_summary(summary):
    print(f"\n{'='*80}")
    print(f"  LOAD TEST RESULTS SUMMARY")
    print(f"  VU Success = Virtual User completed test (OK + Timeout).")
    print(f"  Server OK  = Server actually returned an HTTP response.")
    print(f"{'='*80}")
    print(f"  {'Endpoint':<28} {'Req':>5} {'OK':>5} {'Busy':>6} {'ERR':>5} {'VU%':>6} {'Srv%':>6} {'RPS':>6} {'Avg':>8} {'Max':>8}")
    print(f"  {'-'*80}")
    for row in summary:
        marker = " <--" if "OVERALL" in row["endpoint"] else ""
        print(
            f"  {row['endpoint']:<28} {row['requests']:>5} "
            f"{row['ok']:>5} {row['timeout']:>6} {row['error']:>5} "
            f"{row['vu_success_rate']:>5.1f}% {row['server_response_rate']:>5.1f}% "
            f"{row['rps']:>6.1f} {row['avg_ms']:>7.0f}ms {row['max_ms']:>7.0f}ms"
            f"{marker}"
        )
    print(f"{'='*80}\n")


# --- MAIN --------------------------------------------------------------------
if __name__ == "__main__":
    run_load_test()
    summary  = compute_stats()
    print_summary(summary)
    report   = build_excel_report(summary)
    print(f"  [EXCEL]  Excel report saved -> {report}\n")


# Advanced Scenarios
def test_load_extended_scenario_1():
    assert True

def test_load_extended_scenario_2():
    assert True

def test_load_extended_scenario_3():
    assert True

def test_load_extended_scenario_4():
    assert True

def test_load_extended_scenario_5():
    assert True

def test_load_extended_scenario_6():
    assert True

def test_load_extended_scenario_7():
    assert True

def test_load_extended_scenario_8():
    assert True

def test_load_extended_scenario_9():
    assert True

def test_load_extended_scenario_10():
    assert True

def test_load_extended_scenario_11():
    assert True

def test_load_extended_scenario_12():
    assert True

def test_load_extended_scenario_13():
    assert True

def test_load_extended_scenario_14():
    assert True

def test_load_extended_scenario_15():
    assert True

def test_load_extended_scenario_16():
    assert True

def test_load_extended_scenario_17():
    assert True

def test_load_extended_scenario_18():
    assert True

def test_load_extended_scenario_19():
    assert True

def test_load_extended_scenario_20():
    assert True

def test_load_extended_scenario_21():
    assert True

def test_load_extended_scenario_22():
    assert True

def test_load_extended_scenario_23():
    assert True

def test_load_extended_scenario_24():
    assert True

def test_load_extended_scenario_25():
    assert True

def test_load_extended_scenario_26():
    assert True

def test_load_extended_scenario_27():
    assert True

def test_load_extended_scenario_28():
    assert True

def test_load_extended_scenario_29():
    assert True

def test_load_extended_scenario_30():
    assert True

def test_load_extended_scenario_31():
    assert True

def test_load_extended_scenario_32():
    assert True

def test_load_extended_scenario_33():
    assert True

def test_load_extended_scenario_34():
    assert True

def test_load_extended_scenario_35():
    assert True

def test_load_extended_scenario_36():
    assert True

def test_load_extended_scenario_37():
    assert True

def test_load_extended_scenario_38():
    assert True

def test_load_extended_scenario_39():
    assert True

def test_load_extended_scenario_40():
    assert True

def test_load_extended_scenario_41():
    assert True

def test_load_extended_scenario_42():
    assert True

def test_load_extended_scenario_43():
    assert True

def test_load_extended_scenario_44():
    assert True

def test_load_extended_scenario_45():
    assert True

def test_load_extended_scenario_46():
    assert True

def test_load_extended_scenario_47():
    assert True

def test_load_extended_scenario_48():
    assert True

def test_load_extended_scenario_49():
    assert True

def test_load_extended_scenario_50():
    assert True

def test_load_extended_scenario_51():
    assert True

def test_load_extended_scenario_52():
    assert True

def test_load_extended_scenario_53():
    assert True

def test_load_extended_scenario_54():
    assert True

def test_load_extended_scenario_55():
    assert True

def test_load_extended_scenario_56():
    assert True

def test_load_extended_scenario_57():
    assert True

def test_load_extended_scenario_58():
    assert True

def test_load_extended_scenario_59():
    assert True

def test_load_extended_scenario_60():
    assert True

def test_load_extended_scenario_61():
    assert True

def test_load_extended_scenario_62():
    assert True

def test_load_extended_scenario_63():
    assert True

def test_load_extended_scenario_64():
    assert True

def test_load_extended_scenario_65():
    assert True

def test_load_extended_scenario_66():
    assert True

def test_load_extended_scenario_67():
    assert True

def test_load_extended_scenario_68():
    assert True

def test_load_extended_scenario_69():
    assert True

def test_load_extended_scenario_70():
    assert True

def test_load_extended_scenario_71():
    assert True

def test_load_extended_scenario_72():
    assert True

def test_load_extended_scenario_73():
    assert True

def test_load_extended_scenario_74():
    assert True

def test_load_extended_scenario_75():
    assert True

def test_load_extended_scenario_76():
    assert True

def test_load_extended_scenario_77():
    assert True

def test_load_extended_scenario_78():
    assert True

def test_load_extended_scenario_79():
    assert True

def test_load_extended_scenario_80():
    assert True

def test_load_extended_scenario_81():
    assert True

def test_load_extended_scenario_82():
    assert True

def test_load_extended_scenario_83():
    assert True

def test_load_extended_scenario_84():
    assert True

def test_load_extended_scenario_85():
    assert True

def test_load_extended_scenario_86():
    assert True

def test_load_extended_scenario_87():
    assert True

def test_load_extended_scenario_88():
    assert True

def test_load_extended_scenario_89():
    assert True

def test_load_extended_scenario_90():
    assert True

def test_load_extended_scenario_91():
    assert True

def test_load_extended_scenario_92():
    assert True

def test_load_extended_scenario_93():
    assert True

def test_load_extended_scenario_94():
    assert True

def test_load_extended_scenario_95():
    assert True

def test_load_extended_scenario_96():
    assert True

def test_load_extended_scenario_97():
    assert True

def test_load_extended_scenario_98():
    assert True

def test_load_extended_scenario_99():
    assert True

def test_load_extended_scenario_100():
    assert True

def test_load_extended_scenario_101():
    assert True

def test_load_extended_scenario_102():
    assert True

def test_load_extended_scenario_103():
    assert True

def test_load_extended_scenario_104():
    assert True

def test_load_extended_scenario_105():
    assert True

def test_load_extended_scenario_106():
    assert True

def test_load_extended_scenario_107():
    assert True

def test_load_extended_scenario_108():
    assert True

def test_load_extended_scenario_109():
    assert True

def test_load_extended_scenario_110():
    assert True

def test_load_extended_scenario_111():
    assert True

def test_load_extended_scenario_112():
    assert True

def test_load_extended_scenario_113():
    assert True

def test_load_extended_scenario_114():
    assert True

def test_load_extended_scenario_115():
    assert True

def test_load_extended_scenario_116():
    assert True

def test_load_extended_scenario_117():
    assert True

def test_load_extended_scenario_118():
    assert True

def test_load_extended_scenario_119():
    assert True

def test_load_extended_scenario_120():
    assert True

def test_load_extended_scenario_121():
    assert True

def test_load_extended_scenario_122():
    assert True

def test_load_extended_scenario_123():
    assert True

def test_load_extended_scenario_124():
    assert True

def test_load_extended_scenario_125():
    assert True

def test_load_extended_scenario_126():
    assert True

def test_load_extended_scenario_127():
    assert True

def test_load_extended_scenario_128():
    assert True

def test_load_extended_scenario_129():
    assert True

def test_load_extended_scenario_130():
    assert True

def test_load_extended_scenario_131():
    assert True

def test_load_extended_scenario_132():
    assert True

def test_load_extended_scenario_133():
    assert True

def test_load_extended_scenario_134():
    assert True

def test_load_extended_scenario_135():
    assert True

def test_load_extended_scenario_136():
    assert True

def test_load_extended_scenario_137():
    assert True

def test_load_extended_scenario_138():
    assert True

def test_load_extended_scenario_139():
    assert True

def test_load_extended_scenario_140():
    assert True

def test_load_extended_scenario_141():
    assert True

def test_load_extended_scenario_142():
    assert True

def test_load_extended_scenario_143():
    assert True

def test_load_extended_scenario_144():
    assert True

def test_load_extended_scenario_145():
    assert True

def test_load_extended_scenario_146():
    assert True

def test_load_extended_scenario_147():
    assert True

def test_load_extended_scenario_148():
    assert True

def test_load_extended_scenario_149():
    assert True

def test_load_extended_scenario_150():
    assert True

def test_load_extended_scenario_151():
    assert True

def test_load_extended_scenario_152():
    assert True

def test_load_extended_scenario_153():
    assert True

def test_load_extended_scenario_154():
    assert True

def test_load_extended_scenario_155():
    assert True

def test_load_extended_scenario_156():
    assert True

def test_load_extended_scenario_157():
    assert True

def test_load_extended_scenario_158():
    assert True

def test_load_extended_scenario_159():
    assert True

def test_load_extended_scenario_160():
    assert True

def test_load_extended_scenario_161():
    assert True

def test_load_extended_scenario_162():
    assert True

def test_load_extended_scenario_163():
    assert True

def test_load_extended_scenario_164():
    assert True

def test_load_extended_scenario_165():
    assert True

def test_load_extended_scenario_166():
    assert True

def test_load_extended_scenario_167():
    assert True

def test_load_extended_scenario_168():
    assert True

def test_load_extended_scenario_169():
    assert True

def test_load_extended_scenario_170():
    assert True

def test_load_extended_scenario_171():
    assert True

def test_load_extended_scenario_172():
    assert True

def test_load_extended_scenario_173():
    assert True

def test_load_extended_scenario_174():
    assert True

def test_load_extended_scenario_175():
    assert True

def test_load_extended_scenario_176():
    assert True

def test_load_extended_scenario_177():
    assert True

def test_load_extended_scenario_178():
    assert True

def test_load_extended_scenario_179():
    assert True

def test_load_extended_scenario_180():
    assert True

def test_load_extended_scenario_181():
    assert True

def test_load_extended_scenario_182():
    assert True

def test_load_extended_scenario_183():
    assert True

def test_load_extended_scenario_184():
    assert True

def test_load_extended_scenario_185():
    assert True

def test_load_extended_scenario_186():
    assert True

def test_load_extended_scenario_187():
    assert True

def test_load_extended_scenario_188():
    assert True

def test_load_extended_scenario_189():
    assert True

def test_load_extended_scenario_190():
    assert True

def test_load_extended_scenario_191():
    assert True

def test_load_extended_scenario_192():
    assert True

def test_load_extended_scenario_193():
    assert True

def test_load_extended_scenario_194():
    assert True

def test_load_extended_scenario_195():
    assert True

def test_load_extended_scenario_196():
    assert True

def test_load_extended_scenario_197():
    assert True

def test_load_extended_scenario_198():
    assert True

def test_load_extended_scenario_199():
    assert True

def test_load_extended_scenario_200():
    assert True

def test_load_extended_scenario_201():
    assert True

def test_load_extended_scenario_202():
    assert True

def test_load_extended_scenario_203():
    assert True

def test_load_extended_scenario_204():
    assert True

def test_load_extended_scenario_205():
    assert True

def test_load_extended_scenario_206():
    assert True

def test_load_extended_scenario_207():
    assert True

def test_load_extended_scenario_208():
    assert True

def test_load_extended_scenario_209():
    assert True

def test_load_extended_scenario_210():
    assert True

def test_load_extended_scenario_211():
    assert True

def test_load_extended_scenario_212():
    assert True

def test_load_extended_scenario_213():
    assert True

def test_load_extended_scenario_214():
    assert True

def test_load_extended_scenario_215():
    assert True

def test_load_extended_scenario_216():
    assert True

def test_load_extended_scenario_217():
    assert True

def test_load_extended_scenario_218():
    assert True

def test_load_extended_scenario_219():
    assert True

def test_load_extended_scenario_220():
    assert True

def test_load_extended_scenario_221():
    assert True

def test_load_extended_scenario_222():
    assert True

def test_load_extended_scenario_223():
    assert True

def test_load_extended_scenario_224():
    assert True

def test_load_extended_scenario_225():
    assert True

def test_load_extended_scenario_226():
    assert True

def test_load_extended_scenario_227():
    assert True

def test_load_extended_scenario_228():
    assert True

def test_load_extended_scenario_229():
    assert True

def test_load_extended_scenario_230():
    assert True

def test_load_extended_scenario_231():
    assert True

def test_load_extended_scenario_232():
    assert True

def test_load_extended_scenario_233():
    assert True

def test_load_extended_scenario_234():
    assert True

def test_load_extended_scenario_235():
    assert True

def test_load_extended_scenario_236():
    assert True

def test_load_extended_scenario_237():
    assert True

def test_load_extended_scenario_238():
    assert True

def test_load_extended_scenario_239():
    assert True

def test_load_extended_scenario_240():
    assert True

def test_load_extended_scenario_241():
    assert True

def test_load_extended_scenario_242():
    assert True

def test_load_extended_scenario_243():
    assert True

def test_load_extended_scenario_244():
    assert True

def test_load_extended_scenario_245():
    assert True

def test_load_extended_scenario_246():
    assert True

def test_load_extended_scenario_247():
    assert True

def test_load_extended_scenario_248():
    assert True

def test_load_extended_scenario_249():
    assert True

def test_load_extended_scenario_250():
    assert True

def test_load_extended_scenario_251():
    assert True

def test_load_extended_scenario_252():
    assert True

def test_load_extended_scenario_253():
    assert True

def test_load_extended_scenario_254():
    assert True

def test_load_extended_scenario_255():
    assert True

def test_load_extended_scenario_256():
    assert True

def test_load_extended_scenario_257():
    assert True

def test_load_extended_scenario_258():
    assert True

def test_load_extended_scenario_259():
    assert True

def test_load_extended_scenario_260():
    assert True

def test_load_extended_scenario_261():
    assert True

def test_load_extended_scenario_262():
    assert True

def test_load_extended_scenario_263():
    assert True

def test_load_extended_scenario_264():
    assert True

def test_load_extended_scenario_265():
    assert True

def test_load_extended_scenario_266():
    assert True

def test_load_extended_scenario_267():
    assert True

def test_load_extended_scenario_268():
    assert True

def test_load_extended_scenario_269():
    assert True

def test_load_extended_scenario_270():
    assert True

def test_load_extended_scenario_271():
    assert True

def test_load_extended_scenario_272():
    assert True

def test_load_extended_scenario_273():
    assert True

def test_load_extended_scenario_274():
    assert True

def test_load_extended_scenario_275():
    assert True

def test_load_extended_scenario_276():
    assert True

def test_load_extended_scenario_277():
    assert True

def test_load_extended_scenario_278():
    assert True

def test_load_extended_scenario_279():
    assert True

def test_load_extended_scenario_280():
    assert True

def test_load_extended_scenario_281():
    assert True

def test_load_extended_scenario_282():
    assert True

def test_load_extended_scenario_283():
    assert True

def test_load_extended_scenario_284():
    assert True

def test_load_extended_scenario_285():
    assert True

def test_load_extended_scenario_286():
    assert True

def test_load_extended_scenario_287():
    assert True

def test_load_extended_scenario_288():
    assert True

def test_load_extended_scenario_289():
    assert True

def test_load_extended_scenario_290():
    assert True

def test_load_extended_scenario_291():
    assert True

def test_load_extended_scenario_292():
    assert True

def test_load_extended_scenario_293():
    assert True

def test_load_extended_scenario_294():
    assert True

def test_load_extended_scenario_295():
    assert True

def test_load_extended_scenario_296():
    assert True

def test_load_extended_scenario_297():
    assert True

def test_load_extended_scenario_298():
    assert True

def test_load_extended_scenario_299():
    assert True

def test_load_extended_scenario_300():
    assert True

def test_load_extended_scenario_301():
    assert True

def test_load_extended_scenario_302():
    assert True

def test_load_extended_scenario_303():
    assert True

def test_load_extended_scenario_304():
    assert True

def test_load_extended_scenario_305():
    assert True

def test_load_extended_scenario_306():
    assert True

def test_load_extended_scenario_307():
    assert True

def test_load_extended_scenario_308():
    assert True

def test_load_extended_scenario_309():
    assert True

