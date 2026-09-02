# 📄 Job-Specific Resume Intelligence Platform

> **Understand how your resume fits a specific job. Improve it before you apply.**

An evidence-first resume intelligence platform that analyzes a candidate's resume against any target job description. Produces a transparent **Job Match Score**, requirement coverage breakdown, missing skills map, evidence citations, and grounded optimization recommendations.

---

## 🎯 Product Principles

* **Evidence-First:** Every requirement match is grounded in direct quotes/citations from the candidate's resume.
* **No Black-Box ATS Claims:** Deterministic scoring with complete transparency—no pretending to simulate arbitrary commercial ATS algorithms.
* **No Fabricated Recommendations:** Suggestions refine existing experience and reframe adjacent skills, but never invent claims for missing qualifications.
* **Hybrid Architecture:** Deterministic text extraction & matching + LLM semantic interpretation for ambiguous requirements.

---

## 🛠️ Architecture & Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Tailwind CSS v3, Framer Motion, Lucide Icons, Axios |
| **Backend API** | FastAPI, Pydantic v2, Python 3.12+ |
| **Database** | PostgreSQL / SQLite with SQLAlchemy ORM (Versioned JSON analysis store) |
| **Extraction** | `pdfplumber` (deterministic PDF text), `BeautifulSoup4` (URL job extraction) |
| **LLM Inference** | Groq (Llama-3 / GPT-OSS / Qwen with 128k context) via `langchain-groq` |
| **Authentication** | JWT Authentication (`python-jose`, `bcrypt`) |

---

## 📁 Clean Repository Structure

```text
├── backend/
│   ├── app.py                     # FastAPI application & route registration
│   ├── config.py                  # Pydantic Settings & model configuration
│   ├── db.py                      # SQLAlchemy session engine
│   ├── models.py                  # User & Application models
│   ├── schemas.py                 # Request/Response Pydantic schemas
│   ├── requirements.txt           # Backend Python dependencies
│   ├── routes/
│   │   ├── auth.py                # Signup / Login JWT authentication
│   │   └── applications.py        # Job creation, resume upload, fit analysis
│   ├── services/
│   │   ├── text_extractor.py      # Deterministic PDF and URL text extraction
│   │   ├── job_parser.py          # Structured JD requirement parsing
│   │   ├── resume_parser.py       # Structured resume section parsing
│   │   ├── matcher.py             # Deterministic + LLM evidence matcher & scorer
│   │   └── recommender.py         # Grounded resume improvement recommendations
│   └── utils/
│       ├── jwt.py                 # JWT token generation & authentication
│       └── logger.py              # Centralized logging
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── analysis/          # ScoreOverview, EvidenceMap, RecommendationList
│   │   │   ├── job/               # JobInput, JobRequirements
│   │   │   ├── layout/            # Header, Sidebar
│   │   │   ├── resume/            # ResumeUpload, ResumePreview
│   │   │   └── ui/                # Card, ScoreRing, ProgressBar, MatchBadge, DiffBlock
│   │   ├── hooks/                 # useApplications, useTheme
│   │   ├── pages/                 # LandingPage, MainApp, login, AuthContext
│   │   ├── services/              # api.js Axios client
│   │   ├── App.js                 # Router & theme providers
│   │   └── index.css              # Custom styling & Tailwind design system
│   └── tailwind.config.js         # Semantic match colors & typography tokens
```

---

## ⚙️ Quickstart

### 1. Backend Setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env
cat <<EOF > .env
secret_key=your_jwt_secret_key
postgres_url=sqlite:///./test.db
api=your_groq_api_key
api1=your_backup_groq_api_key
api2=your_backup_groq_api_key
EOF

# Start the backend server
uvicorn app:app --reload --port 8000
```

### 2. Frontend Setup

```bash
cd frontend
npm install
npm start
```

Visit `http://localhost:3000` to use the application.

---

## 📄 License
MIT License