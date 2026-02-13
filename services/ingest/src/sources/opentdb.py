import html
import json
import logging
from typing import Optional

import httpx
from tenacity import retry, stop_after_attempt, wait_exponential

from src.config import settings
from src.models import FetchResult, QuizData, QuizQuestionData

logger = logging.getLogger(__name__)

# OpenTDB category IDs mapped to our subjects
CATEGORY_MAP = {
    17: "Science",   # Science & Nature
    18: "Science",   # Computers
    19: "Math",      # Mathematics
    23: "History",   # History
    22: "Geography", # Geography
    9:  "English",   # General Knowledge
}


@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=10),
)
async def fetch_from_opentdb(
    amount: int = 10,
    category: Optional[int] = None,
    difficulty: Optional[str] = None,
) -> list[dict]:
    """Fetch questions from Open Trivia Database API."""
    params = {"amount": amount, "type": "multiple"}
    if category:
        params["category"] = category
    if difficulty:
        params["difficulty"] = difficulty

    async with httpx.AsyncClient() as client:
        response = await client.get(settings.opentdb_base_url, params=params)
        response.raise_for_status()
        data = response.json()

    if data.get("response_code") != 0:
        logger.warning(f"OpenTDB returned code {data.get('response_code')}")
        return []

    return data.get("results", [])


def map_opentdb_to_quiz(raw_questions: list[dict], category_id: int) -> Optional[QuizData]:
    """Convert OpenTDB API response to our QuizData model."""
    if not raw_questions:
        return None

    subject = CATEGORY_MAP.get(category_id, "Science")
    first = raw_questions[0]
    difficulty = first.get("difficulty", "medium")

    questions = []
    for q in raw_questions:
        # Decode HTML entities from OpenTDB
        question_text = html.unescape(q["question"])
        correct = html.unescape(q["correct_answer"])
        incorrect = [html.unescape(a) for a in q["incorrect_answers"]]

        # Combine and shuffle options (correct answer at random position)
        options = incorrect + [correct]
        options.sort()

        questions.append(
            QuizQuestionData(
                question_text=question_text,
                options=options,
                correct_answer=correct,
                explanation=f"The correct answer is: {correct}",
            )
        )

    return QuizData(
        title=f"{subject} Quiz - {difficulty.title()}",
        subject=subject,
        difficulty=difficulty,
        source="opentdb",
        source_id=f"opentdb-{category_id}-{difficulty}",
        questions=questions,
    )


async def fetch_and_store_quizzes(amount_per_category: int = 5) -> FetchResult:
    """Fetch quizzes from OpenTDB for all mapped categories and store them."""
    import psycopg2

    result = FetchResult()
    conn = psycopg2.connect(settings.database_url)

    try:
        with conn.cursor() as cur:
            cur.execute("SELECT id, name FROM subjects")
            subject_map = {row[1].lower(): row[0] for row in cur.fetchall()}

            for category_id, subject_name in CATEGORY_MAP.items():
                try:
                    raw = await fetch_from_opentdb(
                        amount=amount_per_category, category=category_id
                    )
                    quiz = map_opentdb_to_quiz(raw, category_id)
                    if not quiz:
                        continue

                    subject_id = subject_map.get(quiz.subject.lower())
                    if not subject_id:
                        result.errors.append(f"Unknown subject: {quiz.subject}")
                        continue

                    # Check if already fetched (by source_id)
                    cur.execute(
                        "SELECT id FROM quizzes WHERE source_id = %s",
                        (quiz.source_id,),
                    )
                    if cur.fetchone():
                        logger.info(f"Quiz {quiz.source_id} already exists, skipping")
                        continue

                    cur.execute(
                        """
                        INSERT INTO quizzes (subject_id, title, difficulty, source, source_id)
                        VALUES (%s, %s, %s, %s, %s)
                        RETURNING id
                        """,
                        (subject_id, quiz.title, quiz.difficulty, quiz.source, quiz.source_id),
                    )
                    quiz_id = cur.fetchone()[0]
                    result.quizzes_fetched += 1

                    for i, q in enumerate(quiz.questions):
                        cur.execute(
                            """
                            INSERT INTO quiz_questions
                                (quiz_id, question_text, question_type, options, correct_answer, explanation, sort_order)
                            VALUES (%s, %s, %s, %s, %s, %s, %s)
                            """,
                            (
                                quiz_id,
                                q.question_text,
                                q.question_type,
                                json.dumps(q.options),
                                q.correct_answer,
                                q.explanation,
                                i,
                            ),
                        )
                        result.questions_fetched += 1

                    logger.info(f"Fetched quiz: {quiz.title} ({len(quiz.questions)} questions)")

                except Exception as e:
                    error_msg = f"Failed to fetch category {category_id}: {e}"
                    logger.error(error_msg)
                    result.errors.append(error_msg)

            conn.commit()

    except Exception:
        conn.rollback()
        logger.exception("Failed to fetch and store quizzes")
        raise
    finally:
        conn.close()

    return result
