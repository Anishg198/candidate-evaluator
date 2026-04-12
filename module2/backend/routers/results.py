from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from collections import defaultdict

from database import get_db
from models import TestSession, Answer, Question

router = APIRouter(tags=["results"])


@router.get("/module2/result/{candidate_id}")
async def get_result(candidate_id: str, db: AsyncSession = Depends(get_db)):
    # Get all submitted sessions for this candidate
    result = await db.execute(
        select(TestSession)
        .where(TestSession.candidate_id == candidate_id)
        .where(TestSession.submitted_at.isnot(None))
        .order_by(TestSession.submitted_at.desc())
    )
    sessions = result.scalars().all()

    if not sessions:
        raise HTTPException(404, f"No submitted results for candidate {candidate_id}")

    # Use the most recent session
    session = sessions[0]

    # Fetch answers and questions
    ans_result = await db.execute(select(Answer).where(Answer.session_id == session.id))
    answers = ans_result.scalars().all()

    q_ids = [a.question_id for a in answers]
    q_result = await db.execute(select(Question).where(Question.id.in_(q_ids)))
    questions = {q.id: q for q in q_result.scalars().all()}

    # Aggregate by skill
    skill_stats: dict[str, dict] = defaultdict(lambda: {
        "questions_attempted": 0, "questions_correct": 0, "points": 0.0, "max_points": 0.0
    })

    total_score = 0.0
    total_max = 0.0

    for ans in answers:
        q = questions.get(ans.question_id)
        skill = q.skill if q else "Unknown"
        skill_stats[skill]["questions_attempted"] += 1
        skill_stats[skill]["points"] += ans.points_awarded
        skill_stats[skill]["max_points"] += ans.max_points
        total_score += ans.points_awarded
        total_max += ans.max_points
        if ans.is_correct:
            skill_stats[skill]["questions_correct"] += 1

    breakdown = [
        {"skill": skill, **stats}
        for skill, stats in skill_stats.items()
    ]

    return {
        "candidate_id": candidate_id,
        "session_id": session.id,
        "score": round(total_score, 2),
        "total": round(total_max, 2),
        "percentage": round((total_score / total_max * 100) if total_max > 0 else 0, 1),
        "submitted_at": session.submitted_at.isoformat() if session.submitted_at else None,
        "breakdown": breakdown,
    }
