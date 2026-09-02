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