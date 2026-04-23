import os
import asyncio
import httpx
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional

from database import get_db
from models import FinalReport, Application
from services.aggregator import (
    compute_cv_score,
    compute_final_score,
    get_recommendation,
    build_strengths_concerns,
    generate_summary,
)

router = APIRouter(tags=["reports"])

MODULE2_URL = os.getenv("MODULE2_URL", "http://localhost:8002")
MODULE3_URL = os.getenv("MODULE3_URL", "http://localhost:8003")
MODULE4_URL = os.getenv("MODULE4_URL", "http://localhost:8004")

REC_LABELS = {
    "strong_hire": "Strong Hire",
    "hire": "Hire",
    "maybe": "Maybe — Further Review",
    "review": "Borderline — Review Needed",
    "not_recommended": "Not Recommended",
}


class ReportRequest(BaseModel):
    candidate_id: str
    name: Optional[str] = ""
    email: Optional[str] = ""
    cv_data: Optional[dict] = None
    behavior_score: Optional[float] = None


async def _fetch(url: str) -> dict | None:
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.get(url)
            if r.status_code == 200:
                return r.json()
    except Exception:
        pass
    return None


@router.post("/module5/report")
async def generate_report(req: ReportRequest, db: AsyncSession = Depends(get_db)):
    candidate_id = req.candidate_id

    written_data, interview_data, coding_data = await asyncio.gather(
        _fetch(f"{MODULE2_URL}/module2/result/{candidate_id}"),
        _fetch(f"{MODULE3_URL}/module3/result/{candidate_id}"),
        _fetch(f"{MODULE4_URL}/module4/result/{candidate_id}"),
    )

    cv_data = req.cv_data
    cv_score = compute_cv_score(cv_data)
    written_score = written_data.get("percentage", 0) if written_data else 0.0
    interview_score = interview_data.get("percentage", None) if interview_data else None
    behavior_score = req.behavior_score
    coding_score = coding_data.get("total_score", 0) if coding_data else 0.0

    final_score = compute_final_score(cv_score, written_score, coding_score, interview_score, behavior_score)
    rec_key, rec_label = get_recommendation(final_score)
    strengths, concerns = build_strengths_concerns(cv_data, written_data, interview_data, coding_data, behavior_score)
    summary = generate_summary(req.name or "", final_score, rec_label, strengths, concerns)

    existing = await db.execute(select(FinalReport).where(FinalReport.candidate_id == candidate_id))
    report = existing.scalar_one_or_none()

    if report:
        report.name = req.name or report.name
        report.email = req.email or report.email
        report.cv_score = cv_score
        report.written_score = written_score
        report.interview_score = interview_score
        report.behavior_score = behavior_score
        report.coding_score = coding_score
        report.final_score = final_score
        report.recommendation = rec_key
        report.cv_data = cv_data
        report.written_data = written_data
        report.interview_data = interview_data
        report.coding_data = coding_data
        report.strengths = strengths
        report.concerns = concerns
        report.summary = summary
    else:
        report = FinalReport(
            candidate_id=candidate_id,
            name=req.name or "",
            email=req.email or "",
            cv_score=cv_score,
            written_score=written_score,
            interview_score=interview_score,
            behavior_score=behavior_score,
            coding_score=coding_score,
            final_score=final_score,
            recommendation=rec_key,
            cv_data=cv_data,
            written_data=written_data,
            interview_data=interview_data,
            coding_data=coding_data,
            strengths=strengths,
            concerns=concerns,
            summary=summary,
        )
        db.add(report)

    await db.commit()
    await db.refresh(report)
    return _report_response(report, rec_label)


@router.get("/module5/report/{candidate_id}")
async def get_report(candidate_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(FinalReport).where(FinalReport.candidate_id == candidate_id))
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(404, f"No report found for {candidate_id}")
    return _report_response(report, REC_LABELS.get(report.recommendation, report.recommendation))


@router.get("/module5/admin/reports")
async def list_reports(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(FinalReport).order_by(FinalReport.created_at.desc()))
    reports = result.scalars().all()
    # Fetch application decisions
    cids = [r.candidate_id for r in reports]
    apps_result = await db.execute(select(Application).where(Application.candidate_id.in_(cids)))
    apps = {a.candidate_id: a for a in apps_result.scalars().all()}

    return [
        {
            "candidate_id": r.candidate_id,
            "name": r.name,
            "email": r.email,
            "final_score": r.final_score,
            "recommendation": r.recommendation,
            "recommendation_label": REC_LABELS.get(r.recommendation, r.recommendation),
            "cv_score": r.cv_score,
            "written_score": r.written_score,
            "interview_score": r.interview_score,
            "behavior_score": r.behavior_score,
            "coding_score": r.coding_score,
            "hr_decision": apps[r.candidate_id].hr_decision if r.candidate_id in apps else "pending",
            "created_at": r.created_at.isoformat() if r.created_at else None,
        }
        for r in reports
    ]


def _report_response(r: FinalReport, rec_label: str) -> dict:
    return {
        "candidate_id": r.candidate_id,
        "name": r.name,
        "email": r.email,
        "scores": {
            "cv": r.cv_score,
            "written": r.written_score,
            "interview": r.interview_score,
            "behavior": r.behavior_score,
            "coding": r.coding_score,
            "final": r.final_score,
        },
        "recommendation": r.recommendation,
        "recommendation_label": rec_label,
        "strengths": r.strengths or [],
        "concerns": r.concerns or [],
        "summary": r.summary,
        "written_data": r.written_data,
        "interview_data": r.interview_data,
        "coding_data": r.coding_data,
        "cv_data": r.cv_data,
        "created_at": r.created_at.isoformat() if r.created_at else None,
    }
