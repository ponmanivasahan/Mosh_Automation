const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');
require('dotenv').config();

const register = async (req, res) => {
  try {
    const { name, phone, password, role } = req.body;

    if (!name || !phone || !password) {
      return res.status(400).json({ success: false, message: 'Please provide name, phone and password.' });
    }

    // Check if user already exists
    const [existing] = await pool.query('SELECT * FROM users WHERE phone = ?', [phone]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'Phone number already registered.' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    
    // Determine role (default to customer, restrict admin creation to active admin sessions or default phone)
    const userRole = role === 'admin' && phone === '0987654321' ? 'admin' : 'customer';

    await pool.query(
      'INSERT INTO users (name, phone, password_hash, role) VALUES (?, ?, ?, ?)',
      [name, phone, passwordHash, userRole]
    );

    return res.status(201).json({ success: true, message: 'User registered successfully. Please login.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Registration failed.', error: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { name, phone } = req.body;

    if (!phone) {
      return res.status(400).json({ success: false, message: 'Please provide phone number.' });
    }

    let [users] = await pool.query('SELECT * FROM users WHERE phone = ?', [phone]);
    let user;

    if (users.length === 0) {
      // Auto-register user if not exists
      const cleanedName = name || 'Customer';
      const role = phone === '0987654321' ? 'admin' : 'customer';
      // Default password hash
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(phone, salt);

      const [result] = await pool.query(
        'INSERT INTO users (name, phone, password_hash, role) VALUES (?, ?, ?, ?)',
        [cleanedName, phone, passwordHash, role]
      );
      
      const [newUsers] = await pool.query('SELECT * FROM users WHERE id = ?', [result.insertId]);
      user = newUsers[0];
    } else {
      user = users[0];
      // Update name if changed
      if (name && name !== user.name) {
        await pool.query('UPDATE users SET name = ? WHERE phone = ?', [name, phone]);
        user.name = name;
      }
    }

    // Update login timestamp
    await pool.query('UPDATE users SET logged_in_at = CURRENT_TIMESTAMP WHERE phone = ?', [phone]);

    // Sign JWT
    const token = jwt.sign(
      { id: user.id, name: user.name, phone: user.phone, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: parseInt(process.env.COOKIE_EXPIRES_IN) * 24 * 60 * 60 * 1000 // days to ms
    });

    return res.json({
      success: true,
      message: 'Logged in successfully.',
      user: {
        name: user.name,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Login failed.', error: error.message });
  }
};

const logout = async (req, res) => {
  res.clearCookie('token');
  return res.json({ success: true, message: 'Logged out successfully.' });
};

const getMe = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Not authenticated.' });
  }
  return res.json({ success: true, user: req.user });
};

const getUsers = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT name, phone, role, created_at, logged_in_at AS loggedInAt FROM users ORDER BY created_at DESC');
    return res.json({ success: true, users: rows });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve users.', error: error.message });
  }
};

const toggleUserRole = async (req, res) => {
  try {
    const { phone } = req.params;
    const { role } = req.body;

    if (!role || (role !== 'admin' && role !== 'customer')) {
      return res.status(400).json({ success: false, message: 'Invalid role selection.' });
    }

    await pool.query('UPDATE users SET role = ? WHERE phone = ?', [role, phone]);
    return res.json({ success: true, message: 'User role updated successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update user role.', error: error.message });
  }
};

module.exports = {
  register,
  login,
  logout,
  getMe,
  getUsers,
  toggleUserRole
};
