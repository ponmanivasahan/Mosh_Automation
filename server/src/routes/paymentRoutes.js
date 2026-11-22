const express = require('express');
const router = express.Router();
const { createRazorpayOrder, verifyRazorpayPayment } = require('../controllers/PaymentController');
const { authenticate } = require('../middleware/auth');

router.post('/create-order', authenticate, createRazorpayOrder);
router.post('/verify', authenticate, verifyRazorpayPayment);

module.exports = router;
