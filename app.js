const express = require('express');
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

// Middleware to verify JWT
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// User registration
app.post('/register', async (req, res) => {
    const { email, password, nickname, birth_date } = req.body;

    try {
        // Sign up the user using Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
        });

        if (authError) throw authError;

        // If auth signup is successful, insert user data into the custom users table
        const { data: userData, error: userError } = await supabase
            .from('users')
            .insert([
                {
                    id: authData.user.id,
                    email,
                    nickname,
                    birth_date
                }
            ]);

        if (userError) throw userError;

        res.status(201).json({ message: 'User registered successfully', user: authData.user });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});
// User login
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) throw error;

        const accessToken = jwt.sign({ userId: data.user.id }, JWT_SECRET, { expiresIn: '1h' });
        const refreshToken = jwt.sign({ userId: data.user.id }, JWT_REFRESH_SECRET, { expiresIn: '7d' });

        res.json({ accessToken, refreshToken });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// User sign-out
app.post('/signout', authenticateToken, async (req, res) => {
    try {
        const { error } = await supabase.auth.signOut();

        if (error) throw error;

        res.json({ message: 'Sign out successful' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Refresh token
app.post('/refresh-token', (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) return res.sendStatus(401);

    jwt.verify(refreshToken, JWT_REFRESH_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);

        const accessToken = jwt.sign({ userId: user.userId }, JWT_SECRET, { expiresIn: '1h' });

        res.json({ accessToken });
    });
});

// Get user data
app.get('/user', authenticateToken, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', req.user.userId)
            .single();

        if (error) throw error;

        res.json(data);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Get user profession results
app.get('/user/profession-results', authenticateToken, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('user_profession_results')
            .select('*')
            .eq('user_id', req.user.userId);

        if (error) throw error;

        res.json(data);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Get user progress
app.get('/user/progress', authenticateToken, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('user_progress')
            .select('*')
            .eq('user_id', req.user.userId);

        if (error) throw error;

        res.json(data);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Update user nickname
app.put("/user/nickname", authenticateToken, async (req, res) => {
    const { nickname } = req.body

    try {
        const { data, error } = await supabase.from("users").update({ nickname }).eq("id", req.user.userId).select()

        if (error) throw error

        res.json({ message: "Nickname updated successfully", user: data[0] })
    } catch (error) {
        res.status(400).json({ error: error.message })
    }
})

app.get('/profession-test/:testId', authenticateToken, async (req, res) => {
    const { testId } = req.params;

    try {
        // Fetch the profession test
        const { data: testData, error: testError } = await supabase
            .from('profession_tests')
            .select('*')
            .eq('id', testId)
            .single();

        if (testError) throw testError;

        if (!testData) {
            return res.status(404).json({ error: 'Profession test not found' });
        }

        // Fetch the questions for this test
        const { data: questionsData, error: questionsError } = await supabase
            .from('profession_test_questions')
            .select('*')
            .eq('test_id', testId);

        if (questionsError) throw questionsError;

        // Combine test data with questions
        const testWithQuestions = {
            ...testData,
            questions: questionsData
        };

        res.json(testWithQuestions);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Create a new profession test
app.post('/profession-tests', authenticateToken, async (req, res) => {
    const { title, description } = req.body;

    try {
        const { data, error } = await supabase
            .from('profession_tests')
            .insert([{ title, description }])
            .select();

        if (error) throw error;

        res.status(201).json(data[0]);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Add a question to a profession test
app.post("/profession-tests/:testId/questions", authenticateToken, async (req, res) => {
    const { testId } = req.params
    const { questionText, options } = req.body

    try {
        const { data, error } = await supabase.rpc("add_profession_test_question", {
            p_test_id: testId,
            p_question_text: questionText,
            p_options: JSON.stringify(options),
        })

        if (error) throw error

        res.status(201).json({ message: "Question added successfully", questionId: data })
    } catch (error) {
        res.status(400).json({ error: error.message })
    }
})

// Get all profession tests
app.get("/profession-tests", authenticateToken, async (req, res) => {
    try {
        const { data, error } = await supabase.from("profession_tests").select("*")

        if (error) throw error

        res.json(data)
    } catch (error) {
        res.status(400).json({ error: error.message })
    }
})

// Get a specific profession test with its questions and options
app.get("/profession-tests/:testId", authenticateToken, async (req, res) => {
    const { testId } = req.params

    try {
        const { data: test, error: testError } = await supabase
            .from("profession_tests")
            .select("*")
            .eq("id", testId)
            .single()

        if (testError) throw testError

        const { data: questions, error: questionsError } = await supabase
            .from("profession_test_questions")
            .select(`
          id,
          question_text,
          question_options (
            id,
            option_text,
            option_scores (
              profession,
              score
            )
          )
        `)
            .eq("test_id", testId)

        if (questionsError) throw questionsError

        res.json({ ...test, questions })
    } catch (error) {
        res.status(400).json({ error: error.message })
    }
})

app.post('/forgot-password', async (req, res) => {
    const { email } = req.body;

    try {
        const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: 'http://localhost:3000/reset-password',
        });

        if (error) throw error;

        res.json({ message: 'Password reset email sent successfully' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.post('/reset-password', async (req, res) => {
    const { new_password } = req.body;

    try {
        const { data, error } = await supabase.auth.updateUser({
            password: new_password
        });

        if (error) throw error;

        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Create a new course
app.post('/courses', authenticateToken, async (req, res) => {
    const { title, description } = req.body;

    try {
        const { data, error } = await supabase
            .from('courses')
            .insert([{ title, description }])
            .select();

        if (error) throw error;

        res.status(201).json(data[0]);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Create a new chapter for a course
app.post('/courses/:courseId/chapters', authenticateToken, async (req, res) => {
    const { courseId } = req.params;
    const { title, description, main_information, order_in_course } = req.body;

    try {
        const { data, error } = await supabase
            .from('chapters')
            .insert([{
                course_id: courseId,
                title,
                description,
                main_information,
                order_in_course
            }])
            .select();

        if (error) throw error;

        res.status(201).json(data[0]);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Create questions for a chapter
app.post('/chapters/:chapterId/questions', authenticateToken, async (req, res) => {
    const { chapterId } = req.params;
    const { question, options } = req.body;

    try {
        const { data, error } = await supabase
            .from('chapter_tests')
            .insert([{
                chapter_id: chapterId,
                question: JSON.stringify(question),
                options: JSON.stringify(options)
            }])
            .select();

        if (error) throw error;

        res.status(201).json(data[0]);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Get all courses
app.get('/courses', authenticateToken, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('courses')
            .select('*');

        if (error) throw error;

        res.json(data);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Get a specific course with its chapters
app.get('/courses/:courseId', authenticateToken, async (req, res) => {
    const { courseId } = req.params;

    try {
        const { data: course, error: courseError } = await supabase
            .from('courses')
            .select('*')
            .eq('id', courseId)
            .single();

        if (courseError) throw courseError;

        const { data: chapters, error: chaptersError } = await supabase
            .from('chapters')
            .select('*')
            .eq('course_id', courseId)
            .order('order_in_course', { ascending: true });

        if (chaptersError) throw chaptersError;

        res.json({ ...course, chapters });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Get questions for a specific chapter
app.get('/chapters/:chapterId/questions', authenticateToken, async (req, res) => {
    const { chapterId } = req.params;

    try {
        const { data, error } = await supabase
            .from('chapter_tests')
            .select('*')
            .eq('chapter_id', chapterId)
            .single();

        if (error) throw error;

        res.json(data);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.get('/', (req, res) => {
    res.send('Welcome to your Express App!');
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

export default app