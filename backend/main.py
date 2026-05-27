import hashlib
import json
import random
import re
import os
import datetime
import urllib.parse
from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, BackgroundTasks
from pydantic import BaseModel, EmailStr
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi_mail import ConnectionConfig, FastMail, MessageSchema, MessageType

from ai.gemini_engine import analyze_with_gemini
from utils.pdf_reader import extract_text_from_pdf
from utils.supabase_client import supabase
import models, database, auth
from dotenv import load_dotenv

load_dotenv()

# Initialize Database
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="Legal Risk Analyzer API")

@app.get("/")
def read_root():
    return {"status": "online", "message": "Legal Risk Analyzer API is running!"}


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Email Configuration
conf = ConnectionConfig(
    MAIL_USERNAME = os.getenv("MAIL_USERNAME"),
    MAIL_PASSWORD = os.getenv("MAIL_PASSWORD"),
    MAIL_FROM = os.getenv("MAIL_FROM"),
    MAIL_PORT = int(os.getenv("MAIL_PORT")),
    MAIL_SERVER = os.getenv("MAIL_SERVER"),
    MAIL_FROM_NAME = os.getenv("MAIL_FROM_NAME"),
    MAIL_STARTTLS = True,
    MAIL_SSL_TLS = False,
    USE_CREDENTIALS = True,
    VALIDATE_CERTS = True
)

fm = FastMail(conf)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

# --- SCHEMAS ---
class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    dob: str
    is_major: bool

class VerifyOTP(BaseModel):
    email: str
    code: str

class ResetPassword(BaseModel):
    email: str
    otp: str
    new_password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class Input(BaseModel):
    text: str

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

async def send_otp_email(email: str, otp: str):
    message = MessageSchema(
        subject="Your Legal Auditor Verification Code",
        recipients=[email],
        body=f"Your verification code is: {otp}\n\nThis code will expire in 10 minutes.",
        subtype=MessageType.plain
    )
    await fm.send_message(message)

async def send_reset_email(email: str, otp: str):
    message = MessageSchema(
        subject="Password Reset Request - Legal Auditor",
        recipients=[email],
        body=f"You requested a password reset. Your OTP is: {otp}",
        subtype=MessageType.plain
    )
    await fm.send_message(message)

# --- DEPENDENCIES ---
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(database.get_db)):
    payload = auth.decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    user = db.query(models.User).filter(models.User.email == payload.get("sub")).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

# --- AUTH ROUTES ---
@app.post("/signup")
async def signup(user_data: UserCreate, background_tasks: BackgroundTasks, db: Session = Depends(database.get_db)):
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

    # 4. Create User (Unverified)
    hashed_pw = auth.get_password_hash(user_data.password)
    new_user = models.User(
        name=user_data.name, 
        email=user_data.email, 
        hashed_password=hashed_pw, 
        is_verified=0, 
        date_of_birth=user_data.dob,
        is_major=user_data.is_major
    )
    db.add(new_user)
    
    # 5. Generate OTP
    otp_code = str(random.randint(100000, 999999))
    new_otp = models.OTP(email=user_data.email, code=otp_code)
    db.add(new_otp)
    
    db.commit()
    
    # Send Real Email in Background
    background_tasks.add_task(send_otp_email, user_data.email, otp_code)
    
    return {"message": "Account created successfully! Please verify your email with the OTP sent."}

@app.post("/verify-otp", response_model=Token)
def verify_otp(data: VerifyOTP, db: Session = Depends(database.get_db)):
    otp_record = db.query(models.OTP).filter(models.OTP.email == data.email, models.OTP.code == data.code).first()
    if not otp_record:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")
    
    user = db.query(models.User).filter(models.User.email == data.email).first()
    if user:
        user.is_verified = 1
        db.delete(otp_record) # Clean up
        db.commit()
        
        access_token = auth.create_access_token(data={"sub": user.email})
        return {"access_token": access_token, "token_type": "bearer"}
    
    raise HTTPException(status_code=404, detail="User not found")

@app.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    
    if user.is_verified == 0:
        raise HTTPException(status_code=403, detail="Please verify your email before logging in.")
    
    access_token = auth.create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/forgot-password")
async def forgot_password(email: str, background_tasks: BackgroundTasks, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="No account found with this email.")
    
    otp_code = str(random.randint(100000, 999999))
    new_otp = models.OTP(email=email, code=otp_code)
    db.add(new_otp)
    db.commit()
    
    background_tasks.add_task(send_reset_email, email, otp_code)
    return {"message": "OTP sent to your email for password reset."}

@app.post("/reset-password")
def reset_password(data: ResetPassword, db: Session = Depends(database.get_db)):
    otp_record = db.query(models.OTP).filter(models.OTP.email == data.email, models.OTP.code == data.otp).first()
    if not otp_record:
        raise HTTPException(status_code=400, detail="Invalid OTP")
    
    user = db.query(models.User).filter(models.User.email == data.email).first()
    
    # Validate New Password Strength
    is_strong, msg = validate_password(data.new_password)
    if not is_strong:
        raise HTTPException(status_code=400, detail=msg)

    user.hashed_password = auth.get_password_hash(data.new_password)
    db.delete(otp_record)
    db.commit()
    
    return {"message": "Password updated successfully! You can now log in."}

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
def analyze(data: Input, current_user: models.User = Depends(get_current_user), db: Session = Depends(database.get_db)):
    # Simple hash for raw text caching
    text_hash = hashlib.sha256(data.text.encode()).hexdigest()
    
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
    gemini_result = analyze_with_gemini(data.text)
    if not gemini_result:
        raise HTTPException(status_code=500, detail="Gemini API Error")

    # Save to DB
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

    return {
        "summaries": gemini_result.get("summaries", []),
        "clauses": gemini_result.get("detected_clauses", []),
        "risk_score": risk_score,
        "risk_level": get_risk_level(risk_score),
        "risks": gemini_result.get("risks", []),
        "cached": False
    }

@app.post("/analyze-pdf")
async def analyze_pdf(
    file: UploadFile = File(...), 
    current_user: models.User = Depends(get_current_user), 
    db: Session = Depends(database.get_db)
):
    # Read file content and create hash
    contents = await file.read()
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
