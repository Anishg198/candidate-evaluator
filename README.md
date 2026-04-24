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

Install these before anything else:

- **Python 3.10+** — [python.org/downloads](https://www.python.org/downloads/)
- **Node.js 18+** — [nodejs.org](https://nodejs.org/)
- **PostgreSQL 14+** — see platform-specific instructions below
- **Git** — [git-scm.com](https://git-scm.com/) *(Windows: includes Git Bash — use Git Bash for all commands)*

For coding test language support (optional):

| Language | Requirement |
|----------|-------------|
| Python 3 | included with Python |
| JavaScript | Node.js (already required) |
| Java | JDK — `java` + `javac` in PATH |
| C++ | `g++` in PATH |

---

## Step 1 — Install & Start PostgreSQL

> **This step can take 5–10 minutes** if PostgreSQL is not already installed — the download is ~100 MB. Once installed, future runs are instant.

### Mac

```bash
# Homebrew (recommended)
brew install postgresql@16
brew services start postgresql@16
```

Or download the app: [postgresapp.com](https://postgresapp.com)

### Windows

**Option 1 — Command line (winget, built into Windows 10/11):**
```
winget install PostgreSQL.PostgreSQL.16
```

**Option 2 — Chocolatey:**
```
choco install postgresql16
```

**Option 3 — Installer:** [postgresql.org/download/windows](https://www.postgresql.org/download/windows/)

During install, set a password for the `postgres` user. After install, PostgreSQL starts automatically as a Windows service.

---

## Step 2 — Database Setup

### Mac

```bash
bash setup_db.sh
```

### Windows (Git Bash)

Open **Git Bash** (not Command Prompt or PowerShell), then:

```bash
sed -i 's/\r//' setup_db.sh
bash setup_db.sh
```

> The `sed` command is a one-time fix for line endings — only needed on the first run.

The script creates the `hcl_user` and `hcl_db` database automatically. Safe to re-run on existing databases.

---

## Step 3 — Run the Backends

Open a **separate terminal** for each module. Run each block from the **repo root**.

> **Windows:** use Git Bash for all commands below. Replace `source .venv/bin/activate` with `source .venv/Scripts/activate`.

---

### Module 1 — CV Parsing

**Mac**
```bash
cd module1/backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

**Windows (Git Bash)**
```bash
cd module1/backend
python -m venv .venv && source .venv/Scripts/activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

---

### Module 2 — Written Test

**Mac**
```bash
cd module2/backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
DATABASE_URL=postgresql+asyncpg://hcl_user:hcl_pass@localhost:5432/hcl_db \
MODEL_CACHE_DIR=/tmp/model_cache \
uvicorn main:app --host 0.0.0.0 --port 8002 --reload --timeout-keep-alive 300
```

**Windows (Git Bash)**
```bash
cd module2/backend
python -m venv .venv && source .venv/Scripts/activate
pip install -r requirements.txt
DATABASE_URL=postgresql+asyncpg://hcl_user:hcl_pass@localhost:5432/hcl_db \
MODEL_CACHE_DIR=$TEMP/model_cache \
uvicorn main:app --host 0.0.0.0 --port 8002 --reload --timeout-keep-alive 300
```

**First startup only:** downloads `all-MiniLM-L6-v2` (~90 MB). Subsequent starts are instant.

---

### Module 3 — AI Interview

**Mac**
```bash
cd module3/backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
DATABASE_URL=postgresql+asyncpg://hcl_user:hcl_pass@localhost:5432/hcl_db \
uvicorn app.main:app --host 0.0.0.0 --port 8003 --reload
```

**Windows (Git Bash)**
```bash
cd module3/backend
python -m venv .venv && source .venv/Scripts/activate
pip install -r requirements.txt
DATABASE_URL=postgresql+asyncpg://hcl_user:hcl_pass@localhost:5432/hcl_db \
uvicorn app.main:app --host 0.0.0.0 --port 8003 --reload
```

---

### Module 4 — Coding Test

**Mac**
```bash
cd module4/backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
DATABASE_URL=postgresql+asyncpg://hcl_user:hcl_pass@localhost:5432/hcl_db \
uvicorn main:app --host 0.0.0.0 --port 8004 --reload
```

**Windows (Git Bash)**
```bash
cd module4/backend
python -m venv .venv && source .venv/Scripts/activate
pip install -r requirements.txt
DATABASE_URL=postgresql+asyncpg://hcl_user:hcl_pass@localhost:5432/hcl_db \
uvicorn main:app --host 0.0.0.0 --port 8004 --reload
```

Seed the coding problem bank (first time only):

**Mac**
```bash
python3 seed.py
```

**Windows (Git Bash)**
```bash
python seed.py
```

---

### Module 5 — Final Report

**Mac**
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

**Windows (Git Bash)**
```bash
cd module5/backend
python -m venv .venv && source .venv/Scripts/activate
pip install -r requirements.txt
DATABASE_URL=postgresql+asyncpg://hcl_user:hcl_pass@localhost:5432/hcl_db \
MODULE2_URL=http://localhost:8002 \
MODULE3_URL=http://localhost:8003 \
MODULE4_URL=http://localhost:8004 \
uvicorn main:app --host 0.0.0.0 --port 8005 --reload
```

---

## Step 4 — Run the Frontend

Same on both platforms:

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

## Default Ports

| Service | Port |
|---------|------|
| Platform Frontend | 5175 |
| Module 1 — CV Parsing | 8000 |
| Module 2 — Written Test | 8002 |
| Module 3 — Interview | 8003 |
| Module 4 — Coding | 8004 |
| Module 5 — Report | 8005 |
| PostgreSQL | 5432 |

To override backend URLs in the frontend, create `platform/frontend/.env.local`:

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

**Code Execution:** Local subprocess (Python, Node.js, Java, g++) — no Docker

---

## Troubleshooting

**`role "postgres" does not exist` (Mac Homebrew)** — Homebrew uses your macOS username as the superuser, not `postgres`. The `setup_db.sh` script handles this automatically.

**`$'\r': command not found` (Windows)** — Run `sed -i 's/\r//' setup_db.sh` in Git Bash before running the script.

**`python: command not found` (Mac)** — Use `python3` on Mac. The README commands already use `python3` for Mac.

**Coding test fails with "Language not supported"** — Make sure `python3`, `node`, `javac`, `g++` are installed and in PATH.

**Camera not working** — browser requires `localhost`. Always access via `http://localhost:5175`, not a LAN IP.

**Written test shows no questions** — HR must create a job posting first.

**Port already in use:**
- Mac: `lsof -i :PORT` then `kill -9 PID`
- Windows: `netstat -ano | findstr :PORT` then `taskkill /PID <pid> /F`
