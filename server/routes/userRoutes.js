const express = require('express');
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Apply middleware to ALL routes
// 1. Must be logged in
router.use(authMiddleware.protect); 
// 2. Must be an ADMIN
router.use(authMiddleware.restrictTo('ADMIN')); 

// Define routes
router.route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser);

// Action Routes
router.patch('/:id/status', userController.toggleUserStatus);
router.patch('/:id/reset-password', userController.resetPassword);

module.exports = router;