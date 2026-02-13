import json
import logging
from datetime import datetime
from typing import Optional
from uuid import UUID

from src.db.connection import get_connection, release_connection

logger = logging.getLogger(__name__)


def insert_learning_event(
    event_type: str,
    payload: dict,
    user_id: Optional[str] = None,
    session_id: Optional[str] = None,
    event_id: Optional[str] = None,
    created_at: Optional[str] = None,
) -> str:
    """Insert a raw learning event and return its ID."""
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO learning_events (id, user_id, event_type, payload, session_id, created_at)
                VALUES (
                    COALESCE(%s, uuid_generate_v4()),
                    %s, %s, %s, %s,
                    COALESCE(%s::timestamptz, NOW())
                )
                RETURNING id
                """,
                (event_id, user_id, event_type, json.dumps(payload), session_id, created_at),
            )
            result_id = str(cur.fetchone()[0])
            conn.commit()
            return result_id
    except Exception:
        conn.rollback()
        raise
    finally:
        release_connection(conn)


def insert_quiz_answer(
    user_id: str,
    quiz_id: str,
    question_id: str,
    selected_answer: str,
    is_correct: bool,
    time_spent_ms: Optional[int] = None,
    hints_used: int = 0,
    event_id: Optional[str] = None,
) -> str:
    """Insert a denormalized quiz answer record."""
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO quiz_answers
                    (user_id, quiz_id, question_id, selected_answer, is_correct, time_spent_ms, hints_used, event_id)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id
                """,
                (user_id, quiz_id, question_id, selected_answer, is_correct, time_spent_ms, hints_used, event_id),
            )
            result_id = str(cur.fetchone()[0])
            conn.commit()
            return result_id
    except Exception:
        conn.rollback()
        raise
    finally:
        release_connection(conn)
