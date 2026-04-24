# HCL Internship Program - Project 4, Module 1

## Project
HCL Internship Program - Project 4, Module 1: CV Scanning & Skill Matching.

## SRS Coverage
This module implements FR-01 through FR-07 from SRS Version 1.0.

## Prerequisites
- Node 18+
- Python 3.11+

## Quick Start
```bash
npm install
python3 -m venv .venv
./.venv/bin/pip install -r backend/requirements.txt
npm run dev:backend
npm run dev
# Open http://localhost:5173
```

## Candidate Flow
1. Open the login page and choose `I'm a Candidate`.
2. Complete the candidate registration form with name, email, and optional phone number.
3. Upload a PDF or DOCX CV and click `Analyze Resume`.
4. Review the extracted summary, skills, work experience, and education.
5. Submit the application to store the candidate profile and run matching against all active jobs.
6. Review the confirmation page listing each evaluated role and score.

## HR Flow
1. Open the login page and choose `I'm an HR Manager`.
2. Review demo jobs or create a new role from `Post New Job`.
3. Define the job description, required skills, preferred skills, and minimum experience.
4. Inspect candidates ranked by overall score for the selected role.
5. Open a candidate profile to review match analysis, matched skills, and missing critical skills.

## Architecture
- Frontend: React + Vite + Tailwind with shadcn-style UI primitives in `src/components/ui`
- Backend: FastAPI parser service in `backend/app`
- Parsing approach: deterministic NLP/rule-based extraction using regex, section parsing, skill dictionaries, and date-range heuristics

## Matching Algorithm
The matcher normalizes candidate and job skills using lowercase comparison. Required skill coverage drives the base skill score, and preferred skills add a bonus of up to 10 points. Skill score contributes 70% of the overall result, while experience score contributes 30%. Experience receives full credit when the candidate meets the minimum years requirement, with fallback tiers at 70, 40, or 10. The final score is rounded to one decimal place and mapped to recommendation tiers: `STRONG_MATCH`, `GOOD_MATCH`, `PARTIAL_MATCH`, and `WEAK_MATCH`.

## localStorage Schema
| Key | Shape / Purpose |
|---|---|
| `cvm_role` | `"CANDIDATE"` or `"HR"` |
| `cvm_candidates` | JSON array of candidate objects containing `id`, `skills`, extracted CV data, and `matchResults` |
| `cvm_jobs` | JSON array of job objects with required and preferred skills |
| `cvm_candidate_draft` | In-progress candidate registration payload used between register and upload |

## Module 2 Handoff
Module 2 should read `cvm_candidates` from localStorage. Each candidate object exposes `candidate.id`, `candidate.name`, `candidate.skills`, `candidate.totalYearsExperience`, and `candidate.matchResults`. The first match result contains `jobId`, `overallScore`, `matchedSkills`, and `missingSkills`, which Module 2 can use to tailor the written test and difficulty.

## Data Note
All application state is stored in localStorage. If browser storage is cleared, candidate profiles, jobs, draft candidate data, and match results are removed as well.
