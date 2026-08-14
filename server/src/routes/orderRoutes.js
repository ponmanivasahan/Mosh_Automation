const express = require('express');
const router = express.Router();
const { getOrders, createOrder, updateOrderStatus, verifyPayment, deleteOrder } = require('../controllers/OrderController');
const { authenticate, authorizeAdmin } = require('../middleware/auth');

router.get('/', authenticate, getOrders);
router.post('/', authenticate, createOrder);
router.patch('/:id/status', authenticate, updateOrderStatus);
router.post('/:id/verify-payment', authenticate, verifyPayment);
router.delete('/:id', authenticate, authorizeAdmin, deleteOrder);

module.exports = router;
