# CandEvalAI — AI-Powered Candidate Evaluation Platform

An end-to-end automated hiring pipeline: CV upload → written test → AI interview → coding assessment → final HR report.

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
Judge0 CE           Code execution engine          http://localhost:2358
```

---

## Prerequisites

- Python 3.10+
- Node.js 18+
- PostgreSQL 14+
- Docker + Docker Compose — required for Judge0 CE
- Judge0 CE (self-hosted) — for code execution

---

## Database Setup

Create the database and user in PostgreSQL:

```sql
CREATE USER hcl_user WITH PASSWORD 'hcl_pass';
CREATE DATABASE hcl_db OWNER hcl_user;
GRANT ALL PRIVILEGES ON DATABASE hcl_db TO hcl_user;
```

All backends auto-create their tables on first startup — no migrations needed.

---

## Judge0 Setup (Code Execution)

Judge0 CE bundles its own PostgreSQL and Redis — runs entirely in Docker.

```bash
wget https://github.com/judge0/judge0/releases/download/v1.13.1/judge0-v1.13.1.zip
unzip judge0-v1.13.1.zip
cd judge0-v1.13.1
```

Generate two passwords and paste them into `judge0.conf`:

```
REDIS_PASSWORD=<any-password>
POSTGRES_PASSWORD=<any-password>
```

Then start:

```bash
docker-compose up -d db redis
sleep 10
docker-compose up -d
sleep 5
```

Judge0 runs on `http://localhost:2358`. It takes ~30 seconds to be fully ready after startup.

```bash
# Verify it's up
curl http://localhost:2358/languages | head -c 100
```

---

## Running the Backends

Open a separate terminal for each service.

### Module 1 — CV Parsing

```bash
cd module1/backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

uvicorn app.main:app --port 8000 --reload
```

### Module 2 — Written Test

```bash
cd module2/backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

DATABASE_URL=postgresql+asyncpg://hcl_user:hcl_pass@localhost:5432/hcl_db \
MODEL_CACHE_DIR=/tmp/model_cache \
uvicorn main:app --port 8002 --reload
```

**First startup only:** downloads `all-MiniLM-L6-v2` (~90 MB). Subsequent starts are instant.

### Module 3 — AI Interview

```bash
cd module3/backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

DATABASE_URL=postgresql+asyncpg://hcl_user:hcl_pass@localhost:5432/hcl_db \
uvicorn app.main:app --port 8003 --reload
```

### Module 4 — Coding Test

```bash
cd module4/backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

DATABASE_URL=postgresql+asyncpg://hcl_user:hcl_pass@localhost:5432/hcl_db \
JUDGE0_URL=http://localhost:2358 \
uvicorn main:app --port 8004 --reload
```

Seed the coding problem bank (first time only):

```bash
python seed.py
```

### Module 5 — Final Report

```bash
cd module5/backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

DATABASE_URL=postgresql+asyncpg://hcl_user:hcl_pass@localhost:5432/hcl_db \
MODULE2_URL=http://localhost:8002 \
MODULE3_URL=http://localhost:8003 \
MODULE4_URL=http://localhost:8004 \
uvicorn main:app --port 8005 --reload
```

---

## Running the Frontend

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
- Set HR decisions — Approve or Reject candidates

---

## Candidate Flow

1. **Apply** — find an open job on the home page, submit name, email, and CV (PDF)
2. **Pre-test instructions** — camera check + environment guidelines before each test
3. **Written Test** — AI-generated MCQ + short-answer questions tailored to CV skills
4. **AI Interview** — 5 text-based questions (technical + behavioural), AI-scored
5. **Coding Test** — algorithmic problems with live code execution in multiple languages
6. **Done** — final report compiled and available to HR

Candidates receive a **Candidate ID** on applying. Use it on the home page to resume the pipeline after a break.

---

## Supported Coding Languages

Python · JavaScript · Java · C++ · C · TypeScript · Go · Rust · Kotlin · Ruby · Swift

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
| Judge0 | 2358 |

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

**Code Execution:** Judge0 CE (self-hosted)

---

## Troubleshooting

**Coding submissions fail** — Judge0 takes ~30 seconds to be ready after starting. Wait and retry.

**Camera not working** — browser requires `localhost` (not a LAN IP). Always access via `http://localhost:5175`.

**Written test shows no questions** — HR must create a job posting first. The question bank pulls from the job's skill tags.

**Port already in use** — find and kill the process: `lsof -i :PORT` then `kill -9 PID`.
