from __future__ import annotations
from uuid import UUID
from datetime import datetime
from typing import Optional, Any
from pydantic import BaseModel, Field

from app.models import SessionStatus, InterviewLabel


# ── Session schemas ──────────────────────────────────────────────────────────

class SessionCreate(BaseModel):
    candidate_id: str = Field(..., min_length=1, max_length=255)
    interviewer_id: str = Field(..., min_length=1, max_length=255)
    job_role: Optional[str] = Field(None, max_length=255)


class SessionUpdate(BaseModel):
    status: Optional[SessionStatus] = None


class SessionResponse(BaseModel):
    id: UUID
    candidate_id: str
    interviewer_id: str
    job_role: Optional[str]
    livekit_room_name: Optional[str]
    livekit_room_url: Optional[str]
    status: SessionStatus
    started_at: Optional[datetime]
    ended_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ── Token / room schemas ─────────────────────────────────────────────────────

class MeetingTokenRequest(BaseModel):
    session_id: UUID
    participant_role: str = Field(..., pattern="^(interviewer|candidate)$")
    participant_name: str = Field(..., min_length=1, max_length=100)


class MeetingTokenResponse(BaseModel):
    token: str
    room_url: str
    expires_at: datetime


# ── Emotion schemas ───────────────────────────────────────────────────────────

class FrameUpload(BaseModel):
    """Base64-encoded JPEG frame sent from the frontend every 3 seconds."""
    frame_b64: str = Field(..., description="Base64-encoded JPEG image data")
    frame_index: int = Field(..., ge=0)
    captured_at: Optional[datetime] = None


class RawEmotions(BaseModel):
    angry: float
    disgust: float
    fear: float
    happy: float
    sad: float
    surprise: float
    neutral: float


class EmotionReadingResponse(BaseModel):
    id: UUID
    session_id: UUID
    captured_at: datetime
    frame_index: int
    raw_emotions: dict[str, Any]
    dominant_raw_emotion: str
    interview_label: InterviewLabel
    confidence_score: float

    model_config = {"from_attributes": True}


# ── Report schema (Module 5 contract) ────────────────────────────────────────

class EmotionTotals(BaseModel):
    confident: int
    neutral: int
    stressed: int
    distracted: int


class EmotionPercentages(BaseModel):
    confident: float
    neutral: float
    stressed: float
    distracted: float


class EmotionTimeline(BaseModel):
    """Ordered list of (frame_index, label, confidence, timestamp) for trend charts."""
    frame_index: int
    label: InterviewLabel
    confidence: float
    captured_at: datetime


class SessionReport(BaseModel):
    """
    JSON contract exposed to Module 5.
    Module 5 should call GET /sessions/{session_id}/report to obtain this object.
    """
    session_id: UUID
    candidate_id: str
    interviewer_id: str
    job_role: Optional[str]
    status: SessionStatus
    started_at: Optional[datetime]
    ended_at: Optional[datetime]
    total_frames_analyzed: int
    emotion_totals: EmotionTotals
    emotion_percentages: EmotionPercentages
    dominant_label: InterviewLabel
    average_confidence: float
    timeline: list[EmotionTimeline]
