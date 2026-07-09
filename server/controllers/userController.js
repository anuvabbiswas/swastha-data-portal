const bcrypt = require('bcryptjs');
const prisma = require('../utils/prisma');

// Get all users (excluding passwords)
exports.getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, employeeId: true, name: true, role: true, status: true, createdAt: true },
      orderBy: { createdAt: 'desc' }
    });
    res.status(200).json({ status: 'success', data: { users } });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to fetch users.' });
  }
};

// Create a new associate
exports.createUser = async (req, res) => {
  try {
    const { employeeId, name, role, password } = req.body;
    if (!employeeId || !name || !role || !password) {
      return res.status(400).json({ status: 'fail', message: 'Please provide all required fields.' });
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await prisma.user.create({
      data: { employeeId, name, role, passwordHash },
      select: { id: true, employeeId: true, name: true, role: true, status: true }
    });

    res.status(201).json({ status: 'success', data: { user: newUser } });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ status: 'fail', message: 'A user with this ID already exists.' });
    }
    res.status(500).json({ status: 'error', message: 'Failed to create user.' });
  }
};

// Toggle User Status (Disable/Enable)
exports.toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find the user first
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return res.status(404).json({ status: 'fail', message: 'User not found.' });
    
    // Prevent Admins from accidentally disabling themselves or other admins
    if (user.role === 'ADMIN') {
      return res.status(403).json({ status: 'fail', message: 'Cannot disable Admin accounts.' });
    }

    const newStatus = user.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';

    await prisma.user.update({
      where: { id },
      data: { status: newStatus }
    });

    res.status(200).json({ status: 'success', message: `User ${newStatus.toLowerCase()} successfully.` });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to update user status.' });
  }
};

// Reset Password
exports.resetPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword) return res.status(400).json({ status: 'fail', message: 'Provide a new password.' });

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { id },
      data: { passwordHash }
    });

    res.status(200).json({ status: 'success', message: 'Password reset successfully.' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to reset password.' });
  }
};