-- Staging: clean user records
SELECT
    id,
    email,
    display_name,
    role,
    age,
    grade_level,
    parent_id,
    created_at
FROM users
