const express = require('express');
const authController = require('../controllers/authController');

const router = express.Router();

// Define the POST route for login
router.post('/login', authController.login);

module.exports = router;