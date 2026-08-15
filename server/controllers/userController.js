const bcrypt = require('bcryptjs');
const prisma = require('../utils/prisma');

const VALID_ROLES = ['ADMIN', 'MARKETING', 'COMMUNITY'];

exports.getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, employeeId: true, name: true, role: true, status: true, createdAt: true },
      orderBy: { createdAt: 'desc' }
    });
    res.status(200).json({ status: 'success', data: { users } });
  } catch (error) {
    console.error('Get All Users Error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch users.' });
  }
};

exports.createUser = async (req, res) => {
  try {
    const { employeeId, name, role, password } = req.body;
    if (!employeeId || !name || !role || !password) {
      return res.status(400).json({ status: 'fail', message: 'Please provide all required fields.' });
    }
    if (!VALID_ROLES.includes(role)) {
      return res.status(400).json({ status: 'fail', message: 'Invalid role specified.' });
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
    console.error('Create User Error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to create user.' });
  }
};

exports.toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const loggedInUserId = req.user.id;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return res.status(404).json({ status: 'fail', message: 'User not found.' });

    if (user.id === loggedInUserId) {
      return res.status(403).json({ status: 'fail', message: 'You cannot disable your own active session.' });
    }
    const newStatus = user.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
    await prisma.user.update({
      where: { id },
      data: { status: newStatus }
    });
    res.status(200).json({ status: 'success', message: `User ${newStatus.toLowerCase()} successfully.` });
  } catch (error) {
    console.error('Toggle User Status Error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to update user status.' });
  }
};

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
    console.error('Reset Password Error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to reset password.' });
  }
};

exports.updateUserDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const { employeeId, name, role } = req.body;
    const loggedInUserId = req.user.id;
    if (!employeeId || !name || !role) {
      return res.status(400).json({ status: 'fail', message: 'All fields are required.' });
    }
    if (!VALID_ROLES.includes(role)) {
      return res.status(400).json({ status: 'fail', message: 'Invalid role specified.' });
    }

    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) {
      return res.status(404).json({ status: 'fail', message: 'User not found.' });
    }

    if (targetUser.id === loggedInUserId && role !== targetUser.role) {
      return res.status(403).json({ status: 'fail', message: 'You cannot change your own role to prevent accidental lockouts.' });
    }
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { employeeId, name, role },
      select: { id: true, employeeId: true, name: true, role: true, status: true }
    });
    res.status(200).json({ status: 'success', data: { user: updatedUser } });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ status: 'fail', message: 'That Employee ID is already assigned to another user.' });
    }
    console.error('Update User Details Error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to update user details.' });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const loggedInUserId = req.user.id;
    if (id === loggedInUserId) {
      return res.status(403).json({ status: 'fail', message: 'You cannot permanently delete your own account.' });
    }
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ status: 'fail', message: 'User not found.' });
    }
    await prisma.user.delete({
      where: { id }
    });
    res.status(200).json({ status: 'success', message: 'User permanently deleted.' });
  } catch (error) {
    console.error("Delete User Error:", error);
    res.status(500).json({ status: 'error', message: 'Failed to delete user.' });
  }
};