import asyncio
import logging
import signal

from src.config import settings
from src.consumers.redis_sub import RedisConsumer
from src.db.connection import close_pool
from src.processors.event_processor import process_event

logging.basicConfig(
    level=settings.log_level,
    format="%(asctime)s %(name)s %(levelname)s %(message)s",
)
logger = logging.getLogger(__name__)

shutdown = False


def handle_signal(sig, frame):
    global shutdown
    logger.info(f"Received signal {sig}, shutting down gracefully...")
    shutdown = True


async def run():
    consumer = RedisConsumer()
    await consumer.subscribe(settings.channel)

    logger.info(f"Worker listening on channel: {settings.channel}")

    try:
        async for event in consumer.listen():
            if shutdown:
                break
            try:
                process_event(event)
            except Exception:
                logger.exception(f"Failed to process event: {event.get('event_type', 'unknown')}")
    finally:
        await consumer.close()
        close_pool()
        logger.info("Worker stopped")


def main():
    signal.signal(signal.SIGINT, handle_signal)
    signal.signal(signal.SIGTERM, handle_signal)

    logger.info("Worker service starting")
    asyncio.run(run())


if __name__ == "__main__":
    main()
