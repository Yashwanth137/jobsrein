"""
Application API routes.

Handles the full application lifecycle:
  - Create application (with JD text or URL)
  - List user's applications
  - Get full application detail
  - Update extracted job requirements
  - Upload + parse resume
  - Run analysis
  - Update recommendation status
  - Delete application
"""

import traceback
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from sqlalchemy.orm import Session

from db import get_db
from models import Application, User
from schemas import (
    ApplicationCreate, ApplicationListItem, ApplicationDetail,
    JobParseRequest, JobParseURLRequest, JobUpdateRequest,
    ParsedJob, ParsedResume, AnalysisResult, RecommendationStatusUpdate,
)
from routes.auth import get_current_user
from services.text_extractor import extract_pdf_text, extract_url_text
from services.job_parser import parse_job_description
from services.resume_parser import parse_resume
from services.matcher import run_analysis
from services.recommender import generate_recommendations
from utils.logger import logger

router = APIRouter(prefix="/api/applications", tags=["Applications"])


# ──────────────────────────────────────────────
#  CREATE — new application
# ──────────────────────────────────────────────

@router.post("/", response_model=ApplicationDetail)
async def create_application(
    body: ApplicationCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new application with a job description (text or URL)."""
    job_raw_text = body.job_text
    job_url = body.job_url

    # If URL provided, try to extract text from it
    if job_url and not job_raw_text:
        extracted = extract_url_text(job_url)
        if extracted:
            job_raw_text = extracted
        else:
            raise HTTPException(
                status_code=400,
                detail="Could not extract text from the URL. Please paste the job description text directly.",
            )

    if not job_raw_text:
        raise HTTPException(status_code=400, detail="Please provide job_text or job_url.")

    # Parse job description with LLM
    try:
        parsed_job = parse_job_description(job_raw_text)
    except Exception as e:
        logger.error(f"Job parsing failed: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to parse job description: {str(e)}")

    app = Application(
        user_id=user.id,
        job_title=parsed_job.title,
        company=parsed_job.company,
        job_raw_text=job_raw_text,
        job_url=job_url,
        job_parsed=parsed_job.model_dump(),
    )
    db.add(app)
    db.commit()
    db.refresh(app)

    return _build_detail(app)


# ──────────────────────────────────────────────
#  LIST — user's applications
# ──────────────────────────────────────────────

@router.get("/", response_model=list[ApplicationListItem])
async def list_applications(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List all applications for the current user."""
    apps = (
        db.query(Application)
        .filter(Application.user_id == user.id)
        .order_by(Application.updated_at.desc())
        .all()
    )

    result = []
    for app in apps:
        overall_score = None
        if app.analysis_result and isinstance(app.analysis_result, dict):
            overall_score = app.analysis_result.get("overall_score")

        result.append(ApplicationListItem(
            id=app.id,
            job_title=app.job_title,
            company=app.company,
            overall_score=overall_score,
            created_at=app.created_at,
            updated_at=app.updated_at,
        ))

    return result


# ──────────────────────────────────────────────
#  GET — full application detail
# ──────────────────────────────────────────────

@router.get("/{app_id}", response_model=ApplicationDetail)
async def get_application(
    app_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get full detail for a specific application."""
    app = _get_user_app(app_id, user.id, db)
    return _build_detail(app)


# ──────────────────────────────────────────────
#  UPDATE — edit extracted job requirements
# ──────────────────────────────────────────────

@router.put("/{app_id}/job")
async def update_job_requirements(
    app_id: str,
    body: JobUpdateRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update the extracted job requirements (user edits)."""
    app = _get_user_app(app_id, user.id, db)

    app.job_parsed = body.job_parsed.model_dump()
    app.job_title = body.job_parsed.title
    app.company = body.job_parsed.company
    # Clear stale analysis when requirements change
    app.analysis_result = None
    app.analysis_version = 0

    db.commit()
    db.refresh(app)

    return _build_detail(app)


# ──────────────────────────────────────────────
#  UPLOAD — parse resume PDF
# ──────────────────────────────────────────────

@router.post("/{app_id}/resume")
async def upload_resume(
    app_id: str,
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Upload and parse a PDF resume for this application."""
    app = _get_user_app(app_id, user.id, db)

    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    # Stage 1: Deterministic text extraction
    file_bytes = await file.read()
    try:
        raw_text = extract_pdf_text(file_bytes)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Stage 2: LLM structured parsing
    try:
        parsed_resume = parse_resume(raw_text)
    except Exception as e:
        logger.error(f"Resume parsing failed: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to parse resume: {str(e)}")

    app.resume_filename = file.filename
    app.resume_raw_text = raw_text
    app.resume_parsed = parsed_resume.model_dump()
    # Clear stale analysis when resume changes
    app.analysis_result = None
    app.analysis_version = 0

    db.commit()
    db.refresh(app)

    return _build_detail(app)


# ──────────────────────────────────────────────
#  ANALYZE — run the full pipeline
# ──────────────────────────────────────────────

@router.post("/{app_id}/analyze")
async def analyze_application(
    app_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Run the full analysis pipeline:
      1. Deterministic matching
      2. LLM evidence interpretation
      3. Deterministic score computation
      4. LLM recommendation generation
    """
    app = _get_user_app(app_id, user.id, db)

    if not app.job_parsed:
        raise HTTPException(status_code=400, detail="No job description found. Add a job first.")
    if not app.resume_parsed:
        raise HTTPException(status_code=400, detail="No resume found. Upload a resume first.")

    try:
        parsed_job = ParsedJob(**app.job_parsed)
        parsed_resume = ParsedResume(**app.resume_parsed)

        # Stages 5-7: Analysis
        analysis = run_analysis(parsed_job, parsed_resume, app.resume_raw_text or "")

        # Stage 8: Recommendations
        recommendations = generate_recommendations(
            analysis.evidence_map,
            parsed_resume,
            app.resume_raw_text or "",
        )
        analysis.recommendations = recommendations

        # Save
        app.analysis_result = analysis.model_dump()
        app.analysis_version = (app.analysis_version or 0) + 1

        db.commit()
        db.refresh(app)

        return _build_detail(app)

    except Exception as e:
        traceback.print_exc()
        logger.error(f"Analysis failed: {e}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


# ──────────────────────────────────────────────
#  PATCH — update recommendation status
# ──────────────────────────────────────────────

@router.patch("/{app_id}/recommendations/{rec_index}")
async def update_recommendation_status(
    app_id: str,
    rec_index: int,
    body: RecommendationStatusUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Approve or reject a specific recommendation."""
    app = _get_user_app(app_id, user.id, db)

    if not app.analysis_result:
        raise HTTPException(status_code=400, detail="No analysis found.")

    recs = app.analysis_result.get("recommendations", [])
    if rec_index < 0 or rec_index >= len(recs):
        raise HTTPException(status_code=404, detail="Recommendation not found.")

    if body.status not in ("approved", "rejected"):
        raise HTTPException(status_code=400, detail="Status must be 'approved' or 'rejected'.")

    # Update the recommendation status in the JSON
    recs[rec_index]["status"] = body.status
    app.analysis_result["recommendations"] = recs

    # SQLAlchemy needs to detect JSON mutation
    from sqlalchemy.orm.attributes import flag_modified
    flag_modified(app, "analysis_result")

    db.commit()
    db.refresh(app)

    return {"status": "updated", "recommendation_index": rec_index, "new_status": body.status}


# ──────────────────────────────────────────────
#  DELETE — remove application
# ──────────────────────────────────────────────

@router.delete("/{app_id}")
async def delete_application(
    app_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete an application."""
    app = _get_user_app(app_id, user.id, db)
    db.delete(app)
    db.commit()
    return {"status": "deleted", "id": app_id}


# ──────────────────────────────────────────────
#  Job parsing endpoints (standalone, no app)
# ──────────────────────────────────────────────

jobs_router = APIRouter(prefix="/api/jobs", tags=["Jobs"])


@jobs_router.post("/parse", response_model=ParsedJob)
async def parse_job(body: JobParseRequest):
    """Parse a job description text into structured requirements (preview, no save)."""
    try:
        return parse_job_description(body.text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse: {str(e)}")


@jobs_router.post("/parse-url", response_model=ParsedJob)
async def parse_job_from_url(body: JobParseURLRequest):
    """Fetch URL text and parse into structured requirements (preview, no save)."""
    text = extract_url_text(body.url)
    if not text:
        raise HTTPException(
            status_code=400,
            detail="Could not extract text from the URL. Please paste the job description directly.",
        )
    try:
        return parse_job_description(text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse: {str(e)}")


# ──────────────────────────────────────────────
#  Helpers
# ──────────────────────────────────────────────

def _get_user_app(app_id: str, user_id: int, db: Session) -> Application:
    """Get an application, ensuring it belongs to the current user."""
    app = db.query(Application).filter(
        Application.id == app_id,
        Application.user_id == user_id,
    ).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found.")
    return app


def _build_detail(app: Application) -> ApplicationDetail:
    """Build an ApplicationDetail response from a DB model."""
    job_parsed = None
    if app.job_parsed:
        job_parsed = ParsedJob(**app.job_parsed)

    resume_parsed = None
    if app.resume_parsed:
        resume_parsed = ParsedResume(**app.resume_parsed)

    analysis_result = None
    if app.analysis_result:
        analysis_result = AnalysisResult(**app.analysis_result)

    return ApplicationDetail(
        id=app.id,
        job_title=app.job_title,
        company=app.company,
        job_parsed=job_parsed,
        job_raw_text=app.job_raw_text,
        resume_filename=app.resume_filename,
        resume_parsed=resume_parsed,
        analysis_result=analysis_result,
        analysis_version=app.analysis_version or 0,
        created_at=app.created_at,
        updated_at=app.updated_at,
    )
