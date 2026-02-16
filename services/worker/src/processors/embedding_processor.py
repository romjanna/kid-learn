"""Embedding processor — generates vector embeddings for lessons and questions."""

import json
import logging
from typing import Optional

from openai import OpenAI
from tenacity import retry, stop_after_attempt, wait_exponential

from src.config import settings
from src.db.connection import get_connection, release_connection

logger = logging.getLogger(__name__)

MODEL = "text-embedding-3-small"


def get_client() -> Optional[OpenAI]:
    if not settings.openai_api_key:
        logger.warning("OPENAI_API_KEY not set, skipping embeddings")
        return None
    return OpenAI(api_key=settings.openai_api_key)


@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
def generate_embedding(client: OpenAI, text: str) -> list[float]:
    """Generate embedding vector for a text string."""
    response = client.embeddings.create(input=text, model=MODEL)
    return response.data[0].embedding


def process_lessons():
    """Generate embeddings for lessons that don't have them yet."""
    client = get_client()
    if not client:
        return

    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id, title, content FROM lessons WHERE embedding IS NULL LIMIT 50"
            )
            rows = cur.fetchall()

            if not rows:
                logger.info("No lessons need embeddings")
                return

            logger.info(f"Generating embeddings for {len(rows)} lessons")

            for lesson_id, title, content in rows:
                text = f"{title}\n\n{content[:2000]}"
                try:
                    embedding = generate_embedding(client, text)
                    cur.execute(
                        "UPDATE lessons SET embedding = %s WHERE id = %s",
                        (json.dumps(embedding), lesson_id),
                    )
                    conn.commit()
                    logger.info(f"Embedded lesson: {title}")
                except Exception:
                    conn.rollback()
                    logger.exception(f"Failed to embed lesson: {title}")

    finally:
        release_connection(conn)


def process_questions():
    """Generate embeddings for quiz questions that don't have them yet."""
    client = get_client()
    if not client:
        return

    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id, question_text FROM quiz_questions WHERE embedding IS NULL LIMIT 100"
            )
            rows = cur.fetchall()

            if not rows:
                logger.info("No questions need embeddings")
                return

            logger.info(f"Generating embeddings for {len(rows)} questions")

            for question_id, question_text in rows:
                try:
                    embedding = generate_embedding(client, question_text)
                    cur.execute(
                        "UPDATE quiz_questions SET embedding = %s WHERE id = %s",
                        (json.dumps(embedding), question_id),
                    )
                    conn.commit()
                    logger.debug(f"Embedded question: {question_text[:50]}")
                except Exception:
                    conn.rollback()
                    logger.exception(f"Failed to embed question: {question_text[:50]}")

    finally:
        release_connection(conn)


def generate_all_embeddings():
    """Generate embeddings for all content that needs them."""
    logger.info("Starting embedding generation")
    process_lessons()
    process_questions()
    logger.info("Embedding generation complete")
