const express = require('express');
const router = express.Router();
const { getCustomers } = require('../controllers/AdminController');
const { authenticate, authorizeAdmin } = require('../middleware/auth');

router.get('/customers', authenticate, authorizeAdmin, getCustomers);

module.exports = router;
