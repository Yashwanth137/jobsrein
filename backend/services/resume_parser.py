"""
Resume Parser.

Stage 4 of the pipeline: uses LLM to extract structured sections
from raw resume text. The text extraction itself (PDF → text) is
done deterministically in text_extractor.py.
"""

import json
from langchain_groq import ChatGroq
from config import settings
from schemas import ParsedResume
from utils.logger import logger

# ──────────────────────────────────────────────
#  LLM Setup
# ──────────────────────────────────────────────

llm = ChatGroq(
    model=settings.groq_model,
    temperature=settings.llm_temperature,
    api_key=settings.api,
)

# ──────────────────────────────────────────────
#  Extraction Prompt
# ──────────────────────────────────────────────

RESUME_PARSE_PROMPT = """You are a resume parser. Extract structured information from the following resume text.

Return a JSON object with exactly these fields:
{{
  "summary": "Professional summary/objective or null if not present",
  "experience": [
    {{
      "title": "Job title",
      "company": "Company name",
      "dates": "Date range, e.g. 'Jan 2022 - Present'",
      "description": "Brief description of role",
      "achievements": ["Quantifiable achievement 1", "Achievement 2"]
    }}
  ],
  "projects": [
    {{
      "name": "Project name",
      "description": "What the project does",
      "technologies": ["tech1", "tech2"],
      "highlights": ["Key outcome or metric"]
    }}
  ],
  "skills": ["skill1", "skill2"],
  "education": [
    {{
      "degree": "Degree name",
      "institution": "University/School name",
      "dates": "Date range",
      "details": "GPA, honors, relevant coursework, etc."
    }}
  ],
  "certifications": ["certification1", "certification2"],
  "technologies": ["specific tool/framework/language not in skills"],
  "achievements": ["Quantifiable achievements not tied to a specific role"]
}}

Rules:
- Extract ONLY what is explicitly stated. Do not infer or fabricate.
- For skills, list ALL mentioned technical skills, programming languages, tools, frameworks.
- For technologies, list specific tools/platforms mentioned in context (Docker, AWS, Redis, etc.) that aren't already in skills.
- For experience achievements, prefer quantifiable metrics ("increased performance by 40%", "served 10K users").
- Keep descriptions concise.
- If a section is not present in the resume, use an empty list or null.
- Return valid JSON only. No markdown, no explanation, no code blocks.

Resume Text:
{resume_text}
"""


def parse_resume(raw_text: str) -> ParsedResume:
    """
    Parse raw resume text into structured sections.

    Args:
        raw_text: Plain text extracted from the resume PDF.

    Returns:
        ParsedResume with all extracted sections.

    Raises:
        ValueError: If LLM response cannot be parsed.
    """
    prompt = RESUME_PARSE_PROMPT.format(resume_text=raw_text[:10000])  # Limit input size

    try:
        response = llm.invoke(prompt)
        content = response.content.strip()

        # Strip markdown code fences if present
        if content.startswith("```"):
            content = content.split("\n", 1)[1]
            if content.endswith("```"):
                content = content[:-3]
            content = content.strip()

        parsed = json.loads(content)
        result = ParsedResume(**parsed)

        logger.info(f"Parsed resume: {len(result.experience)} experiences, "
                    f"{len(result.skills)} skills, "
                    f"{len(result.projects)} projects, "
                    f"{len(result.education)} education entries")

        return result

    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse LLM response as JSON: {e}")
        logger.error(f"Raw response: {content[:500]}")
        raise ValueError(f"LLM returned invalid JSON: {e}")
    except Exception as e:
        logger.error(f"Resume parsing failed: {e}")
        raise
