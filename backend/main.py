import hashlib
import json
import random
import re
import os
import datetime
import urllib.parse
from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, BackgroundTasks, Request
from fastapi.responses import HTMLResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, EmailStr
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from ai.gemini_engine import analyze_with_gemini, chat_with_gemini, translate_with_gemini
from utils.pdf_reader import extract_text_from_pdf
from utils.supabase_client import supabase
import models, database, auth
from dotenv import load_dotenv

load_dotenv()

# Initialize Database
models.Base.metadata.create_all(bind=database.engine)

# Initialize FastAPI app with docs configuration (disabled in production)
ENV = os.getenv("ENV", "development").lower()
show_docs = ENV != "production"

limiter = Limiter(key_func=get_remote_address)
app = FastAPI(
    title="Legal Risk Analyzer API",
    docs_url="/docs" if show_docs else None,
    redoc_url="/redoc" if show_docs else None,
    openapi_url="/openapi.json" if show_docs else None
)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Restricted CORS Allowed Origins Whitelist
allowed_origins = [
    "http://localhost:8081",
    "http://localhost:19006",
    "http://localhost:3000",
    "http://127.0.0.1:8081",
    "http://127.0.0.1:3000",
    "https://legal-risk-analyzer.up.railway.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Serve Expo Static Frontend ───────────────────────────────────────────────
# Determine frontend dist path (relative to this file for Railway deployment)
_BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
_FRONTEND_DIST = os.path.join(_BACKEND_DIR, "..", "frontend", "dist")
_FRONTEND_DIST = os.path.normpath(_FRONTEND_DIST)

# Mount static assets (_expo directory, assets, etc.) if frontend is built
if os.path.isdir(_FRONTEND_DIST):
    _EXPO_ASSETS = os.path.join(_FRONTEND_DIST, "_expo")
    if os.path.isdir(_EXPO_ASSETS):
        app.mount("/_expo", StaticFiles(directory=_EXPO_ASSETS), name="expo_assets")
    _ASSETS_DIR = os.path.join(_FRONTEND_DIST, "assets")
    if os.path.isdir(_ASSETS_DIR):
        app.mount("/assets", StaticFiles(directory=_ASSETS_DIR), name="frontend_assets")


def _serve_frontend_page(page: str) -> HTMLResponse:
    """Serve a specific frontend HTML page from the Expo dist directory."""
    html_file = os.path.join(_FRONTEND_DIST, page)
    if os.path.isfile(html_file):
        with open(html_file, "r", encoding="utf-8") as f:
            return HTMLResponse(content=f.read())
    # Fallback to index.html for SPA routing
    index_file = os.path.join(_FRONTEND_DIST, "index.html")
    if os.path.isfile(index_file):
        with open(index_file, "r", encoding="utf-8") as f:
            return HTMLResponse(content=f.read())
    return HTMLResponse(content="<html><body><h1>Frontend not found</h1></body></html>", status_code=404)


@app.get("/")
def read_root(request: Request):
    # If Accept header prefers HTML (browser request), serve frontend
    accept = request.headers.get("accept", "")
    if "text/html" in accept:
        return _serve_frontend_page("index.html")
    return {"status": "online", "message": "Legal Risk Analyzer API is running!"}


# ─── Frontend Page Routes (SPA) ───────────────────────────────────────────────
@app.get("/login", response_class=HTMLResponse)
def serve_login_page():
    return _serve_frontend_page("login.html")

@app.get("/signup", response_class=HTMLResponse)
def serve_signup_page():
    return _serve_frontend_page("signup.html")

@app.get("/onboarding", response_class=HTMLResponse)
def serve_onboarding_page():
    return _serve_frontend_page("onboarding.html")

@app.get("/upload", response_class=HTMLResponse)
def serve_upload_page():
    return _serve_frontend_page("upload.html")

@app.get("/scanning", response_class=HTMLResponse)
def serve_scanning_page():
    return _serve_frontend_page("scanning.html")

@app.get("/summary", response_class=HTMLResponse)
def serve_summary_page():
    return _serve_frontend_page("summary.html")

@app.get("/clauses", response_class=HTMLResponse)
def serve_clauses_page():
    return _serve_frontend_page("clauses.html")

@app.get("/details", response_class=HTMLResponse)
def serve_details_page():
    return _serve_frontend_page("details.html")

@app.get("/export", response_class=HTMLResponse)
def serve_export_page():
    return _serve_frontend_page("export.html")

@app.get("/(drawer)", response_class=HTMLResponse)
@app.get("/(drawer)/{path:path}", response_class=HTMLResponse)
def serve_drawer_page(path: str = ""):
    """Serve drawer routes – Expo static builds flatten these to root HTML files."""
    # Expo may build drawer routes as flat files: history.html, settings.html, etc.
    # Map known drawer sub-paths to their flat HTML counterparts
    _drawer_page_map = {
        "": "index.html",
        "history": "history.html",
        "settings": "settings.html",
        "chat": "index.html",       # fallback to index if no dedicated page
        "translator": "index.html",
        "templates": "index.html",
    }
    page_filename = _drawer_page_map.get(path, f"{path}.html")
    
    # Try flat file first
    page_file = os.path.join(_FRONTEND_DIST, page_filename)
    if os.path.isfile(page_file):
        with open(page_file, "r", encoding="utf-8") as f:
            return HTMLResponse(content=f.read())
    
    # Try inside (drawer) subdirectory if it exists
    drawer_dir = os.path.join(_FRONTEND_DIST, "(drawer)")
    if os.path.isdir(drawer_dir):
        drawer_page = os.path.join(drawer_dir, f"{path}.html" if path else "index.html")
        if os.path.isfile(drawer_page):
            with open(drawer_page, "r", encoding="utf-8") as f:
                return HTMLResponse(content=f.read())
    
    # Final fallback to main index
    return _serve_frontend_page("index.html")



oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

# --- SCHEMAS ---
class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    dob: str
    is_major: bool
    security_answer: str

class ResetPasswordSecurity(BaseModel):
    email: str
    dob: str
    security_answer: str
    new_password: str



class Token(BaseModel):
    access_token: str
    token_type: str

class Input(BaseModel):
    text: str

class ChatRequest(BaseModel):
    message: str

class TranslateRequest(BaseModel):
    text: str
    language: str

# --- HELPERS ---
def validate_password(password: str):
    """
    Check if password is strong: 8+ chars, 1 number, 1 special char.
    """
    if len(password) < 8:
        return False, "Password must be at least 8 characters long."
    if not re.search("[0-9]", password):
        return False, "Password must contain at least one number."
    if not re.search("[!@#$%^&*(),.?\":{}|<>]", password):
        return False, "Password must contain at least one special character."
    return True, ""



# --- DEPENDENCIES ---
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(database.get_db)):
    # Session invalidation (logout verification)
    is_blacklisted = db.query(models.BlacklistedToken).filter(models.BlacklistedToken.token == token).first()
    if is_blacklisted:
        raise HTTPException(status_code=401, detail="Session has been invalidated. Please log in again.")

    payload = auth.decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    user = db.query(models.User).filter(models.User.email == payload.get("sub")).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

# --- AUTH ROUTES ---
@app.post("/signup")
@limiter.limit("3/minute")  # DAST fix F-002: prevent automated bulk account creation
async def signup(request: Request, user_data: UserCreate, db: Session = Depends(database.get_db)):
    # 1. Age Validation
    try:
        birth_date = datetime.datetime.strptime(user_data.dob, "%Y-%m-%d")
        today = datetime.datetime.today()
        age = today.year - birth_date.year - ((today.month, today.day) < (birth_date.month, birth_date.day))
        if age < 18:
            raise HTTPException(status_code=400, detail="You must be at least 18 years old.")
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date of birth format. Use YYYY-MM-DD.")

    if not user_data.is_major:
        raise HTTPException(status_code=400, detail="You must confirm you are of legal age.")

    # 2. Check if email exists
    db_user = db.query(models.User).filter(models.User.email == user_data.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="This email is already registered. Try logging in.")
    
    # 3. Validate Password Strength
    is_strong, msg = validate_password(user_data.password)
    if not is_strong:
        raise HTTPException(status_code=400, detail=msg)

    # 4. Create User
    hashed_pw = auth.get_password_hash(user_data.password)
    new_user = models.User(
        name=user_data.name, 
        email=user_data.email, 
        hashed_password=hashed_pw, 
        date_of_birth=user_data.dob,
        is_major=user_data.is_major,
        security_answer=user_data.security_answer.strip().lower()
    )
    db.add(new_user)
    db.commit()
    
    access_token = auth.create_access_token(data={"sub": new_user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/login", response_model=Token)
@limiter.limit("5/minute")  # DAST fix F-001: brute-force protection (5 attempts/min per IP)
def login(request: Request, form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    
    access_token = auth.create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/reset-password")
@limiter.limit("3/minute")
def reset_password(request: Request, data: ResetPasswordSecurity, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.email == data.email).first()
    
    if not user:
        raise HTTPException(status_code=400, detail="Invalid details provided.")
        
    if user.date_of_birth != data.dob:
        raise HTTPException(status_code=400, detail="Invalid details provided.")
        
    # Check security answer
    stored_answer = user.security_answer or ""
    if stored_answer.lower() != data.security_answer.strip().lower():
        raise HTTPException(status_code=400, detail="Invalid details provided.")
    
    # Validate New Password Strength
    is_strong, msg = validate_password(data.new_password)
    if not is_strong:
        raise HTTPException(status_code=400, detail=msg)

    user.hashed_password = auth.get_password_hash(data.new_password)
    db.commit()
    
    return {"message": "Password updated successfully! You can now log in."}

@app.post("/logout")
def logout(request: Request, current_user: models.User = Depends(get_current_user), db: Session = Depends(database.get_db)):
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]
        # Check if already blacklisted
        exists = db.query(models.BlacklistedToken).filter(models.BlacklistedToken.token == token).first()
        if not exists:
            db_token = models.BlacklistedToken(token=token)
            db.add(db_token)
            db.commit()
    return {"message": "Successfully logged out."}

@app.get("/me")
async def get_me(current_user: models.User = Depends(get_current_user)):
    return {
        "email": current_user.email, 
        "name": current_user.name,
        "dob": current_user.date_of_birth
    }

class UserUpdate(BaseModel):
    name: str | None = None
    dob: str | None = None

@app.post("/update-profile")
async def update_profile(data: UserUpdate, current_user: models.User = Depends(get_current_user), db: Session = Depends(database.get_db)):
    if data.name is not None:
        current_user.name = data.name
    if data.dob is not None:
        # Age check if DOB is updated
        try:
            birth_date = datetime.datetime.strptime(data.dob, "%Y-%m-%d")
            today = datetime.datetime.today()
            age = today.year - birth_date.year - ((today.month, today.day) < (birth_date.month, birth_date.day))
            if age < 18:
                raise HTTPException(status_code=400, detail="You must be at least 18 years old.")
            current_user.date_of_birth = data.dob
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date of birth format.")
            
    db.commit()
    return {"message": "Profile updated successfully", "name": current_user.name}

# --- CORE LOGIC ---
def get_risk_level(score):
    if score >= 80: return "High Risk"
    if score >= 50: return "Medium Risk"
    return "Low Risk"

@app.post("/analyze")
@limiter.limit("5/minute")
def analyze(request: Request, data: Input, current_user: models.User = Depends(get_current_user), db: Session = Depends(database.get_db)):
    # Input validation: check for blank or whitespace-only strings (DAST injection fix)
    clean_text = data.text.strip() if data.text else ""
    if not clean_text:
        raise HTTPException(
            status_code=400, 
            detail="Analysis text cannot be empty or whitespace-only."
        )

    # Simple hash for raw text caching
    text_hash = hashlib.sha256(clean_text.encode("utf-8", errors="replace")).hexdigest()
    
    # Check if this user has analyzed this text before
    existing_doc = db.query(models.Document).filter(
        models.Document.user_id == current_user.id,
        models.Document.file_hash == text_hash
    ).first()
    
    if existing_doc and existing_doc.analysis:
        return {
            "summary": existing_doc.analysis.data.get("summaries", []),
            "clauses": existing_doc.analysis.data.get("detected_clauses", []),
            "risk_score": existing_doc.analysis.risk_score,
            "risk_level": existing_doc.analysis.risk_level,
            "risks": existing_doc.analysis.data.get("risks", []),
            "cached": True
        }

    # Call Gemini
    try:
        gemini_result = analyze_with_gemini(clean_text)
    except Exception as e:
        print(f"Gemini engine failed during analysis: {e}")
        gemini_result = None

    if not gemini_result:
        raise HTTPException(
            status_code=502, 
            detail="The analysis engine encountered an error or failed to process the request. Please try again."
        )

    # Save to DB
    try:
        new_doc = models.Document(user_id=current_user.id, filename="Raw Text", file_hash=text_hash)
        db.add(new_doc)
        db.commit()
        db.refresh(new_doc)
        
        risk_score = gemini_result.get("risk_score", 10)
        analysis = models.AnalysisResult(
            document_id=new_doc.id,
            risk_score=risk_score,
            risk_level=get_risk_level(risk_score),
            data=gemini_result
        )
        db.add(analysis)
        db.commit()
    except Exception as db_err:
        db.rollback()
        print(f"Database error during saving analysis: {db_err}")
        raise HTTPException(
            status_code=500,
            detail="Failed to save analysis result. Please try again."
        )

    return {
        "summaries": gemini_result.get("summaries", []),
        "clauses": gemini_result.get("detected_clauses", []),
        "risk_score": risk_score,
        "risk_level": get_risk_level(risk_score),
        "risks": gemini_result.get("risks", []),
        "cached": False
    }

MAX_FILE_SIZE = 10 * 1024 * 1024 # 10 MB limit

@app.post("/analyze-pdf")
@limiter.limit("3/minute")
async def analyze_pdf(
    request: Request,
    file: UploadFile = File(...), 
    current_user: models.User = Depends(get_current_user), 
    db: Session = Depends(database.get_db)
):
    # Read file content and check size
    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File size exceeds the 10 MB limit.")
        
    # PDF validation: check magic bytes/signature (%PDF-)
    if not contents.startswith(b"%PDF-"):
        raise HTTPException(status_code=400, detail="Invalid file type. Only PDF documents are allowed.")

    file_hash = hashlib.sha256(contents).hexdigest()
    file.file.seek(0) # Reset file pointer for pdfplumber
    
    # Check Cache
    existing_doc = db.query(models.Document).filter(
        models.Document.user_id == current_user.id,
        models.Document.file_hash == file_hash
    ).first()
    
    if existing_doc and existing_doc.analysis:
        return {
            "summaries": existing_doc.analysis.data.get("summaries", []),
            "clauses": existing_doc.analysis.data.get("detected_clauses", []),
            "risk_score": existing_doc.analysis.risk_score,
            "risk_level": existing_doc.analysis.risk_level,
            "risks": existing_doc.analysis.data.get("risks", []),
            "cached": True
        }

    # Process New PDF
    text = extract_text_from_pdf(file.file)
    gemini_result = analyze_with_gemini(text)
    
    if not gemini_result:
        raise HTTPException(status_code=500, detail="Gemini API Error")

    # Upload to Supabase Storage
    file_url = None
    try:
        file_path = f"{current_user.id}/{file_hash}.pdf"
        file.file.seek(0)
        supabase.storage.from_("legal-documents").upload(file_path, file.file.read(), {"content-type": "application/pdf"})
        file_url = supabase.storage.from_("legal-documents").get_public_url(file_path)
    except Exception as e:
        print(f"Supabase storage upload failed: {e}")

    # Save to DB
    new_doc = models.Document(user_id=current_user.id, filename=file.filename, file_hash=file_hash, file_url=file_url)
    db.add(new_doc)
    db.commit()
    db.refresh(new_doc)
    
    risk_score = gemini_result.get("risk_score", 10)
    analysis = models.AnalysisResult(
        document_id=new_doc.id,
        risk_score=risk_score,
        risk_level=get_risk_level(risk_score),
        data=gemini_result
    )
    db.add(analysis)
    db.commit()

    return {
        "summaries": gemini_result.get("summaries", []),
        "clauses": gemini_result.get("detected_clauses", []),
        "risk_score": risk_score,
        "risk_level": get_risk_level(risk_score),
        "risks": gemini_result.get("risks", []),
        "cached": False
    }

@app.get("/history")
def get_history(current_user: models.User = Depends(get_current_user), db: Session = Depends(database.get_db)):
    docs = db.query(models.Document).filter(models.Document.user_id == current_user.id).order_by(models.Document.created_at.desc()).all()
    history = []
    for doc in docs:
        if doc.analysis:
            history.append({
                "id": doc.id,
                "filename": urllib.parse.unquote(doc.filename) if doc.filename else "Raw Text",
                "file_url": doc.file_url,
                "risk_score": doc.analysis.risk_score,
                "risk_level": doc.analysis.risk_level,
                "date": doc.created_at.isoformat() + "Z"
            })
    return history

@app.get("/analysis/{doc_id}")
def get_analysis_by_id(doc_id: int, current_user: models.User = Depends(get_current_user), db: Session = Depends(database.get_db)):
    doc = db.query(models.Document).filter(models.Document.id == doc_id, models.Document.user_id == current_user.id).first()
    if not doc or not doc.analysis:
        raise HTTPException(status_code=404, detail="Analysis result not found")
    
    return {
        "id": doc.id,
        "filename": urllib.parse.unquote(doc.filename) if doc.filename else "Raw Text",
        "file_url": doc.file_url,
        "risk_score": doc.analysis.risk_score,
        "risk_level": doc.analysis.risk_level,
        "summaries": doc.analysis.data.get("summaries", []),
        "risks": doc.analysis.data.get("risks", []),
        "clauses": doc.analysis.data.get("detected_clauses", []),
        "context": doc.analysis.data.get("context", "Other"),
        "date": doc.created_at.isoformat() + "Z"
    }

@app.post("/chat")
@limiter.limit("10/minute")
def chat_endpoint(request: Request, req: ChatRequest, current_user: models.User = Depends(get_current_user)):
    response = chat_with_gemini(req.message)
    return response

@app.post("/translate")
@limiter.limit("10/minute")
def translate_endpoint(request: Request, req: TranslateRequest, current_user: models.User = Depends(get_current_user)):
    response = translate_with_gemini(req.text, req.language)
    return response
