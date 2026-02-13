-- Mart: overall student progress with subject breakdown
SELECT
    tp.user_id,
    u.display_name,
    s.name AS subject_name,
    tp.total_questions,
    tp.correct_count,
    tp.accuracy_pct,
    tp.avg_time_ms,
    tp.last_activity
FROM {{ ref('int_topic_performance') }} tp
JOIN {{ ref('stg_users') }} u ON u.id = tp.user_id
JOIN subjects s ON s.id = tp.subject_id
