"""
Job Description Parser.

Stage 3 of the pipeline: uses LLM to extract structured requirements
from raw job description text. This is one of two LLM extraction stages.
"""

import json
from langchain_groq import ChatGroq
from config import settings
from schemas import ParsedJob
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

JOB_PARSE_PROMPT = """You are a job description parser. Extract structured information from the following job description text.

Return a JSON object with exactly these fields:
{{
  "title": "Job title or null if not found",
  "company": "Company name or null if not found",
  "seniority": "Junior/Mid/Senior/Lead/Staff/Principal or null",
  "location": "Location or null",
  "work_arrangement": "remote/hybrid/onsite or null",
  "required_skills": ["list of explicitly required technical skills and tools"],
  "preferred_skills": ["list of preferred/nice-to-have skills"],
  "responsibilities": ["list of key job responsibilities"],
  "qualifications": ["list of required qualifications"],
  "experience_requirements": "Experience requirement as a string, e.g. '3+ years' or null",
  "education_requirements": "Education requirement as a string, e.g. 'BS in CS' or null"
}}

Rules:
- Extract ONLY what is explicitly stated in the text. Do not infer or add skills.
- For required_skills, include specific technologies, languages, frameworks, tools.
- For preferred_skills, include items listed as "nice to have", "preferred", "bonus", "plus".
- For responsibilities, extract the main duties/tasks.
- For qualifications, extract non-skill requirements (clearances, certifications, etc.).
- Keep each list item concise (a few words to one sentence).
- Return valid JSON only. No markdown, no explanation, no code blocks.

Job Description:
{job_text}
"""


def parse_job_description(raw_text: str) -> ParsedJob:
    """
    Parse a raw job description into structured requirements.

    Args:
        raw_text: The full text of the job description.

    Returns:
        ParsedJob with extracted fields.

    Raises:
        ValueError: If LLM response cannot be parsed.
    """
    prompt = JOB_PARSE_PROMPT.format(job_text=raw_text[:8000])  # Limit input size

    try:
        response = llm.invoke(prompt)
        content = response.content.strip()

        # Strip markdown code fences if present
        if content.startswith("```"):
            content = content.split("\n", 1)[1]  # Remove first line
            if content.endswith("```"):
                content = content[:-3]
            content = content.strip()

        parsed = json.loads(content)
        result = ParsedJob(**parsed)

        logger.info(f"Parsed JD: {result.title} at {result.company}, "
                    f"{len(result.required_skills)} required skills, "
                    f"{len(result.responsibilities)} responsibilities")

        return result

    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse LLM response as JSON: {e}")
        logger.error(f"Raw response: {content[:500]}")
        raise ValueError(f"LLM returned invalid JSON: {e}")
    except Exception as e:
        logger.error(f"Job parsing failed: {e}")
        raise
