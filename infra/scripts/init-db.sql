-- Kids Educational Learning Platform - Database Schema
-- Requires pgvector extension

CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS & AUTH
-- ============================================
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email           VARCHAR(255) UNIQUE NOT NULL,
    display_name    VARCHAR(100) NOT NULL,
    role            VARCHAR(20) NOT NULL CHECK (role IN ('student', 'parent', 'teacher')),
    age             INTEGER,
    grade_level     INTEGER,
    parent_id       UUID REFERENCES users(id),
    password_hash   VARCHAR(255) NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_parent ON users(parent_id);

-- ============================================
-- EDUCATIONAL CONTENT
-- ============================================
CREATE TABLE subjects (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(100) NOT NULL UNIQUE,
    icon            VARCHAR(50),
    color           VARCHAR(7)
);

CREATE TABLE lessons (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subject_id      INTEGER REFERENCES subjects(id),
    title           VARCHAR(255) NOT NULL,
    content         TEXT NOT NULL,
    difficulty      VARCHAR(20) CHECK (difficulty IN ('easy', 'medium', 'hard')),
    grade_min       INTEGER DEFAULT 1,
    grade_max       INTEGER DEFAULT 12,
    embedding       vector(1536),
    metadata        JSONB DEFAULT '{}',
    source          VARCHAR(50) DEFAULT 'seed',
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_lessons_subject ON lessons(subject_id);
CREATE INDEX idx_lessons_difficulty ON lessons(difficulty);

CREATE TABLE quizzes (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lesson_id       UUID REFERENCES lessons(id),
    subject_id      INTEGER REFERENCES subjects(id),
    title           VARCHAR(255) NOT NULL,
    difficulty      VARCHAR(20) CHECK (difficulty IN ('easy', 'medium', 'hard')),
    source          VARCHAR(50) DEFAULT 'seed',
    source_id       VARCHAR(255),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_quizzes_subject ON quizzes(subject_id);

CREATE TABLE quiz_questions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quiz_id         UUID REFERENCES quizzes(id) ON DELETE CASCADE,
    question_text   TEXT NOT NULL,
    question_type   VARCHAR(20) DEFAULT 'multiple_choice',
    options         JSONB NOT NULL,
    correct_answer  VARCHAR(255) NOT NULL,
    explanation     TEXT,
    embedding       vector(1536),
    sort_order      INTEGER DEFAULT 0
);

CREATE INDEX idx_questions_quiz ON quiz_questions(quiz_id);

-- ============================================
-- LEARNING EVENTS (raw event store)
-- ============================================
CREATE TABLE learning_events (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID REFERENCES users(id),
    event_type      VARCHAR(50) NOT NULL,
    payload         JSONB NOT NULL,
    session_id      UUID,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_events_user_time ON learning_events(user_id, created_at DESC);
CREATE INDEX idx_events_type ON learning_events(event_type);
CREATE INDEX idx_events_session ON learning_events(session_id);

-- ============================================
-- QUIZ ANSWERS (denormalized for fast analytics)
-- ============================================
CREATE TABLE quiz_answers (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID REFERENCES users(id),
    quiz_id         UUID REFERENCES quizzes(id),
    question_id     UUID REFERENCES quiz_questions(id),
    selected_answer VARCHAR(255),
    is_correct      BOOLEAN NOT NULL,
    time_spent_ms   INTEGER,
    hints_used      INTEGER DEFAULT 0,
    event_id        UUID REFERENCES learning_events(id),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_answers_user ON quiz_answers(user_id, created_at DESC);
CREATE INDEX idx_answers_quiz ON quiz_answers(quiz_id);

-- ============================================
-- AI TUTOR CONVERSATIONS
-- ============================================
CREATE TABLE tutor_sessions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID REFERENCES users(id),
    subject_id      INTEGER REFERENCES subjects(id),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE tutor_messages (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id      UUID REFERENCES tutor_sessions(id) ON DELETE CASCADE,
    role            VARCHAR(20) NOT NULL,
    content         TEXT NOT NULL,
    tokens_used     INTEGER,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tutor_messages_session ON tutor_messages(session_id, created_at);

-- ============================================
-- SEED: Default subjects
-- ============================================
INSERT INTO subjects (name, icon, color) VALUES
    ('Math', 'calculator', '#4F46E5'),
    ('Science', 'flask', '#059669'),
    ('History', 'book-open', '#D97706'),
    ('English', 'pencil', '#DC2626'),
    ('Geography', 'globe', '#2563EB');
