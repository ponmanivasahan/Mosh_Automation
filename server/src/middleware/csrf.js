const crypto = require('crypto');

const getOriginFromUrl = (urlString) => {
  try {
    const parsed = new URL(urlString);
    return parsed.origin;
  } catch {
    return null;
  }
};

const getAllowedOrigins = () => {
  const allowed = [
    process.env.FRONTEND_URL,
    'https://mosh-automation.vercel.app',
    'https://www.moshautomation.com',
    'https://moshautomation.com',
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
    'http://127.0.0.1:5175',
    'http://localhost:3000',
    'http://127.0.0.1:3000'
  ].filter(Boolean);

  if (process.env.FRONTEND_URL && process.env.FRONTEND_URL.includes(',')) {
    process.env.FRONTEND_URL.split(',').forEach((u) => {
      const trimmed = u.trim();
      if (trimmed) allowed.push(trimmed);
    });
  }

  return new Set(allowed);
};

// Issue or renew CSRF cookie on safe GET requests
const setCsrfCookie = (req, res, next) => {
  if (!req.cookies || !req.cookies.mosh_csrf_token) {
    const csrfToken = crypto.randomBytes(24).toString('hex');
    const isProd = process.env.NODE_ENV === 'production';
    res.cookie('mosh_csrf_token', csrfToken, {
      httpOnly: false, // Must be readable by frontend JavaScript to attach in X-CSRF-Token header
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });
    req.csrfToken = csrfToken;
  } else {
    req.csrfToken = req.cookies.mosh_csrf_token;
  }
  next();
};

// Validate CSRF on state-changing requests
const csrfProtect = (req, res, next) => {
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  if (safeMethods.includes(req.method)) {
    return next();
  }

  // 1. Origin / Referer Validation (Defense-in-depth against cross-site forged requests)
  const reqOrigin = req.headers.origin || (req.headers.referer ? getOriginFromUrl(req.headers.referer) : null);
  const allowedSet = getAllowedOrigins();

  if (reqOrigin) {
    const isAllowed =
      allowedSet.has(reqOrigin) ||
      (process.env.NODE_ENV !== 'production' &&
        /^https?:\/\/(192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2[0-9]|3[0-1])\.\d+\.\d+)(:\d+)?$/.test(
          reqOrigin
        ));

    if (!isAllowed) {
      return res.status(403).json({
        success: false,
        message: 'Cross-origin request forbidden.'
      });
    }
  }

  // 2. Token-based CSRF Check for Cookie-Authenticated Requests
  // If the request is using cookies for authentication, verify that a valid CSRF token or custom header is present
  const hasAuthCookie = req.cookies && (req.cookies.accessToken || req.cookies.token || req.cookies.refreshToken);
  const authHeader = req.headers.authorization;

  // Bearer token requests via Authorization header are immune to browser cross-site ambient credential CSRF
  if (!hasAuthCookie && authHeader && authHeader.startsWith('Bearer ')) {
    return next();
  }

  if (hasAuthCookie) {
    const csrfCookie = req.cookies.mosh_csrf_token;
    const clientHeader = req.headers['x-csrf-token'] || req.headers['x-requested-with'];

    // If client sent X-CSRF-Token, verify it matches cookie using constant time comparison
    if (csrfCookie && req.headers['x-csrf-token']) {
      const headerToken = req.headers['x-csrf-token'];
      const bufA = Buffer.from(csrfCookie);
      const bufB = Buffer.from(headerToken);
      if (bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB)) {
        return next();
      }
    }

    // Allow standard AJAX header if CSRF cookie is not yet initialized (e.g. first request)
    if (clientHeader) {
      return next();
    }

    // If Origin is present and matches, allow
    if (reqOrigin && allowedSet.has(reqOrigin)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'CSRF token missing or invalid.'
    });
  }

  next();
};

module.exports = {
  setCsrfCookie,
  csrfProtect,
  getAllowedOrigins
};
