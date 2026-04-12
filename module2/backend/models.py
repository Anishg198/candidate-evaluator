import uuid
from datetime import datetime
from sqlalchemy import String, Float, Integer, Boolean, DateTime, JSON, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database import Base
import enum


class QuestionType(str, enum.Enum):
    mcq = "mcq"
    short_answer = "short_answer"


class Difficulty(str, enum.Enum):
    easy = "easy"
    medium = "medium"
    hard = "hard"


class Candidate(Base):
    __tablename__ = "m2_candidates"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String, nullable=False)
    email: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    sessions: Mapped[list["TestSession"]] = relationship("TestSession", back_populates="candidate")


class Question(Base):
    __tablename__ = "m2_questions"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    skill: Mapped[str] = mapped_column(String, nullable=False)
    type: Mapped[str] = mapped_column(SAEnum(QuestionType), nullable=False)
    difficulty: Mapped[str] = mapped_column(SAEnum(Difficulty), nullable=False)
    question_text: Mapped[str] = mapped_column(String, nullable=False)
    options: Mapped[dict | None] = mapped_column(JSON, nullable=True)  # {A:.., B:.., C:.., D:..}
    answer_key: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class TestSession(Base):
    __tablename__ = "m2_test_sessions"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    candidate_id: Mapped[str] = mapped_column(String, ForeignKey("m2_candidates.id"), nullable=False)
    skills: Mapped[list] = mapped_column(JSON, nullable=False)
    difficulty: Mapped[str] = mapped_column(String, nullable=False)
    question_ids: Mapped[list] = mapped_column(JSON, nullable=False)
    start_time: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    duration_minutes: Mapped[int] = mapped_column(Integer, default=30)
    submitted_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    raw_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    max_score: Mapped[float | None] = mapped_column(Float, nullable=True)

    candidate: Mapped["Candidate"] = relationship("Candidate", back_populates="sessions")
    answers: Mapped[list["Answer"]] = relationship("Answer", back_populates="session")


class Answer(Base):
    __tablename__ = "m2_answers"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id: Mapped[str] = mapped_column(String, ForeignKey("m2_test_sessions.id"), nullable=False)
    question_id: Mapped[str] = mapped_column(String, ForeignKey("m2_questions.id"), nullable=False)
    candidate_answer: Mapped[str] = mapped_column(String, nullable=False)
    is_correct: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    similarity_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    points_awarded: Mapped[float] = mapped_column(Float, default=0.0)
    max_points: Mapped[float] = mapped_column(Float, default=10.0)

    session: Mapped["TestSession"] = relationship("TestSession", back_populates="answers")
