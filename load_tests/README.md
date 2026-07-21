# Load Tests — Legal Risk Analyzer

## What This Does
Baseline (Normal Load) test that simulates **300 concurrent virtual users** hitting the API for **60 seconds**.

## How to Run
```powershell
cd "e:\PDD App"
python load_tests/load_test_baseline.py
```

## What You'll See (Console)
```
  Endpoint                         Req     RPS      Avg      Min      Max     OK%
  ──────────────────────────────────────────────────────────────────────────────
  GET /                            820   13.7    210ms    45ms   980ms   99.9%
  POST /login                      640   10.7    350ms    80ms  1500ms   98.8%
  GET /history                    1100   18.3    280ms    60ms  1200ms   99.4%
  GET /me                         1050   17.5    230ms    55ms   900ms   99.7%
  POST /analyze                    420    7.0    620ms   150ms  3200ms   97.2%
  POST /chat                       390    6.5    580ms   130ms  2800ms   97.8%
  🔢  OVERALL                     4420   73.7    340ms    45ms  3200ms   98.8% ←
```

## Excel Report (Auto-Generated)
After each run, an Excel file is saved to `load_tests/`:
```
Load_Test_Report_2026-07-12T12-30-00.xlsx
```

### Sheets Inside:
| Sheet | Contents |
|-------|----------|
| **Executive Summary** | Config, overall RPS, avg/min/max response times |
| **Endpoint Breakdown** | Per-endpoint: requests, errors, success rate, RPS, latencies |
| **Response Time Dist.** | Bucketed histogram + bar chart |
| **Percentile Summary** | P50, P75, P90, P95, P99, P99.9 per endpoint |

## Config (edit at top of script)
```python
VIRTUAL_USERS    = 300   # concurrent users
DURATION_SECONDS = 60    # test length
RAMP_UP_SECONDS  = 5     # spread thread launch over N seconds
```
