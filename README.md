# ⚖️ Legal Risk Analyzer

**Legal Risk Analyzer** is a production-ready, AI-powered tool designed to help users identify predatory terms, hidden fees, and unfair clauses in legal documents. It uses advanced semantic analysis to understand context, negations, and complex legal synonyms, ensuring your agreements are fair and transparent.

![App Header](https://img.shields.io/badge/AI-Powered-blue) ![Backend](https://img.shields.io/badge/FastAPI-Framework-green) ![Database](https://img.shields.io/badge/PostgreSQL-Managed-blue) ![Frontend](https://img.shields.io/badge/React%20Native-Expo-blueviolet)

---

## 🚀 Key Features

- **🔍 Semantic Audit**: Detects high-risk clauses like "Data Exploitation," "Unilateral Termination," and "Hidden Costs" using grounded AI logic.
- **🔐 Secure Authentication**: Complete user management system including Signup with **OTP Verification**, Secure Login, and a robust **Password Reset** flow.
- **📄 High-Fidelity PDF Export**: Generate professional PDF reports of your analysis. On Web, it uses `html2pdf.js` with native sharing; on Mobile, it integrates with `expo-print`.
- **⏳ Persistent History**: Never lose a scan. All your previous document audits are stored securely and accessible anytime via the History dashboard.
- **🌗 Universal Dark Mode**: A sleek, professional UI that supports global theme switching across all screens (Dashboard, History, Settings).
- **👤 Profile Management**: Edit your personal details with a custom Date of Birth calendar and real-time profile updates.
- **📊 Dynamic Risk Scoring**: Provides a 0-100 score with visual color-coded indicators (Green/Yellow/Red) and detailed clause breakdowns.

---

## 🛠️ Tech Stack

### Backend
- **Framework**: [FastAPI](https://fastapi.tiangolo.com/) (Python 3.10+)
- **Core AI**: [Gemini Pro](https://aistudio.google.com/) for high-precision legal reasoning.
- **Database**: [PostgreSQL](https://www.postgresql.org/) with [SQLAlchemy ORM](https://www.sqlalchemy.org/).
- **Security**: JWT-based authentication, salted password hashing (bcrypt), and OTP-gated registration.
- **Email**: Gmail SMTP integration for OTP and Password Reset delivery.

### Frontend
- **Framework**: [React Native](https://reactnative.dev/) + [Expo Router](https://docs.expo.dev/router/introduction/).
- **UI/UX**: Custom "Professional Navy" design system with `ThemeContext` for dynamic dark mode.
- **PDF Engine**: Dynamic `html2pdf.js` (Web) and `expo-print/sharing` (Native).

---

## ⚙️ Installation & Setup

### 1. Prerequisites
- Python 3.10+
- Node.js & npm/yarn
- A [Google AI Studio API Key](https://aistudio.google.com/app/apikey)
- A Gmail account with an [App Password](https://myaccount.google.com/apppasswords) for SMTP.

### 2. Backend Setup
```bash
cd backend
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Install deps:
pip install -r requirements.txt
```
- Create a `.env` file in the `backend` folder:
```env
DATABASE_URL=postgresql://user:pass@localhost/dbname
SECRET_KEY=your_jwt_secret
GEMINI_API_KEY=your_google_api_key
MAIL_USERNAME=your_gmail@gmail.com
MAIL_PASSWORD=your_app_password
MAIL_FROM=your_gmail@gmail.com
```
- Start the server:
```bash
uvicorn main:app --reload
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npx expo start
```
- Press `w` to open in your browser, or use the Expo Go app.

---

## 📂 Project Structure

```text
├── backend/
│   ├── ai/                # LLM Analysis Logic
│   ├── utils/             # PDF Parsing & Helpers
│   ├── main.py            # API Routes (Auth, Analysis, Profile)
│   ├── models.py          # SQLAlchemy Database Schemas
│   └── auth.py            # JWT & Hashing Logic
├── frontend/
│   ├── app/               # Expo Router Screens (Tabs & Modals)
│   ├── context/           # Theme & Auth Context
│   └── services/          # API Integration layer
└── README.md
```

---

## ⚖️ Disclaimer
*This tool is for educational and informational purposes only and does not constitute legal advice. Always consult with a qualified attorney before signing any legal agreement.*