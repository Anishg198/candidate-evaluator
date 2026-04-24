import asyncio
import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from pydantic import BaseModel

from database import get_db
from models import Problem, CodingSubmission
from services.judge0 import submit_and_wait, get_language_name
from services.quality import analyze

router = APIRouter(tags=["problems"])

SUPPORTED_LANGUAGES = {71, 63, 62, 54}


class SubmitRequest(BaseModel):
    candidate_id: str
    language_id: int
    source_code: str


class RunRequest(BaseModel):
    language_id: int
    source_code: str


class CustomRunRequest(BaseModel):
    language_id: int
    source_code: str
    stdin: str = ""


@router.get("/problems")
async def list_problems(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Problem).order_by(Problem.created_at))
    problems = result.scalars().all()
    return [
        {
            "id": p.id,
            "title": p.title,
            "difficulty": p.difficulty,
            "time_limit_seconds": p.time_limit_seconds,
            "memory_limit_mb": p.memory_limit_mb,
            "visible_test_cases_count": len(p.visible_test_cases),
            "total_test_cases": len(p.visible_test_cases) + len(p.hidden_test_cases),
        }
        for p in problems
    ]


@router.get("/problems/{problem_id}")
async def get_problem(problem_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Problem).where(Problem.id == problem_id))
    p = result.scalar_one_or_none()
    if not p:
        raise HTTPException(404, "Problem not found")
    return {
        "id": p.id,
        "title": p.title,
        "description": p.description,
        "difficulty": p.difficulty,
        "examples": p.examples,
        "constraints": p.constraints,
        "visible_test_cases": p.visible_test_cases,
        "time_limit_seconds": p.time_limit_seconds,
        "memory_limit_mb": p.memory_limit_mb,
        "starter_code": p.starter_code or {},
    }


@router.post("/problems/{problem_id}/run")
async def run_code(problem_id: str, req: RunRequest, db: AsyncSession = Depends(get_db)):
    """Run code against visible test cases only — no DB save."""
    if req.language_id not in SUPPORTED_LANGUAGES:
        raise HTTPException(400, f"Language {req.language_id} not supported.")

    result = await db.execute(select(Problem).where(Problem.id == problem_id))
    problem = result.scalar_one_or_none()
    if not problem:
        raise HTTPException(404, "Problem not found")

    wrapper = (problem.wrappers or {}).get(str(req.language_id), "")
    full_code = req.source_code + wrapper

    async def run_one(tc: dict) -> dict:
        judge_result = await submit_and_wait(
            source_code=full_code,
            language_id=req.language_id,
            stdin=tc.get("input", ""),
            expected_output=tc.get("expected_output", ""),
            time_limit=problem.time_limit_seconds,
            memory_limit=problem.memory_limit_mb,
        )
        actual = judge_result["stdout"].strip()
        expected = tc.get("expected_output", "").strip()
        is_passed = actual == expected and judge_result["status_id"] not in (5, 6, 11)
        return {
            "test_case_id": tc.get("id"),
            "hidden": False,
            "passed": is_passed,
            "status": judge_result["status"],
            "time_ms": judge_result["time_ms"],
            "memory_kb": judge_result["memory_kb"],
            "input": tc.get("input", ""),
            "expected_output": expected,
            "actual_output": actual,
            "compile_output": judge_result.get("compile_output", ""),
            "stderr": judge_result.get("stderr", ""),
        }

    raw_results = await asyncio.gather(*[run_one(tc) for tc in problem.visible_test_cases])
    test_results = list(raw_results)
    passed = sum(1 for e in test_results if e["passed"])
    total = len(test_results)

    return {
        "status": "Accepted" if passed == total else ("Partial" if passed > 0 else "Failed"),
        "passed_tests": passed,
        "total_tests": total,
        "score": round((passed / total * 100) if total > 0 else 0, 1),
        "test_results": test_results,
        "dry_run": True,
    }


@router.post("/problems/{problem_id}/run-custom")
async def run_custom(problem_id: str, req: CustomRunRequest, db: AsyncSession = Depends(get_db)):
    """Run code against user-supplied stdin — no test case comparison."""
    if req.language_id not in SUPPORTED_LANGUAGES:
        raise HTTPException(400, f"Language {req.language_id} not supported.")
    result = await db.execute(select(Problem).where(Problem.id == problem_id))
    problem = result.scalar_one_or_none()
    if not problem:
        raise HTTPException(404, "Problem not found")
    wrapper = (problem.wrappers or {}).get(str(req.language_id), "")
    full_code = req.source_code + wrapper
    judge_result = await submit_and_wait(
        source_code=full_code,
        language_id=req.language_id,
        stdin=req.stdin,
        expected_output="",
        time_limit=problem.time_limit_seconds,
        memory_limit=problem.memory_limit_mb,
    )
    return {
        "status": judge_result["status"],
        "stdout": judge_result["stdout"],
        "stderr": judge_result["stderr"],
        "compile_output": judge_result.get("compile_output", ""),
        "time_ms": judge_result["time_ms"],
    }


@router.post("/problems/{problem_id}/submit")
async def submit_code(problem_id: str, req: SubmitRequest, db: AsyncSession = Depends(get_db)):
    if req.language_id not in SUPPORTED_LANGUAGES:
        raise HTTPException(400, f"Language {req.language_id} not supported. Use: {SUPPORTED_LANGUAGES}")

    result = await db.execute(select(Problem).where(Problem.id == problem_id))
    problem = result.scalar_one_or_none()
    if not problem:
        raise HTTPException(404, "Problem not found")

    # Determine attempt number
    prev = await db.execute(
        select(func.count()).where(
            CodingSubmission.candidate_id == req.candidate_id,
            CodingSubmission.problem_id == problem_id,
        )
    )
    attempt_num = (prev.scalar() or 0) + 1

    # Run against all test cases (visible + hidden)
    all_cases = [
        {"hidden": False, **tc} for tc in problem.visible_test_cases
    ] + [
        {"hidden": True, **tc} for tc in problem.hidden_test_cases
    ]

    # Append the I/O wrapper (if any) so candidates only write the function
    wrapper = (problem.wrappers or {}).get(str(req.language_id), "")
    full_code = req.source_code + wrapper

    async def run_one(tc: dict) -> dict:
        judge_result = await submit_and_wait(
            source_code=full_code,
            language_id=req.language_id,
            stdin=tc.get("input", ""),
            expected_output=tc.get("expected_output", ""),
            time_limit=problem.time_limit_seconds,
            memory_limit=problem.memory_limit_mb,
        )
        actual = judge_result["stdout"].strip()
        expected = tc.get("expected_output", "").strip()
        is_passed = actual == expected and judge_result["status_id"] not in (5, 6, 11)
        entry = {
            "test_case_id": tc.get("id"),
            "hidden": tc["hidden"],
            "passed": is_passed,
            "status": judge_result["status"],
            "time_ms": judge_result["time_ms"],
            "memory_kb": judge_result["memory_kb"],
        }
        if not tc["hidden"]:
            entry["input"] = tc.get("input", "")
            entry["expected_output"] = expected
            entry["actual_output"] = actual
            if judge_result["compile_output"]:
                entry["compile_output"] = judge_result["compile_output"]
            if judge_result["stderr"]:
                entry["stderr"] = judge_result["stderr"]
        return entry

    raw_results = await asyncio.gather(*[run_one(tc) for tc in all_cases])
    test_results = list(raw_results)
    passed = sum(1 for e in test_results if e["passed"])
    total_time_ms = sum(e["time_ms"] for e in test_results)

    total = len(all_cases)
    score = round((passed / total * 100) if total > 0 else 0, 1)
    overall_status = "Accepted" if passed == total else ("Partial" if passed > 0 else "Failed")

    # Code quality
    quality = analyze(req.source_code, req.language_id)

    submission = CodingSubmission(
        id=str(uuid.uuid4()),
        candidate_id=req.candidate_id,
        problem_id=problem_id,
        language_id=req.language_id,
        language_name=get_language_name(req.language_id),
        source_code=req.source_code,
        status=overall_status,
        test_results=test_results,
        total_tests=total,
        passed_tests=passed,
        time_taken_ms=total_time_ms,
        attempt_number=attempt_num,
        code_quality=quality,
        submitted_at=datetime.utcnow(),
    )
    db.add(submission)
    await db.commit()

    return {
        "submission_id": submission.id,
        "status": overall_status,
        "passed_tests": passed,
        "total_tests": total,
        "score": score,
        "time_taken_ms": total_time_ms,
        "attempt_number": attempt_num,
        "language": get_language_name(req.language_id),
        "code_quality": quality,
        "test_results": test_results,
    }
