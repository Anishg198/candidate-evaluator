# CandEvalAI — AI-Powered Candidate Evaluation Platform

An end-to-end automated hiring pipeline that takes a candidate from CV submission through a written test, AI technical interview, and live coding assessment, then compiles a final evaluation report for HR review.

---

## Architecture Overview

```
platform/frontend          →  Unified React UI (port 3000 / 5175 dev)
├── module1                →  CV upload & application (port 8001 / 3001)
├── module2/backend        →  Written test API — AI-generated MCQ + short answer (port 8002)
├── module3/backend        →  Technical interview API — conversational AI (port 8003)
├── module4/backend        →  Coding test API — Judge0 execution engine (port 8004)
└── module5/backend        →  Final report aggregator (port 8005)

Infrastructure
├── PostgreSQL 16          →  Shared database (port 5433)
└── Judge0 CE              →  Self-hosted code execution sandbox (port 2358)
```

**Candidate pipeline:** Apply → Written Test → AI Interview → Coding Test → Final Report

**HR portal:** `/hr` — password `HCL@2024`

---

## Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| Docker | 24+ | Required for full-stack run |
| Docker Compose | v2+ | `docker compose` or `docker-compose` |
| Node.js | 18+ | Frontend dev only |
| Python | 3.10+ | Backend dev only |
| Git | any | |

---

## Quick Start (Docker — Recommended)

### 1. Clone the repo

```bash
git clone https://github.com/Anishg198/candidate-evaluator.git
cd candidate-evaluator
```

### 2. Start everything

```bash
docker compose up --build
```

This starts all services: PostgreSQL, Judge0, all 5 module backends, and the platform frontend.

> **First run takes 5–10 minutes** — module2 downloads AI models (~500 MB) and Judge0 initialises its worker.

### 3. Open the app

```
http://localhost:3000
```

HR Portal: `http://localhost:3000/hr` — password: `HCL@2024`

---

## Local Development Setup

Run each service individually for hot-reload development.

### Step 1 — Start infrastructure only (Docker)

```bash
docker compose up postgres judge0 judge0-worker judge0-redis judge0-postgres -d
```

Wait ~30 seconds for Judge0 to initialise.

### Step 2 — Module 2 Backend (Written Test)

```bash
cd module2/backend
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
DATABASE_URL=postgresql+asyncpg://hcl_user:hcl_pass@localhost:5433/hcl_db \
uvicorn app.main:app --port 8002 --reload
```

### Step 3 — Module 3 Backend (AI Interview)

```bash
cd module3/backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
DATABASE_URL=postgresql+asyncpg://hcl_user:hcl_pass@localhost:5433/hcl_db \
uvicorn app.main:app --port 8003 --reload
```

### Step 4 — Module 4 Backend (Coding Test)

```bash
cd module4/backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
DATABASE_URL=postgresql+asyncpg://hcl_user:hcl_pass@localhost:5433/hcl_db \
JUDGE0_URL=http://localhost:2358 \
uvicorn main:app --port 8004 --reload
```

Seed coding problems (first time only):

```bash
python seed.py
```

### Step 5 — Module 5 Backend (Final Report)

```bash
cd module5/backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
DATABASE_URL=postgresql+asyncpg://hcl_user:hcl_pass@localhost:5433/hcl_db \
MODULE2_URL=http://localhost:8002 \
MODULE4_URL=http://localhost:8004 \
uvicorn main:app --port 8005 --reload
```

### Step 6 — Platform Frontend

```bash
cd platform/frontend
npm install
npm run dev
```

App runs at `http://localhost:5175`

---

## Environment Variables

### Module 2 (Written Test)

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | — | PostgreSQL async URL |
| `MODEL_CACHE_DIR` | `/app/model_cache` | Where AI models are cached |

### Module 3 (Interview)

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | — | PostgreSQL async URL |

### Module 4 (Coding Test)

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | — | PostgreSQL async URL |
| `JUDGE0_URL` | `http://localhost:2358` | Judge0 execution engine URL |

### Module 5 (Final Report)

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | — | PostgreSQL async URL |
| `MODULE2_URL` | `http://localhost:8002` | Written test service URL |
| `MODULE4_URL` | `http://localhost:8004` | Coding test service URL |

### Platform Frontend (Vite env vars)

Create `platform/frontend/.env.local` if backends run on non-default ports:

```env
VITE_MODULE2_URL=http://localhost:8002
VITE_MODULE3_URL=http://localhost:8003
VITE_MODULE4_URL=http://localhost:8004
VITE_MODULE5_URL=http://localhost:8005
```

---

## Database

PostgreSQL credentials (Docker):

```
Host:     localhost
Port:     5433
User:     hcl_user
Password: hcl_pass
Database: hcl_db
```

All backends auto-create their tables on startup via SQLAlchemy `create_all`.

---

## Service Ports Reference

| Service | Port | URL |
|---------|------|-----|
| Platform Frontend | 3000 (Docker) / 5175 (dev) | Main candidate + HR UI |
| Module 2 Backend | 8002 | Written test API |
| Module 3 Backend | 8003 | Interview API |
| Module 4 Backend | 8004 | Coding test API |
| Module 5 Backend | 8005 | Final report API |
| PostgreSQL | 5433 | Shared DB |
| Judge0 | 2358 | Code execution |

---

## HR Portal

URL: `/hr`
Password: `HCL@2024`

Features:
- Create and manage job postings (title, description, difficulty, skills, question count)
- View all applications and candidate pipeline progress
- Read full AI-generated evaluation reports per candidate
- See written test and coding test scores
- Set HR decisions (Approve / Reject) per candidate

---

## Candidate Flow

1. **Apply** — candidate finds an open job on the home page and submits their CV + details
2. **Instructions** — pre-test checklist (camera check, environment guidelines, test details)
3. **Written Test** — AI generates personalised MCQ + short-answer questions based on CV skills
4. **AI Interview** — conversational text-based interview with 5 AI-generated questions
5. **Coding Test** — algorithmic problems executed live via Judge0 in multiple languages
6. **Final Report** — aggregated score + AI recommendation sent to HR dashboard

Candidates get a unique **Candidate ID** on applying — use it on the home page to resume the pipeline if they drop off.

---

## Supported Coding Languages

Python · JavaScript · Java · C++ · C · TypeScript · Go · Rust · Kotlin · Ruby · Swift

---

## Tech Stack

**Frontend:** React 18 · Vite · Tailwind CSS · React Router · Monaco Editor · Lucide Icons

**Backends:** FastAPI · SQLAlchemy (async) · PostgreSQL 16 · Uvicorn

**AI / ML:** Sentence Transformers (written test grading) · Rule-based NLP scoring (interview)

**Code Execution:** Judge0 CE (self-hosted)

**Infrastructure:** Docker · Docker Compose

---

## Stopping Services

```bash
# Stop all containers
docker compose down

# Stop and remove volumes (wipes database — fresh start)
docker compose down -v
```

---

## Troubleshooting

**Module 2 slow to start** — downloads transformer models on first run (~500 MB). Wait for `Application startup complete` in logs before using the written test.

**Judge0 returns errors** — give it 30–60 seconds to initialise after `docker compose up`. The worker needs time to connect to Redis and Postgres.

**Port already in use** — stop the conflicting process or change the host port mapping in `docker-compose.yml` (left side of `ports:`).

**Database connection refused** — check PostgreSQL is healthy before starting backends:
```bash
docker compose ps postgres
```

**Camera not working** — browsers require a secure context (HTTPS or `localhost`) for camera access. Always access the app via `http://localhost` not via a LAN IP address.

**Written test has no questions** — HR must create a job posting first via the HR portal. The question bank is seeded from the job's skill tags.
