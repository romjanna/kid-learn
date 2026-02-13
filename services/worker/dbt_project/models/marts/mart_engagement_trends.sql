-- Mart: daily engagement trends per student
SELECT
    e.user_id,
    u.display_name,
    e.event_date,
    COUNT(*) AS total_events,
    COUNT(DISTINCT e.session_id) AS sessions_count,
    SUM(CASE WHEN e.event_type = 'quiz_answer' THEN 1 ELSE 0 END) AS quiz_answers,
    SUM(CASE WHEN e.event_type = 'lesson_view' THEN 1 ELSE 0 END) AS lessons_viewed,
    SUM(CASE WHEN e.event_type = 'hint_request' THEN 1 ELSE 0 END) AS hints_requested
FROM {{ ref('stg_learning_events') }} e
JOIN {{ ref('stg_users') }} u ON u.id = e.user_id
GROUP BY e.user_id, u.display_name, e.event_date
ORDER BY e.event_date DESC
