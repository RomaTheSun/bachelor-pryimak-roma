const express = require('express');
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');

const app = express();
const port = 3000;

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
    const { email, password, nickname } = req.body;

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
                    nickname
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

app.get('/', (req, res) => {
    res.send('Welcome to your Express App!');
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});