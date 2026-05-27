import os
import json
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

# 🧠 CONFIGURE GEMINI
api_key = os.getenv("GEMINI_API_KEY")
if api_key:
    client = genai.Client(api_key=api_key)
else:
    client = None

SYSTEM_PROMPT = """
You are a professional Legal Document Auditor. Your task is to analyze a legal contract and provide a comprehensive risk assessment.

CONTEXT AWARENESS:
1. EMPLOYMENT/INTERNSHIP: If the document is an offer letter or employment agreement, recognize that certain employer-favored clauses (immediate termination, specific jurisdiction, cross-border data transfer for payroll/HR) are standard industry practice. 
   - Label data transfer as "Data Transfer/Privacy Risk" instead of "Data Exploitation".
2. CONSUMER/SaaS: For Terms of Service, be more aggressive with "Data Exploitation" and "Unfair Terms" labels.

CORE RULES:
1. NEGATION BLINDNESS FIX: If the text says "We do NOT sell data", the risk is 0. 
2. CONTRADICTION FIX: If text says "15 days notice", do NOT summarize as "without notice". 

OUTPUT FORMAT (STRICT JSON):
{
  "risk_score": <int 0-100>,
  "detected_clauses": ["Privacy Policy", "Termination", "IP License", "etc"],
  "risks": [
    {"type": "Risk Category", "description": "Concise, relatable explanation of the risk"}
  ],
  "summaries": ["Grounded, accurate summary point 1", "Point 2", "etc"],
  "context": "Employment" or "Consumer"
}
"""

import time

def analyze_with_gemini(text, retries=4):
    if not client:
        return None

    for attempt in range(retries):
        try:
            prompt = f"{SYSTEM_PROMPT}\n\nDocument to analyze:\n{text}"
            response = client.models.generate_content(
                model='gemini-2.5-flash',
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                )
            )
            
            data = json.loads(response.text)
            return data
        except Exception as e:
            print(f"Gemini Error (Attempt {attempt + 1}/{retries}): {e}")
            if 'response' in locals() and hasattr(response, 'text') and response.text:
                print(f"Raw Gemini Response: {response.text}")
                
            if attempt < retries - 1:
                time.sleep(2 ** attempt)  # 1s, 2s, 4s wait
            else:
                return None
