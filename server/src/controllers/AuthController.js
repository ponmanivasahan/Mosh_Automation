const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');
const { sendSMS } = require('../services/smsService');
require('dotenv').config();

// In-memory OTP storage: phone -> { otp, expiresAt }
const otpStore = new Map();

const sendOtp = async (req, res) => {
  try {
    const { phone } = req.body;
    const cleanedPhone = (phone || '').replace(/\D/g, '');

    if (!cleanedPhone || cleanedPhone.length !== 10) {
      return res.status(400).json({ success: false, message: 'Please provide a valid 10-digit mobile phone number.' });
    }

    // Generate random 4-digit OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes validity
    otpStore.set(cleanedPhone, { otp, expiresAt });

    // Send SMS via Gateway Service
    await sendSMS(cleanedPhone, otp, `Your MOSH Automation login verification OTP is: ${otp}. Valid for 5 minutes.`);

    return res.json({
      success: true,
      message: `SMS sent successfully to +91 ${cleanedPhone}. Please check your mobile phone for the 4-digit OTP verification code.`
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to send SMS OTP.', error: error.message });
  }
};

const verifyOtp = async (req, res) => {
  try {
    const { name, phone, otp } = req.body;
    const cleanedPhone = (phone || '').replace(/\D/g, '');
    const cleanedOtp = (otp || '').replace(/\D/g, '');

    if (!cleanedPhone || !cleanedOtp) {
      return res.status(400).json({ success: false, message: 'Please provide mobile phone number and 4-digit OTP.' });
    }

    const record = otpStore.get(cleanedPhone);
    if (!record) {
      return res.status(400).json({ success: false, message: 'OTP expired or not requested yet. Please click Resend OTP.' });
    }

    if (Date.now() > record.expiresAt) {
      otpStore.delete(cleanedPhone);
      return res.status(400).json({ success: false, message: 'OTP verification code expired. Please click Resend OTP.' });
    }

    if (record.otp !== cleanedOtp) {
      return res.status(400).json({ success: false, message: 'Invalid OTP verification code. Please check the SMS sent to your phone and try again.' });
    }

    // Clear OTP on successful match
    otpStore.delete(cleanedPhone);

    // Perform login token creation
    let [users] = await pool.query('SELECT * FROM users WHERE phone = ?', [cleanedPhone]);
    let user;

    if (users.length === 0) {
      const cleanedName = name || 'Customer';
      const role = (cleanedPhone === '8888888888' || cleanedPhone === '0987654321') ? 'admin' : 'customer';
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(cleanedPhone, salt);

      const [result] = await pool.query(
        'INSERT INTO users (name, phone, password_hash, role) VALUES (?, ?, ?, ?)',
        [cleanedName, cleanedPhone, passwordHash, role]
      );
      
      const [newUsers] = await pool.query('SELECT * FROM users WHERE phone = ?', [cleanedPhone]);
      user = newUsers[0];
    } else {
      user = users[0];
      if (name && name !== user.name) {
        await pool.query('UPDATE users SET name = ? WHERE phone = ?', [name, cleanedPhone]);
        user.name = name;
      }
    }

    await pool.query('UPDATE users SET logged_in_at = CURRENT_TIMESTAMP WHERE phone = ?', [cleanedPhone]);

    const token = jwt.sign(
      { id: user.id, name: user.name, phone: user.phone, role: user.role },
      process.env.JWT_SECRET || 'mosh_secret_key_2026',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return res.json({
      success: true,
      message: 'OTP verified successfully.',
      user: {
        name: user.name,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'OTP verification failed.', error: error.message });
  }
};

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
      
      const [newUsers] = await pool.query('SELECT * FROM users WHERE phone = ?', [phone]);
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

const updateUser = async (req, res) => {
  try {
    const { phone } = req.params;
    const { name, role } = req.body;
    
    let query = 'UPDATE users SET ';
    const params = [];
    if (name) {
      query += 'name = ?, ';
      params.push(name);
    }
    if (role) {
      query += 'role = ?, ';
      params.push(role);
    }
    
    if (params.length === 0) {
      return res.status(400).json({ success: false, message: 'No fields provided for update.' });
    }
    
    query = query.slice(0, -2);
    query += ' WHERE phone = ?';
    params.push(phone);
    
    await pool.query(query, params);
    return res.json({ success: true, message: 'User updated successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update user.', error: error.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { phone } = req.params;
    await pool.query('DELETE FROM users WHERE phone = ?', [phone]);
    return res.json({ success: true, message: 'User deleted successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to delete user.', error: error.message });
  }
};

module.exports = {
  sendOtp,
  verifyOtp,
  register,
  login,
  logout,
  getMe,
  getUsers,
  toggleUserRole,
  updateUser,
  deleteUser
};
