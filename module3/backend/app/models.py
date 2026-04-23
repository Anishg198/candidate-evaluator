import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, DateTime, Integer, JSON, Boolean
from app.database import Base


class InterviewSession(Base):
    __tablename__ = "m3_interview_sessions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    candidate_id = Column(String, nullable=False, index=True)
    name = Column(String, default="")
    job_title = Column(String, default="")
    skills = Column(JSON, default=list)
    questions = Column(JSON, default=list)   # [{q, ideal, keywords, skill, category}]
    answers = Column(JSON, default=list)     # [{question, answer, score, max_score}]
    current_q = Column(Integer, default=0)
    raw_score = Column(Float, nullable=True)
    max_score = Column(Float, nullable=True)
    completed = Column(Boolean, default=False)
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
