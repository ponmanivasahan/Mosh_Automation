const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { initDB } = require('./config/db');
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

const path = require('path');
const app = express();
const PORT = process.env.PORT || 5000;
const allowedOrigins = new Set([
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:5174',
  'https://mosh-automation.vercel.app'
].filter(Boolean));

// Security and parser middleware config
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.has(origin)) {
      callback(null, true);
    } else {
      callback(null, false);
    }
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

// Mounted Modular Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/stories', storiesRoutes);
app.use('/api/estimations', estimationsRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/notifications', notificationRoutes);

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
