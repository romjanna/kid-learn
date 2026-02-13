from src.models import LearningEvent, LessonData, QuizData, QuizQuestionData


def test_lesson_data():
    lesson = LessonData(
        title="Test Lesson",
        subject="Math",
        content="Some content",
        difficulty="easy",
    )
    assert lesson.title == "Test Lesson"
    assert lesson.grade_min == 1
    assert lesson.grade_max == 12


def test_quiz_data():
    quiz = QuizData(
        title="Test Quiz",
        subject="Science",
        questions=[
            QuizQuestionData(
                question_text="What is 1+1?",
                options=["1", "2", "3", "4"],
                correct_answer="2",
            )
        ],
    )
    assert len(quiz.questions) == 1
    assert quiz.source == "seed"


def test_learning_event():
    event = LearningEvent(
        event_type="quiz_answer",
        payload={"quiz_id": "abc", "is_correct": True},
    )
    assert event.event_type == "quiz_answer"
    assert event.id is not None
    assert event.created_at is not None
