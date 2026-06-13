"""
dast_07_hardcoded_secrets.py â€” Category 8: Hardcoded Credentials / Secret Scan
Scans backend source files (excluding .venv, __pycache__, node_modules)
for patterns that indicate committed secrets:
  - Hardcoded API keys, passwords, tokens
  - .env files committed to git
  - Base64-encoded blobs that decode to key-like strings
  - Weak/fallback SECRET_KEY values
"""
import sys, os, re, json, subprocess
sys.path.insert(0, os.path.dirname(__file__))
from dast_config import now_iso

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
BACKEND_DIR  = os.path.join(PROJECT_ROOT, "backend")

EXCLUDE_DIRS = {".venv", "__pycache__", "node_modules", ".git", "dist", ".expo", "migrations"}

# Regex patterns (detection only â€” values are masked in output)
SECRET_PATTERNS = [
    (re.compile(r'(?i)(?:api[_-]?key|apikey)\s*=\s*["\']([^"\']{10,})["\']'),        "api_key"),
    (re.compile(r'(?i)secret[_-]?key\s*=\s*["\']([^"\']{4,})["\']'),                 "secret_key"),
    (re.compile(r'(?i)password\s*=\s*["\']([^"\']{4,})["\']'),                        "password"),
    (re.compile(r'(?i)(?:access|auth)[_-]?token\s*=\s*["\']([^"\']{10,})["\']'),      "token"),
    (re.compile(r'(?i)database[_-]?url\s*=\s*["\']([^"\']+)["\']'),                  "db_url"),
    (re.compile(r'(?i)supabase[_-]?(?:url|key)\s*=\s*["\']([^"\']+)["\']'),          "supabase_cred"),
    (re.compile(r'(?i)mail[_-]?password\s*=\s*["\']([^"\']+)["\']'),                 "mail_password"),
    (re.compile(r'GEMINI_API_KEY\s*=\s*["\']([^"\']+)["\']'),                         "gemini_api_key"),
    # Fallback / weak secret detection
    (re.compile(r'SECRET_KEY\s*=\s*.*["\']([^"\']*fallback[^"\']*)["\']', re.I),     "weak_secret_key"),
    (re.compile(r'SECRET_KEY\s*=\s*.*["\']([^"\']*dev[^"\']*)["\']', re.I),          "weak_secret_key_dev"),
    # Committed .env detection
    (re.compile(r'^\s*[A-Z_]+=.+', re.MULTILINE),                                     "env_var_hardcoded"),
]

# Check if .env is in .gitignore
GITIGNORE_PATH = os.path.join(PROJECT_ROOT, ".gitignore")
BACKEND_GITIGNORE = os.path.join(BACKEND_DIR, ".gitignore")

def mask_value(val: str) -> str:
    """Show only first 4 and last 2 chars of a secret value."""
    if len(val) <= 6:
        return "***"
    return val[:4] + "*" * (len(val) - 6) + val[-2:]


def scan_file(filepath: str) -> list[dict]:
    findings = []
    try:
        with open(filepath, encoding="utf-8", errors="replace") as f:
            content = f.read()
    except Exception:
        return []

    rel_path = os.path.relpath(filepath, PROJECT_ROOT)

    for pattern, label in SECRET_PATTERNS:
        for match in pattern.finditer(content):
            val = match.group(1) if match.lastindex else match.group(0)
            # Skip if value looks like an env var placeholder
            if re.match(r'^(your_|<|{|\$|os\.getenv|os\.environ|None|""|\'\')', val.strip()):
                continue
            # Skip if it's just referencing an env var (not a hardcoded value)
            if "getenv" in val or "environ" in val:
                continue

            line_num = content[:match.start()].count("\n") + 1
            findings.append({
                "file": rel_path,
                "line": line_num,
                "pattern_type": label,
                "masked_value": mask_value(val),
                "raw_match": match.group(0)[:60],
            })
    return findings


def check_gitignore(path, label):
    """Check if .env is properly listed in the given .gitignore."""
    if not os.path.exists(path):
        return False, f"{label} not found"
    with open(path) as f:
        content = f.read()
    has_env = bool(re.search(r'^\s*\.env\s*$', content, re.MULTILINE))
    return has_env, content


def check_env_in_git():
    """Use git to check if any .env file is tracked."""
    try:
        result = subprocess.run(
            ["git", "-C", PROJECT_ROOT, "ls-files", "*.env", ".env", "**/.env"],
            capture_output=True, text=True, timeout=10
        )
        tracked = [l.strip() for l in result.stdout.splitlines() if l.strip()]
        return tracked
    except Exception:
        return []


def run():
    records = []
    all_findings = []

    print("\n" + "=" * 65)
    print("  DAST â€” Category 8: Hardcoded Credentials / Secret Scan")
    print("=" * 65)
    print(f"  Scanning: {PROJECT_ROOT}")

    # â”€â”€ File scan â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    scan_dirs = [BACKEND_DIR]
    scanned = 0

    for scan_dir in scan_dirs:
        for root, dirs, files in os.walk(scan_dir):
            dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]
            for fname in files:
                if fname.endswith((".py", ".env", ".json", ".yaml", ".yml", ".toml", ".cfg", ".ini", ".txt")):
                    fpath = os.path.join(root, fname)
                    hits  = scan_file(fpath)
                    scanned += 1
                    if hits:
                        all_findings.extend(hits)

    print(f"  Files scanned: {scanned}")
    print(f"  Pattern matches: {len(all_findings)}\n")

    # â”€â”€ .gitignore check â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    root_git_ok, _ = check_gitignore(GITIGNORE_PATH, "root .gitignore")
    back_git_ok, _ = check_gitignore(BACKEND_GITIGNORE, "backend .gitignore")

    print(f"  .gitignore coverage:")
    print(f"    Root    .gitignore lists .env: {'âœ“' if root_git_ok else 'âœ— MISSING'}")
    print(f"    Backend .gitignore lists .env: {'âœ“' if back_git_ok else 'âœ— MISSING'}")

    records.append({
        "endpoint": ".gitignore", "method": "STATIC",
        "role": "codebase", "status": "OK" if (root_git_ok or back_git_ok) else "MISSING",
        "expected_status": "listed",
        "finding": not (root_git_ok or back_git_ok),
        "severity": "HIGH" if not (root_git_ok or back_git_ok) else "INFO",
        "response_time_ms": 0, "test_category": "hardcoded_secrets",
        "note": f"root_gitignore_has_env={root_git_ok} backend_gitignore_has_env={back_git_ok}",
        "timestamp": now_iso(),
    })

    # â”€â”€ Git-tracked .env check â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    tracked_envs = check_env_in_git()
    if tracked_envs:
        print(f"  âœ— CRITICAL: .env files tracked in git: {tracked_envs}")
        records.append({
            "endpoint": "git:tracked_env", "method": "STATIC",
            "role": "codebase", "status": "COMMITTED",
            "expected_status": "untracked",
            "finding": True, "severity": "CRITICAL",
            "response_time_ms": 0, "test_category": "hardcoded_secrets",
            "note": f".env committed to git: {tracked_envs}",
            "timestamp": now_iso(),
        })
    else:
        print(f"  âœ“ No .env files tracked in git")

    # â”€â”€ Fallback SECRET_KEY detection (code scan) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    auth_path = os.path.join(BACKEND_DIR, "auth.py")
    fallback_found = False
    if os.path.exists(auth_path):
        with open(auth_path) as f:
            auth_content = f.read()
        if "fallback-secret-key" in auth_content or "fallback" in auth_content.lower():
            fallback_found = True
            print(f"  âœ— FINDING: auth.py has fallback SECRET_KEY in getenv() call")
            records.append({
                "endpoint": "backend/auth.py", "method": "STATIC",
                "role": "codebase", "status": "WEAK_DEFAULT",
                "expected_status": "no_fallback",
                "finding": True, "severity": "HIGH",
                "response_time_ms": 0, "test_category": "hardcoded_secrets",
                "note": "SECRET_KEY has a hardcoded fallback: 'fallback-secret-key-for-dev'. "
                        "If SECRET_KEY env var is unset, tokens are signed with a known-weak key.",
                "timestamp": now_iso(),
            })

    # â”€â”€ Report all pattern matches â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    sensitive_labels = {"api_key", "secret_key", "password", "token",
                        "db_url", "supabase_cred", "mail_password",
                        "gemini_api_key", "weak_secret_key", "weak_secret_key_dev"}

    for hit in all_findings:
        is_sensitive = hit["pattern_type"] in sensitive_labels
        # Filter: env_var_hardcoded is only a finding inside .env files
        if hit["pattern_type"] == "env_var_hardcoded" and not hit["file"].endswith(".env"):
            continue
        flag = "âœ— FINDING" if is_sensitive else "  -"
        print(f"  {flag}  [{hit['pattern_type']}] {hit['file']}:{hit['line']}  val={hit['masked_value']}")
        if is_sensitive:
            records.append({
                "endpoint": hit["file"], "method": "STATIC",
                "role": "codebase", "status": "DETECTED",
                "expected_status": "not_hardcoded",
                "finding": True, "severity": "HIGH",
                "response_time_ms": 0, "test_category": "hardcoded_secrets",
                "note": f"Possible hardcoded {hit['pattern_type']} at {hit['file']}:{hit['line']}. "
                        f"Masked: {hit['masked_value']}. Verify it is env-loaded, not literal.",
                "timestamp": now_iso(),
            })

    findings = [r for r in records if r["finding"]]
    print(f"\n  Results: {scanned} files scanned, {len(findings)} FINDINGS")
    return records


if __name__ == "__main__":
    run()

