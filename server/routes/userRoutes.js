const express = require('express');
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();

router.use(authMiddleware.protect);
router.use(authMiddleware.restrictTo('ADMIN'));

// Define routes
router.route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser);

// Action Routes
router.patch('/:id/status', userController.toggleUserStatus);
router.patch('/:id/reset-password', userController.resetPassword);
router.patch('/:id/details', userController.updateUserDetails);
router.delete('/:id', userController.deleteUser);

module.exports = router;