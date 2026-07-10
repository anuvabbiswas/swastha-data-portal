const express = require('express');
const submissionController = require('../controllers/submissionController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// 1. All routes require the user to be logged in
router.use(authMiddleware.protect);

// 2. Restrict these routes to field associates only
router.use(authMiddleware.restrictTo('MARKETING', 'COMMUNITY'));

// 3. Define the endpoints
router.route('/')
  .post(submissionController.createSubmission);

router.route('/me')
  .get(submissionController.getMySubmissions);

module.exports = router;