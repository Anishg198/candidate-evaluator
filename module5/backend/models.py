import uuid
import random
import string
from datetime import datetime
from sqlalchemy import Column, String, Float, JSON, DateTime, Text, Boolean
from database import Base


def _gen_candidate_id():
    suffix = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
    return f"CAND-{suffix}"


class Job(Base):
    __tablename__ = "m5_jobs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4())[:8].upper())
    title = Column(String, nullable=False)
    company = Column(String, default="HCL Technologies")
    description = Column(Text, default="")
    required_skills = Column(JSON, default=list)
    difficulty = Column(String, default="medium")
    num_questions = Column(String, default="10")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class Application(Base):
    __tablename__ = "m5_applications"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    candidate_id = Column(String, unique=True, nullable=False, default=_gen_candidate_id)
    job_id = Column(String, nullable=False)
    name = Column(String, default="")
    email = Column(String, default="")
    cv_data = Column(JSON, nullable=True)
    merged_skills = Column(JSON, default=list)
    applied_at = Column(DateTime, default=datetime.utcnow)
    hr_decision = Column(String, default="pending")
    hr_note = Column(Text, default="")


class FinalReport(Base):
    __tablename__ = "m5_final_reports"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    candidate_id = Column(String, nullable=False, index=True)
    name = Column(String, default="")
    email = Column(String, default="")

    cv_score = Column(Float, default=0.0)
    written_score = Column(Float, default=0.0)
    interview_score = Column(Float, nullable=True)
    behavior_score = Column(Float, nullable=True)
    coding_score = Column(Float, default=0.0)
    final_score = Column(Float, default=0.0)

    recommendation = Column(String, default="")

    cv_data = Column(JSON, nullable=True)
    written_data = Column(JSON, nullable=True)
    interview_data = Column(JSON, nullable=True)
    coding_data = Column(JSON, nullable=True)

    written_time_seconds = Column(Float, nullable=True)
    interview_time_seconds = Column(Float, nullable=True)
    coding_time_seconds = Column(Float, nullable=True)

    strengths = Column(JSON, default=list)
    concerns = Column(JSON, default=list)
    summary = Column(Text, default="")

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
