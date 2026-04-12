import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Text, Float, DateTime, ForeignKey, Integer, JSON, Enum as SAEnum
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import enum

from app.database import Base


class SessionStatus(str, enum.Enum):
    PENDING = "pending"
    ACTIVE = "active"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class InterviewLabel(str, enum.Enum):
    CONFIDENT = "confident"
    NEUTRAL = "neutral"
    STRESSED = "stressed"
    DISTRACTED = "distracted"


class InterviewSession(Base):
    __tablename__ = "interview_sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    candidate_id = Column(String(255), nullable=False, index=True)
    interviewer_id = Column(String(255), nullable=False, index=True)
    job_role = Column(String(255), nullable=True)

    # LiveKit room details
    livekit_room_name = Column(String(255), nullable=True, unique=True)
    livekit_room_url = Column(Text, nullable=True)

    status = Column(SAEnum(SessionStatus), default=SessionStatus.PENDING, nullable=False)

    started_at = Column(DateTime(timezone=True), nullable=True)
    ended_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    emotion_readings = relationship(
        "EmotionReading", back_populates="session", cascade="all, delete-orphan"
    )


class EmotionReading(Base):
    __tablename__ = "emotion_readings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(
        UUID(as_uuid=True), ForeignKey("interview_sessions.id", ondelete="CASCADE"), nullable=False, index=True
    )

    # Timestamp of the captured frame
    captured_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    frame_index = Column(Integer, nullable=False, default=0)

    # Raw DeepFace output (7 emotions with float scores 0-100)
    raw_emotions = Column(JSON, nullable=False)
    dominant_raw_emotion = Column(String(50), nullable=False)

    # Mapped interview label
    interview_label = Column(SAEnum(InterviewLabel), nullable=False)
    confidence_score = Column(Float, nullable=False)  # 0.0 - 1.0

    # Relationship
    session = relationship("InterviewSession", back_populates="emotion_readings")
