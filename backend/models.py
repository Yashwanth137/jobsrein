import uuid
from datetime import datetime

from sqlalchemy import Column, Integer, String, Text, Float, ARRAY, DateTime, ForeignKey, JSON
from db import Base


class User(Base):
    """Existing user model — preserved from Talent Finder."""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    number = Column(String)
    password = Column(String, nullable=False)


class Application(Base):
    """
    One job application the user is analyzing.

    Stores the full analysis lifecycle as JSON columns so the schema
    can evolve without migrations. Normalize later if query patterns
    justify it.
    """
    __tablename__ = "applications"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    # --- Job info ---
    job_title = Column(String, nullable=True)
    company = Column(String, nullable=True)
    job_raw_text = Column(Text, nullable=True)         # Original JD text
    job_url = Column(String, nullable=True)             # Optional source URL
    job_parsed = Column(JSON, nullable=True)            # Structured JD extraction

    # --- Resume info ---
    resume_filename = Column(String, nullable=True)
    resume_raw_text = Column(Text, nullable=True)       # Extracted PDF text
    resume_parsed = Column(JSON, nullable=True)         # Structured resume extraction

    # --- Analysis (versioned JSON) ---
    analysis_result = Column(JSON, nullable=True)
    # Shape:
    # {
    #   "overall_score": int,
    #   "dimensions": {"skills": int, "experience": int, ...},
    #   "evidence_map": [{"requirement": str, "evidence": str|null,
    #                      "match_level": "strong"|"partial"|"missing",
    #                      "source": str|null, "impact": str|null,
    #                      "confidence": float|null}],
    #   "gaps": [{"type": str, "description": str, "severity": str}],
    #   "recommendations": [{"requirement": str, "current_text": str,
    #                         "suggested_text": str, "rationale": str,
    #                         "category": str, "status": "pending"}],
    #   "methodology": {"weights": {...}, "version": "v1"},
    #   "summary": str
    # }
    analysis_version = Column(Integer, default=0)

    # --- Timestamps ---
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
