const express = require('express');
const router = express.Router();
const { getInvoices, createInvoice, deleteInvoice } = require('../controllers/InvoiceController');
const { authenticate, authorizeAdmin } = require('../middleware/auth');

router.get('/', authenticate, authorizeAdmin, getInvoices);
router.post('/', authenticate, authorizeAdmin, createInvoice);
router.delete('/:id', authenticate, authorizeAdmin, deleteInvoice);

module.exports = router;
