import json
import re

log_file = r'C:\Users\Jayani\.gemini\antigravity-ide\brain\2355d578-afc6-4ff7-80bc-7c616caa2d65\.system_generated\logs\transcript.jsonl'

def parse_file_content(text):
    lines = text.splitlines()
    file_path = None
    for line in lines:
        if line.startswith("File Path: `file:///e:/PDD%20App/tests/"):
            file_path = line.split("`")[1].replace("file:///e:/PDD%20App/", "e:/PDD App/").replace("%20", " ")
            break
    if not file_path:
        return None, None
        
    code_lines = []
    capture = False
    for line in lines:
        if "The following code has been modified" in line:
            capture = True
            continue
        if "The above content shows the entire" in line or "The above content does NOT show the entire" in line:
            capture = False
            break
        if capture:
            # remove line number e.g. "1: "
            idx = line.find(": ")
            if idx != -1 and line[:idx].isdigit():
                code_lines.append(line[idx+2:])
            else:
                code_lines.append(line)
                
    return file_path, "\n".join(code_lines)

files_to_restore = {}
with open(log_file, encoding='utf-8') as f:
    for line in f:
        data = json.loads(line)
        content = data.get('content', '')
        if "File Path: `file:///e:/PDD%20App/tests/" in content:
            path, code = parse_file_content(content)
            if path and code and len(code) > 100:
                # keep the last seen (most complete or valid) content for each file
                files_to_restore[path] = code

for path, code in files_to_restore.items():
    if "test_01" in path or "test_02" in path or "test_03" in path or "conftest.py" in path:
        print(f"Restoring {path} ({len(code)} bytes)")
        with open(path, 'w', encoding='utf-8') as out:
            out.write(code)
