import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import create_all_tables
from routers.tests import router as tests_router
from routers.results import router as results_router
from routers.resume import router as resume_router
from routers.admin import router as admin_router
from services.generator import load_model
from services.grader import load_sentence_model

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

MODEL_CACHE_DIR = os.getenv("MODEL_CACHE_DIR", None)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Creating database tables...")
    await create_all_tables()
    logger.info("Loading ML models (this may take a moment on first run)...")
    load_model(MODEL_CACHE_DIR)
    load_sentence_model(MODEL_CACHE_DIR)
    logger.info("Module 2 ready.")
    yield
    logger.info("Module 2 shutting down.")


app = FastAPI(
    title="HCL Module 2 — Written Test",
    version="1.0.0",
    description="Dynamic written test generation and grading using flan-t5-base and sentence-transformers.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(tests_router)
app.include_router(results_router)
app.include_router(resume_router)
app.include_router(admin_router)


@app.get("/health")
async def health():
    return {"status": "ok", "module": "module2"}
