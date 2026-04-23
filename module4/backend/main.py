import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import create_all_tables
from routers.problems import router as problems_router
from routers.results import router as results_router
from routers.session import router as session_router
from routers.admin import router as admin_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Creating database tables...")
    await create_all_tables()
    # Auto-seed problems if table is empty
    try:
        from seed import seed
        await seed()
    except Exception as e:
        logger.warning(f"Seeding skipped: {e}")
    logger.info("Module 4 ready.")
    yield
    logger.info("Module 4 shutting down.")


app = FastAPI(
    title="HCL Module 4 — Coding Test",
    version="1.0.0",
    description="Online coding test with Judge0 CE self-hosted execution engine.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(problems_router)
app.include_router(results_router)
app.include_router(session_router)
app.include_router(admin_router)


@app.get("/health")
async def health():
    return {"status": "ok", "module": "module4"}
