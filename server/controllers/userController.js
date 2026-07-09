const bcrypt = require('bcryptjs');
const prisma = require('../utils/prisma');

// Get all users (excluding passwords)
exports.getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        employeeId: true,
        name: true,
        role: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({ status: 'success', data: { users } });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to fetch users.' });
  }
};

// Create a new associate (Marketing or Community)
exports.createUser = async (req, res) => {
  try {
    const { employeeId, name, role, password } = req.body;

    // Basic validation
    if (!employeeId || !name || !role || !password) {
      return res.status(400).json({ status: 'fail', message: 'Please provide all required fields.' });
    }

    // Hash the temporary password
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create the user
    const newUser = await prisma.user.create({
      data: {
        employeeId,
        name,
        role,
        passwordHash,
      },
      // Exclude passwordHash from the response
      select: {
        id: true,
        employeeId: true,
        name: true,
        role: true,
        status: true,
      }
    });

    res.status(201).json({ status: 'success', data: { user: newUser } });
  } catch (error) {
    // Handle duplicate employeeId error specifically (Prisma code P2002)
    if (error.code === 'P2002') {
      return res.status(400).json({ status: 'fail', message: 'A user with this ID already exists.' });
    }
    console.error(error);
    res.status(500).json({ status: 'error', message: 'Failed to create user.' });
  }
};