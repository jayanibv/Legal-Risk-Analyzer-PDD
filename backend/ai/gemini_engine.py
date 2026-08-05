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
  "context": "Employment" or "Consumer",
  "at_a_glance": {
    "document_type": "e.g., Employment Contract",
    "pages": <estimated int pages>,
    "risk_level": "Low/Medium/High",
    "important_dates": <int count of dates found>,
    "critical_clauses": <int count of critical clauses>,
    "missing_clauses": <int count of standard clauses missing>
  },
  "verdict": {
    "recommendation": "e.g. Sign With Caution, Do Not Sign, Safe to Sign",
    "confidence": <int 0-100>,
    "fairness": <int 0-100>,
    "completeness": <int 0-100>,
    "top_concerns": ["Concern 1", "Concern 2"],
    "recommended_actions": ["Action 1", "Action 2"]
  }
}
VERDICT WEIGHTING: Base your verdict roughly on: High-Risk Clauses (35%), Missing Essential Clauses (20%), Financial Obligations (15%), Fairness (15%), Readability (5%), Ambiguous Language (10%).
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
            
            import re
            clean_text = response.text
            json_match = re.search(r'\{.*\}', clean_text, re.DOTALL)
            if json_match:
                clean_text = json_match.group(0)
            else:
                clean_text = clean_text.strip()
            
            data = json.loads(clean_text)
            return data
        except Exception as e:
            with open("debug.log", "a", encoding="utf-8") as f:
                f.write(f"Gemini Error (Attempt {attempt + 1}): {e}\n")
                if 'response' in locals() and hasattr(response, 'text'):
                    f.write(f"Raw Response: {response.text}\n")
            print(f"Gemini Error (Attempt {attempt + 1}/{retries}): {e}")
                
            if attempt < retries - 1:
                import time
                time.sleep(2 ** attempt)  # 1s, 2s, 4s wait
            else:
                return None

import re

def chat_with_gemini(message, retries=4):
    if not client:
        return {"response": "AI is unavailable right now."}
    
    for attempt in range(retries):
        try:
            prompt = f"You are a strict Legal Assistant. You MUST ONLY answer questions related to law, legal concepts, contracts, and rights. If a user asks a question about coding, programming, sports, math, general trivia, or ANY non-legal topic, you MUST firmly refuse to answer and remind them that you are strictly a Legal Assistant. Answer the user's question simply and accurately if it is legal. Avoid giving strict legal advice, but explain concepts clearly.\n\nUser: {message}"
            response = client.models.generate_content(
                model='gemini-2.5-flash',
                contents=prompt
            )
            return {"response": response.text}
        except Exception as e:
            if attempt < retries - 1:
                delay = 5
                match = re.search(r'retry in ([\d\.]+)s', str(e))
                if match:
                    delay = float(match.group(1)) + 1
                time.sleep(delay)
            else:
                return {"response": "Sorry, I couldn't process your request."}

