from src.processors.event_processor import validate_event, enrich_event


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
