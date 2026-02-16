from src.sources.opentdb import CATEGORY_MAP, map_opentdb_to_quiz


def _make_raw_question(
    question="What is H2O?",
    correct="Water",
    incorrect=None,
    difficulty="medium",
):
    return {
        "question": question,
        "correct_answer": correct,
        "incorrect_answers": incorrect or ["Fire", "Earth", "Air"],
        "difficulty": difficulty,
    }


def test_map_basic():
    raw = [_make_raw_question()]
    result = map_opentdb_to_quiz(raw, category_id=17)

    assert result is not None
    assert result.title == "Science Quiz - Medium"
    assert result.subject == "Science"
    assert result.difficulty == "medium"
    assert result.source == "opentdb"
    assert result.source_id == "opentdb-17-medium"
    assert len(result.questions) == 1
    assert result.questions[0].correct_answer == "Water"


def test_map_html_entities():
    raw = [_make_raw_question(
        question="Which symbol means &#039;less than&#039;? &lt; or &gt;?",
        correct="It&#039;s &lt;",
    )]
    result = map_opentdb_to_quiz(raw, category_id=17)

    assert result is not None
    q = result.questions[0]
    assert "&#039;" not in q.question_text
    assert "'" in q.question_text
    assert "&lt;" not in q.question_text
    assert "<" in q.question_text
    assert "'" in q.correct_answer


def test_map_empty_returns_none():
    assert map_opentdb_to_quiz([], category_id=17) is None


def test_map_category_mapping():
    assert CATEGORY_MAP[17] == "Science"
    assert CATEGORY_MAP[19] == "Math"
    assert CATEGORY_MAP[23] == "History"
    assert CATEGORY_MAP[22] == "Geography"
    assert CATEGORY_MAP[9] == "English"

    # Unknown category falls back to Science
    raw = [_make_raw_question()]
    result = map_opentdb_to_quiz(raw, category_id=999)
    assert result is not None
    assert result.subject == "Science"


def test_map_options_include_correct():
    raw = [_make_raw_question(correct="Water", incorrect=["Fire", "Earth", "Air"])]
    result = map_opentdb_to_quiz(raw, category_id=17)

    assert result is not None
    options = result.questions[0].options
    assert "Water" in options
    assert len(options) == 4
    # Options should be sorted alphabetically
    assert options == sorted(options)
