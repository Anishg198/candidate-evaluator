import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
import openai

from app.database import get_db
from app.models import InterviewSession
from app.services.interviewer import select_questions, score_answer
from app.config import get_settings

router = APIRouter(tags=["interview"])
MAX_SCORE_PER_Q = 10.0


@router.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    settings = get_settings()
    if not settings.openai_api_key:
        raise HTTPException(503, "OpenAI API key not configured")
    client = openai.AsyncOpenAI(api_key=settings.openai_api_key)
    audio_bytes = await file.read()
    # Whisper needs a filename with extension to detect format
    fname = file.filename or "audio.webm"
    transcript = await client.audio.transcriptions.create(
        model="whisper-1",
        file=(fname, audio_bytes, file.content_type or "audio/webm"),
    )
    return {"transcript": transcript.text}


class StartRequest(BaseModel):
    candidate_id: str
    name: str = "Candidate"
    job_title: str = ""
    skills: list[str] = []


class AnswerRequest(BaseModel):
    answer: str


def _q_payload(session: InterviewSession) -> dict:
    idx = session.current_q
    q = session.questions[idx]
    return {
        "number": idx + 1,
        "total": len(session.questions),
        "text": q["q"],
        "skill": q.get("skill", ""),
        "category": q.get("category", "technical"),
    }


@router.post("/interview/start")
async def start_interview(req: StartRequest, db: AsyncSession = Depends(get_db)):
    questions = select_questions(req.skills or ["Python"])
    session = InterviewSession(
        id=str(uuid.uuid4()),
        candidate_id=req.candidate_id,
        name=req.name,
        job_title=req.job_title,
        skills=req.skills,
        questions=questions,
        answers=[],
        current_q=0,
        started_at=datetime.utcnow(),
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)

    return {
        "session_id": session.id,
        "total_questions": len(questions),
        "question": _q_payload(session),
    }


@router.post("/interview/{session_id}/answer")
async def submit_answer(session_id: str, req: AnswerRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(InterviewSession).where(InterviewSession.id == session_id))
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(404, "Session not found")
    if session.completed:
        raise HTTPException(400, "Interview already completed")

    idx = session.current_q
    q = session.questions[idx]
    pts = score_answer(req.answer, q.get("keywords", []))

    answers = list(session.answers or [])
    answers.append({
        "question": q["q"],
        "skill": q.get("skill", ""),
        "category": q.get("category", "technical"),
        "answer": req.answer,
        "score": pts,
        "max_score": MAX_SCORE_PER_Q,
    })
    session.answers = answers
    session.current_q = idx + 1

    # Check if done
    if session.current_q >= len(session.questions):
        session.completed = True
        session.completed_at = datetime.utcnow()
        session.raw_score = sum(a["score"] for a in answers)
        session.max_score = len(answers) * MAX_SCORE_PER_Q
        await db.commit()
        pct = round(session.raw_score / session.max_score * 100, 1) if session.max_score else 0
        return {
            "completed": True,
            "result": {
                "session_id": session_id,
                "score": round(session.raw_score, 2),
                "total": session.max_score,
                "percentage": pct,
            },
        }

    await db.commit()
    await db.refresh(session)
    return {
        "completed": False,
        "question": _q_payload(session),
    }


@router.get("/interview/{session_id}/result")
async def get_result(session_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(InterviewSession).where(InterviewSession.id == session_id))
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(404, "Session not found")
    if not session.completed:
        raise HTTPException(400, "Interview not yet completed")

    pct = round(session.raw_score / session.max_score * 100, 1) if session.max_score else 0
    return {
        "session_id": session_id,
        "candidate_id": session.candidate_id,
        "score": round(session.raw_score or 0, 2),
        "total": session.max_score or 0,
        "percentage": pct,
        "answers": session.answers,
    }


@router.get("/module3/result/{candidate_id}")
async def get_result_by_candidate(candidate_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(InterviewSession)
        .where(InterviewSession.candidate_id == candidate_id, InterviewSession.completed == True)
        .order_by(InterviewSession.completed_at.desc())
    )
    session = result.scalars().first()
    if not session:
        raise HTTPException(404, "No completed interview for this candidate")
    pct = round(session.raw_score / session.max_score * 100, 1) if session.max_score else 0
    return {
        "session_id": session.id,
        "candidate_id": session.candidate_id,
        "score": round(session.raw_score or 0, 2),
        "total": session.max_score or 0,
        "percentage": pct,
        "answers": session.answers,
    }


@router.get("/module3/admin/results")
async def admin_results(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(InterviewSession).where(InterviewSession.completed == True).order_by(InterviewSession.completed_at.desc())
    )
    sessions = result.scalars().all()
    return [
        {
            "session_id": s.id,
            "candidate_id": s.candidate_id,
            "name": s.name,
            "job_title": s.job_title,
            "skills": s.skills,
            "score": round(s.raw_score or 0, 2),
            "total": s.max_score or 0,
            "percentage": round((s.raw_score or 0) / (s.max_score or 1) * 100, 1),
            "completed_at": s.completed_at.isoformat() if s.completed_at else None,
        }
        for s in sessions
    ]
