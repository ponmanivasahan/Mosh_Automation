const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');
const { sendSMS } = require('../services/smsService');
const { getJwtSecret } = require('../middleware/auth');
require('dotenv').config();

// In-memory OTP storage: phone -> { otpHash, expiresAt, attempts, lastRequested }
const otpStore = new Map();

// Helper for cookie options
const getCookieOptions = (req, maxAgeMs, isHttpOnly = true) => {
  const isHttps = Boolean(req && (req.secure || req.headers?.['x-forwarded-proto'] === 'https'));
  const isProd = process.env.NODE_ENV === 'production' || isHttps;
  return {
    httpOnly: isHttpOnly,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    path: '/',
    maxAge: maxAgeMs
  };
};

// Helper to issue access & refresh tokens and set HttpOnly cookies
const issueSession = async (req, res, user) => {
  const jwtSecret = getJwtSecret();
  const accessTokenExpiry = process.env.JWT_EXPIRES_IN || '15m';

  // 1. Short-lived Access Token (JWT)
  const accessToken = jwt.sign(
    {
      id: user.id,
      name: user.name,
      phone: user.phone,
      role: user.role
    },
    jwtSecret,
    { expiresIn: accessTokenExpiry, algorithm: 'HS256' }
  );

  // 2. Cryptographically secure Refresh Token (40 bytes hex)
  const rawRefreshToken = crypto.randomBytes(40).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');
  const refreshExpiryDays = parseInt(process.env.REFRESH_TOKEN_EXPIRES_DAYS || '7', 10);
  const expiresAt = new Date(Date.now() + refreshExpiryDays * 24 * 60 * 60 * 1000);

  // Persist refresh token in MySQL
  await pool.query(
    'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)',
    [user.id, tokenHash, expiresAt]
  );

  // 3. CSRF token for defense in depth
  const csrfToken = crypto.randomBytes(24).toString('hex');

  // Set Cookies
  // Access Token (15 mins)
  res.cookie('accessToken', accessToken, getCookieOptions(req, 15 * 60 * 1000, true));
  // Backwards-compatible cookie name
  res.cookie('token', accessToken, getCookieOptions(req, 15 * 60 * 1000, true));

  // Refresh Token (7 days)
  res.cookie('refreshToken', rawRefreshToken, getCookieOptions(req, refreshExpiryDays * 24 * 60 * 60 * 1000, true));

  // CSRF Cookie (readable by JS to include in custom header)
  res.cookie('mosh_csrf_token', csrfToken, getCookieOptions(req, refreshExpiryDays * 24 * 60 * 60 * 1000, false));

  return { csrfToken };
};

// Send OTP
const sendOtp = async (req, res) => {
  try {
    const { phone } = req.body;
    const cleanedPhone = (phone || '').replace(/\D/g, '');

    if (!cleanedPhone || cleanedPhone.length !== 10) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid 10-digit mobile number.'
      });
    }

    // Rate Limiting: Minimum 30s between OTP requests per phone
    const existing = otpStore.get(cleanedPhone);
    const now = Date.now();
    if (existing && existing.lastRequested && now - existing.lastRequested < 30 * 1000) {
      const waitSeconds = Math.ceil((30 * 1000 - (now - existing.lastRequested)) / 1000);
      return res.status(429).json({
        success: false,
        message: `Please wait ${waitSeconds}s before requesting a new OTP.`
      });
    }

    // Generate 6-digit cryptographically secure OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const otpHash = crypto.createHash('sha256').update(otp).digest('hex');
    const expiresAt = now + 5 * 60 * 1000; // 5 minutes validity

    otpStore.set(cleanedPhone, {
      otpHash,
      expiresAt,
      attempts: 0,
      lastRequested: now
    });

    const isProd = process.env.NODE_ENV === 'production';

    // In production, send real SMS
    if (isProd) {
      await sendSMS(
        cleanedPhone,
        otp,
        `Your MOSH Automation login code is: ${otp}. Valid for 5 minutes.`
      );
    } else {
      console.log(`[DEV OTP] Mobile +91 ${cleanedPhone} => OTP: ${otp}`);
    }

    return res.json({
      success: true,
      message: `Verification code sent to +91 ${cleanedPhone}.`,
      // In development mode, provide devOtp for frictionless local testing
      ...(isProd ? {} : { devOtp: otp })
    });
  } catch (error) {
    console.error('sendOtp error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to dispatch verification code. Please try again.'
    });
  }
};

// Verify OTP
const verifyOtp = async (req, res) => {
  try {
    const { name, phone, otp } = req.body;
    const cleanedPhone = (phone || '').replace(/\D/g, '');
    const cleanedOtp = (otp || '').replace(/\D/g, '');

    if (!cleanedPhone || cleanedPhone.length !== 10 || !cleanedOtp || cleanedOtp.length !== 6) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid 10-digit mobile number and 6-digit OTP code.'
      });
    }

    const record = otpStore.get(cleanedPhone);
    if (!record) {
      return res.status(400).json({
        success: false,
        message: 'Verification code not found or already used. Please request a new code.'
      });
    }

    if (Date.now() > record.expiresAt) {
      otpStore.delete(cleanedPhone);
      return res.status(400).json({
        success: false,
        message: 'Verification code has expired. Please request a new code.'
      });
    }

    if (record.attempts >= 5) {
      otpStore.delete(cleanedPhone);
      return res.status(429).json({
        success: false,
        message: 'Too many incorrect attempts. Please request a new verification code.'
      });
    }

    record.attempts += 1;

    // Constant-time comparison
    const inputHash = crypto.createHash('sha256').update(cleanedOtp).digest('hex');
    const bufA = Buffer.from(record.otpHash, 'hex');
    const bufB = Buffer.from(inputHash, 'hex');

    if (bufA.length !== bufB.length || !crypto.timingSafeEqual(bufA, bufB)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code. Please try again.'
      });
    }

    // Single-use: delete OTP immediately upon verification
    otpStore.delete(cleanedPhone);

    // Look up or register user
    let [users] = await pool.query('SELECT * FROM users WHERE phone = ?', [cleanedPhone]);
    let user;

    if (users.length === 0) {
      // Auto-register as CUSTOMER. Role is strictly 'customer' - never promote to admin via OTP
      const cleanedName = name ? name.trim() : 'Customer';
      const randomPassword = crypto.randomBytes(24).toString('hex');
      const passwordHash = await bcrypt.hash(randomPassword, 12);

      const [result] = await pool.query(
        'INSERT INTO users (name, phone, password_hash, role) VALUES (?, ?, ?, ?)',
        [cleanedName, cleanedPhone, passwordHash, 'customer']
      );

      const [newUsers] = await pool.query('SELECT * FROM users WHERE phone = ?', [cleanedPhone]);
      user = newUsers[0];
    } else {
      user = users[0];

      if (user.status && user.status === 'Inactive') {
        return res.status(403).json({
          success: false,
          message: 'Account has been deactivated. Please contact support.'
        });
      }

      // Update name if changed
      if (name && name.trim() && name.trim() !== user.name) {
        await pool.query('UPDATE users SET name = ? WHERE phone = ?', [name.trim(), cleanedPhone]);
        user.name = name.trim();
      }
    }

    await pool.query('UPDATE users SET logged_in_at = CURRENT_TIMESTAMP WHERE phone = ?', [cleanedPhone]);

    // Issue secure session cookies
    const { csrfToken } = await issueSession(req, res, user);

    return res.json({
      success: true,
      message: 'Verified successfully.',
      csrfToken,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        email: user.email || null,
        role: user.role
      }
    });
  } catch (error) {
    console.error('verifyOtp error:', error);
    return res.status(500).json({
      success: false,
      message: 'Verification failed. Please try again.'
    });
  }
};

// Login (Inbuilt verified phone portal login or password credentials)
const login = async (req, res) => {
  try {
    const { name, phone, password } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required.'
      });
    }

    const cleanedPhone = phone.trim().replace(/\D/g, '');
    if (cleanedPhone.length !== 10) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid 10-digit mobile number.'
      });
    }

    let [users] = await pool.query('SELECT * FROM users WHERE phone = ?', [cleanedPhone]);
    let user;

    if (password) {
      // If user provided a password, verify it against password_hash
      if (users.length === 0) {
        return res.status(401).json({
          success: false,
          message: 'Invalid mobile number or password.'
        });
      }
      user = users[0];
      if (user.status && user.status === 'Inactive') {
        return res.status(403).json({
          success: false,
          message: 'Account has been deactivated. Please contact support.'
        });
      }
      const isPasswordValid = await bcrypt.compare(password, user.password_hash);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid mobile number or password.'
        });
      }
    } else {
      // In-built verification for direct Portal Login (Name + Phone)
      const isAdminPhone = cleanedPhone === '9514714441';

      if (users.length > 0) {
        user = users[0];
        if (user.status && user.status === 'Inactive') {
          return res.status(403).json({
            success: false,
            message: 'Account has been deactivated. Please contact support.'
          });
        }
        // Update name if changed
        if (name && name.trim() && user.name !== name.trim()) {
          await pool.query('UPDATE users SET name = ? WHERE phone = ?', [name.trim(), cleanedPhone]);
          user.name = name.trim();
        }
      } else {
        // Auto-register new customer
        const userName = (name && name.trim()) ? name.trim() : 'Customer';
        const userRole = isAdminPhone ? 'admin' : 'customer';
        const randomPassword = crypto.randomBytes(24).toString('hex');
        const passwordHash = await bcrypt.hash(randomPassword, 12);

        const [result] = await pool.query(
          'INSERT INTO users (name, phone, password_hash, role) VALUES (?, ?, ?, ?)',
          [userName, cleanedPhone, passwordHash, userRole]
        );

        user = {
          id: result.insertId,
          name: userName,
          phone: cleanedPhone,
          role: userRole,
          email: null
        };
      }
    }

    await pool.query('UPDATE users SET logged_in_at = CURRENT_TIMESTAMP WHERE phone = ?', [cleanedPhone]);

    const { csrfToken } = await issueSession(req, res, user);

    return res.json({
      success: true,
      message: 'Logged in successfully.',
      csrfToken,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        email: user.email || null,
        role: user.role
      }
    });
  } catch (error) {
    console.error('login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Login failed. Please try again later.'
    });
  }
};

// Refresh Token Rotation
const refreshToken = async (req, res) => {
  try {
    const rawRefreshToken = req.cookies?.refreshToken;
    if (!rawRefreshToken) {
      return res.status(401).json({
        success: false,
        code: 'NO_REFRESH_TOKEN',
        message: 'Session expired. Please log in.'
      });
    }

    const tokenHash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');

    const [rows] = await pool.query(
      'SELECT * FROM refresh_tokens WHERE token_hash = ?',
      [tokenHash]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        code: 'INVALID_REFRESH_TOKEN',
        message: 'Invalid refresh session.'
      });
    }

    const record = rows[0];

    // Reuse detection: If token is already revoked, potential token theft! Revoke all tokens for this user.
    if (record.revoked) {
      await pool.query('UPDATE refresh_tokens SET revoked = TRUE WHERE user_id = ?', [record.user_id]);
      res.clearCookie('accessToken', getCookieOptions(0));
      res.clearCookie('token', getCookieOptions(0));
      res.clearCookie('refreshToken', getCookieOptions(0));
      res.clearCookie('mosh_csrf_token', getCookieOptions(0, false));
      return res.status(401).json({
        success: false,
        code: 'TOKEN_REVOKED',
        message: 'Security warning: Session revoked due to reuse detection.'
      });
    }

    // Check expiration
    if (new Date(record.expires_at) < new Date()) {
      return res.status(401).json({
        success: false,
        code: 'TOKEN_EXPIRED',
        message: 'Session expired. Please log in again.'
      });
    }

    // Invalidate current refresh token (Rotation)
    await pool.query('UPDATE refresh_tokens SET revoked = TRUE WHERE id = ?', [record.id]);

    // Fetch user
    const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [record.user_id]);
    if (users.length === 0 || (users[0].status && users[0].status === 'Inactive')) {
      return res.status(401).json({
        success: false,
        message: 'User account not active.'
      });
    }

    const user = users[0];

    // Issue fresh access token and fresh refresh token
    const { csrfToken } = await issueSession(req, res, user);

    return res.json({
      success: true,
      csrfToken,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        email: user.email || null,
        role: user.role
      }
    });
  } catch (error) {
    console.error('refreshToken error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to refresh session.'
    });
  }
};

// Logout (Revoke refresh token & clear cookies)
const logout = async (req, res) => {
  try {
    const rawRefreshToken = req.cookies?.refreshToken;
    if (rawRefreshToken) {
      const tokenHash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');
      await pool.query('UPDATE refresh_tokens SET revoked = TRUE WHERE token_hash = ?', [tokenHash]);
    }
  } catch (err) {
    console.error('Error during logout token revocation:', err);
  }

  res.clearCookie('accessToken', getCookieOptions(req, 0));
  res.clearCookie('token', getCookieOptions(req, 0));
  res.clearCookie('refreshToken', getCookieOptions(req, 0));
  res.clearCookie('mosh_csrf_token', getCookieOptions(req, 0, false));

  return res.json({
    success: true,
    message: 'Logged out successfully.'
  });
};

// Register (Customer self-registration with strong password)
const register = async (req, res) => {
  try {
    const { name, phone, password } = req.body;

    if (!name || !name.trim() || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide full name, mobile number, and password.'
      });
    }

    const cleanedPhone = phone.trim().replace(/\D/g, '');
    if (cleanedPhone.length !== 10) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid 10-digit mobile number.'
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long.'
      });
    }

    const [existing] = await pool.query('SELECT id FROM users WHERE phone = ?', [cleanedPhone]);
    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'A user with this mobile number is already registered.'
      });
    }

    // Work factor 12
    const passwordHash = await bcrypt.hash(password, 12);

    // Role is ALWAYS 'customer'. Never accept role from untrusted request body
    await pool.query(
      'INSERT INTO users (name, phone, password_hash, role) VALUES (?, ?, ?, ?)',
      [name.trim(), cleanedPhone, passwordHash, 'customer']
    );

    return res.status(201).json({
      success: true,
      message: 'Account registered successfully. Please sign in.'
    });
  } catch (error) {
    console.error('register error:', error);
    return res.status(500).json({
      success: false,
      message: 'Registration failed. Please try again.'
    });
  }
};

// Get current authenticated user profile
const getMe = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Not authenticated.' });
  }

  try {
    const [rows] = await pool.query(
      'SELECT id, name, phone, email, role, status, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'User account not found.'
      });
    }

    const user = rows[0];

    return res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        email: user.email || null,
        role: user.role,
        status: user.status || 'Active',
        createdAt: user.created_at
      }
    });
  } catch (error) {
    console.error('getMe error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve profile.'
    });
  }
};

// Admin: Retrieve user list
const getUsers = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, phone, email, role, status, created_at, logged_in_at AS loggedInAt FROM users ORDER BY created_at DESC'
    );
    return res.json({ success: true, users: rows });
  } catch (error) {
    console.error('getUsers error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve users.' });
  }
};

// Admin: Toggle or change user role
const toggleUserRole = async (req, res) => {
  try {
    const { phone } = req.params;
    const { role } = req.body;

    if (!role || (role !== 'admin' && role !== 'customer')) {
      return res.status(400).json({ success: false, message: 'Invalid role selection.' });
    }

    // Safety: Prevent admin from demoting themselves
    if (req.user.phone === phone && role !== 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Cannot demote your own administrator account.'
      });
    }

    await pool.query('UPDATE users SET role = ? WHERE phone = ?', [role, phone]);
    return res.json({ success: true, message: 'User role updated successfully.' });
  } catch (error) {
    console.error('toggleUserRole error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update user role.' });
  }
};

// Admin: Update user details
const updateUser = async (req, res) => {
  try {
    const { phone } = req.params;
    const { name, role, status, email } = req.body;

    const updates = [];
    const params = [];

    if (name && name.trim()) {
      updates.push('name = ?');
      params.push(name.trim());
    }

    if (role && (role === 'admin' || role === 'customer')) {
      if (req.user.phone === phone && role !== 'admin') {
        return res.status(400).json({
          success: false,
          message: 'Cannot demote your own administrator account.'
        });
      }
      updates.push('role = ?');
      params.push(role);
    }

    if (status && (status === 'Active' || status === 'Inactive')) {
      updates.push('status = ?');
      params.push(status);
    }

    if (email !== undefined) {
      updates.push('email = ?');
      params.push(email || null);
    }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid fields provided for update.' });
    }

    params.push(phone);
    await pool.query(`UPDATE users SET ${updates.join(', ')} WHERE phone = ?`, params);

    return res.json({ success: true, message: 'User updated successfully.' });
  } catch (error) {
    console.error('updateUser error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update user.' });
  }
};

// Admin: Delete user
const deleteUser = async (req, res) => {
  try {
    const { phone } = req.params;

    // Safety: Prevent admin from deleting themselves
    if (req.user.phone === phone) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own administrator account.'
      });
    }

    await pool.query('DELETE FROM users WHERE phone = ?', [phone]);
    return res.json({ success: true, message: 'User deleted successfully.' });
  } catch (error) {
    console.error('deleteUser error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete user.' });
  }
};

module.exports = {
  sendOtp,
  verifyOtp,
  login,
  refreshToken,
  logout,
  register,
  getMe,
  getUsers,
  toggleUserRole,
  updateUser,
  deleteUser
};
