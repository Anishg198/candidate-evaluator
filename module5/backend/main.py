import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import create_all_tables
from routers.reports import router as reports_router
from routers.jobs import router as jobs_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Creating database tables...")
    await create_all_tables()
    logger.info("Module 5 ready.")
    yield
    logger.info("Module 5 shutting down.")


app = FastAPI(
    title="HCL Module 5 — Final Evaluation Report",
    version="1.0.0",
    description="Aggregates results from CV scanning, written test, and coding test to produce comprehensive candidate reports.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(reports_router)
app.include_router(jobs_router)


@app.get("/health")
async def health():
    return {"status": "ok", "module": "module5"}
