-- Staging: clean quiz answers with subject info
SELECT
    qa.id,
    qa.user_id,
    qa.quiz_id,
    qa.question_id,
    qa.selected_answer,
    qa.is_correct,
    qa.time_spent_ms,
    qa.hints_used,
    qa.created_at,
    qa.created_at::date AS answer_date,
    q.subject_id,
    q.difficulty
FROM quiz_answers qa
JOIN quizzes q ON q.id = qa.quiz_id
WHERE qa.user_id IS NOT NULL
