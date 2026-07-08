const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const prisma = require('../utils/prisma');

// Helper function to generate a JWT token
const signToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

exports.login = async (req, res) => {
  try {
    const { employeeId, password, role } = req.body;

    // 1. Check if employeeId, password, and role actually exist in the request
    if (!employeeId || !password || !role) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide employeeId, password, and role.',
      });
    }

    // 2. Find the user in the database
    const user = await prisma.user.findUnique({
      where: { employeeId },
    });

    // 3. Verify the user exists, the role matches, and the password is correct
    if (!user || user.role !== role || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({
        status: 'fail',
        // Generic error message as required by AUTH-1 in the PRD
        message: 'Invalid credentials. Please try again.',
      });
    }

    // 4. Check if the admin disabled this account (ADM-2 requirement)
    if (user.status === 'DISABLED') {
      return res.status(403).json({
        status: 'fail',
        message: 'This account has been disabled. Please contact an administrator.',
      });
    }

    // 5. If everything is okay, generate a token and send it back
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