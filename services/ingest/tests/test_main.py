from unittest.mock import AsyncMock, patch

import pytest
from fastapi.testclient import TestClient

from src.models import SeedResult


@pytest.fixture()
def client():
    """Create a TestClient with the publisher mocked so no real Redis connection is needed."""
    with patch("src.main.publisher") as mock_pub:
        mock_pub.publish = AsyncMock()
        mock_pub.close = AsyncMock()
        from src.main import app
        yield TestClient(app)


def test_health(client):
    resp = client.get("/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"
    assert data["service"] == "ingest"


@patch("src.main.load_seed_data")
def test_seed_success(mock_seed, client):
    mock_seed.return_value = SeedResult(
        subjects_count=5, lessons_loaded=10, quizzes_loaded=3, questions_loaded=15
    )
    resp = client.post("/api/seed")
    assert resp.status_code == 200
    data = resp.json()
    assert data["lessons_loaded"] == 10
    assert data["quizzes_loaded"] == 3
    mock_seed.assert_called_once()


@patch("src.main.load_seed_data", side_effect=RuntimeError("DB down"))
def test_seed_error(mock_seed, client):
    resp = client.post("/api/seed")
    assert resp.status_code == 500
    assert "DB down" in resp.json()["detail"]


def test_publish_event(client):
    with patch("src.main.publisher") as mock_pub:
        mock_pub.publish = AsyncMock()
        resp = client.post(
            "/api/events",
            json={
                "event_type": "quiz_answer",
                "payload": {"quiz_id": "abc", "is_correct": True},
            },
        )
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "published"
    assert "event_id" in data


def test_publish_event_validation(client):
    # Missing required field event_type
    resp = client.post("/api/events", json={"payload": {"quiz_id": "abc"}})
    assert resp.status_code == 422
