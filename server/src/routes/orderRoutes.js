const express = require('express');
const router = express.Router();
const { getOrders, createOrder, updateOrderStatus, verifyPayment } = require('../controllers/OrderController');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, getOrders);
router.post('/', authenticate, createOrder);
router.patch('/:id/status', authenticate, updateOrderStatus);
router.post('/:id/verify-payment', authenticate, verifyPayment);

module.exports = router;
