-- Intermediate: daily stats per user per subject
SELECT
    user_id,
    subject_id,
    answer_date,
    COUNT(*) AS total_questions,
    SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) AS correct_count,
    ROUND(
        100.0 * SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) / NULLIF(COUNT(*), 0), 1
    ) AS accuracy_pct,
    AVG(time_spent_ms)::int AS avg_time_ms,
    SUM(hints_used) AS total_hints
FROM {{ ref('stg_quiz_answers') }}
GROUP BY user_id, subject_id, answer_date
