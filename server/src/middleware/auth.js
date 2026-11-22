const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { pool } = require('../config/db');
require('dotenv').config();

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (process.env.NODE_ENV === 'production') {
    if (!secret || secret === 'mosh_secret_key_2026' || secret.length < 32) {
      console.error('FATAL: A strong JWT_SECRET (at least 32 characters) must be configured in production environment.');
      process.exit(1);
    }
    return secret;
  }
  return secret || 'mosh_dev_secret_key_min_32_characters_long_2026';
};

const getCookieOptions = (req, maxAgeMs, isHttpOnly = true) => {
  const isHttps = Boolean(req && (req.secure || req.headers['x-forwarded-proto'] === 'https'));
  const isProd = process.env.NODE_ENV === 'production' || isHttps;
  return {
    httpOnly: isHttpOnly,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    path: '/',
    maxAge: maxAgeMs
  };
};

// Verify JWT token from HTTP-only Cookie or Bearer header with resilient refresh fallback
const authenticate = async (req, res, next) => {
  try {
    let token = null;

    // 1. Check Authorization: Bearer header
    if (req.headers.authorization) {
      const parts = req.headers.authorization.split(' ');
      if (parts.length === 2 && parts[0] === 'Bearer') {
        token = parts[1];
      }
    }

    // 2. Check HttpOnly access token cookies
    if (!token && req.cookies) {
      token = req.cookies.accessToken || req.cookies.token;
    }

    // 3. If access token is present, attempt verification
    if (token) {
      try {
        const decoded = jwt.verify(token, getJwtSecret(), { algorithms: ['HS256'] });
        req.user = decoded; // { id, name, phone, role }
        return next();
      } catch (err) {
        // If error is not expiration, or if no refresh token is present, fail
        if (err.name !== 'TokenExpiredError' && !req.cookies?.refreshToken) {
          return res.status(401).json({
            success: false,
            code: 'INVALID_TOKEN',
            message: 'Invalid authentication session. Please log in.'
          });
        }
      }
    }

    // 4. Resilient Self-Healing: If access token is expired or missing, check refresh token cookie
    if (req.cookies && req.cookies.refreshToken) {
      const rawRefreshToken = req.cookies.refreshToken;
      const tokenHash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');

      const [records] = await pool.query(
        'SELECT * FROM refresh_tokens WHERE token_hash = ? AND revoked = FALSE AND expires_at > CURRENT_TIMESTAMP',
        [tokenHash]
      );

      if (records.length > 0) {
        const record = records[0];
        const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [record.user_id]);

        if (users.length > 0 && (!users[0].status || users[0].status !== 'Inactive')) {
          const user = users[0];
          const jwtSecret = getJwtSecret();
          const newAccessToken = jwt.sign(
            { id: user.id, name: user.name, phone: user.phone, role: user.role },
            jwtSecret,
            { expiresIn: '15m', algorithm: 'HS256' }
          );

          // Transparently issue updated access token cookies to the browser
          res.cookie('accessToken', newAccessToken, getCookieOptions(req, 15 * 60 * 1000, true));
          res.cookie('token', newAccessToken, getCookieOptions(req, 15 * 60 * 1000, true));

          req.user = { id: user.id, name: user.name, phone: user.phone, role: user.role };
          return next();
        }
      }
    }

    // If neither access token nor valid refresh token exists
    return res.status(401).json({
      success: false,
      code: 'AUTH_REQUIRED',
      message: 'Access denied. Please log in to continue.'
    });

  } catch (error) {
    console.error('Authentication middleware error:', error);
    return res.status(500).json({
      success: false,
      code: 'AUTH_SERVER_ERROR',
      message: 'Authentication processing failed.'
    });
  }
};

// Verify Admin privileges strictly
const authorizeAdmin = (req, res, next) => {
  if (!req.user || !req.user.role || req.user.role.toString().toLowerCase() !== 'admin') {
    return res.status(403).json({
      success: false,
      code: 'FORBIDDEN',
      message: 'Forbidden. Administrative privileges required.'
    });
  }
  next();
};

module.exports = {
  authenticate,
  authorizeAdmin,
  getJwtSecret,
  getCookieOptions
};
