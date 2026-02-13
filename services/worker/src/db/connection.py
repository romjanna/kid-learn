import logging

import psycopg2
from psycopg2.pool import ThreadedConnectionPool

from src.config import settings

logger = logging.getLogger(__name__)

_pool = None


def get_pool() -> ThreadedConnectionPool:
    global _pool
    if _pool is None:
        _pool = ThreadedConnectionPool(
            minconn=1,
            maxconn=5,
            dsn=settings.database_url,
        )
        logger.info("Database connection pool created")
    return _pool


def get_connection():
    pool = get_pool()
    return pool.getconn()


def release_connection(conn):
    pool = get_pool()
    pool.putconn(conn)


def close_pool():
    global _pool
    if _pool:
        _pool.closeall()
        _pool = None
        logger.info("Database connection pool closed")
