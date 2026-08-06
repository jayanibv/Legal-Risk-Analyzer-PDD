import re

# Comprehensive regular expressions for date/deadline extraction
# We use re.IGNORECASE to match regardless of capitalization

DATE_REGEXES = {
    # e.g., 12/03/2026, 12-03-2026, 2026-03-12, 12.03.2026
    "Numeric Dates": r'\b(?:\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}|\d{4}[-/.]\d{1,2}[-/.]\d{1,2})\b',
    
    # e.g., March 12, 2026, 12 March 2026, Mar 12 2026
    "Long Dates": r'\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2}(?:st|nd|rd|th)?(?:,)?\s+\d{4}\b|\b\d{1,2}(?:st|nd|rd|th)?\s+(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)(?:,)?\s+\d{4}\b',
    
    # Relative deadlines e.g., within 30 days, within 15 business days, 90-day notice, at least 30 days
    "Relative Deadlines": r'\b(?:within|no later than|at least)\s+(?:\w+|[0-9]+)\s+(?:calendar\s+|business\s+)?days\b|\b[0-9]+\s*(?:-| )\s*day(?:s)?\s+notice\b'
}

# Keywords to categorize sentences that contain dates/deadlines
CATEGORIES = {
    "Document Issued": ["issued", "date:", "issued on", "certificate date"],
    "Internship/Employment Period": ["internship", "employment", "period", "duration", "tenure"],
    "Contract Signed": ["signed", "executed", "signature"],
    "Effective Date": ["effective from", "effective date", "comes into effect"],
    "Renewal Date": ["automatically renew", "renewal date", "renews on"],
    "Notice Period": ["days notice", "notice period", "written notice"],
    "Payment Due": ["payment due", "shall be made within", "invoice due", "payable"],
    "Termination": ["termination date", "terminate on", "cancellation"],
    "Expiry": ["expires on", "expiry date", "valid until"],
    "Delivery": ["delivery deadline", "delivered by"],
    "Probation": ["probation period", "probationary"],
    "Grace Period": ["grace period"]
}

def categorize_sentence(sentence: str) -> str:
    s_lower = sentence.lower()
    for cat, keywords in CATEGORIES.items():
        for keyword in keywords:
            if keyword in s_lower:
                return cat
    return "General Deadline"

def extract_dates(text: str) -> list:
    """
    Extracts dates and deadlines from text, categorizes them, 
    and removes duplicates while preserving order.
    """
    # Split text into sentences roughly by period/newline
    sentences = re.split(r'(?<=[.!?])\s+|\n', text)
    
    extracted = []
    seen = set()

    for sentence in sentences:
        sentence_clean = sentence.strip()
        if not sentence_clean:
            continue
            
        found_values = []
        
        # Check all regexes against this sentence
        for label, regex in DATE_REGEXES.items():
            matches = re.finditer(regex, sentence_clean, re.IGNORECASE)
            for match in matches:
                found_values.append(match.group(0).strip())
                
        for value in found_values:
            s_lower = sentence_clean.lower()
            
            # Exclude dates that are clearly personal/non-contractual
            exclude_keywords = ["birth", "dob", "born", "birthday", "age"]
            if any(kw in s_lower for kw in exclude_keywords):
                continue
                
            category = categorize_sentence(sentence_clean)
            
            # Simple deduplication key
            dedup_key = f"{category}:{value.lower()}"
            if dedup_key not in seen:
                seen.add(dedup_key)
                extracted.append({
                    "type": category,
                    "value": value,
                    "sentence": sentence_clean
                })
                
    return extracted
