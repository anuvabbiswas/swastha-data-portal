const express = require('express');
const uploadController = require('../controllers/uploadController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authMiddleware.protect);

router.post('/', uploadController.uploadMiddleware, uploadController.handleUpload);

router.get('/:filename', uploadController.getFile);

router.delete('/:filename', uploadController.deleteFile);

module.exports = router;