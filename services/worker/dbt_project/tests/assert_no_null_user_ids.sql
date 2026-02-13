-- Test: ensure no null user_ids in mart_student_progress
SELECT *
FROM {{ ref('mart_student_progress') }}
WHERE user_id IS NULL
