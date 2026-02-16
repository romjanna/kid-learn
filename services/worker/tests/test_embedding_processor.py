from unittest.mock import MagicMock, patch

from src.processors.embedding_processor import generate_embedding, get_client, process_lessons


@patch("src.processors.embedding_processor.settings")
def test_get_client_no_key_returns_none(mock_settings):
    mock_settings.openai_api_key = ""
    assert get_client() is None


@patch("src.processors.embedding_processor.settings")
@patch("src.processors.embedding_processor.OpenAI")
def test_get_client_with_key(mock_openai_cls, mock_settings):
    mock_settings.openai_api_key = "sk-test"
    client = get_client()
    mock_openai_cls.assert_called_once_with(api_key="sk-test")
    assert client is not None


def test_generate_embedding():
    mock_client = MagicMock()
    mock_response = MagicMock()
    mock_response.data = [MagicMock(embedding=[0.1, 0.2, 0.3])]
    mock_client.embeddings.create.return_value = mock_response

    result = generate_embedding(mock_client, "test text")

    assert result == [0.1, 0.2, 0.3]
    mock_client.embeddings.create.assert_called_once_with(
        input="test text", model="text-embedding-3-small"
    )


@patch("src.processors.embedding_processor.get_client", return_value=None)
def test_process_lessons_skips_without_key(mock_get_client):
    # Should return early without touching DB
    process_lessons()
    mock_get_client.assert_called_once()


@patch("src.processors.embedding_processor.release_connection")
@patch("src.processors.embedding_processor.get_connection")
@patch("src.processors.embedding_processor.generate_embedding", return_value=[0.1, 0.2])
@patch("src.processors.embedding_processor.get_client")
def test_process_lessons_updates_db(mock_get_client, mock_gen_embed, mock_get_conn, mock_release):
    mock_client = MagicMock()
    mock_get_client.return_value = mock_client

    mock_cursor = MagicMock()
    mock_cursor.fetchall.return_value = [
        (1, "Intro to Math", "Numbers are fun"),
        (2, "Intro to Science", "Atoms are small"),
    ]
    mock_conn = MagicMock()
    mock_conn.cursor.return_value.__enter__ = MagicMock(return_value=mock_cursor)
    mock_conn.cursor.return_value.__exit__ = MagicMock(return_value=False)
    mock_get_conn.return_value = mock_conn

    process_lessons()

    # Should have called generate_embedding for each row
    assert mock_gen_embed.call_count == 2
    # Should have called UPDATE for each row
    assert mock_cursor.execute.call_count == 3  # 1 SELECT + 2 UPDATEs
    mock_release.assert_called_once_with(mock_conn)
