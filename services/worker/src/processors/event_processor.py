import logging
from datetime import datetime

from src.db.repository import insert_learning_event, insert_quiz_answer

logger = logging.getLogger(__name__)

REQUIRED_FIELDS = {"event_type", "payload"}


def validate_event(event: dict) -> bool:
    """Check that event has required fields."""
    if not REQUIRED_FIELDS.issubset(event.keys()):
        logger.warning(f"Event missing required fields: {REQUIRED_FIELDS - event.keys()}")
        return False
    if not isinstance(event.get("payload"), dict):
        logger.warning("Event payload must be a dict")
        return False
    return True


def enrich_event(event: dict) -> dict:
    """Add server-side enrichment to the event."""
    event["processed_at"] = datetime.utcnow().isoformat()
    return event


def process_event(event: dict) -> None:
    """Process a single learning event: validate, enrich, store."""
    if not validate_event(event):
        return

    event = enrich_event(event)
    event_type = event["event_type"]
    payload = event["payload"]

    # Store raw event
    event_id = insert_learning_event(
        event_type=event_type,
        payload=payload,
        user_id=event.get("user_id"),
        session_id=event.get("session_id"),
        event_id=event.get("id"),
        created_at=event.get("created_at"),
    )

    logger.info(f"Stored event {event_id} (type={event_type})")

    # Denormalize quiz answers for fast analytics
    if event_type == "quiz_answer" and all(
        k in payload for k in ("quiz_id", "question_id", "selected_answer", "is_correct")
    ):
        answer_id = insert_quiz_answer(
            user_id=event.get("user_id", ""),
            quiz_id=payload["quiz_id"],
            question_id=payload["question_id"],
            selected_answer=payload["selected_answer"],
            is_correct=payload["is_correct"],
            time_spent_ms=payload.get("time_spent_ms"),
            hints_used=payload.get("hints_used", 0),
            event_id=event_id,
        )
        logger.info(f"Stored quiz answer {answer_id} (correct={payload['is_correct']})")
