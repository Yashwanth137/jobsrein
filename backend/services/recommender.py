"""
Recommendation Engine.

Stage 8 of the pipeline: uses LLM to generate specific, actionable
resume improvement suggestions grounded strictly in existing resume evidence.

Key constraint: recommendations must only use information already present
in the resume. This stage NEVER fabricates experience.
"""

import json
from langchain_groq import ChatGroq
from config import settings
from schemas import ParsedResume, EvidenceItem, RecommendationItem
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
#  Recommendation Prompt
# ──────────────────────────────────────────────

RECOMMENDATION_PROMPT = """You are a resume optimization advisor. Generate specific, actionable resume improvement suggestions.

CRITICAL RULES:
1. ONLY suggest changes using information already present in the resume. Never fabricate experience.
2. Categorize each recommendation:
   - "already_demonstrated": Evidence exists but could be stated more clearly or prominently
   - "possibly_relevant": Candidate has adjacent/related experience that could be reframed
   - "missing": No evidence in resume — flag it but do NOT suggest adding false claims
3. For "already_demonstrated" and "possibly_relevant", provide current_text and suggested_text.
4. For "missing", provide only a rationale explaining the gap. Do NOT provide suggested_text.
5. Suggested text must be truthful rewrites of existing content, not fabrications.

The candidate's resume contains:
{resume_summary}

These requirements have gaps or partial matches:
{gaps_json}

Return a JSON array of recommendation objects:
[
  {{
    "requirement": "The job requirement this addresses",
    "current_text": "Current text from the resume (or null if missing)",
    "suggested_text": "Improved text (or null if missing)",
    "rationale": "Why this change helps and what evidence supports it",
    "category": "already_demonstrated" | "possibly_relevant" | "missing"
  }}
]

Return valid JSON only. No markdown, no explanation, no code blocks."""


def generate_recommendations(
    evidence_map: list[EvidenceItem],
    parsed_resume: ParsedResume,
    resume_raw_text: str,
) -> list[RecommendationItem]:
    """
    Generate actionable recommendations for resume gaps.

    Only processes requirements with "partial" or "missing" match levels.
    Recommendations are strictly grounded in existing resume content.

    Args:
        evidence_map: Full evidence mapping from the analysis.
        parsed_resume: Structured resume data.
        resume_raw_text: Raw resume text.

    Returns:
        List of RecommendationItem objects.
    """
    # Filter to gaps only (partial + missing)
    gaps = [e for e in evidence_map if e.match_level in ("partial", "missing")]

    if not gaps:
        logger.info("No gaps found — no recommendations needed")
        return []

    # Build resume summary for context
    resume_summary_parts = []

    if parsed_resume.summary:
        resume_summary_parts.append(f"Summary: {parsed_resume.summary}")

    for exp in parsed_resume.experience:
        resume_summary_parts.append(
            f"Experience: {exp.title} at {exp.company} ({exp.dates}) — "
            f"{exp.description} Achievements: {', '.join(exp.achievements)}"
        )

    for proj in parsed_resume.projects:
        resume_summary_parts.append(
            f"Project: {proj.name} — {proj.description} "
            f"Tech: {', '.join(proj.technologies)}"
        )

    resume_summary_parts.append(f"Skills: {', '.join(parsed_resume.skills)}")
    resume_summary_parts.append(f"Technologies: {', '.join(parsed_resume.technologies)}")

    resume_summary = "\n".join(resume_summary_parts)

    # Format gaps for prompt
    gaps_for_prompt = []
    for gap in gaps:
        gaps_for_prompt.append({
            "requirement": gap.requirement,
            "match_level": gap.match_level,
            "evidence_found": gap.evidence,
            "found_in": gap.source,
            "impact": gap.impact,
        })

    prompt = RECOMMENDATION_PROMPT.format(
        resume_summary=resume_summary[:4000],
        gaps_json=json.dumps(gaps_for_prompt, indent=2),
    )

    try:
        response = llm.invoke(prompt)
        content = response.content.strip()

        if content.startswith("```"):
            content = content.split("\n", 1)[1]
            if content.endswith("```"):
                content = content[:-3]
            content = content.strip()

        raw_recs = json.loads(content)

        recommendations = []
        for rec in raw_recs:
            category = rec.get("category", "missing")

            # Enforce rule: missing items should NOT have suggested_text
            suggested = rec.get("suggested_text")
            if category == "missing":
                suggested = None

            recommendations.append(RecommendationItem(
                requirement=rec.get("requirement", ""),
                current_text=rec.get("current_text"),
                suggested_text=suggested,
                rationale=rec.get("rationale", ""),
                category=category,
                status="pending",
            ))

        logger.info(f"Generated {len(recommendations)} recommendations: "
                    f"{sum(1 for r in recommendations if r.category == 'already_demonstrated')} already demonstrated, "
                    f"{sum(1 for r in recommendations if r.category == 'possibly_relevant')} possibly relevant, "
                    f"{sum(1 for r in recommendations if r.category == 'missing')} missing")

        return recommendations

    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse recommendation response: {e}")
        return []
    except Exception as e:
        logger.error(f"Recommendation generation failed: {e}")
        return []
