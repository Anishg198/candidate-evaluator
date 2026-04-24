# CandEvalAI — AI-Powered Candidate Evaluation Platform

An end-to-end automated hiring pipeline: CV upload → written test → AI interview → coding assessment → final HR report.

**[HR & Candidate User Guide →](GUIDE.md)**

```bash
git clone https://github.com/Anishg198/candidate-evaluator.git
cd candidate-evaluator
```

---

## Architecture

```
platform/frontend   React + Vite UI               http://localhost:5175
module1/backend     CV parsing API (FastAPI)       http://localhost:8000
module2/backend     Written test API (FastAPI)     http://localhost:8002
module3/backend     Interview API (FastAPI)        http://localhost:8003
module4/backend     Coding test API (FastAPI)      http://localhost:8004
module5/backend     Final report API (FastAPI)     http://localhost:8005
PostgreSQL          Shared database                localhost:5432
```

---

## Prerequisites

- **Python 3.10+** — [python.org/downloads](https://www.python.org/downloads/)
- **Node.js 18+** — [nodejs.org](https://nodejs.org/)
- **PostgreSQL 14+** — must be installed and running before Step 1
  - Mac (Homebrew): `brew install postgresql@16 && brew services start postgresql@16`
  - Mac (app): [postgresapp.com](https://postgresapp.com)
  - Windows: [postgresql.org/download/windows](https://www.postgresql.org/download/windows/)
- For coding test language support:
  - Python 3 — included with Python
  - JavaScript — Node.js (already required)
  - Java — `java` + `javac` (JDK)
  - C++ — `g++`

No Docker required. Code execution runs locally via subprocess.

> **Windows users:** (1) replace `source .venv/bin/activate` with `.venv\Scripts\activate` in all backend commands, and (2) run `setup_db.sh` in **Git Bash**, not Command Prompt.

---

## Step 1 — Database Setup

```bash
bash setup_db.sh
```

That's it. The script creates the user, database, grants permissions, and applies any required column migrations — safe to run on both fresh installs and existing databases.

---

## Step 2 — Run the Backends

Open a **separate terminal** for each. Run each block from the **repo root** — do not `cd` first.

### Module 1 — CV Parsing

```bash
cd module1/backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Module 2 — Written Test

```bash
cd module2/backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
DATABASE_URL=postgresql+asyncpg://hcl_user:hcl_pass@localhost:5432/hcl_db \
MODEL_CACHE_DIR=/tmp/model_cache \
uvicorn main:app --host 0.0.0.0 --port 8002 --reload --timeout-keep-alive 300
```

**First startup only:** downloads `all-MiniLM-L6-v2` (~90 MB). Subsequent starts are instant.

### Module 3 — AI Interview

```bash
cd module3/backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
DATABASE_URL=postgresql+asyncpg://hcl_user:hcl_pass@localhost:5432/hcl_db \
uvicorn app.main:app --host 0.0.0.0 --port 8003 --reload
```

### Module 4 — Coding Test

```bash
cd module4/backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
DATABASE_URL=postgresql+asyncpg://hcl_user:hcl_pass@localhost:5432/hcl_db \
uvicorn main:app --host 0.0.0.0 --port 8004 --reload
```

Seed the coding problem bank (first time only):

```bash
python3 seed.py
```

### Module 5 — Final Report

```bash
cd module5/backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
DATABASE_URL=postgresql+asyncpg://hcl_user:hcl_pass@localhost:5432/hcl_db \
MODULE2_URL=http://localhost:8002 \
MODULE3_URL=http://localhost:8003 \
MODULE4_URL=http://localhost:8004 \
uvicorn main:app --host 0.0.0.0 --port 8005 --reload
```

---

## Step 3 — Run the Frontend

```bash
cd platform/frontend
npm install
npm run dev
```

Open `http://localhost:5175`

---

## HR Portal

URL: `http://localhost:5175/hr`
Password: `HCL@2024`

**What you can do:**
- Create and manage job postings (skills, difficulty, question count)
- View all applications and each candidate's pipeline progress
- Read AI-generated evaluation reports with scores per module
- See time taken for each test (written, interview, coding)
- Set HR decisions — Approve or Reject candidates

---

## Candidate Flow

1. **Apply** — find an open job on the home page, submit name, email, and CV (PDF)
2. **Pre-test instructions** — camera check + environment guidelines before each test
3. **Written Test** — MCQ + short-answer questions tailored to CV skills, 30 min timer, auto-submits on expire
4. **AI Interview** — 5 text-based questions (technical + behavioural), AI-scored, 30 min timer, auto-submits on expire
5. **Coding Test** — algorithmic problems with live code execution, 45 min timer, auto-submits on expire; code auto-saved per problem so candidates can switch problems and return; custom input panel for testing against own inputs
6. **Done** — final report compiled and available to HR

Candidates receive a **Candidate ID** on applying. Use it on the home page to resume the pipeline after a break.

---

## Code Execution

No Docker or external services needed. Module 4 runs code locally via Python `subprocess`:

| Language | Requirement |
|----------|-------------|
| Python 3 | `python3` in PATH |
| JavaScript | `node` in PATH |
| Java | `javac` + `java` in PATH (JDK) |
| C++ | `g++` in PATH |

Code runs in a temp file, stdout/stderr is captured and returned to the frontend. A 10-second timeout applies per test case.

---

## Default Ports

| Service | Port |
|---------|------|
| Platform Frontend (dev) | 5175 |
| Module 1 — CV Parsing | 8000 |
| Module 2 — Written Test | 8002 |
| Module 3 — Interview | 8003 |
| Module 4 — Coding | 8004 |
| Module 5 — Report | 8005 |
| PostgreSQL | 5432 |

To change any backend URL in the frontend, create `platform/frontend/.env.local`:

```env
VITE_MODULE1_URL=http://localhost:8000
VITE_MODULE2_URL=http://localhost:8002
VITE_MODULE3_URL=http://localhost:8003
VITE_MODULE4_URL=http://localhost:8004
VITE_MODULE5_URL=http://localhost:8005
```

---

## Tech Stack

**Frontend:** React 18, Vite, Tailwind CSS, React Router, Monaco Editor

**Backends:** FastAPI, SQLAlchemy (async), PostgreSQL, Uvicorn

**AI / ML:** Curated question bank (written test generation), keyword-based scoring (interview grading), face-api (behavioural proctoring)

**Code Execution:** Local subprocess execution (Python, Node.js, Java, g++) — no Docker

---

## Troubleshooting

**Coding test fails with "Language not supported"** — only Python, JavaScript, Java, C++ are supported. Make sure `python3`, `node`, `javac`, `g++` are installed and in PATH.

**Camera not working** — browser requires `localhost` (not a LAN IP). Always access via `http://localhost:5175`.

**Written test shows no questions** — HR must create a job posting first. The question bank pulls from the job's skill tags.

**Port already in use** — find and kill the process: `lsof -i :PORT` then `kill -9 PID`.
