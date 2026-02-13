"""Embedding processor — generates vector embeddings for lessons and questions.

This is a placeholder for Phase 5 (AI Features). It will:
1. Call OpenAI text-embedding-ada-002 API
2. Store embeddings in the vector(1536) columns
3. Enable semantic search via pgvector cosine similarity
"""

import logging

logger = logging.getLogger(__name__)


async def generate_embeddings_for_new_content():
    """Generate embeddings for lessons/questions that don't have them yet."""
    logger.info("Embedding processor: not yet implemented (Phase 5)")
