const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const prisma = require('../utils/prisma');

const signToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

exports.login = async (req, res) => {
  try {
    const { employeeId, password, role } = req.body;

    if (!employeeId || !password || !role) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide employeeId, password, and role.',
      });
    }

    const user = await prisma.user.findUnique({
      where: { employeeId },
    });

    if (!user) {
      return res.status(401).json({
        status: 'fail',
        message: 'User ID does not exist.',
      });
    }
    if (user.role !== role) {
      return res.status(401).json({
        status: 'fail',
        message: 'Incorrect role selected.',
      });
    }
    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      return res.status(401).json({
        status: 'fail',
        message: 'Incorrect password.',
      });
    }

    if (user.status === 'DISABLED') {
      return res.status(403).json({
        status: 'fail',
        message: 'This account has been disabled. Please contact an administrator.',
      });
    }

    const token = signToken(user.id, user.role);

    res.status(200).json({
      status: 'success',
      token,
      data: {
        user: {
          id: user.id,
          employeeId: user.employeeId,
          name: user.name,
          role: user.role,
        }
      }
    });

  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An internal server error occurred.',
    });
  }
};