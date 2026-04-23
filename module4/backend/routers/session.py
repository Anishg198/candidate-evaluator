"""
Session management — assigns 3 random problems per candidate at start.
"""
import random
import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text
from pydantic import BaseModel

from database import get_db, engine
from models import CodingSession, Problem

router = APIRouter(tags=["session"])

PROBLEMS_PER_SESSION = 3
REQUIRED_TO_ATTEMPT = 2   # candidate must attempt this many


class StartRequest(BaseModel):
    candidate_id: str
    name: str = ""
    email: str = ""


@router.post("/session/start")
async def start_session(req: StartRequest, db: AsyncSession = Depends(get_db)):
    """Create (or return existing) session for a candidate with 3 random problems."""
    # Ensure name/email columns exist (safe on repeated calls)
    async with engine.begin() as conn:
        await conn.execute(text(
            "ALTER TABLE m4_coding_sessions ADD COLUMN IF NOT EXISTS name VARCHAR DEFAULT ''"
        ))
        await conn.execute(text(
            "ALTER TABLE m4_coding_sessions ADD COLUMN IF NOT EXISTS email VARCHAR DEFAULT ''"
        ))

    # Return existing session if candidate already started
    existing = await db.execute(
        select(CodingSession).where(CodingSession.candidate_id == req.candidate_id)
    )
    session = existing.scalar_one_or_none()
    if session:
        return _session_response(session)

    # Pick 3 random problems from the pool
    all_problems = await db.execute(select(Problem.id))
    all_ids = [row[0] for row in all_problems.fetchall()]

    if len(all_ids) < PROBLEMS_PER_SESSION:
        raise HTTPException(500, f"Not enough problems in pool (have {len(all_ids)}, need {PROBLEMS_PER_SESSION})")

    chosen = random.sample(all_ids, PROBLEMS_PER_SESSION)

    session = CodingSession(
        id=str(uuid.uuid4()),
        candidate_id=req.candidate_id,
        name=req.name,
        email=req.email,
        problem_ids=chosen,
        required_count=REQUIRED_TO_ATTEMPT,
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)
    return _session_response(session)


@router.get("/session/{candidate_id}")
async def get_session(candidate_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(CodingSession).where(CodingSession.candidate_id == candidate_id)
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(404, "No session found. Please start a session first.")
    return _session_response(session)


def _session_response(s: CodingSession) -> dict:
    return {
        "session_id": s.id,
        "candidate_id": s.candidate_id,
        "problem_ids": s.problem_ids,
        "required_count": s.required_count,
        "total_problems": len(s.problem_ids),
    }
