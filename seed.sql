-- 1. Create Users table
CREATE TABLE
    users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
        nickname TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        profile_picture TEXT,
        created_at TIMESTAMP
        WITH
            TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

-- 2. Create Profession Test tables
CREATE TABLE
    profession_tests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
        title TEXT NOT NULL,
        description TEXT
    );

CREATE TABLE
    profession_test_questions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
        test_id UUID REFERENCES profession_tests (id),
        question TEXT NOT NULL,
        options JSONB
    );

CREATE TABLE
    user_profession_results (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
        user_id UUID REFERENCES users (id),
        test_id UUID REFERENCES profession_tests (id),
        result JSONB,
        taken_at TIMESTAMP
        WITH
            TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

-- 3. Create Courses related tables
CREATE TABLE
    courses (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
        title TEXT NOT NULL,
        description TEXT,
        created_at TIMESTAMP
        WITH
            TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

CREATE TABLE
    chapters (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
        course_id UUID REFERENCES courses (id),
        title TEXT NOT NULL,
        description TEXT,
        main_information TEXT,
        order_in_course INT NOT NULL
    );

CREATE TABLE
    chapter_tests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
        chapter_id UUID REFERENCES chapters (id),
        questions JSONB
    );

CREATE TABLE
    user_progress (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
        user_id UUID REFERENCES users (id),
        course_id UUID REFERENCES courses (id),
        chapter_id UUID REFERENCES chapters (id),
        completed BOOLEAN DEFAULT FALSE,
        test_score FLOAT,
        last_accessed TIMESTAMP
        WITH
            TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

-- Add indexes for better query performance
CREATE INDEX idx_user_email ON users (email);

CREATE INDEX idx_chapter_course ON chapters (course_id);

CREATE INDEX idx_user_progress ON user_progress (user_id, course_id);