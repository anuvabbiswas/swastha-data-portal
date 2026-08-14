const express = require('express');
const analyticsController = require('../controllers/analyticsController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authMiddleware.protect);
router.use(authMiddleware.restrictTo('ADMIN'));

router.get('/', analyticsController.getAnalytics);

module.exports = router;