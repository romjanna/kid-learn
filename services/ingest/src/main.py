import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException

from src.config import settings
from src.models import FetchResult, LearningEvent, SeedResult
from src.publishers.redis_pub import RedisPublisher
from src.sources.opentdb import fetch_and_store_quizzes
from src.sources.seed import load_seed_data

logging.basicConfig(
    level=settings.log_level,
    format="%(asctime)s %(name)s %(levelname)s %(message)s",
)
logger = logging.getLogger(__name__)

publisher = RedisPublisher()


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Ingest service starting")
    yield
    await publisher.close()
    logger.info("Ingest service stopped")


app = FastAPI(
    title="Kid Learn - Ingest Service",
    description="Data ingestion: seed data loading and Open Trivia DB fetching",
    version="0.1.0",
    lifespan=lifespan,
)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "ingest"}


@app.post("/api/seed", response_model=SeedResult)
async def seed_data():
    """Load seed data (lessons, quizzes) from JSON files into Postgres."""
    try:
        result = load_seed_data()
        return result
    except Exception as e:
        logger.exception("Seed failed")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/fetch-quizzes", response_model=FetchResult)
async def fetch_quizzes(amount_per_category: int = 5):
    """Fetch quizzes from Open Trivia Database API."""
    try:
        result = await fetch_and_store_quizzes(amount_per_category)
        return result
    except Exception as e:
        logger.exception("Fetch quizzes failed")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/events")
async def publish_event(event: LearningEvent):
    """Publish a learning event to Redis Pub/Sub."""
    try:
        await publisher.publish("learning-events", event.model_dump())
        return {"status": "published", "event_id": str(event.id)}
    except Exception as e:
        logger.exception("Event publish failed")
        raise HTTPException(status_code=500, detail=str(e))
