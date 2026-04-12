"""
Report route — aggregates session emotion data for Module 5.

GET /sessions/{session_id}/report  →  SessionReport
"""
from uuid import UUID
from collections import Counter

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models import InterviewSession, EmotionReading, InterviewLabel
from app.schemas import (
    SessionReport,
    EmotionTotals,
    EmotionPercentages,
    EmotionTimeline,
)

router = APIRouter(prefix="/sessions", tags=["Report"])


@router.get("/{session_id}/report", response_model=SessionReport)
async def get_session_report(session_id: UUID, db: AsyncSession = Depends(get_db)):
    """
    Aggregated emotion report for a completed interview session.

    This endpoint is the primary data contract between Module 3 and Module 5.
    Module 5 calls this after the session ends to feed into the final
    candidate evaluation score.
    """
    # Load session
    s_result = await db.execute(
        select(InterviewSession).where(InterviewSession.id == session_id)
    )
    session = s_result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail=f"Session {session_id} not found.")

    # Load all emotion readings ordered chronologically
    e_result = await db.execute(
        select(EmotionReading)
        .where(EmotionReading.session_id == session_id)
        .order_by(EmotionReading.frame_index)
    )
    readings = e_result.scalars().all()

    total = len(readings)

    if total == 0:
        # Return a zeroed report if no frames were analyzed
        zero_totals = EmotionTotals(confident=0, neutral=0, stressed=0, distracted=0)
        zero_pct = EmotionPercentages(confident=0.0, neutral=0.0, stressed=0.0, distracted=0.0)
        return SessionReport(
            session_id=session.id,
            candidate_id=session.candidate_id,
            interviewer_id=session.interviewer_id,
            job_role=session.job_role,
            status=session.status,
            started_at=session.started_at,
            ended_at=session.ended_at,
            total_frames_analyzed=0,
            emotion_totals=zero_totals,
            emotion_percentages=zero_pct,
            dominant_label=InterviewLabel.NEUTRAL,
            average_confidence=0.0,
            timeline=[],
        )

    # Aggregate counts
    label_counts: Counter = Counter(r.interview_label for r in readings)
    avg_confidence = sum(r.confidence_score for r in readings) / total

    totals = EmotionTotals(
        confident=label_counts.get(InterviewLabel.CONFIDENT, 0),
        neutral=label_counts.get(InterviewLabel.NEUTRAL, 0),
        stressed=label_counts.get(InterviewLabel.STRESSED, 0),
        distracted=label_counts.get(InterviewLabel.DISTRACTED, 0),
    )

    percentages = EmotionPercentages(
        confident=round(totals.confident / total * 100, 2),
        neutral=round(totals.neutral / total * 100, 2),
        stressed=round(totals.stressed / total * 100, 2),
        distracted=round(totals.distracted / total * 100, 2),
    )

    dominant_label = label_counts.most_common(1)[0][0]

    timeline = [
        EmotionTimeline(
            frame_index=r.frame_index,
            label=r.interview_label,
            confidence=r.confidence_score,
            captured_at=r.captured_at,
        )
        for r in readings
    ]

    return SessionReport(
        session_id=session.id,
        candidate_id=session.candidate_id,
        interviewer_id=session.interviewer_id,
        job_role=session.job_role,
        status=session.status,
        started_at=session.started_at,
        ended_at=session.ended_at,
        total_frames_analyzed=total,
        emotion_totals=totals,
        emotion_percentages=percentages,
        dominant_label=dominant_label,
        average_confidence=round(avg_confidence, 4),
        timeline=timeline,
    )
