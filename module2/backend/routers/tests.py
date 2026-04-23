import uuid
import asyncio
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel

from database import get_db
from models import Candidate, Question, TestSession, Answer, QuestionType
from services.generator import generate_questions
from services.grader import grade_mcq, grade_short_answer

router = APIRouter(tags=["tests"])

MAX_POINTS_PER_QUESTION = 10.0


# ── Schemas ────────────────────────────────────────────────────────────────────

class GenerateRequest(BaseModel):
    candidate_id: str
    name: str = "Candidate"
    email: str = "candidate@example.com"
    skills: list[str]
    difficulty: str = "medium"
    num_questions: int = 10


class SubmitAnswer(BaseModel):
    question_id: str
    answer: str


class SubmitRequest(BaseModel):
    answers: list[SubmitAnswer]


# ── Helpers ────────────────────────────────────────────────────────────────────

def _question_response(q: Question, include_answer: bool = False) -> dict:
    data = {
        "id": q.id,
        "type": q.type,
        "skill": q.skill,
        "difficulty": q.difficulty,
        "question_text": q.question_text,
        "options": q.options if q.type == QuestionType.mcq else None,
        "max_points": MAX_POINTS_PER_QUESTION,
    }
    if include_answer:
        data["answer_key"] = q.answer_key
    return data


# ── Endpoints ──────────────────────────────────────────────────────────────────

@router.post("/tests/generate")
async def generate_test(req: GenerateRequest, db: AsyncSession = Depends(get_db)):
    # Upsert candidate
    result = await db.execute(select(Candidate).where(Candidate.id == req.candidate_id))
    candidate = result.scalar_one_or_none()
    if not candidate:
        candidate = Candidate(id=req.candidate_id, name=req.name, email=req.email)
        db.add(candidate)

    # Distribute questions evenly across skills, spreading the remainder
    num_skills = len(req.skills)
    base = req.num_questions // num_skills
    remainder = req.num_questions % num_skills
    # First `remainder` skills get one extra question
    counts = [max(1, base + (1 if i < remainder else 0)) for i in range(num_skills)]
    all_question_ids = []

    for skill, count in zip(req.skills, counts):
        generated = await asyncio.to_thread(generate_questions, skill, req.difficulty, count)
        for g in generated:
            q = Question(
                id=str(uuid.uuid4()),
                skill=skill,
                type=g["type"],
                difficulty=req.difficulty,
                question_text=g["question_text"],
                options=g.get("options"),
                answer_key=g["answer_key"],
            )
            db.add(q)
            all_question_ids.append(q.id)

    # Create session
    session = TestSession(
        id=str(uuid.uuid4()),
        candidate_id=req.candidate_id,
        skills=req.skills,
        difficulty=req.difficulty,
        question_ids=all_question_ids,
        start_time=datetime.utcnow(),
        duration_minutes=30,
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)

    # Fetch questions for response
    result = await db.execute(select(Question).where(Question.id.in_(all_question_ids)))
    questions = result.scalars().all()
    q_map = {q.id: q for q in questions}

    return {
        "session_id": session.id,
        "duration_minutes": session.duration_minutes,
        "start_time": session.start_time.isoformat(),
        "questions": [_question_response(q_map[qid]) for qid in all_question_ids if qid in q_map],
    }


@router.get("/tests/{session_id}")
async def get_test(session_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(TestSession).where(TestSession.id == session_id))
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(404, "Session not found")

    now = datetime.utcnow()
    start = session.start_time.replace(tzinfo=None) if session.start_time.tzinfo is not None else session.start_time
    elapsed = (now - start).total_seconds()
    remaining = max(0, session.duration_minutes * 60 - int(elapsed))

    result = await db.execute(select(Question).where(Question.id.in_(session.question_ids)))
    questions = result.scalars().all()
    q_map = {q.id: q for q in questions}

    return {
        "session_id": session.id,
        "submitted": session.submitted_at is not None,
        "time_remaining_seconds": remaining,
        "duration_minutes": session.duration_minutes,
        "questions": [_question_response(q_map[qid]) for qid in session.question_ids if qid in q_map],
    }


@router.get("/tests/{session_id}/result")
async def get_result(session_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(TestSession).where(TestSession.id == session_id))
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(404, "Session not found")
    if not session.submitted_at:
        raise HTTPException(400, "Test not yet submitted")

    answers = await db.execute(select(Answer).where(Answer.session_id == session_id))
    ans_list = answers.scalars().all()

    question_ids = [a.question_id for a in ans_list]
    questions_r = await db.execute(select(Question).where(Question.id.in_(question_ids)))
    q_map = {q.id: q for q in questions_r.scalars().all()}

    breakdown = [
        {
            "question_id": a.question_id,
            "skill": q_map[a.question_id].skill if a.question_id in q_map else "",
            "type": q_map[a.question_id].type if a.question_id in q_map else "",
            "question_text": q_map[a.question_id].question_text if a.question_id in q_map else "",
            "candidate_answer": a.candidate_answer,
            "correct_answer": q_map[a.question_id].answer_key if a.question_id in q_map else "",
            "points_awarded": a.points_awarded,
            "max_points": a.max_points,
            "is_correct": a.is_correct,
            "similarity_score": a.similarity_score,
        }
        for a in ans_list
    ]

    score = session.raw_score or 0.0
    total = session.max_score or 1.0
    return {
        "session_id": session_id,
        "score": round(score, 2),
        "total": total,
        "percentage": round((score / total * 100) if total > 0 else 0, 1),
        "breakdown": breakdown,
        "breakdown_questions": breakdown,
    }


@router.post("/tests/{session_id}/submit")
async def submit_test(session_id: str, req: SubmitRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(TestSession).where(TestSession.id == session_id))
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(404, "Session not found")
    if session.submitted_at:
        raise HTTPException(400, "Test already submitted")

    # Fetch questions
    result = await db.execute(select(Question).where(Question.id.in_(session.question_ids)))
    questions = result.scalars().all()
    q_map = {q.id: q for q in questions}

    answer_map = {a.question_id: a.answer for a in req.answers}

    total_score = 0.0
    max_score = len(session.question_ids) * MAX_POINTS_PER_QUESTION
    breakdown = []

    for qid in session.question_ids:
        q = q_map.get(qid)
        if not q:
            continue
        candidate_answer = answer_map.get(qid, "").strip()

        if q.type == QuestionType.mcq:
            is_correct, pts = grade_mcq(candidate_answer, q.answer_key, MAX_POINTS_PER_QUESTION)
            similarity = None
        else:
            similarity, pts = grade_short_answer(candidate_answer, q.answer_key, MAX_POINTS_PER_QUESTION)
            is_correct = similarity >= 0.5 if similarity else False

        total_score += pts

        ans = Answer(
            id=str(uuid.uuid4()),
            session_id=session_id,
            question_id=qid,
            candidate_answer=candidate_answer,
            is_correct=is_correct,
            similarity_score=similarity,
            points_awarded=pts,
            max_points=MAX_POINTS_PER_QUESTION,
        )
        db.add(ans)

        breakdown.append({
            "question_id": qid,
            "skill": q.skill,
            "type": q.type,
            "question_text": q.question_text,
            "candidate_answer": candidate_answer,
            "correct_answer": q.answer_key,
            "points_awarded": pts,
            "max_points": MAX_POINTS_PER_QUESTION,
            "is_correct": is_correct,
            "similarity_score": similarity,
        })

    session.submitted_at = datetime.utcnow()
    session.raw_score = total_score
    session.max_score = max_score
    await db.commit()

    return {
        "session_id": session_id,
        "score": round(total_score, 2),
        "total": max_score,
        "percentage": round((total_score / max_score * 100) if max_score > 0 else 0, 1),
        "breakdown": breakdown,
    }
