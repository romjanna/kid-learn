import json
import logging
from pathlib import Path

import psycopg2
from psycopg2.extras import execute_values

from src.config import settings
from src.models import SeedResult

logger = logging.getLogger(__name__)

SEED_DIR = Path(__file__).parent.parent.parent / "seed_data"


def get_db_connection():
    return psycopg2.connect(settings.database_url)


def load_seed_data() -> SeedResult:
    """Load lessons and quizzes from seed JSON files into Postgres."""
    result = SeedResult()
    conn = get_db_connection()

    try:
        with conn.cursor() as cur:
            # Get subject name -> id mapping
            cur.execute("SELECT id, name FROM subjects")
            subject_map = {row[1].lower(): row[0] for row in cur.fetchall()}
            result.subjects_count = len(subject_map)

            # Load lessons
            lessons_file = SEED_DIR / "lessons.json"
            if lessons_file.exists():
                lessons = json.loads(lessons_file.read_text())
                for lesson in lessons:
                    subject_id = subject_map.get(lesson["subject"].lower())
                    if not subject_id:
                        logger.warning(f"Unknown subject: {lesson['subject']}")
                        continue

                    cur.execute(
                        """
                        INSERT INTO lessons (subject_id, title, content, difficulty, grade_min, grade_max, source)
                        VALUES (%s, %s, %s, %s, %s, %s, 'seed')
                        ON CONFLICT DO NOTHING
                        """,
                        (
                            subject_id,
                            lesson["title"],
                            lesson["content"],
                            lesson.get("difficulty", "medium"),
                            lesson.get("grade_min", 1),
                            lesson.get("grade_max", 12),
                        ),
                    )
                    result.lessons_loaded += 1

            # Load quizzes
            quizzes_file = SEED_DIR / "quizzes.json"
            if quizzes_file.exists():
                quizzes = json.loads(quizzes_file.read_text())
                for quiz in quizzes:
                    subject_id = subject_map.get(quiz["subject"].lower())
                    if not subject_id:
                        logger.warning(f"Unknown subject: {quiz['subject']}")
                        continue

                    cur.execute(
                        """
                        INSERT INTO quizzes (subject_id, title, difficulty, source)
                        VALUES (%s, %s, %s, 'seed')
                        RETURNING id
                        """,
                        (subject_id, quiz["title"], quiz.get("difficulty", "medium")),
                    )
                    quiz_id = cur.fetchone()[0]
                    result.quizzes_loaded += 1

                    for i, q in enumerate(quiz.get("questions", [])):
                        cur.execute(
                            """
                            INSERT INTO quiz_questions
                                (quiz_id, question_text, question_type, options, correct_answer, explanation, sort_order)
                            VALUES (%s, %s, %s, %s, %s, %s, %s)
                            """,
                            (
                                quiz_id,
                                q["question_text"],
                                q.get("question_type", "multiple_choice"),
                                json.dumps(q["options"]),
                                q["correct_answer"],
                                q.get("explanation"),
                                i,
                            ),
                        )
                        result.questions_loaded += 1

            conn.commit()
            logger.info(
                f"Seed complete: {result.lessons_loaded} lessons, "
                f"{result.quizzes_loaded} quizzes, {result.questions_loaded} questions"
            )

    except Exception:
        conn.rollback()
        logger.exception("Failed to load seed data")
        raise
    finally:
        conn.close()

    return result
