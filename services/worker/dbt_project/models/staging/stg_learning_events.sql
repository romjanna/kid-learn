-- Staging: clean raw learning events
SELECT
    id,
    user_id,
    event_type,
    payload,
    session_id,
    created_at,
    created_at::date AS event_date
FROM learning_events
WHERE user_id IS NOT NULL
