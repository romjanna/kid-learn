-- Mart: subjects where student accuracy is below 70%
SELECT
    tp.user_id,
    u.display_name,
    s.name AS subject_name,
    tp.total_questions,
    tp.correct_count,
    tp.accuracy_pct,
    tp.avg_time_ms
FROM {{ ref('int_topic_performance') }} tp
JOIN {{ ref('stg_users') }} u ON u.id = tp.user_id
JOIN subjects s ON s.id = tp.subject_id
WHERE tp.accuracy_pct < 70
  AND tp.total_questions >= 3
ORDER BY tp.accuracy_pct ASC
