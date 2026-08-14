const express = require('express');
const submissionController = require('../controllers/submissionController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authMiddleware.protect);

router.post('/', authMiddleware.restrictTo('MARKETING', 'COMMUNITY'), submissionController.createSubmission);
router.get('/me', authMiddleware.restrictTo('MARKETING', 'COMMUNITY'), submissionController.getMySubmissions);
router.patch('/:id', authMiddleware.restrictTo('MARKETING', 'COMMUNITY'), submissionController.updateSubmission);

router.get('/all', authMiddleware.restrictTo('ADMIN'), submissionController.getAllSubmissions);
router.delete('/:id', authMiddleware.restrictTo('ADMIN'), submissionController.deleteSubmission);

module.exports = router;