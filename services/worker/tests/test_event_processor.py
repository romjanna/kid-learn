from unittest.mock import patch

from src.processors.event_processor import validate_event, enrich_event, process_event


def test_validate_event_valid():
    event = {"event_type": "quiz_answer", "payload": {"quiz_id": "abc"}}
    assert validate_event(event) is True


def test_validate_event_missing_type():
    event = {"payload": {"quiz_id": "abc"}}
    assert validate_event(event) is False


def test_validate_event_bad_payload():
    event = {"event_type": "quiz_answer", "payload": "not a dict"}
    assert validate_event(event) is False


def test_enrich_event_adds_processed_at():
    event = {"event_type": "test", "payload": {}}
    enriched = enrich_event(event)
    assert "processed_at" in enriched


# --- process_event integration tests ---


@patch("src.processors.event_processor.insert_learning_event", return_value="evt-123")
def test_process_event_stores_raw(mock_insert):
    event = {
        "event_type": "lesson_view",
        "payload": {"lesson_id": "L1"},
        "user_id": "u1",
    }
    process_event(event)
    mock_insert.assert_called_once()
    call_kwargs = mock_insert.call_args[1]
    assert call_kwargs["event_type"] == "lesson_view"
    assert call_kwargs["user_id"] == "u1"


@patch("src.processors.event_processor.insert_quiz_answer", return_value="ans-1")
@patch("src.processors.event_processor.insert_learning_event", return_value="evt-456")
def test_process_event_quiz_answer_denormalizes(mock_insert_event, mock_insert_answer):
    event = {
        "event_type": "quiz_answer",
        "payload": {
            "quiz_id": "q1",
            "question_id": "qq1",
            "selected_answer": "Water",
            "is_correct": True,
            "time_spent_ms": 1500,
        },
        "user_id": "u2",
    }
    process_event(event)
    mock_insert_event.assert_called_once()
    mock_insert_answer.assert_called_once()
    ans_kwargs = mock_insert_answer.call_args[1]
    assert ans_kwargs["quiz_id"] == "q1"
    assert ans_kwargs["is_correct"] is True
    assert ans_kwargs["event_id"] == "evt-456"


@patch("src.processors.event_processor.insert_quiz_answer")
@patch("src.processors.event_processor.insert_learning_event", return_value="evt-789")
def test_process_event_non_quiz_no_denormalize(mock_insert_event, mock_insert_answer):
    event = {
        "event_type": "lesson_view",
        "payload": {"lesson_id": "L2"},
    }
    process_event(event)
    mock_insert_event.assert_called_once()
    mock_insert_answer.assert_not_called()


def test_process_event_invalid_skips():
    # Missing event_type — should return without calling any repository function
    event = {"payload": {"x": 1}}
    # Should not raise
    process_event(event)
