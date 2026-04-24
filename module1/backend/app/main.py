from __future__ import annotations

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from .parser import extract_text_from_upload, parse_resume

# This API is intentionally thin: file validation and HTTP concerns stay here, parsing stays in parser.py.
app = FastAPI(title="Resume Parser API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def healthcheck() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/parse-resume")
async def parse_resume_endpoint(file: UploadFile = File(...)) -> dict:
    file_name = (file.filename or "").lower()
    if not file_name.endswith((".pdf", ".docx")):
        raise HTTPException(status_code=400, detail="Only PDF and DOCX files are supported.")

    try:
        content = await file.read()
        # First convert the uploaded binary file into plain text.
        raw_text = extract_text_from_upload(file_name, content)
        # Then run the heuristic resume parser over that extracted text.
        parsed = parse_resume(raw_text)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    except Exception as error:
        raise HTTPException(status_code=500, detail="Failed to parse the uploaded resume.") from error

    payload = parsed.to_dict()
    payload["rawText"] = raw_text
    payload["cvFileName"] = file.filename or "resume"
    return payload
