const express = require('express');
const submissionController = require('../controllers/submissionController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// 1. All routes require the user to be logged in
router.use(authMiddleware.protect);

// 2. Associate Routes (Only Marketing & Community)
router.post('/', authMiddleware.restrictTo('MARKETING', 'COMMUNITY'), submissionController.createSubmission);
router.get('/me', authMiddleware.restrictTo('MARKETING', 'COMMUNITY'), submissionController.getMySubmissions);

// 3. Admin Routes (Only Admin)
router.get('/all', authMiddleware.restrictTo('ADMIN'), submissionController.getAllSubmissions);

module.exports = router;