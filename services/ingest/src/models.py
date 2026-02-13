from datetime import datetime
from typing import Optional
from uuid import UUID, uuid4

from pydantic import BaseModel, Field


class LessonData(BaseModel):
    title: str
    subject: str
    content: str
    difficulty: str = "medium"
    grade_min: int = 1
    grade_max: int = 12


class QuizQuestionData(BaseModel):
    question_text: str
    question_type: str = "multiple_choice"
    options: list[str]
    correct_answer: str
    explanation: Optional[str] = None


class QuizData(BaseModel):
    title: str
    subject: str
    difficulty: str = "medium"
    source: str = "seed"
    source_id: Optional[str] = None
    questions: list[QuizQuestionData]


class LearningEvent(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    event_type: str
    payload: dict
    user_id: Optional[UUID] = None
    session_id: Optional[UUID] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)


class SeedResult(BaseModel):
    subjects_count: int = 0
    lessons_loaded: int = 0
    quizzes_loaded: int = 0
    questions_loaded: int = 0


class FetchResult(BaseModel):
    quizzes_fetched: int = 0
    questions_fetched: int = 0
    errors: list[str] = Field(default_factory=list)
