"""
Match Analyzer — The core analysis engine.

Pipeline stages 5-7:
  Stage 5: Deterministic keyword/fuzzy matching
  Stage 6: LLM evidence interpretation (ambiguous matches only)
  Stage 7: Deterministic score computation

Design principle: deterministic where possible, LLM only for
structured interpretation of ambiguous evidence.
"""

import json
import re
from langchain_groq import ChatGroq
from config import settings
from schemas import (
    ParsedJob, ParsedResume, AnalysisResult, EvidenceItem,
    GapItem, DimensionScores, AnalysisMethodology
)
from utils.logger import logger

# ──────────────────────────────────────────────
#  LLM Setup (for Stage 6 only)
# ──────────────────────────────────────────────

llm = ChatGroq(
    model=settings.groq_model,
    temperature=settings.llm_temperature,
    api_key=settings.api,
)

# ──────────────────────────────────────────────
#  Common abbreviation/synonym map
# ──────────────────────────────────────────────

SYNONYMS = {
    "javascript": ["js", "ecmascript"],
    "typescript": ["ts"],
    "python": ["py"],
    "kubernetes": ["k8s"],
    "postgresql": ["postgres", "psql"],
    "mongodb": ["mongo"],
    "amazon web services": ["aws"],
    "google cloud platform": ["gcp"],
    "microsoft azure": ["azure"],
    "machine learning": ["ml"],
    "artificial intelligence": ["ai"],
    "natural language processing": ["nlp"],
    "continuous integration": ["ci"],
    "continuous deployment": ["cd"],
    "ci/cd": ["ci cd", "cicd", "continuous integration", "continuous deployment"],
    "react.js": ["react", "reactjs"],
    "node.js": ["node", "nodejs"],
    "vue.js": ["vue", "vuejs"],
    "next.js": ["next", "nextjs"],
    "express.js": ["express", "expressjs"],
    "rest api": ["rest", "restful", "rest apis"],
    "graphql": ["gql"],
    "docker": ["containerization", "containers"],
    "terraform": ["iac", "infrastructure as code"],
    "sql": ["structured query language"],
    "nosql": ["non-relational"],
    "html": ["html5"],
    "css": ["css3"],
    "c++": ["cpp"],
    "c#": ["csharp", "c sharp"],
    ".net": ["dotnet"],
    "objective-c": ["objc"],
    "swift": ["swiftui"],
    "redis": ["caching"],
    "elasticsearch": ["elastic", "es"],
    "rabbitmq": ["message queue", "amqp"],
    "kafka": ["event streaming"],
    "linux": ["unix"],
    "git": ["version control"],
    "agile": ["scrum", "kanban"],
    "devops": ["dev ops"],
}

# Build reverse lookup: synonym → canonical
_REVERSE_SYNONYMS: dict[str, str] = {}
for canonical, syns in SYNONYMS.items():
    for s in syns:
        _REVERSE_SYNONYMS[s.lower()] = canonical.lower()


def _normalize(text: str) -> str:
    """Lowercase and strip extra whitespace."""
    return re.sub(r'\s+', ' ', text.lower().strip())


def _get_canonical(skill: str) -> str:
    """Get canonical form of a skill, or return the skill itself."""
    norm = _normalize(skill)
    return _REVERSE_SYNONYMS.get(norm, norm)


def _build_resume_index(parsed_resume: ParsedResume, resume_raw: str) -> dict:
    """
    Build a searchable index from the parsed resume.

    Returns a dict with:
      - skills_set: set of normalized skills
      - technologies_set: set of normalized technologies
      - all_skills_set: union of skills + technologies
      - experience_texts: list of (section_label, text) tuples
      - full_text_lower: lowercase full resume text
    """
    skills_set = {_normalize(s) for s in parsed_resume.skills}
    tech_set = {_normalize(t) for t in parsed_resume.technologies}
    all_skills = skills_set | tech_set

    # Also add canonical forms
    canonical_skills = {_get_canonical(s) for s in all_skills}
    all_skills = all_skills | canonical_skills

    experience_texts = []
    for exp in parsed_resume.experience:
        section = f"Experience: {exp.title} at {exp.company}"
        text = f"{exp.title} {exp.company} {exp.description} " + " ".join(exp.achievements)
        experience_texts.append((section, _normalize(text)))

    for proj in parsed_resume.projects:
        section = f"Project: {proj.name}"
        text = f"{proj.name} {proj.description} " + " ".join(proj.technologies) + " " + " ".join(proj.highlights)
        experience_texts.append((section, _normalize(text)))

    for edu in parsed_resume.education:
        section = f"Education: {edu.degree} at {edu.institution}"
        text = f"{edu.degree} {edu.institution} {edu.details}"
        experience_texts.append((section, _normalize(text)))

    for cert in parsed_resume.certifications:
        experience_texts.append(("Certifications", _normalize(cert)))

    return {
        "skills_set": skills_set,
        "technologies_set": tech_set,
        "all_skills_set": all_skills,
        "experience_texts": experience_texts,
        "full_text_lower": _normalize(resume_raw),
    }


# ──────────────────────────────────────────────
#  Stage 5: Deterministic Matching
# ──────────────────────────────────────────────

def _deterministic_match(requirement: str, resume_index: dict) -> dict:
    """
    Try to match a single requirement against the resume using
    deterministic methods. Returns a dict with match info.

    Match priority:
      1. Exact skill match → strong
      2. Synonym/abbreviation match → strong
      3. Keyword found in experience/project text → contextual (needs LLM)
      4. No match → none
    """
    req_norm = _normalize(requirement)
    req_canonical = _get_canonical(requirement)
    all_skills = resume_index["all_skills_set"]

    # 1. Exact match in skills/technologies
    if req_norm in all_skills or req_canonical in all_skills:
        return {
            "match_type": "exact_keyword",
            "match_level": "strong",
            "evidence": f"Listed in resume skills/technologies: {requirement}",
            "source": "Skills",
            "confidence": 1.0,
        }

    # 2. Check if any resume skill is a synonym of this requirement
    for skill in all_skills:
        skill_canonical = _get_canonical(skill)
        if skill_canonical == req_canonical:
            return {
                "match_type": "synonym_match",
                "match_level": "strong",
                "evidence": f"Resume lists '{skill}' (synonym of '{requirement}')",
                "source": "Skills",
                "confidence": 0.95,
            }

    # 3. Keyword-in-context search across experience texts
    # Split multi-word requirement into keywords and search
    req_keywords = [w for w in req_norm.split() if len(w) > 2]
    if not req_keywords:
        req_keywords = [req_norm]

    best_context_match = None
    for section_label, section_text in resume_index["experience_texts"]:
        # Check if any keyword appears in the section
        matched_keywords = [kw for kw in req_keywords if kw in section_text]
        if matched_keywords:
            # Extract surrounding context
            match_ratio = len(matched_keywords) / len(req_keywords)
            if match_ratio > 0 and (best_context_match is None or
                                     match_ratio > best_context_match["ratio"]):
                # Get a snippet around the first match
                idx = section_text.find(matched_keywords[0])
                start = max(0, idx - 60)
                end = min(len(section_text), idx + 80)
                snippet = section_text[start:end].strip()

                best_context_match = {
                    "ratio": match_ratio,
                    "section": section_label,
                    "snippet": snippet,
                }

    if best_context_match:
        return {
            "match_type": "contextual",
            "match_level": "needs_llm",  # Needs LLM to interpret
            "evidence": best_context_match["snippet"],
            "source": best_context_match["section"],
            "confidence": None,
            "context_ratio": best_context_match["ratio"],
        }

    # 4. Full-text last-resort search
    if req_norm in resume_index["full_text_lower"]:
        idx = resume_index["full_text_lower"].find(req_norm)
        start = max(0, idx - 60)
        end = min(len(resume_index["full_text_lower"]), idx + len(req_norm) + 60)
        snippet = resume_index["full_text_lower"][start:end].strip()
        return {
            "match_type": "full_text",
            "match_level": "needs_llm",
            "evidence": snippet,
            "source": "Resume text",
            "confidence": None,
        }

    # 5. No match at all
    return {
        "match_type": "none",
        "match_level": "missing",
        "evidence": None,
        "source": None,
        "confidence": 0.0,
    }


# ──────────────────────────────────────────────
#  Stage 6: LLM Evidence Interpretation
# ──────────────────────────────────────────────

EVIDENCE_INTERPRET_PROMPT = """You are evaluating whether a candidate's resume demonstrates specific job requirements.

For each requirement below, I found some potential evidence in the resume. Classify each as:
- "strong": The evidence clearly demonstrates this requirement
- "partial": The evidence is related but doesn't fully demonstrate the requirement
- "missing": The evidence is not actually relevant to this requirement

Also assess the impact if this requirement is not met:
- "high": This is a core/critical requirement
- "medium": This is important but not a dealbreaker
- "low": This is a nice-to-have

Return a JSON array of objects:
[
  {{
    "index": 0,
    "match_level": "strong" | "partial" | "missing",
    "impact": "high" | "medium" | "low",
    "reasoning": "Brief explanation of why"
  }}
]

Requirements with evidence to evaluate:
{items_json}

Return valid JSON only. No markdown, no explanation, no code blocks."""


def _llm_interpret_evidence(ambiguous_items: list[dict]) -> list[dict]:
    """
    Send ambiguous matches to the LLM for classification.

    Args:
        ambiguous_items: List of dicts with 'requirement', 'evidence', 'source'.

    Returns:
        List of dicts with 'match_level', 'impact', 'reasoning' for each item.
    """
    if not ambiguous_items:
        return []

    # Format items for the prompt
    items_for_prompt = []
    for i, item in enumerate(ambiguous_items):
        items_for_prompt.append({
            "index": i,
            "requirement": item["requirement"],
            "evidence_found": item["evidence"],
            "found_in": item["source"],
        })

    prompt = EVIDENCE_INTERPRET_PROMPT.format(
        items_json=json.dumps(items_for_prompt, indent=2)
    )

    try:
        response = llm.invoke(prompt)
        content = response.content.strip()

        if content.startswith("```"):
            content = content.split("\n", 1)[1]
            if content.endswith("```"):
                content = content[:-3]
            content = content.strip()

        results = json.loads(content)
        return results

    except Exception as e:
        logger.error(f"LLM evidence interpretation failed: {e}")
        # Fallback: treat all as partial
        return [{"index": i, "match_level": "partial", "impact": "medium",
                 "reasoning": "Could not interpret"} for i in range(len(ambiguous_items))]


# ──────────────────────────────────────────────
#  Stage 7: Deterministic Score Computation
# ──────────────────────────────────────────────

DIMENSION_WEIGHTS = {
    "skills": 0.25,
    "experience": 0.25,
    "responsibilities": 0.20,
    "projects": 0.10,
    "education": 0.10,
    "keywords": 0.10,
}


def _classify_requirement(req: str, source: str) -> str:
    """Classify which dimension a requirement belongs to."""
    req_lower = req.lower()
    source_lower = source.lower() if source else ""

    # Education-related
    edu_keywords = ["degree", "bachelor", "master", "phd", "bs", "ms", "mba",
                    "university", "college", "gpa", "coursework"]
    if any(kw in req_lower for kw in edu_keywords):
        return "education"

    # Experience-related
    exp_keywords = ["years", "experience", "senior", "junior", "lead",
                    "worked", "managed", "led"]
    if any(kw in req_lower for kw in exp_keywords):
        return "experience"

    # Responsibility-related (usually longer phrases)
    if len(req.split()) > 5:
        return "responsibilities"

    # Default to skills for short technical terms
    return "skills"


def _compute_dimension_score(items: list[EvidenceItem]) -> int:
    """Compute score for a single dimension (0-100)."""
    if not items:
        return 0

    total = len(items)
    strong = sum(1 for item in items if item.match_level == "strong")
    partial = sum(1 for item in items if item.match_level == "partial")

    return round((strong * 1.0 + partial * 0.5) / total * 100)


def _compute_scores(evidence_map: list[EvidenceItem], parsed_job: ParsedJob) -> tuple[int, DimensionScores]:
    """
    Compute overall and dimension scores from the evidence map.

    Scoring formula (transparent and deterministic):
      dimension_score = (strong × 1.0 + partial × 0.5) / total_requirements × 100
      overall_score = weighted average of dimension scores

    Returns:
        (overall_score, DimensionScores)
    """
    # Bucket evidence items by dimension
    buckets: dict[str, list[EvidenceItem]] = {
        "skills": [], "experience": [], "responsibilities": [],
        "projects": [], "education": [], "keywords": [],
    }

    # Skills dimension: required_skills + preferred_skills
    skill_reqs = set(r.lower() for r in parsed_job.required_skills + parsed_job.preferred_skills)
    # Responsibilities
    resp_reqs = set(r.lower() for r in parsed_job.responsibilities)
    # Education
    edu_req = parsed_job.education_requirements

    for item in evidence_map:
        req_lower = item.requirement.lower()

        if req_lower in skill_reqs:
            buckets["skills"].append(item)
        elif req_lower in resp_reqs:
            buckets["responsibilities"].append(item)
        elif edu_req and req_lower == edu_req.lower():
            buckets["education"].append(item)
        else:
            # Classify by content
            dim = _classify_requirement(item.requirement, item.source)
            buckets[dim].append(item)

    # Compute per-dimension scores
    dim_scores = DimensionScores(
        skills=_compute_dimension_score(buckets["skills"]),
        experience=_compute_dimension_score(buckets["experience"]),
        responsibilities=_compute_dimension_score(buckets["responsibilities"]),
        projects=_compute_dimension_score(buckets["projects"]),
        education=_compute_dimension_score(buckets["education"]),
        keywords=_compute_dimension_score(buckets["keywords"]),
    )

    # Compute overall as weighted average
    overall = round(
        dim_scores.skills * DIMENSION_WEIGHTS["skills"] +
        dim_scores.experience * DIMENSION_WEIGHTS["experience"] +
        dim_scores.responsibilities * DIMENSION_WEIGHTS["responsibilities"] +
        dim_scores.projects * DIMENSION_WEIGHTS["projects"] +
        dim_scores.education * DIMENSION_WEIGHTS["education"] +
        dim_scores.keywords * DIMENSION_WEIGHTS["keywords"]
    )

    # If some dimensions have no requirements, redistribute weights
    active_weights = {}
    dim_values = {
        "skills": (dim_scores.skills, len(buckets["skills"])),
        "experience": (dim_scores.experience, len(buckets["experience"])),
        "responsibilities": (dim_scores.responsibilities, len(buckets["responsibilities"])),
        "projects": (dim_scores.projects, len(buckets["projects"])),
        "education": (dim_scores.education, len(buckets["education"])),
        "keywords": (dim_scores.keywords, len(buckets["keywords"])),
    }

    total_weight = 0
    weighted_sum = 0
    for dim_name, (score, count) in dim_values.items():
        if count > 0:
            w = DIMENSION_WEIGHTS[dim_name]
            weighted_sum += score * w
            total_weight += w

    overall = round(weighted_sum / total_weight) if total_weight > 0 else 0

    return overall, dim_scores


# ──────────────────────────────────────────────
#  Main entry point
# ──────────────────────────────────────────────

def _extract_gaps(evidence_map: list[EvidenceItem]) -> list[GapItem]:
    """Extract gaps from the evidence map."""
    gaps = []

    missing = [e for e in evidence_map if e.match_level == "missing"]
    partial = [e for e in evidence_map if e.match_level == "partial"]

    for item in missing:
        gaps.append(GapItem(
            gap_type="missing_skill",
            description=f"No evidence found for: {item.requirement}",
            severity=item.impact or "medium",
        ))

    for item in partial:
        gaps.append(GapItem(
            gap_type="weak_evidence",
            description=f"Weak demonstration of: {item.requirement}",
            severity="low",
        ))

    return gaps


def run_analysis(
    parsed_job: ParsedJob,
    parsed_resume: ParsedResume,
    resume_raw_text: str,
) -> AnalysisResult:
    """
    Run the full analysis pipeline.

    Stage 5: Deterministic matching
    Stage 6: LLM evidence interpretation (ambiguous only)
    Stage 7: Deterministic score computation

    Args:
        parsed_job: Structured job requirements.
        parsed_resume: Structured resume data.
        resume_raw_text: Raw resume text for context search.

    Returns:
        Complete AnalysisResult.
    """
    logger.info("Starting analysis pipeline...")

    # Build resume search index (deterministic)
    resume_index = _build_resume_index(parsed_resume, resume_raw_text)

    # Collect ALL requirements to analyze
    all_requirements = []

    for skill in parsed_job.required_skills:
        all_requirements.append(("skills", skill, True))
    for skill in parsed_job.preferred_skills:
        all_requirements.append(("skills", skill, False))
    for resp in parsed_job.responsibilities:
        all_requirements.append(("responsibilities", resp, True))
    for qual in parsed_job.qualifications:
        all_requirements.append(("qualifications", qual, True))
    if parsed_job.experience_requirements:
        all_requirements.append(("experience", parsed_job.experience_requirements, True))
    if parsed_job.education_requirements:
        all_requirements.append(("education", parsed_job.education_requirements, True))

    logger.info(f"Analyzing {len(all_requirements)} total requirements")

    # ── Stage 5: Deterministic matching ──
    deterministic_results = []
    ambiguous_items = []

    for _dim, req, _is_required in all_requirements:
        match_info = _deterministic_match(req, resume_index)

        if match_info["match_level"] == "needs_llm":
            ambiguous_items.append({
                "requirement": req,
                "evidence": match_info["evidence"],
                "source": match_info["source"],
                "match_info": match_info,
            })
            deterministic_results.append(None)  # Placeholder
        else:
            deterministic_results.append(match_info)

    logger.info(f"Deterministic: {sum(1 for r in deterministic_results if r is not None)} resolved, "
                f"{len(ambiguous_items)} need LLM interpretation")

    # ── Stage 6: LLM evidence interpretation ──
    llm_results = _llm_interpret_evidence(ambiguous_items)

    # Merge LLM results back
    ambiguous_idx = 0
    for i, result in enumerate(deterministic_results):
        if result is None:
            llm_result = llm_results[ambiguous_idx] if ambiguous_idx < len(llm_results) else {
                "match_level": "partial", "impact": "medium", "reasoning": "Unresolved"
            }
            amb_item = ambiguous_items[ambiguous_idx]

            deterministic_results[i] = {
                "match_type": amb_item["match_info"]["match_type"],
                "match_level": llm_result.get("match_level", "partial"),
                "evidence": amb_item["evidence"],
                "source": amb_item["source"],
                "confidence": 0.7 if llm_result.get("match_level") == "strong" else 0.5,
                "impact": llm_result.get("impact", "medium"),
            }
            ambiguous_idx += 1

    # Build evidence map
    evidence_map = []
    for (dim, req, is_required), match_info in zip(all_requirements, deterministic_results):
        # Assign impact for deterministic matches that don't have one
        impact = match_info.get("impact")
        if impact is None:
            if match_info["match_level"] == "missing":
                impact = "high" if is_required else "low"
            else:
                impact = "medium"

        evidence_map.append(EvidenceItem(
            requirement=req,
            evidence=match_info.get("evidence"),
            match_level=match_info["match_level"],
            source=match_info.get("source"),
            impact=impact,
            confidence=match_info.get("confidence"),
        ))

    # ── Stage 7: Deterministic score computation ──
    overall_score, dim_scores = _compute_scores(evidence_map, parsed_job)

    # Extract gaps
    gaps = _extract_gaps(evidence_map)

    # Build summary
    strong_count = sum(1 for e in evidence_map if e.match_level == "strong")
    partial_count = sum(1 for e in evidence_map if e.match_level == "partial")
    missing_count = sum(1 for e in evidence_map if e.match_level == "missing")

    summary = (
        f"{overall_score}% Match — {len(evidence_map)} requirements analyzed — "
        f"{strong_count} strong — {partial_count} partial — {missing_count} missing"
    )

    logger.info(f"Analysis complete: {summary}")

    return AnalysisResult(
        overall_score=overall_score,
        dimensions=dim_scores,
        evidence_map=evidence_map,
        gaps=gaps,
        recommendations=[],  # Filled by recommender.py separately
        methodology=AnalysisMethodology(
            weights=DIMENSION_WEIGHTS,
            version="v1",
        ),
        summary=summary,
    )
