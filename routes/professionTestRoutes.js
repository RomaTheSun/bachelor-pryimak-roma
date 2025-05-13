const express = require('express');
const router = express.Router();
const professionTestController = require('../controllers/professionTestController');
const { authenticateToken } = require('../middleware/auth');

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
 *       400:
 *         description: Error creating test
 */
router.post('/profession-tests', authenticateToken, professionTestController.createTest);

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
 *       400:
 *         description: Error adding question
 */
router.post('/profession-tests/:testId/questions', authenticateToken, professionTestController.addQuestion);

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
 *       400:
 *         description: Error retrieving tests
 */
router.get('/profession-tests', authenticateToken, professionTestController.getAllTests);

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
 *       400:
 *         description: Error retrieving descriptions
 */
router.get('/profession_descriptions', authenticateToken, professionTestController.getProfessionDescriptions);

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
 *       400:
 *         description: Error retrieving test
 */
router.get('/profession-tests/:testId', authenticateToken, professionTestController.getTestWithQuestions);

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
 *                 description: JSON object containing test results
 *     responses:
 *       201:
 *         description: Test results saved successfully
 *       400:
 *         description: Invalid input or test not found
 */
router.post('/profession-tests/:testId/results', authenticateToken, professionTestController.saveTestResults);

module.exports = router;