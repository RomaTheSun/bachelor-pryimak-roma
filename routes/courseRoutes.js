const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const { authenticateToken } = require('../middleware/auth');

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
 *       400:
 *         description: Error creating course
 */
router.post('/courses', authenticateToken, courseController.createCourse);

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
 *       400:
 *         description: Error creating chapter
 */
router.post('/courses/:courseId/chapters', authenticateToken, courseController.createChapter);

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
 *       400:
 *         description: Error creating questions
 */
router.post('/chapters/:chapterId/questions', authenticateToken, courseController.createChapterQuestions);

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
 *       400:
 *         description: Error retrieving courses
 */
router.get('/courses', authenticateToken, courseController.getAllCourses);

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
 *       400:
 *         description: Error retrieving course
 */
router.get('/courses/:courseId', authenticateToken, courseController.getCourseWithChapters);

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
 *       400:
 *         description: Error retrieving questions
 */
router.get('/chapters/:chapterId/questions', authenticateToken, courseController.getChapterQuestions);

module.exports = router;