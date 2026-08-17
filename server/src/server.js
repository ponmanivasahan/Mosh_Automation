const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { initDB, pool } = require('./config/db');
require('dotenv').config();

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

const path = require('path');
const app = express();
const PORT = process.env.PORT || 5000;
const allowedOrigins = new Set([
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'http://127.0.0.1:5175',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'https://mosh-automation.vercel.app'
].filter(Boolean));

// Security and parser middleware config
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, true);
    }
    
    // Check exact allowed origins Set
    if (allowedOrigins.has(origin)) {
      return callback(null, true);
    }
    
    // Allow any HTTPS origin (production deployments, custom domains, vercel previews)
    if (origin.startsWith('https://')) {
      return callback(null, true);
    }
    
    // Allow local network IP addresses (e.g. http://192.168.1.10:5173) for mobile testing
    if (/^https?:\/\/(192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2[0-9]|3[0-1])\.\d+\.\d+)(:\d+)?$/.test(origin)) {
      return callback(null, true);
    }
    
    // Default: reject CORS
    callback(null, false);
  },
  credentials: true
}));
app.use(express.json({ limit: '10mb' })); // support base64 image uploads
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Simple Health Status Check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Mosh Automation Backend is active & secure.' });
});

// Database Health Status Check
app.get('/api/health/db', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    const rawHost = process.env.DB_HOST || process.env.MYSQLHOST || 'localhost';
    const rawDatabase = process.env.DB_NAME || process.env.MYSQLDATABASE || 'mosh_automation';
    
    console.log(`Database connected\nHost: ${rawHost}\nDatabase: ${rawDatabase}`);
    
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

// Mounted Modular Routes
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

// Serve client static assets if present (built into ../public)
// Prefer serving a server/public folder when deployed
const staticDir = path.join(__dirname, '..', 'public');
if (require('fs').existsSync(staticDir)) {
  app.use(express.static(staticDir));

  // Fallback to index.html for SPA routes (allow API routes to function)
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(staticDir, 'index.html'));
  });
}

// Also support serving the client app if it was built to `cLient/dist` (common Vite output)
const clientDist = path.join(__dirname, '..', 'cLient', 'dist');
if (require('fs').existsSync(clientDist)) {
  app.use(express.static(clientDist));

  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

// Global Error Handler boundary
app.use((err, req, res, next) => {
  console.error('Unhandled internal server error:', err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong inside the server. Please try again later.'
  });
});

// Setup DB and start HTTP listener
const startServer = async () => {
  await initDB();
  app.listen(PORT, () => {
    console.log(`[Mosh Server] Service listening securely on port ${PORT}`);
  });
};

startServer();
