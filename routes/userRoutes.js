const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken } = require('../middleware/auth');

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
 *       400:
 *         description: Error retrieving user data
 */
router.get('/user', authenticateToken, userController.getUser);

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
 *       400:
 *         description: Error retrieving results
 */
router.get('/user/profession-results', authenticateToken, userController.getProfessionResults);

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
 *       400:
 *         description: Error retrieving progress
 */
router.get('/user/progress', authenticateToken, userController.getProgress);

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
 *       400:
 *         description: Error updating nickname
 */
router.put('/user/nickname', authenticateToken, userController.updateNickname);

module.exports = router;