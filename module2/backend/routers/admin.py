"""
HR admin endpoint — aggregate results for all candidates in the written assessment.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from collections import defaultdict

from database import get_db
from models import Candidate, TestSession, Answer, Question, QuestionType

router = APIRouter(tags=["admin"])


@router.get("/module2/admin/results")
async def get_all_results(db: AsyncSession = Depends(get_db)):
    """Return score summary for every candidate that has a submitted session."""

    # All submitted sessions, newest first
    sess_result = await db.execute(
        select(TestSession)
        .where(TestSession.submitted_at.isnot(None))
        .order_by(TestSession.submitted_at.desc())
    )
    sessions = sess_result.scalars().all()

    if not sessions:
        return []

    # Fetch all candidates, answers, questions in bulk
    cand_result = await db.execute(select(Candidate))
    candidates = {c.id: c for c in cand_result.scalars().all()}

    ans_result = await db.execute(select(Answer))
    all_answers = ans_result.scalars().all()
    answers_by_session: dict[str, list[Answer]] = defaultdict(list)
    for a in all_answers:
        answers_by_session[a.session_id].append(a)

    q_result = await db.execute(select(Question))
    questions = {q.id: q for q in q_result.scalars().all()}

    # One row per candidate — use their most recent submitted session
    seen_candidates: set[str] = set()
    rows = []

    for session in sessions:
        cid = session.candidate_id
        if cid in seen_candidates:
            continue
        seen_candidates.add(cid)

        candidate = candidates.get(cid)
        answers = answers_by_session.get(session.id, [])

        # Aggregate by skill
        skill_stats: dict[str, dict] = defaultdict(lambda: {
            "mcq_total": 0, "mcq_correct": 0,
            "subjective_total": 0, "subjective_points": 0.0, "subjective_max": 0.0,
            "points": 0.0, "max_points": 0.0,
        })

        total_score = 0.0
        total_max = 0.0
        mcq_correct = 0
        mcq_total = 0
        subj_total = 0

        skill_list = []

        for ans in answers:
            q = questions.get(ans.question_id)
            if not q:
                continue
            skill = q.skill
            ss = skill_stats[skill]
            ss["points"] += ans.points_awarded
            ss["max_points"] += ans.max_points
            total_score += ans.points_awarded
            total_max += ans.max_points

            if q.type == QuestionType.mcq:
                ss["mcq_total"] += 1
                mcq_total += 1
                if ans.is_correct:
                    ss["mcq_correct"] += 1
                    mcq_correct += 1
            else:
                ss["subjective_total"] += 1
                ss["subjective_points"] += ans.points_awarded
                ss["subjective_max"] += ans.max_points
                subj_total += 1

        # Build skill breakdown list (same order as session.skills)
        for skill in session.skills:
            ss = skill_stats.get(skill)
            if ss is None:
                continue
            pct = round((ss["points"] / ss["max_points"] * 100) if ss["max_points"] > 0 else 0, 1)
            skill_list.append({
                "skill": skill,
                "score_pct": pct,
                "points": round(ss["points"], 2),
                "max_points": round(ss["max_points"], 2),
                "mcq_total": ss["mcq_total"],
                "mcq_correct": ss["mcq_correct"],
                "subjective_total": ss["subjective_total"],
                "subjective_points": round(ss["subjective_points"], 2),
                "subjective_max": round(ss["subjective_max"], 2),
            })

        percentage = round((total_score / total_max * 100) if total_max > 0 else 0, 1)

        rows.append({
            "candidate_id": cid,
            "name": candidate.name if candidate else "",
            "email": candidate.email if candidate else "",
            "total_score": percentage,
            "raw_score": round(total_score, 2),
            "max_score": round(total_max, 2),
            "questions_attempted": len(answers),
            "questions_total": len(session.question_ids),
            "mcq_correct": mcq_correct,
            "mcq_total": mcq_total,
            "subjective_total": subj_total,
            "difficulty": session.difficulty,
            "skills": session.skills,
            "started_at": session.start_time.isoformat() if session.start_time else None,
            "submitted_at": session.submitted_at.isoformat() if session.submitted_at else None,
            "skill_breakdown": skill_list,
        })

    return sorted(rows, key=lambda r: r["total_score"], reverse=True)
