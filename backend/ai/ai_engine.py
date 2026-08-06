import os
import json
import re
from dotenv import load_dotenv
from groq import Groq
from google import genai
from google.genai import types

load_dotenv()

# Initialize API Clients
gemini_api_key = os.getenv("GEMINI_API_KEY")
groq_api_key = os.getenv("GROQ_API_KEY")

gemini_client = genai.Client(api_key=gemini_api_key) if gemini_api_key else None
groq_client = Groq(api_key=groq_api_key) if groq_api_key else None

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

Respond ONLY with the raw JSON object. Do not include markdown formatting or explanations.
"""

def analyze_document(text, retries=2):
    if not gemini_client:
        return None

    for attempt in range(retries):
        try:
            prompt = f"{SYSTEM_PROMPT}\n\nDocument to analyze:\n{text}"
            response = gemini_client.models.generate_content(
                model='gemini-3.5-flash',
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                )
            )
            
            clean_text = response.text
            json_match = re.search(r'\{.*\}', clean_text, re.DOTALL)
            if json_match:
                clean_text = json_match.group(0)
            else:
                clean_text = clean_text.strip()
            
            data = json.loads(clean_text)
            return data
        except Exception as e:
            print(f"Gemini Error (Attempt {attempt + 1}/{retries}): {e}")
            if attempt < retries - 1:
                import time
                time.sleep(2 ** attempt)
            else:
                return None

def chat_with_bot(message: str) -> str:
    """Simple conversational function for the Legal Assistant chatbot."""
    if not groq_client:
        return "Sorry, the AI engine is currently offline."
    
    try:
        response = groq_client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": "You are a helpful Legal Assistant chatbot. Provide a concise, helpful, and professional answer to the user's question. Always include a disclaimer that you are an AI and this is not formal legal advice."
                },
                {
                    "role": "user",
                    "content": message
                }
            ],
            model="llama-3.1-8b-instant",
            max_tokens=1024
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        print(f"Chat Error: {e}")
        return "I'm sorry, I'm having trouble connecting to my servers right now."
