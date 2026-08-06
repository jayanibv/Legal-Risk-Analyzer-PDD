import json
import re
import time
import requests

# ---------------------------------------------------------------------------
# Ollama configuration
# ---------------------------------------------------------------------------
OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL_NAME = "qwen2.5:3b"

# ---------------------------------------------------------------------------
# System prompt – kept exactly as originally authored
# ---------------------------------------------------------------------------
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

# ---------------------------------------------------------------------------
# Reusable Ollama helper
# ---------------------------------------------------------------------------

def ask_ollama(prompt: str) -> str:
    """
    POST a prompt to the local Ollama instance and return the generated text.
    Retries up to twice on transient failures.
    """
    payload = {
        "model": MODEL_NAME,
        "prompt": prompt,
        "stream": False,
    }

    last_error = None
    for attempt in range(3):          # initial try + 2 retries
        try:
            response = requests.post(
                OLLAMA_URL,
                json=payload,
                timeout=180,
            )
            response.raise_for_status()
            data = response.json()
            return data.get("response", "")
        except requests.exceptions.ConnectionError as e:
            last_error = e
            print(f"Ollama connection error (attempt {attempt + 1}/3): {e}")
            if attempt < 2:
                time.sleep(2 ** attempt)
        except requests.exceptions.Timeout as e:
            last_error = e
            print(f"Ollama timeout (attempt {attempt + 1}/3): {e}")
            if attempt < 2:
                time.sleep(2 ** attempt)
        except Exception as e:
            last_error = e
            print(f"Ollama unexpected error (attempt {attempt + 1}/3): {e}")
            if attempt < 2:
                time.sleep(2 ** attempt)

    raise RuntimeError(
        f"Ollama is unavailable after 3 attempts. Last error: {last_error}"
    )


# ---------------------------------------------------------------------------
# Document analysis
# ---------------------------------------------------------------------------

def analyze_document(text, retries=2):
    """
    Analyze a legal document and return a parsed risk-assessment dictionary.
    Returns None if analysis fails after all retries.
    """
    prompt = f"{SYSTEM_PROMPT}\n\nDocument to analyze:\n{text}"

    for attempt in range(retries):
        try:
            raw = ask_ollama(prompt)

            # Strip markdown code fences if the model wrapped the JSON
            clean = re.sub(r"```(?:json)?", "", raw, flags=re.IGNORECASE).strip()
            clean = clean.strip("`").strip()

            # Extract the first JSON object from the response
            json_match = re.search(r'\{.*\}', clean, re.DOTALL)
            if json_match:
                clean = json_match.group(0)

            data = json.loads(clean)
            return data

        except (json.JSONDecodeError, ValueError) as e:
            print(f"JSON parse error (attempt {attempt + 1}/{retries}): {e}")
            if attempt < retries - 1:
                time.sleep(2 ** attempt)
            else:
                return None

        except RuntimeError as e:
            # Ollama is offline – surface a clear error, no retry needed
            print(f"Ollama unavailable during document analysis: {e}")
            return None

        except Exception as e:
            print(f"analyze_document error (attempt {attempt + 1}/{retries}): {e}")
            if attempt < retries - 1:
                time.sleep(2 ** attempt)
            else:
                return None


# ---------------------------------------------------------------------------
# Legal assistant chatbot
# ---------------------------------------------------------------------------

CHAT_SYSTEM_PROMPT = (
    "You are a professional Legal Assistant. "
    "Answer clearly. "
    "Keep answers concise. "
    "Always mention that you are an AI assistant and not a licensed lawyer."
)


def chat_with_bot(message: str) -> str:
    """Simple conversational function for the Legal Assistant chatbot."""
    prompt = f"{CHAT_SYSTEM_PROMPT}\n\nUser: {message}\nAssistant:"

    try:
        reply = ask_ollama(prompt)
        return reply.strip() if reply else "I'm sorry, I received an empty response."
    except RuntimeError as e:
        print(f"Chat Error: {e}")
        return (
            "I'm sorry, the AI engine is currently offline. "
            "Please make sure Ollama is running locally and try again."
        )
    except Exception as e:
        print(f"Chat Error: {e}")
        return "I'm sorry, I'm having trouble connecting to the AI engine right now."


# ---------------------------------------------------------------------------
# Legal Document Translator
# ---------------------------------------------------------------------------

def translate_document(text: str, language: str) -> str:
    """
    Translate a legal document into the specified language using local Ollama.
    """
    prompt = f"""You are an expert legal translator.

Translate the following legal document into {language}.

Requirements:

• Preserve the legal meaning exactly.
• Preserve legal terminology.
• Preserve formatting whenever possible.
• Do NOT summarize.
• Do NOT simplify.
• Do NOT explain.
• Return ONLY the translated document.

Document to translate:
{text}"""

    try:
        reply = ask_ollama(prompt)
        return reply.strip() if reply else ""
    except Exception as e:
        print(f"Translation Error: {e}")
        raise e

