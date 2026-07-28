const express = require('express');
const router = express.Router();
const { getBillingSettings, updateBillingSettings } = require('../controllers/BillingSettingsController');
const { authenticate, authorizeAdmin } = require('../middleware/auth');

router.get('/', getBillingSettings);
router.put('/', authenticate, authorizeAdmin, updateBillingSettings);

module.exports = router;
