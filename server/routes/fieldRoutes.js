const express = require('express');
const fieldController = require('../controllers/fieldController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// 1. All users must be logged in to access ANY field routes
router.use(authMiddleware.protect);

// 2. GET route is accessible to EVERYONE (Admins & Associates)
router.get('/:formType', fieldController.getFields);

// 3. Apply Admin restriction to ALL routes below this line
router.use(authMiddleware.restrictTo('ADMIN'));

// 4. POST and PATCH routes are ONLY for Admins
router.post('/', fieldController.createField);
router.patch('/:id/deactivate', fieldController.deactivateField);

module.exports = router;