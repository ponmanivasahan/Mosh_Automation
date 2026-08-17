const jwt = require('jsonwebtoken');
require('dotenv').config();

// Verify JWT token from HTTP-only Cookie
const authenticate = async (req, res, next) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({ success: false, message: 'Access denied. Please log in.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'mosh_secret_key_2026');
    req.user = decoded; // { id, name, phone, role }
    next();
  } catch (error) {
    return res.status(403).json({ success: false, message: 'Invalid or expired authentication session.' });
  }
};

// Verify Admin privileges
const authorizeAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Forbidden. Administrative access required.' });
  }
  next();
};

module.exports = {
  authenticate,
  authorizeAdmin
};
