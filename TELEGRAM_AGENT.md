# V2 — Job Discovery & Resume Intelligence Agent

Transform the existing Job-Specific Resume Intelligence V1 into a **Job Discovery + Resume Intelligence Agent**.

Do NOT rebuild the existing analysis system. Extend it.

The current V1 already provides:

* Job description extraction
* Resume PDF extraction
* Structured JD/resume parsing
* Deterministic keyword matching
* LLM evidence interpretation
* Deterministic Job Match scoring
* Evidence mapping
* Gap analysis
* Evidence-grounded recommendations
* Web dashboard and application history

Preserve these capabilities and architecture unless a change is genuinely required.

---

## 1. Product Evolution

The product should no longer feel like:

> "Upload a resume and check it."

It should become:

> **Save any job you find. Understand your fit. Decide whether to apply. Improve your resume.**

Core loop:

**Discover → Save → Analyze → Understand → Decide → Optimize → Track**

The system should support asynchronous job collection through Telegram while keeping the existing web application as the primary intelligence interface.

---

# 2. New Architecture

```text
                  JOB DISCOVERY
                       │
        ┌──────────────┼──────────────┐
        │              │              │
   Telegram Bot    Web Portal    Future Extension
        │              │
        └──────────────┘
                │
                ▼
         Job Ingestion Layer
                │
        ┌───────┴────────┐
        │                │
   URL extraction    JD text
        │                │
        └───────┬────────┘
                ▼
          Job Normalization
                │
                ▼
          Saved Job / Inbox
                │
                ▼
       Existing V1 Analysis Engine
                │
        ┌───────┼────────┐
        ▼       ▼        ▼
      Match   Gaps   Recommendations
        │       │        │
        └───────┼────────┘
                ▼
          Intelligence Portal
                │
        ┌───────┼────────────┐
        ▼       ▼            ▼
     Prioritize Optimize   Track
```

The **analysis engine remains the deterministic + LLM hybrid system already implemented in V1**.

Do NOT replace it with an autonomous LLM agent.

The agent layer should orchestrate workflows around the analysis engine.

---

# 3. Personal Resume Profile

Change the current workflow so users do not need to upload their resume for every job.

Add a persistent personal resume profile.

A user should be able to maintain:

### Master Resume

* Original PDF
* Extracted text
* Structured resume data
* Upload timestamp
* Version number

### Resume Versions

Users can create job-specific versions derived from the master resume.

Example:

```text
My Resumes

Master Resume
Updated Sep 2

Backend Engineer
Updated Sep 1

AI Engineer
Updated Aug 28
```

Each version must remain traceable to the original resume.

Do not silently modify the master resume.

---

# 4. Job Inbox

Create a first-class **Job Inbox**.

Example:

```text
Job Inbox

Amazon
SDE I
82 Match
High Fit
Saved 2h ago

Google
Software Engineer
74 Match
Review
Saved yesterday

Startup XYZ
Backend Engineer
91 Match
Strong Fit
Saved Aug 28
```

Each saved job should contain:

* URL
* Original JD text
* Parsed requirements
* Company
* Title
* Location
* Work arrangement
* Date discovered
* Analysis status
* Match score
* Selected resume version
* Application status

Application statuses:

```text
Saved
Analyzing
Ready to Apply
Applied
Interview
Rejected
Archived
```

---

# 5. Telegram Bot Integration

Add a Telegram bot as a lightweight job ingestion interface.

The bot should support:

```text
/start
/help
/status
/jobs
```

Primary workflow:

```text
User finds a job
        ↓
Shares job URL to Telegram bot
        ↓
Bot validates URL
        ↓
Job is queued
        ↓
URL extraction runs
        ↓
JD is parsed
        ↓
Job is saved
        ↓
Bot confirms
```

Example response:

```text
Job saved

Amazon — SDE I
Backend / Software Development

Status: Ready for analysis

Open in Resume Intelligence →
```

Do not perform an expensive full analysis synchronously inside the Telegram request.

The Telegram endpoint should enqueue/create the job and return quickly.

---

# 6. Telegram Bot Commands

Implement:

### `/start`

Connect Telegram identity to the user's existing account.

Do not create duplicate user accounts.

Use a secure account-linking flow.

### `/jobs`

Return the user's most recently saved jobs.

Example:

```text
Recent Jobs

1. Amazon — SDE I — 82
2. Google — SWE — 74
3. Stripe — Backend — 88
```

Provide links/buttons to open each job in the web portal.

### `/status`

Show:

```text
Resume: Master Resume v3
Jobs saved: 18
Analyzed: 14
Pending: 4
```

### `/help`

Explain supported actions.

---

# 7. Job Deduplication

Do not create duplicate jobs every time the same URL is shared.

Normalize URLs before storage:

* Remove tracking parameters where safe
* Normalize trailing slashes
* Normalize known job-site URL patterns

Create a deterministic job fingerprint using normalized URL and/or normalized JD content.

If the job already exists:

```text
Already saved

Amazon — SDE I
Current Match: 82

Open analysis →
```

Do not create another application record unnecessarily.

---

# 8. Automatic Analysis

When a job is saved, the system should determine whether analysis can run automatically.

If a master resume exists:

```text
New Job
   ↓
JD parsed
   ↓
Master resume available?
   ↓
YES
   ↓
Run V1 analysis
```

If no resume exists:

```text
Job saved

Upload your resume to analyze this job.
```

The user should never be forced to upload the resume before saving a job.

---

# 9. Analysis Engine Integration

Reuse the existing V1 pipeline.

Do not rewrite:

* `text_extractor.py`
* `job_parser.py`
* `resume_parser.py`
* `matcher.py`
* `recommender.py`

unless integration requires small changes.

The flow becomes:

```text
Saved Job
   +
Selected Resume Version
        ↓
Existing Matcher
        ↓
Evidence Map
        ↓
Gap Analysis
        ↓
Deterministic Score
        ↓
Recommendations
```

The score must remain the platform's own **Job Match Score**, not an ATS prediction.

---

# 10. Agent Layer

Introduce an orchestration/service layer responsible for workflow decisions.

Example:

```text
services/agent/
    orchestrator.py
    job_agent.py
    analysis_agent.py
    application_agent.py
```

The agent should be able to perform actions such as:

```text
save_job()
parse_job()
analyze_job()
select_resume()
summarize_analysis()
prioritize_jobs()
update_application_status()
```

However:

**Do not let the LLM directly mutate arbitrary database state.**

Use explicit typed tools/functions.

Example conceptual interface:

```python
agent.run(
    user_id=user_id,
    intent="analyze_saved_job",
    job_id=job_id
)
```

The LLM may decide which tool is appropriate, but the tool itself performs validation and database operations.

---

# 11. Natural Language Intelligence

Add an analysis assistant inside the web portal.

Users should be able to ask:

> Why is my score only 74?

> What are my biggest gaps?

> Which requirements are preventing me from being a strong match?

> Should I prioritize this job over the others?

> What should I change before applying?

> Have I already analyzed a similar job?

Answers must be grounded in stored:

* Job requirements
* Resume evidence
* Match analysis
* Recommendations

Never invent resume experience.

For example:

```text
User:
Why am I weak for this role?

Agent:

The biggest gap is Kubernetes.

The job lists Kubernetes as a required skill.
Your resume contains Docker and AWS experience,
but I found no direct Kubernetes evidence.

Impact: High

Recommendation:
Only surface Kubernetes if you have actually used it.
```

---

# 12. Job Prioritization

Add a simple prioritization system.

Do NOT equate Match Score with probability of getting hired.

Instead calculate a **Fit Priority** using transparent signals such as:

* Job Match Score
* Required-skill coverage
* High-impact missing requirements
* Resume evidence strength
* User-defined preferences

Example:

```text
Priority

High
91 Match
Strong requirement coverage

Medium
78 Match
2 high-impact gaps

Low
61 Match
Multiple required skills missing
```

Clearly distinguish:

**Fit** from **Priority**.

---

# 13. Dashboard Redesign

The `/app` page should become a **Job Intelligence Inbox**, not simply an analysis screen.

Top-level layout:

```text
┌────────────────────────────────────────────┐
│ Job Intelligence                           │
│                                             │
│ 18 Saved    14 Analyzed    6 Strong Fits   │
└────────────────────────────────────────────┘

[ All ] [ Strong Fit ] [ Review ] [ Pending ]

Amazon
SDE I
82 Match
8/10 required requirements covered

[View Analysis]

Google
Software Engineer
74 Match
2 high-impact gaps

[View Analysis]
```

Clicking a job opens the existing deep analysis dashboard.

---

# 14. Job Detail

The job detail page should contain:

### Header

```text
Amazon
SDE I

82 / 100 Job Match

Strong Fit
```

### Quick Assessment

```text
Strong Matches     8
Partial Matches    2
Missing            2
Evidence Coverage  83%
```

### Main Sections

1. Match Overview
2. Requirement Evidence
3. Missing Requirements
4. Resume Gaps
5. Recommendations
6. Resume Version
7. Methodology
8. Application Status

---

# 15. Resume Optimization

Allow users to create a job-specific resume version.

Every modification must be explicit.

```text
Recommendation #3

Requirement:
FastAPI backend development

Current:
Built backend APIs using FastAPI.

Suggested:
Built asynchronous FastAPI APIs using PostgreSQL
and Redis caching for high-performance data retrieval.

[Approve] [Reject]
```

Approved changes become part of the new resume version.

Rejected changes do not modify the resume.

Never fabricate experience.

---

# 16. Application Tracking

Add lightweight application tracking.

Users can change:

```text
Saved
↓
Ready to Apply
↓
Applied
↓
Interview
↓
Offer / Rejected
```

Allow optional metadata:

* Application date
* Notes
* Resume version used
* Job URL

Do not build a full CRM.

Keep it focused on job applications.

---

# 17. Database Evolution

Extend the existing `Application` model or introduce narrowly scoped supporting models where necessary.

At minimum support:

```text
User
Resume
ResumeVersion
Application
Analysis
```

Telegram identity should be linked to the existing user.

Avoid premature normalization.

Continue using JSON for rapidly evolving analysis structures.

Add proper indexes for:

* user_id
* normalized_job_url
* job fingerprint
* status
* created_at

---

# 18. Background Processing

Do not make large LLM workflows block HTTP requests.

Introduce a background job mechanism appropriate for the existing backend/deployment architecture.

Required asynchronous operations:

* URL extraction
* JD parsing
* Resume parsing
* Full analysis
* Recommendation generation

Persist processing state:

```text
queued
processing
completed
failed
```

Store useful failure information without exposing secrets.

Frontend should poll or use an appropriate status mechanism.

---

# 19. Security

All jobs and resumes must be scoped to the authenticated user.

A user must never be able to access another user's:

* Job
* Resume
* Analysis
* Telegram connection
* Recommendations

Validate ownership on every API endpoint.

Validate uploaded files:

* PDF only
* Reasonable size limit
* Safe filename handling

Do not expose raw API keys or internal errors.

---

# 20. Telegram Security

Never trust a Telegram user ID alone to authorize access to an existing account.

Use a secure linking flow such as:

```text
Web Portal
    ↓
Generate one-time linking token
    ↓
User sends token to bot
    ↓
Backend verifies token
    ↓
Telegram identity linked
```

Tokens must:

* Expire
* Be single-use
* Be stored securely
* Never expose account credentials

---

# 21. Frontend Navigation

Update navigation to:

```text
Dashboard
Jobs
Resumes
Applications
```

Job detail:

```text
Overview
Evidence
Gaps
Recommendations
Resume
```

Keep the existing visual language:

* Dark/light mode
* Inter
* JetBrains Mono
* Neutral surfaces
* Teal/cyan accent
* Semantic match colors
* Minimal animations

Do not introduce flashy AI-agent visuals.

---

# 22. Landing Page Positioning

Change the landing page from a simple resume analyzer to the broader product.

Hero:

> **Find jobs. Know your fit. Apply smarter.**

Subheading:

> Save jobs as you discover them. Get evidence-based insight into how your resume fits each role, what you're missing, and what to improve before you apply.

CTA:

> Start Analyzing

Show:

```text
Find a job
     ↓
Send it to your Job Inbox
     ↓
Get your Match Analysis
     ↓
Fix the important gaps
     ↓
Apply
```

Do not claim:

* Guaranteed interviews
* ATS prediction
* Hiring probability
* Guaranteed job matching

---

# 23. Telegram Is an Ingestion Channel, Not the Product

Do not duplicate the entire web application inside Telegram.

Telegram should be optimized for:

**Capture + Notification + Quick Status**

Web portal should be optimized for:

**Analysis + Evidence + Optimization + Tracking**

This separation is important.

---

# 24. Future Extension Boundary

Do NOT implement these in this version:

* Browser extension
* LinkedIn scraping automation
* Automatic job-site crawling
* Autonomous job applications
* Automatic application submission
* Full job-board aggregation
* Resume generation from scratch

Design the architecture so these can be added later without rewriting the core.

---

# 25. Implementation Strategy

Before modifying code:

1. Inspect the entire repository.
2. Identify the current V1 implementation.
3. Verify actual file structure rather than relying on this specification.
4. Identify existing auth/database/API patterns.
5. Identify deployment constraints.
6. Identify the current analysis pipeline entry points.
7. Produce a short implementation plan.
8. Only then modify code.

Do not blindly overwrite existing working code.

Implement incrementally:

### Phase 1

Resume persistence + versions

### Phase 2

Job Inbox + deduplication

### Phase 3

Background analysis integration

### Phase 4

Telegram bot ingestion

### Phase 5

Application tracking

### Phase 6

Agent/orchestration layer

### Phase 7

Natural-language analysis assistant

### Phase 8

UI polish + testing

---

# 26. Testing Requirements

Test:

### Job ingestion

* Valid URL
* Invalid URL
* Unsupported job site
* URL extraction failure
* Duplicate URL

### Resume

* Valid PDF
* Large PDF
* malformed PDF
* multiple resume versions

### Analysis

* Strong match
* Partial match
* Missing requirements
* Ambiguous evidence
* No evidence
* Recommendation fabrication prevention

### Telegram

* New user
* Existing user
* Account linking
* Expired linking token
* Duplicate job
* Invalid URL

### Security

* Cross-user application access
* Cross-user resume access
* Unauthorized analysis access
* Invalid Telegram identity

### Full E2E

```text
Create account
↓
Upload master resume
↓
Connect Telegram
↓
Share JD URL
↓
Job appears in inbox
↓
JD extracted
↓
Analysis runs
↓
Score generated
↓
Evidence displayed
↓
Recommendations generated
↓
Create optimized resume version
↓
Mark Ready to Apply
↓
Mark Applied
```

---

# 27. Success Criteria

The implementation is complete only when this feels natural:

```text
I'm browsing jobs.
        ↓
I find an interesting JD.
        ↓
I share it to Telegram.
        ↓
It's automatically saved.
        ↓
Later I open the portal.
        ↓
I immediately see:
"82 Match — Strong Fit"
        ↓
I can see exactly why.
        ↓
I can see what I'm missing.
        ↓
I can improve my resume.
        ↓
I mark it Ready to Apply / Applied.
```

The product should feel like a **personal job-analysis agent**, while the underlying analysis remains transparent, deterministic where possible, evidence-grounded, and auditable.

Do not optimize for adding the maximum number of AI features.

Optimize for making the **Discover → Analyze → Decide → Apply** workflow genuinely useful.
