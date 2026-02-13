import json
import logging
from typing import AsyncIterator

import redis.asyncio as aioredis

from src.config import settings
from src.consumers.base import Consumer

logger = logging.getLogger(__name__)


class RedisConsumer(Consumer):
    """Consumes events from Redis Pub/Sub channels."""

    def __init__(self):
        self._redis = aioredis.from_url(settings.redis_url)
        self._pubsub = self._redis.pubsub()

    async def subscribe(self, channel: str) -> None:
        await self._pubsub.subscribe(channel)
        logger.info(f"Subscribed to Redis channel: {channel}")

    async def listen(self) -> AsyncIterator[dict]:
        async for message in self._pubsub.listen():
            if message["type"] != "message":
                continue
            try:
                data = json.loads(message["data"])
                yield data
            except json.JSONDecodeError:
                logger.error(f"Invalid JSON: {message['data'][:100]}")

    async def close(self) -> None:
        await self._pubsub.unsubscribe()
        await self._redis.close()
        logger.info("Redis consumer closed")
