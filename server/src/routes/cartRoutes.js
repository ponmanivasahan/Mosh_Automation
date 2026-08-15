const express = require('express');
const router = express.Router();
const { getCart, syncCart } = require('../controllers/CartController');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, getCart);
router.post('/sync', authenticate, syncCart);

module.exports = router;
