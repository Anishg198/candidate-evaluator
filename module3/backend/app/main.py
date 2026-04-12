"""
HCL Module 3 — Technical Interview with Facial Expression Analysis
FastAPI application entry point.
"""
import sys
sys.setrecursionlimit(1000000)  # DeepFace + TensorFlow require deep recursion
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.database import init_db
from app.routers import sessions, emotion, report

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s — %(message)s",
)
logger = logging.getLogger(__name__)
settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting up — initialising database tables …")
    await init_db()
    logger.info("Database ready.")
    yield
    logger.info("Shutting down.")


app = FastAPI(
    title=settings.app_name,
    description=(
        "Backend API for Module 3 of the HCL AI-Powered Candidate Evaluation Platform. "
        "Manages WebRTC interview sessions via Daily.co and performs real-time facial "
        "expression analysis using DeepFace."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS — allow the React dev server and production origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(sessions.router)
app.include_router(emotion.router)
app.include_router(report.router)


@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "ok", "service": settings.app_name}
