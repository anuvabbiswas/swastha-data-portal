const express = require('express');
const uploadController = require('../controllers/uploadController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Apply protection to all upload routes
router.use(authMiddleware.protect);

// Route to upload a file (Requires 'media' form-data field)
router.post('/', uploadController.uploadMiddleware, uploadController.handleUpload);

// Route to fetch/view a file securely
router.get('/:filename', uploadController.getFile);

module.exports = router;