-- Створення таблиці courses
CREATE TABLE courses (
    id UUID PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL
);

-- Створення таблиці chapters
CREATE TABLE chapters (
    id UUID PRIMARY KEY,
    course_id UUID NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    main_information TEXT NOT NULL,
    order_in_course INTEGER NOT NULL,
    FOREIGN KEY (course_id) REFERENCES courses(id)
);

-- Створення таблиці users
CREATE TABLE users (
    id UUID PRIMARY KEY,
    nickname TEXT NOT NULL,
    email TEXT NOT NULL,
    profile_picture TEXT,
    created_at TIMESTAMPTZ NOT NULL,
    birth_date DATE
);

-- Створення таблиці profession_descriptions
CREATE TABLE profession_descriptions (
    id UUID PRIMARY KEY,
    profession TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL
);

-- Створення таблиці profession_test
CREATE TABLE profession_test (
    id UUID PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL
);

-- Створення таблиці chapter_tests
CREATE TABLE chapter_tests (
    id UUID PRIMARY KEY,
    course_id UUID NOT NULL,
    chapter_id UUID NOT NULL,
    question_text TEXT NOT NULL,
    options JSONB NOT NULL,
    FOREIGN KEY (course_id) REFERENCES courses(id),
    FOREIGN KEY (chapter_id) REFERENCES chapters(id)
);

-- Створення таблиці question_options
CREATE TABLE question_options (
    id UUID PRIMARY KEY,
    question_id UUID NOT NULL,
    option_text TEXT NOT NULL,
    FOREIGN KEY (question_id) REFERENCES chapter_tests(id)
);

-- Створення таблиці option_scores
CREATE TABLE option_scores (
    id UUID PRIMARY KEY,
    option_id UUID NOT NULL,
    profession TEXT NOT NULL,
    score INTEGER NOT NULL,
    FOREIGN KEY (option_id) REFERENCES question_options(id)
);

-- Створення таблиці profession_test_questions
CREATE TABLE profession_test_questions (
    id UUID PRIMARY KEY,
    test_id UUID NOT NULL,
    question_text TEXT NOT NULL,
    FOREIGN KEY (test_id) REFERENCES profession_test(id)
);

-- Створення таблиці user_profession_results
CREATE TABLE user_profession_results (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    test_id UUID NOT NULL,
    result TEXT NOT NULL,
    taken_at TIMESTAMPTZ NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (test_id) REFERENCES profession_test(id)
);

-- Створення таблиці user_progress
CREATE TABLE user_progress (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    course_id UUID NOT NULL,
    chapter_id UUID NOT NULL,
    completed BOOLEAN NOT NULL,
    test_score INTEGER,
    last_accessed_at TIMESTAMPTZ,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (course_id) REFERENCES courses(id),
    FOREIGN KEY (chapter_id) REFERENCES chapters(id)
);
