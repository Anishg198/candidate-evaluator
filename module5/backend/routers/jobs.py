"""
Job postings and candidate applications.
"""
import os
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

from database import get_db
from models import Job, Application

router = APIRouter(tags=["jobs"])

# Skills supported by Module 2 test engine
SUPPORTED_SKILLS = [
    "Python", "SQL", "Java", "JavaScript", "C++",
    "Data Structures", "Algorithms", "OOP", "OS", "Networks", "Machine Learning",
]

# Map CV-detected skill variants → test skills
CV_SKILL_MAP = {
    "python": "Python",
    "java": "Java",
    "javascript": "JavaScript", "typescript": "JavaScript", "js": "JavaScript",
    "c++": "C++", "c": "C++",
    "sql": "SQL", "mysql": "SQL", "postgresql": "SQL", "sqlite": "SQL",
    "oracle": "SQL", "pl/sql": "SQL", "t-sql": "SQL", "nosql": "SQL",
    "ms sql": "SQL", "sql server": "SQL", "hive": "SQL",
    "machine learning": "Machine Learning", "ml": "Machine Learning",
    "deep learning": "Machine Learning", "data science": "Machine Learning",
    "nlp": "Machine Learning", "artificial intelligence": "Machine Learning",
    "data structures": "Data Structures",
    "algorithms": "Algorithms", "algorithm": "Algorithms",
    "oop": "OOP", "object oriented": "OOP", "object-oriented": "OOP",
    "os": "OS", "linux": "OS", "unix": "OS", "operating systems": "OS",
    "networks": "Networks", "networking": "Networks", "tcp/ip": "Networks",
    "computer networks": "Networks",
}


def map_cv_skills_to_test_skills(cv_skills: list) -> list:
    mapped = set()
    for skill in cv_skills:
        key = skill.strip().lower()
        if key in CV_SKILL_MAP:
            mapped.add(CV_SKILL_MAP[key])
        # Also check if exact skill is already a supported skill (case-insensitive)
        for supported in SUPPORTED_SKILLS:
            if key == supported.lower():
                mapped.add(supported)
    return list(mapped)


# ── Job CRUD ──────────────────────────────────────────────────────────────

class JobCreate(BaseModel):
    title: str
    company: Optional[str] = "HCL Technologies"
    description: Optional[str] = ""
    required_skills: List[str] = []
    difficulty: Optional[str] = "medium"
    num_questions: Optional[int] = 10


@router.get("/jobs")
async def list_jobs(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Job).where(Job.is_active == True).order_by(Job.created_at.desc()))
    jobs = result.scalars().all()
    return [_job_dict(j) for j in jobs]


@router.get("/jobs/{job_id}")
async def get_job(job_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Job).where(Job.id == job_id))
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(404, "Job not found")
    return _job_dict(job)


@router.post("/jobs")
async def create_job(req: JobCreate, db: AsyncSession = Depends(get_db)):
    # Validate skills are supported
    valid = [s for s in req.required_skills if s in SUPPORTED_SKILLS]
    job = Job(
        title=req.title,
        company=req.company or "HCL Technologies",
        description=req.description or "",
        required_skills=valid,
        difficulty=req.difficulty or "medium",
        num_questions=str(req.num_questions or 10),
    )
    db.add(job)
    await db.commit()
    await db.refresh(job)
    return _job_dict(job)


@router.patch("/jobs/{job_id}")
async def toggle_job(job_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Job).where(Job.id == job_id))
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(404, "Job not found")
    job.is_active = not job.is_active
    await db.commit()
    return {"id": job.id, "is_active": job.is_active}


# ── Applications ──────────────────────────────────────────────────────────

class ApplyRequest(BaseModel):
    name: str
    email: str
    cv_data: Optional[dict] = None


@router.post("/jobs/{job_id}/apply")
async def apply_to_job(job_id: str, req: ApplyRequest, db: AsyncSession = Depends(get_db)):
    # Get job
    job_result = await db.execute(select(Job).where(Job.id == job_id))
    job = job_result.scalar_one_or_none()
    if not job:
        raise HTTPException(404, "Job not found")

    # Merge skills: job required + CV detected
    cv_skills = req.cv_data.get("skills", []) if req.cv_data else []
    mapped_cv = map_cv_skills_to_test_skills(cv_skills)
    merged = list(set(job.required_skills + mapped_cv))

    # Fall back to all job skills if nothing from CV
    if not merged:
        merged = list(job.required_skills) or SUPPORTED_SKILLS[:3]

    app = Application(
        job_id=job_id,
        name=req.name,
        email=req.email,
        cv_data=req.cv_data,
        merged_skills=merged,
    )
    db.add(app)
    await db.commit()
    await db.refresh(app)

    return {
        "candidate_id": app.candidate_id,
        "job_title": job.title,
        "company": job.company,
        "merged_skills": app.merged_skills,
        "difficulty": job.difficulty,
        "num_questions": int(job.num_questions),
    }


@router.get("/applications/{candidate_id}")
async def get_application(candidate_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Application).where(Application.candidate_id == candidate_id))
    app = result.scalar_one_or_none()
    if not app:
        raise HTTPException(404, "Application not found")
    job_result = await db.execute(select(Job).where(Job.id == app.job_id))
    job = job_result.scalar_one_or_none()
    return {
        "candidate_id": app.candidate_id,
        "name": app.name,
        "email": app.email,
        "job_id": app.job_id,
        "job_title": job.title if job else "",
        "company": job.company if job else "",
        "merged_skills": app.merged_skills,
        "difficulty": job.difficulty if job else "medium",
        "num_questions": int(job.num_questions) if job else 10,
        "cv_data": app.cv_data,
        "applied_at": app.applied_at.isoformat() if app.applied_at else None,
    }


@router.get("/applications/{candidate_id}/status")
async def get_application_status(candidate_id: str, db: AsyncSession = Depends(get_db)):
    """Public endpoint — candidate checks own pipeline progress."""
    result = await db.execute(select(Application).where(Application.candidate_id == candidate_id))
    app = result.scalar_one_or_none()
    if not app:
        raise HTTPException(404, "Candidate ID not found")
    job_result = await db.execute(select(Job).where(Job.id == app.job_id))
    job = job_result.scalar_one_or_none()

    # Determine completed stages by calling each module
    import httpx, asyncio, os
    m2 = os.getenv("MODULE2_URL", "http://localhost:8002")
    m3 = os.getenv("MODULE3_URL", "http://localhost:8003")
    m4 = os.getenv("MODULE4_URL", "http://localhost:8004")

    async def quick_check(url):
        try:
            async with httpx.AsyncClient(timeout=5) as c:
                r = await c.get(url)
                return r.status_code == 200
        except Exception:
            return False

    written_done, interview_done, coding_done = await asyncio.gather(
        quick_check(f"{m2}/module2/result/{candidate_id}"),
        quick_check(f"{m3}/module3/result/{candidate_id}"),
        quick_check(f"{m4}/module4/result/{candidate_id}"),
    )

    stages = [
        {"id": 1, "label": "Application Submitted", "done": True},
        {"id": 2, "label": "Written Test", "done": written_done},
        {"id": 3, "label": "AI Interview", "done": interview_done},
        {"id": 4, "label": "Coding Test", "done": coding_done},
        {"id": 5, "label": "Under HR Review", "done": written_done and coding_done},
    ]

    return {
        "candidate_id": candidate_id,
        "name": app.name,
        "email": app.email,
        "job_title": job.title if job else "",
        "company": job.company if job else "HCL Technologies",
        "applied_at": app.applied_at.isoformat() if app.applied_at else None,
        "hr_decision": app.hr_decision or "pending",
        "stages": stages,
        # Resume data — lets candidate restore session from landing page
        "resume": {
            "skills": app.merged_skills or [],
            "difficulty": job.difficulty if job else "medium",
            "num_questions": int(job.num_questions) if job else 10,
            "written_done": written_done,
            "interview_done": interview_done,
            "coding_done": coding_done,
        },
    }


class HRDecision(BaseModel):
    decision: str  # "approved" | "rejected" | "pending"
    note: str = ""


@router.patch("/applications/{candidate_id}/decision")
async def set_hr_decision(candidate_id: str, req: HRDecision, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Application).where(Application.candidate_id == candidate_id))
    app = result.scalar_one_or_none()
    if not app:
        raise HTTPException(404, "Application not found")
    if req.decision not in ("approved", "rejected", "pending"):
        raise HTTPException(400, "Decision must be approved, rejected, or pending")
    app.hr_decision = req.decision
    app.hr_note = req.note
    await db.commit()
    return {"candidate_id": candidate_id, "hr_decision": app.hr_decision}


@router.get("/module5/admin/applications")
async def list_applications(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Application).order_by(Application.applied_at.desc()))
    apps = result.scalars().all()
    job_ids = list({a.job_id for a in apps})
    jobs_result = await db.execute(select(Job).where(Job.id.in_(job_ids)))
    jobs = {j.id: j for j in jobs_result.scalars().all()}
    return [
        {
            "candidate_id": a.candidate_id,
            "name": a.name,
            "email": a.email,
            "job_id": a.job_id,
            "job_title": jobs[a.job_id].title if a.job_id in jobs else "",
            "merged_skills": a.merged_skills,
            "applied_at": a.applied_at.isoformat() if a.applied_at else None,
            "hr_decision": a.hr_decision or "pending",
        }
        for a in apps
    ]


@router.delete("/applications/{candidate_id}")
async def delete_application(candidate_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Application).where(Application.candidate_id == candidate_id))
    app = result.scalar_one_or_none()
    if not app:
        raise HTTPException(404, "Application not found")
    if app.hr_decision != "rejected":
        raise HTTPException(400, "Only rejected applications can be deleted")
    await db.delete(app)
    await db.commit()
    return {"deleted": candidate_id}


def _job_dict(j: Job) -> dict:
    return {
        "id": j.id,
        "title": j.title,
        "company": j.company,
        "description": j.description,
        "required_skills": j.required_skills,
        "difficulty": j.difficulty,
        "num_questions": int(j.num_questions) if j.num_questions else 10,
        "is_active": j.is_active,
        "created_at": j.created_at.isoformat() if j.created_at else None,
    }
