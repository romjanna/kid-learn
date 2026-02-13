import json
import logging

import redis.asyncio as aioredis

from src.config import settings
from src.publishers.base import Publisher

logger = logging.getLogger(__name__)


class RedisPublisher(Publisher):
    """Publishes events to Redis Pub/Sub channels."""

    def __init__(self):
        self._redis = aioredis.from_url(settings.redis_url)

    async def publish(self, channel: str, message: dict) -> None:
        payload = json.dumps(message, default=str)
        await self._redis.publish(channel, payload)
        logger.debug(f"Published to {channel}: {payload[:100]}...")

    async def close(self) -> None:
        await self._redis.close()
