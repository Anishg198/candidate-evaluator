from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from database import get_db
from models import CodingSubmission, CodingSession, Problem

router = APIRouter(tags=["results"])


@router.get("/module4/result/{candidate_id}")
async def get_result(candidate_id: str, db: AsyncSession = Depends(get_db)):
    # Get session to know assigned problems and required count
    sess_result = await db.execute(
        select(CodingSession).where(CodingSession.candidate_id == candidate_id)
    )
    session = sess_result.scalar_one_or_none()

    # Get all submissions
    sub_result = await db.execute(
        select(CodingSubmission)
        .where(CodingSubmission.candidate_id == candidate_id)
        .order_by(CodingSubmission.submitted_at.desc())
    )
    submissions = sub_result.scalars().all()

    if not submissions and not session:
        raise HTTPException(404, f"No data for candidate {candidate_id}")

    # Best submission per problem (highest pass rate)
    best: dict[str, CodingSubmission] = {}
    for s in submissions:
        if s.problem_id not in best or s.passed_tests > best[s.problem_id].passed_tests:
            best[s.problem_id] = s

    # Determine which problem IDs to evaluate
    # If session exists, only score on assigned problems
    assigned_ids = session.problem_ids if session else list(best.keys())
    required_count = session.required_count if session else 2

    # Fetch problem titles
    all_ids = list(set(assigned_ids) | set(best.keys()))
    prob_result = await db.execute(select(Problem).where(Problem.id.in_(all_ids)))
    problems = {p.id: p for p in prob_result.scalars().all()}

    # Build per-problem rows for ALL assigned problems
    problem_rows = []
    scores = []
    for pid in assigned_ids:
        p = problems.get(pid)
        title = p.title if p else "Unknown"
        diff = p.difficulty if p else "easy"
        sub = best.get(pid)
        if sub:
            pct = round((sub.passed_tests / sub.total_tests * 100) if sub.total_tests > 0 else 0, 1)
            scores.append(pct)
            problem_rows.append({
                "problem_id": pid,
                "title": title,
                "difficulty": diff,
                "status": sub.status,
                "passed_tests": sub.passed_tests,
                "total_tests": sub.total_tests,
                "score": pct,
                "attempt_count": sub.attempt_number,
                "language": sub.language_name,
                "submitted_at": sub.submitted_at.isoformat() if sub.submitted_at else None,
                "attempted": True,
            })
        else:
            # Not attempted
            problem_rows.append({
                "problem_id": pid,
                "title": title,
                "difficulty": diff,
                "status": "Not Attempted",
                "passed_tests": 0,
                "total_tests": 0,
                "score": 0,
                "attempt_count": 0,
                "language": None,
                "submitted_at": None,
                "attempted": False,
            })

    # Score = average of top `required_count` scores
    top_scores = sorted(scores, reverse=True)[:required_count]
    total_score = round(sum(top_scores) / required_count, 1) if top_scores else 0.0

    problems_attempted = len(scores)
    problems_solved = sum(1 for s in scores if s == 100.0)

    return {
        "candidate_id": candidate_id,
        "required_count": required_count,
        "total_problems": len(assigned_ids),
        "problems_attempted": problems_attempted,
        "problems_solved": problems_solved,
        "total_score": total_score,
        "scoring_note": f"Score based on best {required_count} of {len(assigned_ids)} problems",
        "submissions": problem_rows,
    }
