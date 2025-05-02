const express = require('express');
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

// Setup Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

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

/**
 * @swagger
 * /register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - nickname
 *               - birth_date
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               nickname:
 *                 type: string
 *               birth_date:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 user:
 *                   type: object
 *       400:
 *         description: Error during registration
 */
app.post('/register', async (req, res) => {
    const { email, password, nickname, birth_date } = req.body;

    try {
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
        });

        if (authError) throw authError;

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

/**
 * @swagger
 * /login:
 *   post:
 *     summary: Login a user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful, returns access and refresh tokens
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                 refreshToken:
 *                   type: string
 *       400:
 *         description: Invalid credentials
 */
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

/**
 * @swagger
 * /signout:
 *   post:
 *     summary: Sign out a user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sign out successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Error during sign out
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
app.post('/signout', authenticateToken, async (req, res) => {
    try {
        const { error } = await supabase.auth.signOut();

        if (error) throw error;

        res.json({ message: 'Sign out successful' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

/**
 * @swagger
 * /refresh-token:
 *   post:
 *     summary: Refresh access token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: New access token generated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *       401:
 *         description: Refresh token missing
 *       403:
 *         description: Invalid refresh token
 */
app.post('/refresh-token', (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) return res.sendStatus(401);

    jwt.verify(refreshToken, JWT_REFRESH_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);

        const accessToken = jwt.sign({ userId: user.userId }, JWT_SECRET, { expiresIn: '1h' });

        res.json({ accessToken });
    });
});

/**
 * @swagger
 * /user:
 *   get:
 *     summary: Get user data
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 email:
 *                   type: string
 *                 nickname:
 *                   type: string
 *                 birth_date:
 *                   type: string
 *       400:
 *         description: Error retrieving user data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
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

/**
 * @swagger
 * /user/profession-results:
 *   get:
 *     summary: Get user profession test results
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profession test results retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   user_id:
 *                     type: string
 *                   test_id:
 *                     type: string
 *                   results:
 *                     type: object
 *                   created_at:
 *                     type: string
 *       400:
 *         description: Error retrieving results
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
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

/**
 * @swagger
 * /user/progress:
 *   get:
 *     summary: Get user progress
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User progress retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   user_id:
 *                     type: string
 *                   course_id:
 *                     type: string
 *                   chapter_id:
 *                     type: string
 *                   status:
 *                     type: string
 *       400:
 *         description: Error retrieving progress
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
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

/**
 * @swagger
 * /user/nickname:
 *   put:
 *     summary: Update user nickname
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nickname
 *             properties:
 *               nickname:
 *                 type: string
 *     responses:
 *       200:
 *         description: Nickname updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 user:
 *                   type: object
 *       400:
 *         description: Error updating nickname
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
app.put("/user/nickname", authenticateToken, async (req, res) => {
    const { nickname } = req.body;

    try {
        const { data, error } = await supabase.from("users").update({ nickname }).eq("id", req.user.userId).select();

        if (error) throw error;

        res.json({ message: "Nickname updated successfully", user: data[0] });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

/**
 * @swagger
 * /profession-test/{testId}:
 *   get:
 *     summary: Get a profession test with questions
 *     tags: [Profession Tests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: testId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the profession test
 *     responses:
 *       200:
 *         description: Profession test retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 title:
 *                   type: string
 *                 description:
 *                   type: string
 *                 questions:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       question_text:
 *                         type: string
 *       400:
 *         description: Error retrieving test
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Test not found
 */
app.get('/profession-test/:testId', authenticateToken, async (req, res) => {
    const { testId } = req.params;

    try {
        const { data: testData, error: testError } = await supabase
            .from('profession_tests')
            .select('*')
            .eq('id', testId)
            .single();

        if (testError) throw testError;

        if (!testData) {
            return res.status(404).json({ error: 'Profession test not found' });
        }

        const { data: questionsData, error: questionsError } = await supabase
            .from('profession_test_questions')
            .select('*')
            .eq('test_id', testId);

        if (questionsError) throw questionsError;

        const testWithQuestions = {
            ...testData,
            questions: questionsData
        };

        res.json(testWithQuestions);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

/**
 * @swagger
 * /profession-tests:
 *   post:
 *     summary: Create a new profession test
 *     tags: [Profession Tests]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Profession test created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 title:
 *                   type: string
 *                 description:
 *                   type: string
 *       400:
 *         description: Error creating test
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
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

/**
 * @swagger
 * /profession-tests/{testId}/questions:
 *   post:
 *     summary: Add a question to a profession test
 *     tags: [Profession Tests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: testId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the profession test
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - questionText
 *               - options
 *             properties:
 *               questionText:
 *                 type: string
 *               options:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       201:
 *         description: Question added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 questionId:
 *                   type: string
 *       400:
 *         description: Error adding question
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
app.post("/profession-tests/:testId/questions", authenticateToken, async (req, res) => {
    const { testId } = req.params;
    const { questionText, options } = req.body;

    try {
        const { data, error } = await supabase.rpc("add_profession_test_question", {
            p_test_id: testId,
            p_question_text: questionText,
            p_options: options,
        });

        if (error) throw error;

        res.status(201).json({ message: "Question added successfully", questionId: data });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

/**
 * @swagger
 * /profession-tests:
 *   get:
 *     summary: Get all profession tests
 *     tags: [Profession Tests]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of profession tests
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   title:
 *                     type: string
 *                   description:
 *                     type: string
 *       400:
 *         description: Error retrieving tests
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
app.get("/profession-tests", authenticateToken, async (req, res) => {
    try {
        const { data, error } = await supabase.from("profession_tests").select("*");

        if (error) throw error;

        res.json(data);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

/**
 * @swagger
 * /profession_descriptions:
 *   get:
 *     summary: Get all profession descriptions
 *     tags: [Profession Tests]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of profession descriptions
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   name:
 *                     type: string
 *                   description:
 *                     type: string
 *       400:
 *         description: Error retrieving descriptions
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
app.get("/profession_descriptions", authenticateToken, async (req, res) => {
    try {
        const { data, error } = await supabase.from("profession_descriptions").select("*");

        if (error) throw error;

        res.json(data);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

/**
 * @swagger
 * /profession-tests/{testId}:
 *   get:
 *     summary: Get a specific profession test with questions and options
 *     tags: [Profession Tests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: testId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the profession test
 *     responses:
 *       200:
 *         description: Profession test with questions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 title:
 *                   type: string
 *                 description:
 *                   type: string
 *                 questions:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       question_text:
 *                         type: string
 *                       question_options:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: string
 *                             option_text:
 *                               type: string
 *                             option_scores:
 *                               type: array
 *                               items:
 *                                 type: object
 *                                 properties:
 *                                   profession:
 *                                     type: string
 *                                   score:
 *                                     type: number
 *       400:
 *         description: Error retrieving test
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
app.get("/profession-tests/:testId", authenticateToken, async (req, res) => {
    const { testId } = req.params;

    try {
        const { data: test, error: testError } = await supabase
            .from("profession_tests")
            .select("*")
            .eq("id", testId)
            .single();

        if (testError) throw testError;

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
            .eq("test_id", testId);

        if (questionsError) throw questionsError;

        res.json({ ...test, questions });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

/**
 * @swagger
 * /profession-tests/{testId}/results:
 *   post:
 *     summary: Save profession test results
 *     tags: [Profession Tests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: testId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the profession test
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - results
 *             properties:
 *               results:
 *                 type: object
 *                 description: JSON object containing test results (e.g., profession scores)
 *     responses:
 *       201:
 *         description: Test results saved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 result:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     user_id:
 *                       type: string
 *                     test_id:
 *                       type: string
 *                     results:
 *                       type: object
 *                     created_at:
 *                       type: string
 *       400:
 *         description: Invalid input or test not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
app.post('/profession-tests/:testId/results', authenticateToken, async (req, res) => {
    const { testId } = req.params;
    const { results } = req.body;

    try {
        if (!results) {
            return res.status(400).json({ error: 'Results are required' });
        }

        const { data: testData, error: testError } = await supabase
            .from('profession_tests')
            .select('id')
            .eq('id', testId)
            .single();

        if (testError || !testData) {
            return res.status(404).json({ error: 'Profession test not found' });
        }

        const { data, error } = await supabase
            .from('user_profession_results')
            .insert([
                {
                    user_id: req.user.userId,
                    test_id: testId,
                    results: results,
                    created_at: new Date().toISOString()
                }
            ])
            .select();

        if (error) throw error;

        res.status(201).json({ message: 'Test results saved successfully', result: data[0] });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

/**
 * @swagger
 * /forgot-password:
 *   post:
 *     summary: Request password reset
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password reset email sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Error sending reset email
 */
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

/**
 * @swagger
 * /reset-password:
 *   post:
 *     summary: Reset user password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - new_password
 *             properties:
 *               new_password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Error resetting password
 */
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

/**
 * @swagger
 * /courses:
 *   post:
 *     summary: Create a new course
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Course created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 title:
 *                   type: string
 *                 description:
 *                   type: string
 *       400:
 *         description: Error creating course
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
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

/**
 * @swagger
 * /courses/{courseId}/chapters:
 *   post:
 *     summary: Create a new chapter for a course
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the course
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - main_information
 *               - order_in_course
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               main_information:
 *                 type: string
 *               order_in_course:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Chapter created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 course_id:
 *                   type: string
 *                 title:
 *                   type: string
 *                 description:
 *                   type: string
 *                 main_information:
 *                   type: string
 *                 order_in_course:
 *                   type: integer
 *       400:
 *         description: Error creating chapter
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
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

/**
 * @swagger
 * /chapters/{chapterId}/questions:
 *   post:
 *     summary: Create questions for a chapter
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chapterId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the chapter
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - question
 *               - options
 *             properties:
 *               question:
 *                 type: object
 *               options:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       201:
 *         description: Questions created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 chapter_id:
 *                   type: string
 *                 question:
 *                   type: object
 *                 options:
 *                   type: array
 *                   items:
 *                     type: object
 *       400:
 *         description: Error creating questions
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
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

/**
 * @swagger
 * /courses:
 *   get:
 *     summary: Get all courses
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of courses
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   title:
 *                     type: string
 *                   description:
 *                     type: string
 *       400:
 *         description: Error retrieving courses
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
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

/**
 * @swagger
 * /courses/{courseId}:
 *   get:
 *     summary: Get a specific course with its chapters
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the course
 *     responses:
 *       200:
 *         description: Course with chapters retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 title:
 *                   type: string
 *                 description:
 *                   type: string
 *                 chapters:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       course_id:
 *                         type: string
 *                       title:
 *                         type: string
 *                       description:
 *                         type: string
 *                       main_information:
 *                         type: string
 *                       order_in_course:
 *                         type: integer
 *       400:
 *         description: Error retrieving course
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
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

/**
 * @swagger
 * /chapters/{chapterId}/questions:
 *   get:
 *     summary: Get questions for a specific chapter
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chapterId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the chapter
 *     responses:
 *       200:
 *         description: Chapter questions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 chapter_id:
 *                   type: string
 *                 question:
 *                   type: object
 *                 options:
 *                   type: array
 *                   items:
 *                     type: object
 *       400:
 *         description: Error retrieving questions
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
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

/**
 * @swagger
 * /:
 *   get:
 *     summary: Welcome message
 *     tags: [General]
 *     responses:
 *       200:
 *         description: Welcome message
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 */
app.get('/', (req, res) => {
    res.send('Welcome to your Express App!');
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
    console.log(`Swagger UI available at http://localhost:${port}/api-docs`);
});

module.exports = app;

