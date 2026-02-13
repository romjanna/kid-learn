-- Intermediate: performance per user per subject (all time)
SELECT
    user_id,
    subject_id,
    COUNT(*) AS total_questions,
    SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) AS correct_count,
    ROUND(
        100.0 * SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) / NULLIF(COUNT(*), 0), 1
    ) AS accuracy_pct,
    AVG(time_spent_ms)::int AS avg_time_ms,
    MAX(created_at) AS last_activity
FROM {{ ref('stg_quiz_answers') }}
GROUP BY user_id, subject_id
