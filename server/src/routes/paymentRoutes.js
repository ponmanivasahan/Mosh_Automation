const express = require('express');
const router = express.Router();
const { createRazorpayOrder, verifyRazorpayPayment, migrateDatabase } = require('../controllers/PaymentController');
const { authenticate } = require('../middleware/auth');

router.post('/create-order', authenticate, createRazorpayOrder);
router.post('/verify', authenticate, verifyRazorpayPayment);

// Temporary route to migrate the live database
router.get('/migrate-db', migrateDatabase);

module.exports = router;
