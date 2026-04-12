"""
Session lifecycle routes.

POST   /sessions                          – create session + LiveKit room
GET    /sessions/{session_id}             – fetch session details
PATCH  /sessions/{session_id}            – update status (active / completed)
POST   /sessions/{session_id}/token      – issue LiveKit meeting token
DELETE /sessions/{session_id}            – cancel & cleanup
"""
import logging
from uuid import UUID
from datetime import datetime, timezone, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models import InterviewSession, SessionStatus
from app.schemas import (
    SessionCreate,
    SessionUpdate,
    SessionResponse,
    MeetingTokenRequest,
    MeetingTokenResponse,
)
from app.services import livekit_service

router = APIRouter(prefix="/sessions", tags=["Sessions"])
logger = logging.getLogger(__name__)


@router.post("", response_model=SessionResponse, status_code=status.HTTP_201_CREATED)
async def create_session(payload: SessionCreate, db: AsyncSession = Depends(get_db)):
    """
    Create a new interview session and provision a LiveKit room.
    """
    session = InterviewSession(
        candidate_id=payload.candidate_id,
        interviewer_id=payload.interviewer_id,
        job_role=payload.job_role,
        status=SessionStatus.PENDING,
    )
    db.add(session)
    await db.flush()  # get the UUID before calling LiveKit

    try:
        room = await livekit_service.create_room(str(session.id))
        session.livekit_room_name = room["name"]
        session.livekit_room_url = room["url"]
    except Exception as exc:
        logger.error("Failed to create LiveKit room: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Could not provision video room. Is the LiveKit server running?",
        )

    await db.commit()
    await db.refresh(session)
    return session


@router.get("/{session_id}", response_model=SessionResponse)
async def get_session(session_id: UUID, db: AsyncSession = Depends(get_db)):
    session = await _get_or_404(session_id, db)
    return session


@router.patch("/{session_id}", response_model=SessionResponse)
async def update_session(
    session_id: UUID, payload: SessionUpdate, db: AsyncSession = Depends(get_db)
):
    session = await _get_or_404(session_id, db)

    if payload.status:
        session.status = payload.status
        if payload.status == SessionStatus.ACTIVE and session.started_at is None:
            session.started_at = datetime.now(timezone.utc)
        elif payload.status == SessionStatus.COMPLETED and session.ended_at is None:
            session.ended_at = datetime.now(timezone.utc)

    await db.commit()
    await db.refresh(session)
    return session


@router.post("/{session_id}/token", response_model=MeetingTokenResponse)
async def issue_meeting_token(
    session_id: UUID, payload: MeetingTokenRequest, db: AsyncSession = Depends(get_db)
):
    """
    Issue a signed LiveKit JWT for a participant.
    Interviewers receive admin tokens; candidates receive standard tokens.
    """
    session = await _get_or_404(session_id, db)
    if session.status == SessionStatus.CANCELLED:
        raise HTTPException(status_code=400, detail="Session has been cancelled.")
    if not session.livekit_room_name:
        raise HTTPException(status_code=400, detail="Room not yet provisioned.")

    is_owner = payload.participant_role == "interviewer"
    try:
        token = await livekit_service.create_meeting_token(
            room_name=session.livekit_room_name,
            participant_name=payload.participant_name,
            is_owner=is_owner,
        )
    except Exception as exc:
        logger.error("Failed to create meeting token: %s", exc)
        raise HTTPException(status_code=502, detail="Could not create meeting token.")

    expires_at = datetime.now(timezone.utc) + timedelta(hours=2)
    return MeetingTokenResponse(
        token=token,
        room_url=session.livekit_room_url,
        expires_at=expires_at,
    )


@router.delete("/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
async def cancel_session(session_id: UUID, db: AsyncSession = Depends(get_db)):
    session = await _get_or_404(session_id, db)
    session.status = SessionStatus.CANCELLED
    session.ended_at = datetime.now(timezone.utc)

    if session.livekit_room_name:
        try:
            await livekit_service.delete_room(session.livekit_room_name)
        except Exception as exc:
            logger.warning("Could not delete LiveKit room %s: %s", session.livekit_room_name, exc)

    await db.commit()


# ── helpers ───────────────────────────────────────────────────────────────────

async def _get_or_404(session_id: UUID, db: AsyncSession) -> InterviewSession:
    result = await db.execute(
        select(InterviewSession).where(InterviewSession.id == session_id)
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail=f"Session {session_id} not found.")
    return session
