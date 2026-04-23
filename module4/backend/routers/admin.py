"""
HR admin endpoint — aggregate results for all candidates.
No auth needed beyond keeping the route non-obvious; add a reverse proxy
secret header in production if desired.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from database import get_db
from models import CodingSubmission, CodingSession, Problem

router = APIRouter(tags=["admin"])


@router.get("/module4/admin/results")
async def get_all_results(db: AsyncSession = Depends(get_db)):
    """Return score summary for every candidate that has a session."""
    sessions_result = await db.execute(select(CodingSession).order_by(CodingSession.created_at.desc()))
    sessions = sessions_result.scalars().all()

    if not sessions:
        return []

    # All submissions + problems in one shot
    subs_result = await db.execute(select(CodingSubmission))
    all_subs = subs_result.scalars().all()

    probs_result = await db.execute(select(Problem))
    problems = {p.id: p for p in probs_result.scalars().all()}

    rows = []
    for session in sessions:
        cid = session.candidate_id
        subs = [s for s in all_subs if s.candidate_id == cid]

        # Best submission per assigned problem
        best: dict[str, CodingSubmission] = {}
        for s in subs:
            if s.problem_id in session.problem_ids:
                if s.problem_id not in best or s.passed_tests > best[s.problem_id].passed_tests:
                    best[s.problem_id] = s

        scores = []
        problem_details = []
        for pid in session.problem_ids:
            p = problems.get(pid)
            sub = best.get(pid)
            if sub:
                pct = round((sub.passed_tests / sub.total_tests * 100) if sub.total_tests > 0 else 0, 1)
                scores.append(pct)
                problem_details.append({
                    "title": p.title if p else pid,
                    "difficulty": p.difficulty if p else "easy",
                    "status": sub.status,
                    "score": pct,
                    "passed_tests": sub.passed_tests,
                    "total_tests": sub.total_tests,
                    "language": sub.language_name,
                    "attempt_count": sub.attempt_number,
                    "attempted": True,
                })
            else:
                problem_details.append({
                    "title": p.title if p else pid,
                    "difficulty": p.difficulty if p else "easy",
                    "status": "Not Attempted",
                    "score": 0,
                    "passed_tests": 0,
                    "total_tests": 0,
                    "language": None,
                    "attempt_count": 0,
                    "attempted": False,
                })

        required_count = session.required_count
        top_scores = sorted(scores, reverse=True)[:required_count]
        total_score = round(sum(top_scores) / required_count, 1) if top_scores else 0.0

        # Latest submission time across all their submissions
        submitted_at = None
        if subs:
            latest = max(subs, key=lambda s: s.submitted_at)
            submitted_at = latest.submitted_at.isoformat()

        rows.append({
            "candidate_id": cid,
            "name": session.name or "",
            "email": session.email or "",
            "total_score": total_score,
            "problems_attempted": len(scores),
            "problems_solved": sum(1 for s in scores if s == 100.0),
            "total_problems": len(session.problem_ids),
            "required_count": required_count,
            "scoring_note": f"Best {required_count} of {len(session.problem_ids)}",
            "started_at": session.created_at.isoformat(),
            "last_submission_at": submitted_at,
            "problems": problem_details,
        })

    return sorted(rows, key=lambda r: r["total_score"], reverse=True)
