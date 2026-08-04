const express = require('express');
const analyticsController = require('../controllers/analyticsController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Apply protection - Only Admins can view aggregate analytics
router.use(authMiddleware.protect);
router.use(authMiddleware.restrictTo('ADMIN'));

router.get('/', analyticsController.getAnalytics);

module.exports = router;