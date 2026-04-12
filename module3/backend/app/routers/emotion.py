"""
Emotion analysis routes.

POST /sessions/{session_id}/frames        – upload a frame for analysis
GET  /sessions/{session_id}/emotions      – live emotion feed (last N readings)
"""
import asyncio
import logging
from concurrent.futures import ThreadPoolExecutor
from uuid import UUID
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from app.database import get_db
from app.models import InterviewSession, EmotionReading, SessionStatus, InterviewLabel
from app.schemas import FrameUpload, EmotionReadingResponse
from app.services import emotion_service

router = APIRouter(prefix="/sessions", tags=["Emotions"])
logger = logging.getLogger(__name__)

def _thread_init():
    """Each worker thread needs its own high recursion limit for DeepFace + TensorFlow."""
    import sys
    sys.setrecursionlimit(1000000)

# DeepFace is CPU-bound — run in a thread pool so it doesn't block the event loop
_executor = ThreadPoolExecutor(max_workers=2, initializer=_thread_init)


@router.post("/{session_id}/frames", response_model=EmotionReadingResponse, status_code=201)
async def upload_frame(
    session_id: UUID,
    payload: FrameUpload,
    db: AsyncSession = Depends(get_db),
):
    """
    Receive a base64-encoded video frame, run DeepFace emotion analysis
    in a thread pool (non-blocking), persist the result, and return it.
    Called every 3 seconds by the candidate's browser during an active interview.
    """
    session = await _get_active_session_or_404(session_id, db)

    loop = asyncio.get_event_loop()
    try:
        analysis = await loop.run_in_executor(
            _executor, emotion_service.analyze_frame, payload.frame_b64
        )
    except Exception as exc:
        logger.error("Emotion analysis error for session %s: %s", session_id, exc)
        raise HTTPException(status_code=500, detail="Emotion analysis failed.")

    captured_at = payload.captured_at or datetime.now(timezone.utc)

    reading = EmotionReading(
        session_id=session.id,
        captured_at=captured_at,
        frame_index=payload.frame_index,
        raw_emotions=analysis["raw_emotions"],
        dominant_raw_emotion=analysis["dominant_raw_emotion"],
        interview_label=InterviewLabel(analysis["interview_label"]),
        confidence_score=analysis["confidence_score"],
    )
    db.add(reading)
    await db.commit()
    await db.refresh(reading)
    return reading


@router.get("/{session_id}/emotions", response_model=list[EmotionReadingResponse])
async def get_live_emotions(
    session_id: UUID,
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
):
    """
    Return the most recent `limit` emotion readings for a session.
    The interviewer's dashboard polls this endpoint every 3 seconds.
    """
    result = await db.execute(
        select(InterviewSession).where(InterviewSession.id == session_id)
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail=f"Session {session_id} not found.")

    result = await db.execute(
        select(EmotionReading)
        .where(EmotionReading.session_id == session_id)
        .order_by(desc(EmotionReading.captured_at))
        .limit(min(limit, 100))
    )
    readings = result.scalars().all()
    return list(reversed(readings))


async def _get_active_session_or_404(session_id: UUID, db: AsyncSession) -> InterviewSession:
    result = await db.execute(
        select(InterviewSession).where(InterviewSession.id == session_id)
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail=f"Session {session_id} not found.")
    if session.status not in (SessionStatus.PENDING, SessionStatus.ACTIVE):
        raise HTTPException(
            status_code=409,
            detail=f"Session is {session.status.value}. Only active sessions accept frames.",
        )
    return session
