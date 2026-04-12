# Module 4 — Online Coding Test: Research & Design Document

**Project:** HCL AI-Powered Candidate Evaluation Platform
**Module:** 4 — Online Coding Test with Automated Evaluation
**Prepared for:** HCL Internship Review Board
**Date:** March 2026
**Status:** Research & Design (Pre-Implementation)

---

## 1. Technology Selection

### 1.1 Code Editor: Monaco Editor

**Decision: Monaco Editor** (the editor powering VS Code)

| Criterion | Monaco Editor | CodeMirror 6 | Ace Editor | Plain `<textarea>` |
|-----------|--------------|--------------|------------|---------------------|
| Language support | 80+ with rich syntax | Modular, excellent | Good | None |
| IntelliSense / autocomplete | ✅ (LSP-based) | Requires plugins | Limited | ❌ |
| Diff viewer | ✅ Built-in | ❌ External | ❌ External | ❌ |
| React wrapper maturity | `@monaco-editor/react` (stable) | `@uiw/react-codemirror` (stable) | `react-ace` (older) | N/A |
| Bundle size (gzipped) | ~2 MB (lazy-loaded via CDN) | ~500 KB | ~400 KB | Trivial |
| Tab/indent handling | ✅ Professional | ✅ | ✅ | ❌ |
| Familiarity to developers | Very high (VS Code users) | Moderate | Moderate | N/A |

**Why Monaco:** Candidates spend 30–60 minutes on a coding test. A degraded editing experience directly affects their performance and fairness of evaluation. Monaco's IntelliSense, multi-cursor support, bracket matching, and error highlighting are features every modern developer expects. The bundle size overhead is acceptable when loaded via the Monaco CDN worker strategy (`@monaco-editor/react` handles this automatically).

**Why not CodeMirror 6:** CodeMirror 6 is excellent for lightweight embeds but requires more manual assembly of language support packages. Monaco's out-of-the-box language server protocol integration makes it preferable for a multi-language coding test.

**Why not Ace:** Ace is technically sound but has stagnated in development and lacks the language richness of Monaco.

---

### 1.2 Code Execution Engine: Judge0

**Decision: Judge0 CE API** (hosted at `judge0.com` or self-hosted via Docker)

| Criterion | Judge0 | Sphere Engine | HackerEarth API | Custom Docker Sandbox |
|-----------|--------|---------------|-----------------|----------------------|
| Open-source | ✅ MIT | ❌ Commercial | ❌ Commercial | N/A |
| Self-host option | ✅ Full Docker compose | ❌ | ❌ | ✅ |
| Supported languages | 60+ | 70+ | 35+ | Unlimited (DIY) |
| Async execution model | ✅ Token-based polling | ✅ | ✅ | N/A |
| Standard test case I/O | ✅ stdin/stdout | ✅ | ✅ | DIY |
| Free tier | ✅ (CE, rate-limited) | ❌ | Limited | ✅ (infra cost) |
| Security sandbox | Isolate (Linux namespaces) | Proprietary | Proprietary | DIY (risky) |
| Setup complexity | Low (Docker) | None (API only) | None (API only) | Very high |

**Why not Sphere Engine:** Sphere Engine has better guarantees and SLAs for production use, but it is fully commercial and requires a paid contract — unsuitable for an intern project prototype.

**Why not HackerEarth API:** Similar commercial model; limited language support for the languages most relevant to HCL's technical screening (Java, C++, Go).

**Why not custom Docker sandbox:** Building a secure code execution sandbox from scratch (namespace isolation, cgroup limits, syscall filtering via seccomp) is a significant security engineering effort. Mistakes result in remote code execution on the host. Judge0's `isolate` backend handles this safely.

**Why Judge0:** Judge0 CE is free, open-source, runs on any Linux host via Docker Compose, supports all major languages, and exposes a well-defined REST API with async token-based submission. For the intern project, the hosted `judge0.com` free tier is sufficient during development; production would self-host.

---

## 2. Backend API Design

All routes are prefixed with `/module4`. Authentication via platform-level JWT (Module 1) is assumed.

### 2.1 Problems

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/problems` | List problems (paginated, filterable by difficulty/tags) |
| `GET` | `/problems/{problem_id}` | Get problem detail (description, examples, constraints — no test cases) |
| `POST` | `/problems` | Create problem (admin only) |
| `PUT` | `/problems/{problem_id}` | Update problem |
| `DELETE` | `/problems/{problem_id}` | Soft-delete problem |

### 2.2 Test Sessions

A **test session** ties a candidate to a problem set for a specific test window.

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/sessions` | Create test session for a candidate (admin) |
| `GET` | `/sessions/{session_id}` | Get session status, assigned problems, start/end time |
| `PATCH` | `/sessions/{session_id}/start` | Candidate starts the session (starts timer) |
| `PATCH` | `/sessions/{session_id}/end` | Candidate or system ends the session |

### 2.3 Submissions

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/sessions/{session_id}/problems/{problem_id}/submit` | Submit code for Judge0 evaluation |
| `GET` | `/sessions/{session_id}/problems/{problem_id}/submissions` | List all submissions for a problem |
| `GET` | `/submissions/{submission_id}` | Poll single submission result |
| `GET` | `/submissions/{submission_id}/quality` | Get code quality assessment |

### 2.4 Run (non-graded)

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/run` | Execute code against custom stdin (no grading) |

### 2.5 Report (Module 5 contract)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/sessions/{session_id}/report` | Aggregated score + quality report for Module 5 |

### 2.6 Tab-Switch Events

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/sessions/{session_id}/events` | Log a tab-switch or focus-loss event |
| `GET` | `/sessions/{session_id}/events` | Retrieve events for review |

---

## 3. PostgreSQL Schema

```sql
-- Problems
CREATE TABLE problems (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title       TEXT NOT NULL,
    slug        TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,          -- Markdown
    difficulty  TEXT NOT NULL CHECK (difficulty IN ('easy','medium','hard')),
    tags        TEXT[] DEFAULT '{}',
    time_limit_ms    INTEGER DEFAULT 2000,
    memory_limit_kb  INTEGER DEFAULT 262144,  -- 256 MB
    is_active   BOOLEAN DEFAULT TRUE,
    created_at  TIMESTAMPTZ DEFAULT now(),
    updated_at  TIMESTAMPTZ DEFAULT now()
);

-- Test Cases (hidden from candidates)
CREATE TABLE test_cases (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    problem_id  UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
    input       TEXT NOT NULL,
    expected_output TEXT NOT NULL,
    is_sample   BOOLEAN DEFAULT FALSE,  -- sample cases shown in problem description
    weight      FLOAT DEFAULT 1.0,      -- for partial scoring
    created_at  TIMESTAMPTZ DEFAULT now()
);

-- Test Sessions
CREATE TABLE test_sessions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id    TEXT NOT NULL,
    problem_ids     UUID[] NOT NULL,        -- ordered set of assigned problems
    status          TEXT DEFAULT 'pending'
                        CHECK (status IN ('pending','active','completed','expired')),
    started_at      TIMESTAMPTZ,
    ended_at        TIMESTAMPTZ,
    duration_minutes INTEGER DEFAULT 60,
    created_at      TIMESTAMPTZ DEFAULT now()
);

-- Submissions
CREATE TABLE submissions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id      UUID NOT NULL REFERENCES test_sessions(id),
    problem_id      UUID NOT NULL REFERENCES problems(id),
    candidate_id    TEXT NOT NULL,
    source_code     TEXT NOT NULL,
    language_id     INTEGER NOT NULL,       -- Judge0 language ID
    language_name   TEXT NOT NULL,

    -- Judge0 tracking
    judge0_token    TEXT UNIQUE,            -- token returned by Judge0 on submission
    judge0_status_id INTEGER,              -- 1-13, see Judge0 status codes
    judge0_status_desc TEXT,

    -- Results (populated by polling)
    stdout          TEXT,
    stderr          TEXT,
    compile_output  TEXT,
    time_seconds    FLOAT,
    memory_kb       INTEGER,

    -- Test-case pass/fail (JSON array of booleans)
    test_case_results JSONB,
    passed_cases    INTEGER DEFAULT 0,
    total_cases     INTEGER DEFAULT 0,
    score           FLOAT DEFAULT 0.0,     -- 0.0–1.0

    -- Code quality (populated asynchronously)
    quality_report  JSONB,

    submitted_at    TIMESTAMPTZ DEFAULT now(),
    evaluated_at    TIMESTAMPTZ
);

-- Integrity events (tab switches, focus loss)
CREATE TABLE session_events (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id  UUID NOT NULL REFERENCES test_sessions(id),
    event_type  TEXT NOT NULL CHECK (event_type IN ('tab_switch','focus_loss','fullscreen_exit','copy_paste')),
    occurred_at TIMESTAMPTZ DEFAULT now(),
    metadata    JSONB DEFAULT '{}'
);

-- Indexes
CREATE INDEX ON submissions(session_id, problem_id);
CREATE INDEX ON submissions(judge0_token);
CREATE INDEX ON session_events(session_id);
CREATE INDEX ON test_cases(problem_id);
```

---

## 4. Judge0 Integration

### 4.1 Authentication

The hosted Judge0 API (`https://judge0-ce.p.rapidapi.com`) uses RapidAPI headers:

```
X-RapidAPI-Host: judge0-ce.p.rapidapi.com
X-RapidAPI-Key: <your_rapidapi_key>
```

For self-hosted Judge0 with an `AUTH_TOKEN`, use:
```
X-Auth-Token: <token>
```

### 4.2 Key Language IDs

| Language | ID |
|----------|----|
| Python 3.8 | 71 |
| Java 15 | 62 |
| C++ 17 (GCC 9.2) | 54 |
| JavaScript (Node 12) | 63 |
| Go 1.13 | 60 |
| C# Mono 6.6 | 51 |
| TypeScript 3.7 | 74 |
| Rust 1.40 | 73 |

### 4.3 Submission Payload

`POST https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=false&wait=false`

```json
{
  "source_code": "print(input())",
  "language_id": 71,
  "stdin": "hello world",
  "expected_output": "hello world",
  "cpu_time_limit": 2,
  "memory_limit": 262144,
  "wall_time_limit": 5,
  "enable_per_process_and_thread_time_limit": false
}
```

**Response (202 Accepted):**
```json
{ "token": "d85cd024-1548-4165-86c7-a641e4b5d6e7" }
```

For multi-test-case problems, the platform submits **one Judge0 request per test case** and aggregates pass/fail counts. This avoids custom test-runner complexity.

### 4.4 Async Polling Pattern

```
Client submits code
      │
      ▼
POST /submissions → Judge0 → returns token
      │
      ▼ (store token in DB, return submission_id to client)
      │
Client polls GET /submissions/{submission_id} every 2 s
      │
      ▼ (backend polls Judge0 GET /submissions/{token})
      │
Judge0 status_id ∈ {1, 2}?  → still queued/running → wait
Judge0 status_id == 3?       → Accepted → mark passed
Judge0 status_id ∈ {4..13}? → Error/Wrong → mark failed → return details
```

**Recommended polling strategy:**
- Max poll attempts: 30 (60 seconds total at 2 s interval)
- Implement exponential backoff after attempt 10 (2s → 3s → 5s)
- If still pending after 60 s, mark submission as `TIMEOUT` in the platform DB

### 4.5 Judge0 Status Code Reference

| ID | Status | Platform Action |
|----|--------|-----------------|
| 1 | In Queue | Continue polling |
| 2 | Processing | Continue polling |
| 3 | Accepted | Mark test case PASS |
| 4 | Wrong Answer | Mark test case FAIL |
| 5 | Time Limit Exceeded | Mark FAIL, surface to candidate |
| 6 | Compilation Error | Mark ALL cases FAIL, return `compile_output` |
| 7 | Runtime Error (SIGSEGV) | Mark FAIL |
| 8 | Runtime Error (SIGXFSZ) | Mark FAIL (file size exceeded) |
| 9 | Runtime Error (SIGFPE) | Mark FAIL (floating point) |
| 10 | Runtime Error (SIGABRT) | Mark FAIL |
| 11 | Runtime Error (NZEC) | Mark FAIL (non-zero exit code) |
| 12 | Runtime Error (Other) | Mark FAIL |
| 13 | Internal Error | Retry once; if fails again, flag for admin review |

---

## 5. Code Quality Assessment

### 5.1 Readability Heuristics (Static Analysis, No AI)

The platform performs the following checks synchronously after a submission is received, before sending to Judge0:

| Metric | Implementation | Threshold |
|--------|---------------|-----------|
| **Line length** | Count lines > 100 chars | Warn if > 20% of lines |
| **Function length** | Parse AST (Python `ast`, Java `javalang`, etc.) | Flag if any function > 50 lines |
| **Cyclomatic complexity** | `radon` (Python), manual AST walk (others) | Warn if CC > 10 per function |
| **Naming conventions** | Regex: `[a-z]{1,2}` variable names flag | Warn on >5 single-letter variables (excluding `i,j,k,n,m`) |
| **Comment density** | `# / //` lines ÷ total lines | Note if < 5% in solutions > 30 lines |
| **Magic numbers** | Numeric literals (not 0/1) inline without named constants | Warn if count > 5 |

These are computed server-side in Python using `radon` for Python submissions and a lightweight regex/AST approach for other languages.

### 5.2 GPT-Assisted Complexity Hints

For each accepted submission, an async background task calls the Claude API (or GPT-4) to produce a brief code quality note:

**Prompt template:**
```
You are a senior software engineer reviewing code submitted during a technical interview.
The candidate solved: {problem_title}
Language: {language}
Code:
```{code}```

Provide a JSON response with:
- "time_complexity": Big-O notation string
- "space_complexity": Big-O notation string
- "approach_summary": 1 sentence describing the algorithm
- "improvement_hint": 1 sentence on the most impactful improvement (if any)
Do not reveal whether the candidate passed or failed test cases.
```

The response is stored in `submissions.quality_report` (JSONB) and surfaced in the Module 5 report. This call is **non-blocking** — the candidate sees their pass/fail result immediately; the quality report populates within ~5 seconds.

**Cost:** ~$0.002 per submission with GPT-3.5-turbo, ~$0.01 with GPT-4o. For a pilot with 50 candidates × 3 problems = 150 submissions, cost is negligible.

---

## 6. Security Considerations

### 6.1 Code Sandboxing

Judge0 uses `isolate` (a Linux kernel isolation tool by Martin Mareš), which provides:
- **PID namespace isolation** — the submitted process cannot see other processes
- **Network namespace isolation** — no network access from executed code
- **Cgroup limits** — enforces CPU time, wall time, and memory limits per the submission payload
- **Filesystem isolation** — code runs in a chroot with read-only access to system libraries

For self-hosted deployments, Judge0 must be deployed on a **dedicated VM or bare-metal host** — never as a container on the same host as the application server — to prevent container escape attacks.

### 6.2 Rate Limiting

Apply per-IP and per-session rate limits at the API gateway level:

| Endpoint | Limit |
|----------|-------|
| `POST /submissions` | 10 requests/minute per session |
| `POST /run` | 20 requests/minute per session |
| `GET /submissions/{token}` (polling) | 60 requests/minute per session |

Implemented via `slowapi` (FastAPI middleware wrapping `limits`) backed by Redis.

### 6.3 Tab-Switch Detection

The frontend registers `document.visibilitychange` and `window.blur` events. On each trigger:

```js
// frontend
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    api.post(`/sessions/${sessionId}/events`, {
      event_type: 'tab_switch',
      occurred_at: new Date().toISOString(),
    })
  }
})
```

The backend stores these in `session_events`. The Module 5 report includes a `integrity_flags` field:
- `tab_switches`: integer count
- `focus_losses`: integer count
- `integrity_risk`: `low | medium | high` (thresholds: `medium` if > 2 events, `high` if > 5)

**Limitations:** Tab-switch detection is not a reliable cheat-prevention mechanism — it can be triggered by legitimate actions (notifications, etc.) and defeated by a second device. It should be treated as a weak signal, not grounds for disqualification.

### 6.4 Input Validation and Injection Prevention

- `source_code` is base64-encoded before storage and transmission to Judge0. It is never interpreted by the platform itself.
- Problem descriptions are stored as Markdown and rendered client-side with a sanitiser (`DOMPurify`). No raw HTML injection is possible.
- All database queries use SQLAlchemy parameterised statements — no raw string interpolation.
- Judge0 `stdin` is derived from stored test case inputs, not from user-provided data.

### 6.5 Source Code Confidentiality

Candidate submissions should not be visible to other candidates. Row-level security (PostgreSQL RLS) or application-level checks must ensure:
- A candidate can only read their own `submissions` rows.
- Interviewers can read all submissions for sessions they own.
- Admins have full access.

---

## 7. Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Judge0 rate limit exceeded (hosted tier) | Medium | High | Self-host Judge0 on a VM; implement a submission queue with backpressure |
| DeepFace/TF dependency conflicts (if co-located with Module 3) | High | Medium | Run Module 4 backend in an isolated Docker container/virtualenv |
| Candidate submits infinite-loop code causing server hang | Low | High | Judge0 `wall_time_limit` enforced at the isolate level; platform DB marked TLE after 60 s polling timeout |
| GPT API outage → quality reports unavailable | Medium | Low | Quality report is non-blocking and advisory; fall back to static analysis only |
| Monaco Editor bundle too large for slow connections | Low | Medium | Lazy-load Monaco via CDN workers; show plain `<textarea>` fallback |
| False integrity flags from tab-switch detection | High | Low | Clearly label these as "advisory signals" in Module 5; require human review |
| PostgreSQL connection exhaustion under peak load | Medium | High | Connection pooling via `PgBouncer`; async SQLAlchemy limits connections per service |
| Judge0 `isolate` container escape (CVE) | Low | Critical | Run Judge0 on a dedicated VM, subscribe to CVE feed; update Judge0 promptly |
| Candidate accesses another candidate's problem via IDOR | Low | High | Enforce `session_id` ownership check in every submission/read endpoint; add integration tests for these boundaries |

---

## 8. Summary of Recommended Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Code editor | Monaco Editor + `@monaco-editor/react` | Best-in-class editing experience |
| Code execution | Judge0 CE (self-hosted) | Open-source, secure, multi-language |
| Backend | FastAPI + asyncpg + SQLAlchemy 2.0 | Consistent with Module 3; async I/O for polling |
| Queue (for Judge0 polling) | Redis + `arq` (async task queue) | Lightweight; avoids blocking HTTP handlers during 60-s polling loops |
| Rate limiting | `slowapi` + Redis | Battle-tested; integrates cleanly with FastAPI |
| Code quality | `radon` (static) + Claude/GPT-4o (AI hints) | Two-tier: fast static analysis + rich AI insights |
| Frontend | React + Vite + Monaco | Same toolchain as Module 3 |
| Tab-switch detection | Browser `visibilitychange` API | Native, zero-dependency |
| Database | PostgreSQL 16 | Consistent with platform; JSONB for quality/test-case results |
