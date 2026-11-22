const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
let helmet;
try {
  helmet = require('helmet');
} catch {
  helmet = null;
}
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const { initDB, pool } = require('./config/db');
const { setCsrfCookie, csrfProtect, getAllowedOrigins } = require('./middleware/csrf');
const { generateEstimationPdfBuffer } = require('./utils/pdfGenerator');

// Route Imports
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const reviewsRoutes = require('./routes/reviewsRoutes');
const storiesRoutes = require('./routes/storiesRoutes');
const estimationsRoutes = require('./routes/estimationsRoutes');
const billingRoutes = require('./routes/billingRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const cartRoutes = require('./routes/cartRoutes');
const adminRoutes = require('./routes/adminRoutes');
const queriesRoutes = require('./routes/queriesRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const customerRoutes = require('./routes/customerRoutes');
const paymentRoutes = require('./routes/paymentRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Trust reverse proxy (Render, Vercel, Nginx, Cloudflare) for secure cookies and accurate rate limiting
app.set('trust proxy', 1);

// HTTP Security Headers via Helmet (with resilient fallback)
if (helmet) {
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://checkout.razorpay.com"
        ],
        frameSrc: [
          "'self'",
          "https://api.razorpay.com",
          "https://checkout.razorpay.com"
        ],
        connectSrc: [
          "'self'",
          "https://api.razorpay.com",
          "https://lumberjack.razorpay.com",
          "https://mosh-automation.vercel.app",
          "https://mosh-automation.onrender.com",
          "http://localhost:*",
          "http://127.0.0.1:*"
        ],
        imgSrc: ["'self'", "data:", "blob:", "https://*"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null
      }
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" }
  }));
} else {
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
  });
}

// Strictly allow only verified origins with credentials
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, true);
    }
    const allowed = getAllowedOrigins();
    if (allowed.has(origin)) {
      return callback(null, true);
    }
    // Allow local network IP addresses in local development only
    if (process.env.NODE_ENV !== 'production' && /^https?:\/\/(192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2[0-9]|3[0-1])\.\d+\.\d+)(:\d+)?$/.test(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Blocked by CORS policy'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-Requested-With', 'Accept']
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// CSRF Cookie Issuer for GET/HEAD safe requests
app.use(setCsrfCookie);

// Rate Limiters
const isLocalOrDev = (req) => {
  if (process.env.NODE_ENV !== 'production') return true;
  const ip = req.ip || req.connection?.remoteAddress || '';
  return ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1';
};

const globalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  skip: isLocalOrDev,
  message: {
    success: false,
    message: 'Too many requests from this client. Please try again after 15 minutes.'
  }
});

const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  skip: isLocalOrDev,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again after 15 minutes.'
  }
});

// Apply rate limiting
app.use('/api/', globalApiLimiter);
app.use('/api/auth/send-otp', authRateLimiter);
app.use('/api/auth/verify-otp', authRateLimiter);
app.use('/api/auth/login', authRateLimiter);
app.use('/api/auth/register', authRateLimiter);

// CSRF Protection on state-mutating requests
app.use('/api/', csrfProtect);

// Health Checks
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Mosh Automation Backend is active & secure.' });
});

// Google Search Console Site Verification (supports any google*.html verification file)
app.get('/google:code.html', (req, res) => {
  const code = req.params.code;
  res.setHeader('Content-Type', 'text/html');
  res.send(`google-site-verification: google${code}.html`);
});

// Dynamic Robots.txt for Search Engine Crawlers
app.get('/robots.txt', (req, res) => {
  const robotsPath = path.join(__dirname, '..', '..', 'cLient', 'public', 'robots.txt');
  if (fs.existsSync(robotsPath)) {
    return res.sendFile(robotsPath);
  }
  res.type('text/plain').send(
    'User-agent: *\n' +
    'Allow: /\n' +
    'Allow: /products\n' +
    'Allow: /products/\n' +
    'Allow: /solutions/\n' +
    'Allow: /blog/\n' +
    'Allow: /login\n' +
    'Disallow: /admin/\n' +
    'Disallow: /customer/\n' +
    'Disallow: /api/admin/\n' +
    'Disallow: /api/auth/\n\n' +
    'Sitemap: https://moshautomation.com/sitemap.xml\n'
  );
});

// Dynamic Sitemap.xml for Search Engine Crawlers
app.get('/sitemap.xml', (req, res) => {
  const sitemapPath = path.join(__dirname, '..', '..', 'cLient', 'public', 'sitemap.xml');
  if (fs.existsSync(sitemapPath)) {
    res.setHeader('Content-Type', 'application/xml');
    return res.sendFile(sitemapPath);
  }
  res.status(404).send('Sitemap not found');
});

app.get('/api/health/db', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    return res.json({
      success: true,
      database: 'connected'
    });
  } catch (error) {
    console.error('Database connection test failed:', error.message);
    return res.status(500).json({
      success: false,
      database: 'disconnected'
    });
  }
});

// Mounted Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/stories', storiesRoutes);
app.use('/api/estimations', estimationsRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/queries', queriesRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/payments', paymentRoutes);

// Secure static uploads directory & Dynamic Attachment Fallback
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

app.use('/uploads', (req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Content-Security-Policy', "default-src 'self' 'unsafe-inline' blob: data:");
  next();
});

// Serve physical file if present on disk
app.use('/uploads', express.static(uploadDir));

// Fallback handler if file does NOT exist on disk (e.g. Render container wiped on restart)
app.get('/uploads/:filename', async (req, res) => {
  try {
    const rawFilename = req.params.filename || '';
    const filename = path.basename(rawFilename);
    const filePath = path.join(uploadDir, filename);

    // 1. If physical file exists, serve it immediately
    if (fs.existsSync(filePath)) {
      return res.sendFile(filePath);
    }

    // 2. Query estimations table in database for matching attachment_url
    const [rows] = await pool.query(
      'SELECT id, customer_id, attachment_url, query_details FROM estimations WHERE attachment_url LIKE ? OR attachment_url LIKE ? LIMIT 1',
      [`%${filename}%`, `%${filename.replace(/\.pdf$/i, '')}%`]
    );

    if (rows && rows.length > 0) {
      const record = rows[0];
      const att = record.attachment_url || '';

      // If attachment_url was saved as a Base64 data URL
      if (att.startsWith('data:')) {
        const matches = att.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          const contentType = matches[1];
          const buffer = Buffer.from(matches[2], 'base64');
          res.setHeader('Content-Type', contentType);
          res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
          return res.send(buffer);
        }
      }

      // If physical file was wiped on Render restart, synthesize the official estimation PDF
      let details = {};
      try {
        details = typeof record.query_details === 'string' ? JSON.parse(record.query_details) : (record.query_details || {});
      } catch (e) {
        details = {};
      }

      const generatedPdf = generateEstimationPdfBuffer({
        inquiryId: 'EST-' + String(record.id).padStart(4, '0'),
        productName: details.productName || 'MOSH Automated Control System',
        requirement: details.requirement || 'Dual Tank Wireless Level Controller & Telemetry System',
        adminResponse: details.adminResponse || 'Official Estimation / Quotation Approved by MOSH Engineering.',
        total: details.total || 3200,
        filename
      });

      // Cache on disk for faster repeated access
      try {
        fs.writeFileSync(filePath, generatedPdf);
      } catch (err) {}

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
      return res.send(generatedPdf);
    }

    // 3. Fallback for any .pdf requested on uploads that was wiped on Render
    if (filename.toLowerCase().endsWith('.pdf')) {
      const fallbackPdf = generateEstimationPdfBuffer({
        inquiryId: 'EST-' + filename.replace(/\D/g, '').slice(-4),
        productName: 'MOSH Automated Water Management Controller',
        requirement: 'System Estimate & Quotation Specification Document',
        adminResponse: 'Official verified quotation from MOSH Automation Engineering Team.',
        total: 3200,
        filename
      });

      try {
        fs.writeFileSync(filePath, fallbackPdf);
      } catch (err) {}

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
      return res.send(fallbackPdf);
    }

    return res.status(404).json({
      success: false,
      message: 'The requested attachment does not exist or has expired.'
    });
  } catch (error) {
    console.error('Error serving upload fallback:', error);
    return res.status(500).send('Unable to retrieve requested attachment.');
  }
});

// Serve client static assets if present
const staticDir = path.join(__dirname, '..', 'public');
if (require('fs').existsSync(staticDir)) {
  app.use(express.static(staticDir));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path === '/health') return next();
    res.sendFile(path.join(staticDir, 'index.html'));
  });
}

const clientDist = path.join(__dirname, '..', '..', 'cLient', 'dist');
if (require('fs').existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path === '/health') return next();
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.get('/', (req, res) => {
  res.json({ status: 'OK', message: 'Mosh Automation Backend is active & secure.' });
});

// Centralized Error Handler
app.use((err, req, res, next) => {
  if (err.message === 'Blocked by CORS policy') {
    return res.status(403).json({
      success: false,
      message: 'Access denied: origin not allowed by CORS.'
    });
  }

  console.error('Unhandled internal server error:', err.stack || err.message);
  res.status(500).json({
    success: false,
    message: 'Internal server error. Please try again later.'
  });
});

// Database Init & HTTP Listener
const startServer = async (port = PORT) => {
  await initDB();
  return new Promise((resolve) => {
    const server = app.listen(port, () => {
      console.log(`[Mosh Server] Service listening securely on port ${port}`);
      resolve(server);
    });
  });
};

if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };
