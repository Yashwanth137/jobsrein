"""
Pydantic schemas for the Resume Intelligence Platform V1.

These models define the API contract and also serve as the structured
output format for LLM extraction stages.
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, field_validator


# ──────────────────────────────────────────────
#  Auth schemas (preserved from Talent Finder)
# ──────────────────────────────────────────────

class SignUpRequest(BaseModel):
    name: str
    email: EmailStr
    number: str
    password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: int
    name: str
    email: Optional[str] = None
    number: Optional[str] = None

    class Config:
        from_attributes = True


# ──────────────────────────────────────────────
#  Job Parsing
# ──────────────────────────────────────────────

class JobParseRequest(BaseModel):
    text: str


class JobParseURLRequest(BaseModel):
    url: str


class ParsedJob(BaseModel):
    """Structured extraction of a job description."""
    title: Optional[str] = None
    company: Optional[str] = None
    seniority: Optional[str] = None
    location: Optional[str] = None
    work_arrangement: Optional[str] = None  # remote / hybrid / onsite
    required_skills: list[str] = []
    preferred_skills: list[str] = []
    responsibilities: list[str] = []
    qualifications: list[str] = []
    experience_requirements: Optional[str] = None
    education_requirements: Optional[str] = None


# ──────────────────────────────────────────────
#  Resume Parsing
# ──────────────────────────────────────────────

class ExperienceEntry(BaseModel):
    title: str = ""
    company: str = ""
    dates: str = ""
    description: str = ""
    achievements: list[str] = []


class ProjectEntry(BaseModel):
    name: str = ""
    description: str = ""
    technologies: list[str] = []
    highlights: list[str] = []


class EducationEntry(BaseModel):
    degree: str = ""
    institution: str = ""
    dates: str = ""
    details: str = ""


class ParsedResume(BaseModel):
    """Structured extraction of a resume."""
    summary: Optional[str] = None
    experience: list[ExperienceEntry] = []
    projects: list[ProjectEntry] = []
    skills: list[str] = []
    education: list[EducationEntry] = []
    certifications: list[str] = []
    technologies: list[str] = []
    achievements: list[str] = []


# ──────────────────────────────────────────────
#  Analysis
# ──────────────────────────────────────────────

class EvidenceItem(BaseModel):
    requirement: str
    evidence: Optional[str] = None        # Cited resume text, or None
    match_level: str                      # "strong" | "partial" | "missing"
    source: Optional[str] = None          # Which resume section
    impact: Optional[str] = None          # "high" | "medium" | "low"
    confidence: Optional[float] = None    # 0.0 – 1.0


class GapItem(BaseModel):
    gap_type: str       # missing_skill | weak_evidence | missing_keyword | etc.
    description: str
    severity: str       # high | medium | low


class RecommendationItem(BaseModel):
    requirement: str
    current_text: Optional[str] = None
    suggested_text: Optional[str] = None
    rationale: str
    category: str       # "already_demonstrated" | "possibly_relevant" | "missing"
    status: str = "pending"  # pending | approved | rejected


class DimensionScores(BaseModel):
    skills: int = 0
    experience: int = 0
    responsibilities: int = 0
    projects: int = 0
    education: int = 0
    keywords: int = 0


class AnalysisMethodology(BaseModel):
    weights: dict = {
        "skills": 0.25,
        "experience": 0.25,
        "responsibilities": 0.20,
        "projects": 0.10,
        "education": 0.10,
        "keywords": 0.10,
    }
    version: str = "v1"


class AnalysisResult(BaseModel):
    overall_score: int = 0
    dimensions: DimensionScores = DimensionScores()
    evidence_map: list[EvidenceItem] = []
    gaps: list[GapItem] = []
    recommendations: list[RecommendationItem] = []
    methodology: AnalysisMethodology = AnalysisMethodology()
    summary: str = ""


# ──────────────────────────────────────────────
#  Application API
# ──────────────────────────────────────────────

class ApplicationCreate(BaseModel):
    job_text: Optional[str] = None
    job_url: Optional[str] = None


class ApplicationListItem(BaseModel):
    id: str
    job_title: Optional[str] = None
    company: Optional[str] = None
    overall_score: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ApplicationDetail(BaseModel):
    id: str
    job_title: Optional[str] = None
    company: Optional[str] = None
    job_parsed: Optional[ParsedJob] = None
    job_raw_text: Optional[str] = None
    resume_filename: Optional[str] = None
    resume_parsed: Optional[ParsedResume] = None
    analysis_result: Optional[AnalysisResult] = None
    analysis_version: int = 0
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class JobUpdateRequest(BaseModel):
    """User edits to the extracted job requirements."""
    job_parsed: ParsedJob


class RecommendationStatusUpdate(BaseModel):
    status: str  # "approved" | "rejected"