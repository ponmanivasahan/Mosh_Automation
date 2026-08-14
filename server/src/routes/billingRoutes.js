const express = require('express');
const router = express.Router();
const { getBillingSettings, updateBillingSettings, createBillingSettings, deleteBillingSettings } = require('../controllers/BillingSettingsController');
const { authenticate, authorizeAdmin } = require('../middleware/auth');

router.get('/', getBillingSettings);
router.post('/', authenticate, authorizeAdmin, createBillingSettings);
router.put('/', authenticate, authorizeAdmin, updateBillingSettings);
router.delete('/', authenticate, authorizeAdmin, deleteBillingSettings);

module.exports = router;
