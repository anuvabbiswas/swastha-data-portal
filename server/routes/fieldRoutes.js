const express = require('express');
const fieldController = require('../controllers/fieldController');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();

router.use(authMiddleware.protect);

router.get('/:formType', fieldController.getFields);

router.use(authMiddleware.restrictTo('ADMIN'));

router.post('/', fieldController.createField);
router.patch('/reorder', fieldController.reorderFields);
router.patch('/:id/deactivate', fieldController.deactivateField);
router.patch('/:id', fieldController.updateField);

module.exports = router;