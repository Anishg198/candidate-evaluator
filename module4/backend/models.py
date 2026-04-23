import uuid
from datetime import datetime
from sqlalchemy import String, Float, Integer, DateTime, JSON, ForeignKey, Text, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database import Base
import enum


class Difficulty(str, enum.Enum):
    easy = "easy"
    medium = "medium"
    hard = "hard"


class Problem(Base):
    __tablename__ = "m4_problems"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    title: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    difficulty: Mapped[str] = mapped_column(SAEnum(Difficulty), nullable=False)
    examples: Mapped[list] = mapped_column(JSON, default=list)
    constraints: Mapped[str] = mapped_column(String, default="")
    visible_test_cases: Mapped[list] = mapped_column(JSON, default=list)
    hidden_test_cases: Mapped[list] = mapped_column(JSON, default=list)
    time_limit_seconds: Mapped[int] = mapped_column(Integer, default=5)
    memory_limit_mb: Mapped[int] = mapped_column(Integer, default=128)
    starter_code: Mapped[dict] = mapped_column(JSON, default=dict)
    wrappers: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    submissions: Mapped[list["CodingSubmission"]] = relationship("CodingSubmission", back_populates="problem")


class CodingSession(Base):
    """Tracks which 3 problems were randomly assigned to a candidate."""
    __tablename__ = "m4_coding_sessions"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    candidate_id: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    name: Mapped[str | None] = mapped_column(String, nullable=True, default="")
    email: Mapped[str | None] = mapped_column(String, nullable=True, default="")
    problem_ids: Mapped[list] = mapped_column(JSON, default=list)   # 3 randomly chosen
    required_count: Mapped[int] = mapped_column(Integer, default=2) # must attempt N
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class CodingSubmission(Base):
    __tablename__ = "m4_coding_submissions"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    candidate_id: Mapped[str] = mapped_column(String, nullable=False, index=True)
    problem_id: Mapped[str] = mapped_column(String, ForeignKey("m4_problems.id"), nullable=False)
    language_id: Mapped[int] = mapped_column(Integer, nullable=False)
    language_name: Mapped[str] = mapped_column(String, nullable=False)
    source_code: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String, default="pending")
    test_results: Mapped[list] = mapped_column(JSON, default=list)
    total_tests: Mapped[int] = mapped_column(Integer, default=0)
    passed_tests: Mapped[int] = mapped_column(Integer, default=0)
    time_taken_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    attempt_number: Mapped[int] = mapped_column(Integer, default=1)
    code_quality: Mapped[dict] = mapped_column(JSON, default=dict)
    submitted_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    problem: Mapped["Problem"] = relationship("Problem", back_populates="submissions")
