const jwt = require('jsonwebtoken');
const prisma = require('../utils/prisma');

// 1. Protect routes: Check if the user is logged in
exports.protect = async (req, res, next) => {
  try {
    let token;
    
    // Check if the authorization header exists and starts with 'Bearer'
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ status: 'fail', message: 'You are not logged in. Please log in to get access.' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if user still exists in DB
    const currentUser = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!currentUser) {
      return res.status(401).json({ status: 'fail', message: 'The user belonging to this token does no longer exist.' });
    }

    // Grant access to protected route by attaching user to the request object
    req.user = currentUser;
    next();
  } catch (error) {
    return res.status(401).json({ status: 'fail', message: 'Invalid token or token expired.' });
  }
};

// 2. Restrict routes: Check if the user has the required role
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ status: 'fail', message: 'You do not have permission to perform this action.' });
    }
    next();
  };
};