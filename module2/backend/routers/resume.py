"""
Resume parsing endpoint.
Accepts PDF or DOCX, extracts text, detects skills and basic candidate info.
"""
import io
import re
import logging
from fastapi import APIRouter, UploadFile, File, HTTPException

logger = logging.getLogger(__name__)
router = APIRouter(tags=["resume"])

# Canonical skill names and the keywords that map to them
SKILL_KEYWORDS: dict[str, list[str]] = {
    "Python":           ["python"],
    "JavaScript":       ["javascript", "js", "node.js", "nodejs", "typescript", "ts", "react", "vue", "angular"],
    "Java":             ["java", "spring", "hibernate", "maven", "gradle"],
    "C++":              ["c++", "cpp"],
    "SQL":              ["sql", "mysql", "postgresql", "postgres", "sqlite", "oracle", "database", "rdbms"],
    "Data Structures":  ["data structures", "linked list", "binary tree", "hash map", "heap", "trie"],
    "Algorithms":       ["algorithms", "dynamic programming", "sorting", "graph algorithms", "recursion", "big-o"],
    "OOP":              ["object oriented", "oop", "design patterns", "solid principles"],
    "OS":               ["operating systems", "linux", "unix", "shell scripting", "bash", "kernel", "multithreading"],
    "Networks":         ["networking", "tcp/ip", "http", "rest api", "restful", "websocket", "dns", "http/s"],
    "Machine Learning": ["machine learning", "ml", "deep learning", "neural network", "scikit-learn", "tensorflow",
                         "pytorch", "nlp", "computer vision", "pandas", "numpy", "data science"],
}


def _extract_text_pdf(content: bytes) -> str:
    try:
        import pdfplumber
        with pdfplumber.open(io.BytesIO(content)) as pdf:
            return "\n".join(page.extract_text() or "" for page in pdf.pages)
    except Exception as e:
        logger.warning(f"PDF extraction failed: {e}")
        return ""


def _extract_text_docx(content: bytes) -> str:
    try:
        from docx import Document
        doc = Document(io.BytesIO(content))
        return "\n".join(p.text for p in doc.paragraphs)
    except Exception as e:
        logger.warning(f"DOCX extraction failed: {e}")
        return ""


def _detect_skills(text: str) -> list[str]:
    lower = text.lower()
    found = []
    for skill, keywords in SKILL_KEYWORDS.items():
        if any(kw in lower for kw in keywords):
            found.append(skill)
    return found


def _detect_name(text: str) -> str:
    """Heuristic: first non-empty line that looks like a name (2-4 words, no @)."""
    for line in text.splitlines():
        line = line.strip()
        if not line or "@" in line or any(c.isdigit() for c in line):
            continue
        words = line.split()
        if 2 <= len(words) <= 4 and all(w[0].isupper() for w in words if w):
            return line
    return ""


def _detect_email(text: str) -> str:
    match = re.search(r"[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}", text)
    return match.group(0) if match else ""


@router.post("/resume/parse")
async def parse_resume(file: UploadFile = File(...)):
    content_type = file.content_type or ""
    filename = file.filename or ""

    if not (
        filename.endswith(".pdf") or filename.endswith(".docx")
        or "pdf" in content_type or "word" in content_type or "openxmlformats" in content_type
    ):
        raise HTTPException(400, "Only PDF and DOCX files are supported.")

    raw = await file.read()
    if len(raw) > 10 * 1024 * 1024:
        raise HTTPException(400, "File too large (max 10 MB).")

    if filename.endswith(".pdf") or "pdf" in content_type:
        text = _extract_text_pdf(raw)
    else:
        text = _extract_text_docx(raw)

    if not text.strip():
        raise HTTPException(422, "Could not extract text from the file.")

    skills = _detect_skills(text)
    name = _detect_name(text)
    email = _detect_email(text)

    return {
        "name": name,
        "email": email,
        "skills": skills,
        "text_preview": text[:300].strip(),
    }
